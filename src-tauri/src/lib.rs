#![cfg_attr(not(feature = "desktop"), allow(dead_code))]

use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use exif::{In, Reader as ExifReader, Tag, Value};
use filetime::{set_file_times, FileTime};
use image::{DynamicImage, GenericImageView, ImageFormat, ImageReader};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::{HashMap, HashSet},
    fs,
    io::{BufReader, Cursor, Read},
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};
use walkdir::WalkDir;

const FREE_LIMIT: usize = 1_000;
const IMAGE_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "webp", "gif", "tif", "tiff", "bmp"];

#[derive(Clone, Debug)]
struct Candidate {
    id: String,
    path: PathBuf,
    root: usize,
    size: u64,
    width: u32,
    height: u32,
    captured_at: Option<String>,
    camera: String,
    modified_at: String,
    sha256: String,
    visual_hash: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhotoCopy {
    id: String,
    path: String,
    name: String,
    size: u64,
    width: u32,
    height: u32,
    format: String,
    captured_at: Option<String>,
    modified_at: String,
    hash: String,
    camera: String,
    backup_count: usize,
    thumbnail: String,
    decision: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhotoGroup {
    id: String,
    kind: String,
    confidence: u8,
    reason: String,
    files: Vec<PhotoCopy>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanReport {
    groups: Vec<PhotoGroup>,
    scanned: usize,
    skipped: usize,
    limited: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveRecord {
    pub id: String,
    pub source: String,
    pub destination: String,
    pub moved_at: String,
    pub restored_at: Option<String>,
}

#[cfg_attr(feature = "desktop", tauri::command)]
fn scan_directories(paths: Vec<String>, licensed: bool) -> Result<ScanReport, String> {
    if paths.is_empty() {
        return Err("Choose at least one photo folder.".into());
    }
    let roots: Vec<PathBuf> = paths.iter().map(PathBuf::from).collect();
    for root in &roots {
        if !root.is_dir() {
            return Err(format!("{} is not a readable folder.", root.display()));
        }
    }
    scan(&roots, if licensed { usize::MAX } else { FREE_LIMIT })
}

fn scan(roots: &[PathBuf], limit: usize) -> Result<ScanReport, String> {
    let mut files = Vec::new();
    let mut skipped = 0;
    let mut seen_paths = HashSet::new();
    for (root_index, root) in roots.iter().enumerate() {
        for entry in WalkDir::new(root).follow_links(false) {
            match entry {
                Ok(entry) if entry.file_type().is_file() && is_image(entry.path()) => {
                    let path = entry.into_path();
                    let identity = path.canonicalize().unwrap_or_else(|_| path.clone());
                    if seen_paths.insert(identity) {
                        files.push((root_index, path));
                    }
                }
                Ok(_) => {}
                Err(_) => skipped += 1,
            }
        }
    }
    files.sort_by(|a, b| a.1.cmp(&b.1));
    let limited = files.len() > limit;
    files.truncate(limit);

    let mut candidates = Vec::with_capacity(files.len());
    for (index, (root, path)) in files.into_iter().enumerate() {
        match inspect_photo(index, root, &path) {
            Ok(candidate) => candidates.push(candidate),
            Err(_) => skipped += 1,
        }
    }

    let mut claimed = HashSet::new();
    let mut raw_groups: Vec<(String, u8, String, Vec<usize>)> = Vec::new();

    let mut exact: HashMap<&str, Vec<usize>> = HashMap::new();
    for (index, candidate) in candidates.iter().enumerate() {
        exact.entry(&candidate.sha256).or_default().push(index);
    }
    for indexes in exact.into_values().filter(|items| items.len() > 1) {
        claimed.extend(indexes.iter().copied());
        raw_groups.push((
            "Exact bytes".into(),
            100,
            "All file bytes match. Names or folders may differ.".into(),
            indexes,
        ));
    }

    let remaining: Vec<usize> = (0..candidates.len())
        .filter(|i| !claimed.contains(i))
        .collect();
    let similar = perceptual_components(&candidates, &remaining);
    for indexes in similar.into_iter().filter(|items| items.len() > 1) {
        claimed.extend(indexes.iter().copied());
        let distance = max_visual_distance(&candidates, &indexes);
        let confidence = 99_u8
            .saturating_sub(distance.saturating_mul(4) as u8)
            .max(82);
        raw_groups.push((
            "Looks alike".into(),
            confidence,
            "Picture content matches closely. Dimensions or encoding may differ.".into(),
            indexes,
        ));
    }

    let mut moments: HashMap<String, Vec<usize>> = HashMap::new();
    for (index, candidate) in candidates
        .iter()
        .enumerate()
        .filter(|(i, _)| !claimed.contains(i))
    {
        if let Some(captured) = &candidate.captured_at {
            let minute = captured.get(..16).unwrap_or(captured);
            moments
                .entry(format!(
                    "{}:{}x{}",
                    minute, candidate.width, candidate.height
                ))
                .or_default()
                .push(index);
        }
    }
    for indexes in moments.into_values().filter(|items| items.len() > 1) {
        raw_groups.push((
            "Same moment".into(),
            88,
            "Capture time and dimensions match. The picture bytes differ.".into(),
            indexes,
        ));
    }

    raw_groups.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.3[0].cmp(&b.3[0])));
    let groups = raw_groups
        .into_iter()
        .enumerate()
        .map(|(group_index, (kind, confidence, reason, indexes))| {
            let roots_present: HashSet<usize> =
                indexes.iter().map(|i| candidates[*i].root).collect();
            let exact_thumbnail = if kind == "Exact bytes" {
                thumbnail_for_path(&candidates[indexes[0]].path)
            } else {
                None
            };
            let files = indexes
                .iter()
                .enumerate()
                .map(|(file_index, index)| {
                    let thumbnail = if kind == "Exact bytes" {
                        if file_index == 0 {
                            exact_thumbnail.clone().unwrap_or_default()
                        } else {
                            String::new()
                        }
                    } else {
                        thumbnail_for_path(&candidates[*index].path).unwrap_or_default()
                    };
                    to_copy(
                        &candidates[*index],
                        roots_present.len().saturating_sub(1),
                        file_index == 0,
                        thumbnail,
                    )
                })
                .collect();
            PhotoGroup {
                id: format!("group-{}", group_index + 1),
                kind,
                confidence,
                reason,
                files,
            }
        })
        .collect();

    Ok(ScanReport {
        groups,
        scanned: candidates.len(),
        skipped,
        limited,
    })
}

fn inspect_photo(index: usize, root: usize, path: &Path) -> Result<Candidate, String> {
    let metadata = fs::metadata(path).map_err(|error| error.to_string())?;
    let mut file = fs::File::open(path).map_err(|error| error.to_string())?;
    let mut hasher = Sha256::new();
    let mut buffer = [0_u8; 64 * 1024];
    loop {
        let read = file.read(&mut buffer).map_err(|error| error.to_string())?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
    }
    let sha256 = format!("{:x}", hasher.finalize());
    let image = ImageReader::open(path)
        .map_err(|error| error.to_string())?
        .with_guessed_format()
        .map_err(|error| error.to_string())?
        .decode()
        .map_err(|error| error.to_string())?;
    let (width, height) = image.dimensions();
    let (captured_at, camera) = read_exif(path);
    let modified_at = metadata
        .modified()
        .ok()
        .map(system_time)
        .unwrap_or_default();
    let visual_hash = difference_hash(&image);
    Ok(Candidate {
        id: format!("photo-{}-{}", index + 1, &sha256[..8]),
        path: path.to_path_buf(),
        root,
        size: metadata.len(),
        width,
        height,
        captured_at,
        camera,
        modified_at,
        sha256,
        visual_hash,
    })
}

fn read_exif(path: &Path) -> (Option<String>, String) {
    let Ok(file) = fs::File::open(path) else {
        return (None, String::new());
    };
    let Ok(exif) = ExifReader::new().read_from_container(&mut BufReader::new(file)) else {
        return (None, String::new());
    };
    let captured = exif
        .get_field(Tag::DateTimeOriginal, In::PRIMARY)
        .or_else(|| exif.get_field(Tag::DateTime, In::PRIMARY))
        .and_then(|field| match &field.value {
            Value::Ascii(values) => values.first(),
            _ => None,
        })
        .and_then(|raw| std::str::from_utf8(raw).ok())
        .map(|raw| raw.trim_matches(char::from(0)).to_string())
        .map(|value| {
            if value.len() >= 19 {
                format!(
                    "{}-{}-{}T{}Z",
                    &value[0..4],
                    &value[5..7],
                    &value[8..10],
                    &value[11..19]
                )
            } else {
                value
            }
        });
    let make = exif
        .get_field(Tag::Make, In::PRIMARY)
        .map(|f| f.display_value().with_unit(&exif).to_string())
        .unwrap_or_default();
    let model = exif
        .get_field(Tag::Model, In::PRIMARY)
        .map(|f| f.display_value().with_unit(&exif).to_string())
        .unwrap_or_default();
    (
        captured,
        format!("{} {}", make.trim(), model.trim())
            .trim()
            .to_string(),
    )
}

fn difference_hash(image: &DynamicImage) -> u64 {
    let pixels = image
        .resize_exact(9, 8, image::imageops::FilterType::Triangle)
        .to_luma8();
    let mut hash = 0_u64;
    for y in 0..8 {
        for x in 0..8 {
            if pixels.get_pixel(x, y)[0] > pixels.get_pixel(x + 1, y)[0] {
                hash |= 1 << (y * 8 + x);
            }
        }
    }
    hash
}

fn thumbnail_data_url(image: &DynamicImage) -> Result<String, String> {
    let thumbnail = image.thumbnail(480, 320);
    let mut bytes = Cursor::new(Vec::new());
    thumbnail
        .write_to(&mut bytes, ImageFormat::WebP)
        .map_err(|error| error.to_string())?;
    Ok(format!(
        "data:image/webp;base64,{}",
        BASE64.encode(bytes.into_inner())
    ))
}

fn thumbnail_for_path(path: &Path) -> Option<String> {
    ImageReader::open(path)
        .ok()?
        .with_guessed_format()
        .ok()?
        .decode()
        .ok()
        .and_then(|image| thumbnail_data_url(&image).ok())
}

fn perceptual_components(candidates: &[Candidate], indexes: &[usize]) -> Vec<Vec<usize>> {
    let mut parent: Vec<usize> = (0..candidates.len()).collect();
    let mut buckets: HashMap<(usize, u8), Vec<usize>> = HashMap::new();
    let mut compared = HashSet::new();
    for index in indexes {
        let hash = candidates[*index].visual_hash;
        for segment in 0..8 {
            let byte = ((hash >> (segment * 8)) & 0xff) as u8;
            let bucket = buckets.entry((segment, byte)).or_default();
            for other in bucket.iter().copied() {
                let pair = if other < *index {
                    (other, *index)
                } else {
                    (*index, other)
                };
                if compared.insert(pair)
                    && (candidates[other].visual_hash ^ hash).count_ones() <= 7
                    && similar_aspect(&candidates[other], &candidates[*index])
                {
                    union(&mut parent, other, *index);
                }
            }
            bucket.push(*index);
        }
    }
    let mut groups: HashMap<usize, Vec<usize>> = HashMap::new();
    for index in indexes {
        groups
            .entry(find(&mut parent, *index))
            .or_default()
            .push(*index);
    }
    groups.into_values().collect()
}

fn similar_aspect(a: &Candidate, b: &Candidate) -> bool {
    let left = a.width as u64 * b.height as u64;
    let right = b.width as u64 * a.height as u64;
    left.abs_diff(right) * 100 <= left.max(right) * 3
}

fn find(parent: &mut [usize], value: usize) -> usize {
    if parent[value] != value {
        parent[value] = find(parent, parent[value]);
    }
    parent[value]
}

fn union(parent: &mut [usize], a: usize, b: usize) {
    let root_a = find(parent, a);
    let root_b = find(parent, b);
    if root_a != root_b {
        parent[root_b] = root_a;
    }
}

fn max_visual_distance(candidates: &[Candidate], indexes: &[usize]) -> u32 {
    indexes
        .iter()
        .flat_map(|a| {
            indexes.iter().map(move |b| {
                (candidates[*a].visual_hash ^ candidates[*b].visual_hash).count_ones()
            })
        })
        .max()
        .unwrap_or(0)
}

fn to_copy(
    candidate: &Candidate,
    backup_count: usize,
    first: bool,
    thumbnail: String,
) -> PhotoCopy {
    let full_hash = &candidate.sha256;
    PhotoCopy {
        id: candidate.id.clone(),
        path: candidate.path.to_string_lossy().to_string(),
        name: candidate
            .path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
        size: candidate.size,
        width: candidate.width,
        height: candidate.height,
        format: candidate
            .path
            .extension()
            .unwrap_or_default()
            .to_string_lossy()
            .to_uppercase(),
        captured_at: candidate.captured_at.clone(),
        modified_at: candidate.modified_at.clone(),
        hash: format!("{}…{}", &full_hash[..8], &full_hash[full_hash.len() - 4..]),
        camera: candidate.camera.clone(),
        backup_count,
        thumbnail,
        decision: if first {
            "keep".into()
        } else {
            "review".into()
        },
    }
}

#[cfg_attr(feature = "desktop", tauri::command)]
fn execute_quarantine(
    paths: Vec<String>,
    quarantine_dir: String,
) -> Result<Vec<MoveRecord>, String> {
    let destination = PathBuf::from(quarantine_dir);
    fs::create_dir_all(&destination)
        .map_err(|error| format!("The quarantine folder could not be created: {error}"))?;
    let mut records: Vec<MoveRecord> = Vec::new();
    for source_text in paths {
        let source = PathBuf::from(&source_text);
        if !source.is_file() {
            return Err(format!(
                "{} is no longer a readable file.",
                source.display()
            ));
        }
        let target = unique_destination(&destination, source.file_name().unwrap_or_default());
        if let Err(error) = move_file(&source, &target) {
            for prior in records.iter().rev() {
                let _ = move_file(Path::new(&prior.destination), Path::new(&prior.source));
            }
            return Err(error);
        }
        records.push(MoveRecord {
            id: format!("move-{}-{}", now_epoch(), records.len() + 1),
            source: source.to_string_lossy().to_string(),
            destination: target.to_string_lossy().to_string(),
            moved_at: now_epoch().to_string(),
            restored_at: None,
        });
    }
    Ok(records)
}

#[cfg_attr(feature = "desktop", tauri::command)]
fn restore_quarantined(record: MoveRecord) -> Result<(), String> {
    let source = PathBuf::from(record.source);
    let quarantined = PathBuf::from(record.destination);
    if source.exists() {
        return Err("The original path already contains a file. Move it before restoring.".into());
    }
    if !quarantined.is_file() {
        return Err("The quarantined file is missing.".into());
    }
    if let Some(parent) = source.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    move_file(&quarantined, &source)
}

#[cfg_attr(feature = "desktop", tauri::command)]
fn write_decision_log(path: String, contents: String) -> Result<(), String> {
    fs::write(path, contents).map_err(|error| format!("The CSV file could not be written: {error}"))
}

#[cfg_attr(feature = "desktop", tauri::command)]
fn read_decision_log(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|error| format!("The CSV file could not be read: {error}"))
}

fn move_file(source: &Path, destination: &Path) -> Result<(), String> {
    match fs::rename(source, destination) {
        Ok(()) => Ok(()),
        Err(_) => copy_then_remove(source, destination),
    }
}

/// Used when a rename crosses file systems: preserve timestamps before the
/// source is removed, so a failed copy can never erase the original.
fn copy_then_remove(source: &Path, destination: &Path) -> Result<(), String> {
    let metadata = fs::metadata(source).map_err(|error| error.to_string())?;
    let accessed = FileTime::from_last_access_time(&metadata);
    let modified = FileTime::from_last_modification_time(&metadata);
    fs::copy(source, destination)
        .map_err(|error| format!("{} could not be copied: {error}", source.display()))?;
    if let Err(error) = set_file_times(destination, accessed, modified) {
        let _ = fs::remove_file(destination);
        return Err(format!(
            "The copied file dates could not be preserved: {error}"
        ));
    }
    if let Err(error) = fs::remove_file(source) {
        let _ = fs::remove_file(destination);
        return Err(format!(
            "The copied file could not be removed from its old folder: {error}"
        ));
    }
    Ok(())
}

fn unique_destination(directory: &Path, file_name: &std::ffi::OsStr) -> PathBuf {
    let initial = directory.join(file_name);
    if !initial.exists() {
        return initial;
    }
    let original = Path::new(file_name);
    let stem = original.file_stem().unwrap_or_default().to_string_lossy();
    let extension = original
        .extension()
        .map(|value| format!(".{}", value.to_string_lossy()))
        .unwrap_or_default();
    for suffix in 2.. {
        let candidate = directory.join(format!("{stem} ({suffix}){extension}"));
        if !candidate.exists() {
            return candidate;
        }
    }
    unreachable!()
}

fn is_image(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| IMAGE_EXTENSIONS.contains(&extension.to_ascii_lowercase().as_str()))
        .unwrap_or(false)
}

