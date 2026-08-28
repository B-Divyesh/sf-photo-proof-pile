export type MatchKind = "Exact bytes" | "Looks alike" | "Same moment";
export type FileDecision = "keep" | "quarantine" | "review";

export interface PhotoCopy {
  id: string;
  path: string;
  name: string;
  size: number;
  width: number;
  height: number;
  format: string;
  capturedAt: string | null;
  modifiedAt: string;
  hash: string;
  camera: string;
  backupCount: number;
  thumbnail?: string;
  decision: FileDecision;
}

export interface PhotoGroup {
  id: string;
  kind: MatchKind;
  confidence: number;
  reason: string;
  files: PhotoCopy[];
}

export interface MoveRecord {
  id: string;
  source: string;
  destination: string;
  movedAt: string;
  restoredAt?: string;
}

/** Decisions and move records are saved together so recovery survives restart. */
export interface SavedReview {
  groups: PhotoGroup[];
  moves: MoveRecord[];
}

const base = (id: string, path: string, props: Partial<PhotoCopy>): PhotoCopy => ({
  id,
  path,
  name: path.split("/").pop() ?? path,
  size: 4_820_112,
  width: 4032,
  height: 3024,
  format: "JPEG",
  capturedAt: "2024-07-14T18:42:11Z",
  modifiedAt: "2025-01-05T12:08:00Z",
  hash: "8ac71e52…92ef",
  camera: "Phone wide camera",
  backupCount: 1,
  decision: "review",
  ...props
});

export const sampleGroups = (): PhotoGroup[] => [
  {
    id: "lake-sunset",
    kind: "Exact bytes",
    confidence: 100,
    reason: "All file bytes match. The names and folders differ.",
    files: [
      base("lake-main", "/Photos/2024/Lake/IMG_4812.jpg", { thumbnail: "/samples/lake-a.svg", decision: "keep", backupCount: 2 }),
      base("lake-import", "/Phone imports/July/IMG_4812 (1).jpg", { thumbnail: "/samples/lake-a.svg", modifiedAt: "2025-02-02T09:11:00Z" }),
      base("lake-old", "/Old drive/DCIM/104APPLE/IMG_4812.jpg", { thumbnail: "/samples/lake-a.svg", backupCount: 0 })
    ]
  },
  {
    id: "birthday-burst",
    kind: "Same moment",
    confidence: 91,
    reason: "These shots share a capture time and camera. Their pixels differ.",
    files: [
      base("cake-1", "/Photos/Family/Birthday/DSC_2081.jpg", { thumbnail: "/samples/birthday.svg", hash: "4319ce77…ba21", capturedAt: "2023-11-08T20:14:03Z", decision: "keep" }),
      base("cake-2", "/Photos/Family/Birthday/DSC_2082.jpg", { thumbnail: "/samples/birthday.svg", hash: "38d201a4…903c", capturedAt: "2023-11-08T20:14:04Z", size: 4_704_822 }),
      base("cake-3", "/Camera card/DCIM/DSC_2083.jpg", { thumbnail: "/samples/birthday.svg", hash: "eb02b142…4d61", capturedAt: "2023-11-08T20:14:05Z", size: 4_633_906, backupCount: 0 })
    ]
  },
  {
    id: "dog-edit",
    kind: "Looks alike",
    confidence: 96,
    reason: "The picture content matches. One copy has smaller dimensions.",
    files: [
      base("dog-original", "/Photos/Pets/Milo-park.jpg", { thumbnail: "/samples/dog.svg", width: 6000, height: 4000, size: 8_912_414, hash: "a3f1e922…871d", decision: "keep", backupCount: 2 }),
      base("dog-message", "/Downloads/Milo-park.jpg", { thumbnail: "/samples/dog.svg", width: 1600, height: 1067, size: 612_109, hash: "29ad7730…b6cc", capturedAt: null })
    ]
  }
];

export function countPlan(groups: PhotoGroup[]) {
  const files = groups.flatMap(group => group.files);
  const selected = files.filter(file => file.decision === "quarantine");
  return { files: selected.length, bytes: selected.reduce((sum, file) => sum + file.size, 0) };
}

export function decisionCsv(groups: PhotoGroup[], moves: MoveRecord[] = []) {
  const moveBySource = new Map(moves.map(move => [move.source, move]));
  const rows = [["group_id", "match", "decision", "path", "bytes", "dimensions", "captured_at", "sha256", "backup_copies", "quarantine_path", "restored_at"]];
  for (const group of groups) for (const file of group.files) {
    const move = moveBySource.get(file.path);
    rows.push([group.id, group.kind, file.decision, file.path, String(file.size), `${file.width}x${file.height}`, file.capturedAt ?? "", file.hash, String(file.backupCount), move?.destination ?? "", move?.restoredAt ?? ""]);
  }
  return rows.map(row => row.map(csvCell).join(",")).join("\n");
}

const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;

/** Read portable recovery records from a Proof Pile decision CSV. */
export function movesFromDecisionCsv(contents: string): MoveRecord[] {
  const [header, ...rows] = parseCsv(contents);
  if (!header) throw new Error("The decision log is empty.");
  const columns = new Map(header.map((name, index) => [name, index]));
  const sourceIndex = columns.get("path");
  const destinationIndex = columns.get("quarantine_path");
  const restoredIndex = columns.get("restored_at");
  if (sourceIndex === undefined || destinationIndex === undefined) throw new Error("This CSV is not a Proof Pile decision log.");
  const known = new Set<string>();
  return rows.flatMap((row, index) => {
    const source = row[sourceIndex]?.trim();
    const destination = row[destinationIndex]?.trim();
    if (!source || !destination || known.has(`${source}\u0000${destination}`)) return [];
    known.add(`${source}\u0000${destination}`);
    return [{ id: `import-${index + 1}`, source, destination, movedAt: "Imported from decision log", restoredAt: row[restoredIndex ?? -1]?.trim() || undefined }];
  });
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(cell); cell = ""; }
    else if (character === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += character;
  }
  if (quoted) throw new Error("The decision log has an unfinished quoted value.");
  if (cell || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
  return rows;
}

export const formatBytes = (bytes: number) => {
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
};