fn system_time(value: SystemTime) -> String {
    value
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs().to_string())
        .unwrap_or_default()
}

fn now_epoch() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or_default()
}

#[cfg(feature = "desktop")]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            scan_directories,
            execute_quarantine,
            restore_quarantined,
            write_decision_log,
            read_decision_log
        ])
        .run(tauri::generate_context!())
        .expect("Proof Pile could not start");
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgb};
    use std::env;

    fn temp_dir(name: &str) -> PathBuf {
        let path = env::temp_dir().join(format!("proof-pile-{name}-{}", now_epoch()));
        fs::create_dir_all(&path).unwrap();
        path
    }

    fn sample(path: &Path, color: [u8; 3]) {
        let image = ImageBuffer::from_pixel(32, 24, Rgb(color));
        image.save(path).unwrap();
    }

    fn patterned_sample(path: &Path, inverse: bool) {
        let image = ImageBuffer::from_fn(9, 8, |x, _| {
            let value = if inverse {
                (x * 28) as u8
            } else {
                255_u8.saturating_sub((x * 28) as u8)
            };
            Rgb([value, value, value])
        });
        image.save(path).unwrap();
    }

    fn add_capture_exif(path: &Path) {
        let image = fs::read(path).unwrap();
        let mut tiff = vec![b'I', b'I', 42, 0, 8, 0, 0, 0];
        tiff.extend_from_slice(&3_u16.to_le_bytes());
        // Make, Model, and the pointer to the Exif IFD.
        for (tag, kind, count, value) in [
            (0x010f_u16, 2_u16, 5_u32, 50_u32),
            (0x0110, 2, 7, 55),
            (0x8769, 4, 1, 62),
        ] {
            tiff.extend_from_slice(&tag.to_le_bytes());
            tiff.extend_from_slice(&kind.to_le_bytes());
            tiff.extend_from_slice(&count.to_le_bytes());
            tiff.extend_from_slice(&value.to_le_bytes());
        }
        tiff.extend_from_slice(&0_u32.to_le_bytes());
        tiff.extend_from_slice(b"Lens\0Camera\0");
        tiff.extend_from_slice(&1_u16.to_le_bytes());
        tiff.extend_from_slice(&0x9003_u16.to_le_bytes());
        tiff.extend_from_slice(&2_u16.to_le_bytes());
        tiff.extend_from_slice(&20_u32.to_le_bytes());
        tiff.extend_from_slice(&80_u32.to_le_bytes());
        tiff.extend_from_slice(&0_u32.to_le_bytes());
        tiff.extend_from_slice(b"2026:08:28 12:34:56\0");
        let mut payload = b"Exif\0\0".to_vec();
        payload.extend_from_slice(&tiff);
        let mut output = vec![0xff, 0xd8, 0xff, 0xe1];
        output.extend_from_slice(&((payload.len() + 2) as u16).to_be_bytes());
        output.extend_from_slice(&payload);
        output.extend_from_slice(&image[2..]);
        fs::write(path, output).unwrap();
    }

    #[test]
    fn exact_files_become_one_group() {
        let root = temp_dir("scan");
        sample(&root.join("first.png"), [40, 90, 120]);
        fs::copy(root.join("first.png"), root.join("copy.png")).unwrap();
        sample(&root.join("other.png"), [210, 80, 20]);
        let report = scan(std::slice::from_ref(&root), 100).unwrap();
        assert_eq!(report.scanned, 3);
        assert_eq!(
            report
                .groups
                .iter()
                .filter(|group| group.kind == "Exact bytes")
                .count(),
            1
        );
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn quarantine_avoids_overwrite_and_restores() {
        let source_dir = temp_dir("source");
        let quarantine = temp_dir("quarantine");
        let source = source_dir.join("memory.jpg");
        fs::write(&source, b"only copy").unwrap();
        fs::write(quarantine.join("memory.jpg"), b"existing").unwrap();
        let records = execute_quarantine(
            vec![source.to_string_lossy().to_string()],
            quarantine.to_string_lossy().to_string(),
        )
        .unwrap();
        assert!(records[0].destination.ends_with("memory (2).jpg"));
        restore_quarantined(records[0].clone()).unwrap();
        assert_eq!(fs::read(source).unwrap(), b"only copy");
        let _ = fs::remove_dir_all(source_dir);
        let _ = fs::remove_dir_all(quarantine);
    }

    // @claim:native-matching
    #[test]
    fn claim_native_matching_groups_exact_visual_and_exif_moments() {
        let root = temp_dir("native-matching");
        sample(&root.join("exact-a.png"), [40, 90, 120]);
        fs::copy(root.join("exact-a.png"), root.join("exact-b.png")).unwrap();
        sample(&root.join("visual-a.png"), [90, 140, 180]);
        sample(&root.join("visual-b.jpg"), [90, 140, 180]);
        patterned_sample(&root.join("moment-a.jpg"), false);
        patterned_sample(&root.join("moment-b.jpg"), true);
        add_capture_exif(&root.join("moment-a.jpg"));
        add_capture_exif(&root.join("moment-b.jpg"));
        assert_eq!(
            read_exif(&root.join("moment-a.jpg")).0.as_deref(),
            Some("2026-08-28T12:34:56Z")
        );
        let first = inspect_photo(0, 0, &root.join("moment-a.jpg")).unwrap();
        let second = inspect_photo(1, 0, &root.join("moment-b.jpg")).unwrap();
        assert_ne!(first.visual_hash ^ second.visual_hash, 0);
        let report = scan(std::slice::from_ref(&root), 100).unwrap();
        let kinds: HashSet<_> = report
            .groups
            .iter()
            .map(|group| group.kind.as_str())
            .collect();
        assert!(kinds.contains("Exact bytes"));
        assert!(kinds.contains("Looks alike"));
        assert!(kinds.contains("Same moment"), "groups: {kinds:?}");
        let _ = fs::remove_dir_all(root);
    }

    // @claim:cross-drive-safety
    #[test]
    fn claim_cross_drive_safety_preserves_dates_and_never_overwrites() {
        let source_dir = temp_dir("copy-source");
        let destination_dir = temp_dir("copy-destination");
        let source = source_dir.join("memory.jpg");
        let destination = destination_dir.join("memory.jpg");
        fs::write(&source, b"only copy").unwrap();
        let stamp = FileTime::from_unix_time(1_700_000_000, 0);
        set_file_times(&source, stamp, stamp).unwrap();
        copy_then_remove(&source, &destination).unwrap();
        assert!(!source.exists());
        assert_eq!(fs::read(&destination).unwrap(), b"only copy");
        assert_eq!(
            FileTime::from_last_modification_time(&fs::metadata(&destination).unwrap())
                .unix_seconds(),
            stamp.unix_seconds()
        );
        fs::write(&source, b"second copy").unwrap();
        fs::write(destination_dir.join("memory (2).jpg"), b"occupied").unwrap();
        let records = execute_quarantine(
            vec![source.to_string_lossy().to_string()],
            destination_dir.to_string_lossy().to_string(),
        )
        .unwrap();
        assert!(records[0].destination.ends_with("memory (3).jpg"));
        let _ = fs::remove_dir_all(source_dir);
        let _ = fs::remove_dir_all(destination_dir);
    }

    // @claim:free-scan-limit
    #[test]
    fn claim_free_scan_limit() {
        let root = temp_dir("limit");
        sample(&root.join("photo-0000.png"), [40, 90, 120]);
        for index in 1..=FREE_LIMIT {
            fs::copy(
                root.join("photo-0000.png"),
                root.join(format!("photo-{index:04}.png")),
            )
            .unwrap();
        }
        let report = scan(std::slice::from_ref(&root), FREE_LIMIT).unwrap();
        assert_eq!(report.scanned, FREE_LIMIT);
        assert!(report.limited);
        let _ = fs::remove_dir_all(root);
    }
}
