import "./style.css";
import { activeMoveSources, countPlan, decisionCsv, formatBytes, movesFromDecisionCsv, normalizeMoves, pendingQuarantineFiles, sampleGroups, type FileDecision, type MoveRecord, type PhotoGroup, type SavedReview } from "./model";

declare global { interface Window { __TAURI_INTERNALS__?: unknown } }

const app = document.querySelector<HTMLDivElement>("#app")!;
const isDesktop = Boolean(window.__TAURI_INTERNALS__);
const PRODUCT = "photo-proof-pile";
const VERSION = "0.1.18";
const LICENSE_KEY = `sb_license:${PRODUCT}`;
const DEMO_KEY = "demo:photo-proof-pile:session";
const REAL_KEY = "proof-pile:session";
let groups: PhotoGroup[] = [];
let activeGroup = 0;
let moves: MoveRecord[] = [];
let notice = "";
let demo = false;
let licenseActive = Boolean(localStorage.getItem(LICENSE_KEY));
let licenseNotice = "";
let planRunning = false;
const scrollPositions = new Map<string, number>();

type LicenseVerdict = { valid: boolean; reason?: string; expires_at?: string | null };

class LicenseServiceError extends Error {
  constructor(readonly kind: "unavailable" | "rate-limited" | "invalid-response") {
    super(kind);
  }
}

const escapeHtml = (value: unknown) => String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
const safeThumbnail = (value?: string) => value?.startsWith("data:image/webp;base64,") || value?.startsWith("/samples/") ? value : "/favicon.svg";

const icon = (name: "stack" | "check" | "arrow" | "shield") => ({
  stack: `<svg aria-hidden="true" viewBox="0 0 32 32"><path d="M7 5h19v20H7z"/><path d="M3 9h19v19H3"/></svg>`,
  check: `<svg aria-hidden="true" viewBox="0 0 32 32"><path d="M6 17l6 6L27 8"/></svg>`,
  arrow: `<svg aria-hidden="true" viewBox="0 0 32 32"><path d="M5 16h21M18 8l8 8-8 8"/></svg>`,
  shield: `<svg aria-hidden="true" viewBox="0 0 32 32"><path d="M16 3l11 5v8c0 7-4 11-11 14C9 27 5 23 5 16V8z"/><path d="M11 16l3 3 7-7"/></svg>`
})[name];

function header() {
  return `<header class="site-header"><a class="wordmark route-link" href="/" aria-label="Proof Pile home"><span class="registration-mark">PP</span><span>Proof Pile</span></a><nav aria-label="Main navigation"><a class="route-link" href="/demo">Demo</a><a class="route-link" href="/#how">How it works</a><a class="route-link" href="/privacy">Privacy</a></nav></header>`;
}

function footer() {
  return `<footer><p>Review duplicate photos before moving extra copies.</p><nav aria-label="Footer navigation"><a class="route-link" href="/privacy">Privacy</a><a class="route-link" href="/terms">Terms</a><a href="https://sociobot.in" rel="external" aria-label="Built by Param Factory (external site)">Built by Param Factory ↗</a></nav><p class="fine">v${VERSION}</p></footer>`;
}

function shell(content: string) {
  app.innerHTML = `${header()}${content}<div class="route-status sr-only" aria-live="polite"></div>${footer()}`;
  bindRoutes();
}

function landing() {
  demo = false;
  const downloadControl = isMobileDevice()
    ? `<p class="mobile-download-note">Open this page on a desktop computer to check downloads.</p>`
    : `<button class="download-link" id="download-app" type="button">Check download for ${platformName()}</button>`;
  shell(`<main id="main" tabindex="-1">
    <section class="hero">
      <div class="hero-copy"><p class="eyebrow">Local duplicate-photo review</p><h1 tabindex="-1">Review photo copies before you remove them</h1><p class="lede">For people with photos across several drives who fear removing the only meaningful copy.</p><div class="hero-action"><a class="button primary route-link" href="/demo">Try it with sample data ${icon("arrow")}</a><span>Opens three ready-to-review groups.</span></div>${downloadControl}<ul class="fact-list"><li>${icon("shield")} Photos stay on this device</li><li>${icon("check")} Works without an account</li><li>${icon("check")} Free for 1,000 files; US$29 once for full libraries</li></ul></div>
      <figure class="hero-art"><img src="/hero-proof-table.webp" width="900" height="600" fetchpriority="high" decoding="async" alt="Overlapping photo plates connect to a protected original on an archival work table."><figcaption>Each group keeps its file locations, dates, sizes, and match details.</figcaption></figure>
    </section>
    <section class="preview-section" aria-labelledby="preview-title"><div><p class="eyebrow">The review desk</p><h2 id="preview-title">See why files match</h2><p>Compare file locations, image sizes, dates, and copies on other drives before making a plan.</p></div>${previewGraphic()}</section>
    <section id="how" class="steps" aria-labelledby="how-title"><h2 id="how-title" tabindex="-1">How photo cleanup works</h2><ol><li><span>01</span><h3>Scan your folders</h3><p>Choose photo folders on each connected drive. The app reads files where they are.</p><figure><img src="/walkthrough/01-groups.webp" width="720" height="746" loading="lazy" decoding="async" alt="Three matching photo groups in the Proof Pile review desk."><figcaption>Start with groups, not a delete list.</figcaption></figure></li><li><span>02</span><h3>Review the evidence</h3><p>Keep one copy and mark extras. Every path and difference remains visible.</p><figure><img src="/walkthrough/02-evidence.webp" width="720" height="623" loading="lazy" decoding="async" alt="Two similar photos with their paths, camera details, and file identifiers."><figcaption>Compare each copy and its metadata.</figcaption></figure></li><li><span>03</span><h3>Quarantine, then verify</h3><p>Move extras to a folder you choose. Restore them from the decision log.</p><figure><img src="/walkthrough/03-quarantine.webp" width="720" height="747" loading="lazy" decoding="async" alt="A quarantine plan with two sample files marked for a reversible move."><figcaption>Move reviewed files, then restore if needed.</figcaption></figure></li></ol></section>
    <section class="boundaries" aria-labelledby="boundaries-title"><div><p class="eyebrow">Privacy and limits</p><h2 id="boundaries-title">Your photos are not uploaded</h2><p>Copies on other drives are matching files, not tested backups.</p></div><div class="warning-note"><strong>Keep a tested backup.</strong><p>A matching copy can still live on a failing drive. Open important backups before cleanup.</p></div></section>
    ${pricing()}
  </main>`);
  bindLanding();
}

function previewGraphic() {
  return `<div class="preview-stack" aria-label="Example duplicate group"><div class="mini-photo rear"></div><div class="mini-photo middle"></div><div class="mini-photo front"><img src="/samples/lake-a.svg" width="320" height="210" alt="Illustrated lake sunset sample photo."></div><div class="evidence-tag exact">Exact bytes</div><div class="evidence-line">3 copies · 2 drives</div></div>`;
}

function pricing() {
  return `<section class="pricing" aria-labelledby="price-title"><div><p class="eyebrow">Desktop license</p><h2 id="price-title">Review a full library</h2><p>The free app scans 1,000 files at a time. A license removes that scan limit.</p>${licenseNotice ? `<p class="license-notice" role="status">${escapeHtml(licenseNotice)}</p>` : ""}</div><div class="price-actions"><p class="price"><strong>US$29</strong> one-time purchase</p><a class="button primary" id="buy-license" rel="external" href="https://api.sociobot.in/api/v1/products/${PRODUCT}/checkout">Buy via Sociobot checkout ↗</a><button class="button quiet" id="restore-license" type="button">Restore a purchase</button><p>Sociobot checkout takes payment. For refunds, email <a href="mailto:support@sociobot.in?subject=Proof%20Pile%20refund">support@sociobot.in</a>.</p></div></section>`;
}

function bindLanding() {
  document.querySelector("#restore-license")?.addEventListener("click", showLicenseDialog);
  document.querySelector("#download-app")?.addEventListener("click", showDownloads);
}

function platformName() {
  const platform = navigator.userAgent.toLowerCase();
  if (platform.includes("mac")) return "macOS";
  if (platform.includes("win")) return "Windows";
  if (platform.includes("linux")) return "Linux";
  return "your computer";
}

function isMobileDevice() {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

function enterDemo() {
  demo = true;
  const saved = readReview(sessionStorage, DEMO_KEY);
  groups = saved?.groups ?? sampleGroups();
  moves = saved?.moves ?? [];
  activeGroup = 0;
  renderDesk();
}

function appRoute() {
  demo = false;
  const saved = readReview(localStorage, REAL_KEY);
  groups = saved?.groups ?? [];
  moves = saved?.moves ?? [];
  activeGroup = 0;
  renderDesk();
}

function readReview(storage: Storage, key: string): SavedReview | null {
  const saved = storage.getItem(key);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    // Read the older groups-only record, then upgrade it on the next write.
    if (Array.isArray(parsed)) return { groups: parsed, moves: [] };
    if (!Array.isArray(parsed?.groups) || !Array.isArray(parsed?.moves)) throw new Error();
    return { groups: parsed.groups, moves: normalizeMoves(parsed.moves) };
  } catch {
    storage.removeItem(key);
    notice = "The saved review could not be read. Start a new scan.";
    return null;
  }
}

function renderDesk() {
  const group = groups[activeGroup];
  const plan = countPlan(groups, moves);
  const title = demo ? "Review a sample photo pile" : groups.length ? "Review your photo pile" : "Choose folders to scan";
  shell(`<main id="main" class="desk-page" tabindex="-1">
    ${demo ? `<aside class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data, nothing is saved</strong><div><button id="reset-demo" type="button">Reset demo</button><button id="start-real" type="button">Start for real</button></div></aside>` : ""}
    <div class="desk-heading"><div><p class="eyebrow">${demo ? "Sample review" : "Local review"}</p><h1 tabindex="-1">${title}</h1><p>${groups.length ? `${groups.length} groups need a decision.` : "Add two or more folders. Proof Pile will compare image files where they are."}</p></div><div class="desk-tools"><button class="button quiet" id="scan-folders" type="button">${isDesktop ? "Choose photo folders" : "Show desktop downloads"}</button><button class="button quiet" id="import-csv" type="button">Import decision log</button>${groups.length ? `<button class="button quiet" id="export-csv" type="button">Export decision log</button>` : ""}</div></div>
    ${notice ? `<div class="notice" role="status">${escapeHtml(notice)}</div>` : ""}
    ${groups.length && group ? deskContent(group, plan.files, plan.bytes) : emptyState()}
  </main>`);
  bindDesk();
}

function emptyState() {
  return `<section class="empty-state" aria-labelledby="empty-title">${icon("stack")}<h2 id="empty-title">No photo groups yet</h2><p>Matching photo groups will appear here after a local scan.</p><button class="button primary" id="empty-action" type="button">${isDesktop ? "Choose photo folders" : "Try sample data"}</button>${moves.some(move => !move.restoredAt) ? `<button class="button quiet" id="restore-last" type="button">Restore last move</button>` : ""}</section>`;
}

function deskContent(group: PhotoGroup, planFiles: number, planBytes: number) {
  const completed = activeMoveSources(moves);
  const planSummary = planFiles
    ? `${formatBytes(planBytes)} would move. Originals stay unchanged until you run the plan.`
    : "No files are waiting to move.";
  return `<div class="desk-layout">
    <aside class="group-rail" aria-label="Photo groups"><div class="rail-heading"><h2>Groups</h2><span>${groups.length}</span></div><div role="listbox" aria-label="Duplicate groups">${groups.map((item, index) => `<button type="button" role="option" aria-selected="${index === activeGroup}" data-group="${index}"><span class="group-thumb"><img src="${safeThumbnail(item.files[0]?.thumbnail)}" alt=""></span><span><strong>${escapeHtml(item.kind)}</strong><small>${item.files.length} files · ${item.confidence}% match</small></span></button>`).join("")}</div><p class="key-hint">Use ↑ and ↓ to change groups.</p></aside>
    <section class="evidence" aria-labelledby="group-title"><div class="evidence-heading"><div><span class="match-badge">${escapeHtml(group.kind)}</span><h2 id="group-title">${escapeHtml(humanGroup(group.id))}</h2><p>${escapeHtml(group.reason)}</p></div><div class="confidence"><strong>${group.confidence}%</strong><span>match</span></div></div>
      <div class="photo-strip" tabindex="0" role="region" aria-label="${escapeHtml(humanGroup(group.id))} photo copies. Scroll sideways to compare every copy.">${group.files.map((file, index) => `<figure class="photo-card ${file.decision} ${completed.has(file.path) ? "completed" : ""}"><img src="${safeThumbnail(file.thumbnail || group.files[0].thumbnail)}" width="320" height="210" alt="${escapeHtml(humanGroup(group.id))} copy ${index + 1}."><figcaption>${completed.has(file.path) ? "Moved to quarantine" : file.decision === "keep" ? "Keep" : file.decision === "quarantine" ? "Quarantine" : "Needs review"}</figcaption></figure>`).join("")}</div>
      <div class="file-list" aria-label="Copy evidence">${group.files.map(file => fileRow(file, completed.has(file.path))).join("")}</div>
      <div class="group-actions"><button class="button quiet" id="keep-best" type="button">Keep largest copy</button><button class="button quiet" id="mark-extras" type="button">Mark exact extras</button></div>
    </section>
    <aside class="plan-rail" aria-labelledby="plan-title"><p class="eyebrow">Reversible plan</p><h2 id="plan-title">Quarantine plan</h2><div class="plan-number"><strong>${planFiles}</strong><span>files marked</span></div><p>${planSummary}</p><label for="quarantine-folder">Quarantine folder</label><input id="quarantine-folder" value="${demo ? "/Sample drive/Proof Pile Quarantine" : ""}" readonly placeholder="Choose a folder"><button class="button primary" id="run-plan" type="button" ${planFiles ? "" : "disabled"}>${planFiles ? `Move ${planFiles} file${planFiles === 1 ? "" : "s"} to quarantine` : "Choose files to quarantine"}</button><p class="safety-copy">Files move only to the quarantine folder. Test a backup before freeing drive space.</p>${moves.some(move => !move.restoredAt) ? `<button class="button quiet" id="restore-last" type="button">Restore last move</button>` : ""}</aside>
  </div>`;
}

function fileRow(file: PhotoGroup["files"][number], completed: boolean) {
  const date = file.capturedAt ? new Date(file.capturedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "No capture date";
  return `<article class="file-row ${file.decision} ${completed ? "completed" : ""}"><div class="file-path"><strong title="${escapeHtml(file.path)}">${escapeHtml(file.name)}</strong><span>${escapeHtml(file.path)}</span></div><dl><div><dt>Dimensions</dt><dd>${file.width} × ${file.height}</dd></div><div><dt>Size</dt><dd>${formatBytes(file.size)}</dd></div><div><dt>Captured</dt><dd>${escapeHtml(date)}</dd></div><div><dt>Camera</dt><dd>${escapeHtml(file.camera || "Not recorded")}</dd></div><div><dt>File identifier</dt><dd><code>${escapeHtml(file.hash)}</code></dd></div><div><dt>Other-drive copies</dt><dd>${file.backupCount}</dd></div></dl>${completed ? `<p class="move-status">Moved to quarantine. Restore it from the decision log to review it again.</p>` : ""}<fieldset ${completed ? "disabled" : ""}><legend>Decision for ${escapeHtml(file.name)}</legend>${decisionButton(file.id, "keep", "Keep", file.decision)}${decisionButton(file.id, "quarantine", "Quarantine", file.decision)}${decisionButton(file.id, "review", "Mark for review", file.decision)}</fieldset></article>`;
}

function decisionButton(id: string, value: string, label: string, current: FileDecision) {
  return `<button type="button" data-file="${escapeHtml(id)}" data-decision="${value}" aria-pressed="${current === value}">${label}</button>`;
}

function humanGroup(id: string) { return id.split("-").map(word => word[0].toUpperCase() + word.slice(1)).join(" "); }

function bindDesk() {
  document.querySelector("#reset-demo")?.addEventListener("click", () => { sessionStorage.removeItem(DEMO_KEY); notice = "Demo reset to its starting state."; enterDemo(); });
  document.querySelector("#start-real")?.addEventListener("click", () => { sessionStorage.removeItem(DEMO_KEY); navigate("/app"); });
  document.querySelector("#empty-action")?.addEventListener("click", () => demo ? undefined : isDesktop ? scanFolders() : navigate("/demo"));
  document.querySelector("#scan-folders")?.addEventListener("click", () => isDesktop ? scanFolders() : showDownloads());
  document.querySelectorAll<HTMLButtonElement>("[data-group]").forEach(button => button.addEventListener("click", () => { activeGroup = Number(button.dataset.group); renderDesk(); }));
  const listbox = document.querySelector<HTMLElement>("[role=listbox]");
  listbox?.addEventListener("keydown", event => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault(); activeGroup = (activeGroup + (event.key === "ArrowDown" ? 1 : -1) + groups.length) % groups.length; renderDesk();
    document.querySelector<HTMLButtonElement>(`[data-group="${activeGroup}"]`)?.focus();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-file]").forEach(button => button.addEventListener("click", () => {
    const file = groups[activeGroup].files.find(item => item.id === button.dataset.file);
    const next = button.dataset.decision as "keep" | "quarantine" | "review";
    if (file && next === "quarantine" && !canQuarantine(groups[activeGroup], file.id)) {
      notice = "Keep one copy in this group before marking another copy for quarantine.";
      renderDeskWithDecisionFocus(file.id, next, false);
      return;
    }
    if (file) file.decision = next;
    persist();
    if (file) renderDeskWithDecisionFocus(file.id, next, true);
    else renderDesk();
  }));
  document.querySelector("#keep-best")?.addEventListener("click", keepBest);
  document.querySelector("#mark-extras")?.addEventListener("click", markExtras);
  document.querySelector("#run-plan")?.addEventListener("click", runPlan);
  document.querySelector("#restore-last")?.addEventListener("click", restoreLast);
  document.querySelector("#export-csv")?.addEventListener("click", exportCsv);
  document.querySelector("#import-csv")?.addEventListener("click", importCsv);
}

function renderDeskWithDecisionFocus(fileId: string, decision: FileDecision, advance: boolean) {
  const actionable = groups[activeGroup].files.filter(file => !activeMoveSources(moves).has(file.path));
  const current = actionable.findIndex(file => file.id === fileId);
  const next = advance && current >= 0 && current + 1 < actionable.length ? actionable[current + 1] : actionable[current];
  const nextDecision: FileDecision = next?.id === fileId ? decision : "keep";
  renderDesk();
  [...document.querySelectorAll<HTMLButtonElement>("[data-file]")]
    .find(button => button.dataset.file === next?.id && button.dataset.decision === nextDecision)
    ?.focus();
}

function persist() {
  try {
    const review: SavedReview = { groups, moves };
    if (demo) sessionStorage.setItem(DEMO_KEY, JSON.stringify(review));
    else localStorage.setItem(REAL_KEY, JSON.stringify(review, (key, value) => key === "thumbnail" ? undefined : value));
  } catch {
    notice = "The review changed, but this device could not save it. Export the CSV before closing the app.";
  }
}

function canQuarantine(group: PhotoGroup, fileId: string) {
  return group.files.some(file => file.id !== fileId && file.decision === "keep");
}

function planHasKeptCopy() {
  return groups.every(group => !group.files.some(file => file.decision === "quarantine") || group.files.some(file => file.decision === "keep"));
}

function keepBest() {
  const sorted = [...groups[activeGroup].files].sort((a, b) => b.width * b.height - a.width * a.height || b.size - a.size);
  groups[activeGroup].files.forEach(file => file.decision = file.id === sorted[0].id ? "keep" : "review");
  notice = `${sorted[0].name} is marked to keep. Review the other copies.`; persist(); renderDesk();
}

function markExtras() {
  const group = groups[activeGroup];
  if (group.kind !== "Exact bytes") { notice = "Only exact byte matches can be marked together. Review this group file by file."; renderDesk(); return; }
  const keep = group.files.find(file => file.decision === "keep") ?? group.files[0];
  const completed = activeMoveSources(moves);
  let added = 0;
  group.files.forEach(file => {
    if (completed.has(file.path)) return;
    file.decision = file.id === keep.id ? "keep" : "quarantine";
    if (file.decision === "quarantine") added += 1;
  });
  notice = added ? `${added} exact copies added to the quarantine plan.` : "These exact copies are already in quarantine.";
  persist(); renderDesk();
}

async function runPlan() {
  if (planRunning) return;
  const selected = pendingQuarantineFiles(groups, moves);
  if (!selected.length) return;
  if (!planHasKeptCopy()) { notice = "Keep one copy in every group before running the quarantine plan."; renderDesk(); return; }
  planRunning = true;
  if (demo) {
    const destination = "/Sample drive/Proof Pile Quarantine";
    if (!confirm(`Move ${selected.length} files to ${destination}? You can restore them from the decision log.`)) { planRunning = false; return; }
    const stamp = new Date().toISOString();
    addCompletedMoves(selected.map((file, i) => ({ id: `demo-${stamp}-${i}`, source: file.path, destination: `${destination}/${file.name}`, movedAt: stamp, sha256: "d".repeat(64), quarantineRoot: destination })), selected);
    planRunning = false;
    persist(); notice = `${selected.length} sample files moved to the demo quarantine. No files on your device changed.`; renderDesk(); return;
  }
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const destination = await open({ directory: true, multiple: false, title: "Choose a quarantine folder" });
    if (!destination || Array.isArray(destination)) return;
    if (!confirm(`Move ${selected.length} files to ${destination}? You can restore them from the decision log.`)) return;
    const reviewedPlan = selected.map(file => {
      const group = groups.find(candidate => candidate.files.some(item => item.id === file.id));
      return { path: file.path, decision: file.decision, keptCopyPath: group?.files.find(item => item.decision === "keep")?.path ?? "" };
    });
    const { invoke } = await import("@tauri-apps/api/core");
    const completed = await invoke<MoveRecord[]>("execute_quarantine", { plan: reviewedPlan, quarantineDir: destination });
    const added = addCompletedMoves(completed, selected);
    persist(); notice = `${added} file${added === 1 ? "" : "s"} moved to quarantine. The decision log is ready to export.`; renderDesk();
  } catch (error) { notice = `The plan did not run. ${plainError(error)} Choose a writable quarantine folder and try again.`; renderDesk(); }
  finally { planRunning = false; }
}

function addCompletedMoves(completed: MoveRecord[], expected: PhotoGroup["files"]) {
  const active = activeMoveSources(moves);
  const selected = new Set(expected.map(file => file.path));
  const added = completed.filter(move => {
    if (!selected.has(move.source) || active.has(move.source)) return false;
    active.add(move.source);
    return true;
  });
  moves.push(...added);
  return added.length;
}

async function restoreLast() {
  const move = [...moves].reverse().find(item => !item.restoredAt); if (!move) return;
  if (!(await confirmRestore(move))) return;
  if (demo) { completeRestore(move); persist(); notice = `${move.source.split("/").pop()} restored in the demo.`; renderDesk(); return; }
  try { const { invoke } = await import("@tauri-apps/api/core"); await invoke("restore_quarantined", { record: move }); completeRestore(move); persist(); notice = `${move.source.split("/").pop()} restored.`; renderDesk(); }
  catch (error) { notice = `The file was not restored. ${plainError(error)} Check both folders and try again.`; renderDesk(); }
}

function completeRestore(move: MoveRecord) {
  move.restoredAt = new Date().toISOString();
  const file = groups.flatMap(group => group.files).find(candidate => candidate.path === move.source);
  if (file?.decision === "quarantine") file.decision = "review";
}

function confirmRestore(move: MoveRecord) {
  return new Promise<boolean>(resolve => {
    const dialog = document.createElement("dialog");
    dialog.innerHTML = `<form method="dialog" class="restore-dialog"><p class="eyebrow">Confirm recovery</p><h2>Restore this file?</h2><p>The quarantined file will move back to its original path.</p><dl><div><dt>From quarantine</dt><dd><code>${escapeHtml(move.destination)}</code></dd></div><div><dt>To original path</dt><dd><code>${escapeHtml(move.source)}</code></dd></div></dl><div class="dialog-actions"><button class="button quiet" value="cancel" autofocus>Cancel</button><button class="button primary" value="restore">Restore this file</button></div></form>`;
    document.body.append(dialog);
    dialog.addEventListener("close", () => { const approved = dialog.returnValue === "restore"; dialog.remove(); resolve(approved); }, { once: true });
    dialog.showModal();
  });
}

async function scanFolders() {
  notice = "";
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const chosen = await open({ directory: true, multiple: true, title: "Choose photo folders on your drives" });
    if (!chosen) return;
    const paths = Array.isArray(chosen) ? chosen : [chosen];
    notice = `Scanning ${paths.length} folders on this device…`; renderDesk();
    const { invoke } = await import("@tauri-apps/api/core");
    const report = await invoke<{ groups: PhotoGroup[]; scanned: number; skipped: number; limited: boolean }>("scan_directories", { paths, licensed: licenseActive });
    groups = report.groups; activeGroup = 0;
    const limit = report.limited ? " The free scan stopped at 1,000 image files." : "";
    const skipped = report.skipped ? ` ${report.skipped} unreadable files were skipped.` : "";
    notice = groups.length ? `${groups.length} matching groups found among ${report.scanned} images.${limit}${skipped}` : `The scan checked ${report.scanned} images and found no matching groups.${limit}${skipped}`;
    persist(); renderDesk();
  } catch (error) { notice = `The scan stopped. ${plainError(error)} Check folder access and try again.`; renderDesk(); }
}

async function exportCsv() {
  const csv = decisionCsv(groups, moves);
  if (isDesktop) {
    try { const { save } = await import("@tauri-apps/plugin-dialog"); const path = await save({ defaultPath: "proof-pile-decisions.csv", filters: [{ name: "CSV", extensions: ["csv"] }] }); if (!path) return; const { invoke } = await import("@tauri-apps/api/core"); await invoke("write_decision_log", { path, contents: csv }); notice = "Decision log saved."; renderDesk(); return; }
    catch (error) { notice = `The log was not saved. ${plainError(error)} Choose another folder and try again.`; renderDesk(); return; }
  }
  const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = "proof-pile-decisions.csv"; link.click(); URL.revokeObjectURL(link.href);
  notice = "Decision log exported."; renderDesk();
}

async function importCsv() {
  try {
    let contents = "";
    if (isDesktop) {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const path = await open({ multiple: false, title: "Choose a Proof Pile decision log", filters: [{ name: "CSV", extensions: ["csv"] }] });
      if (!path || Array.isArray(path)) return;
      const { invoke } = await import("@tauri-apps/api/core");
      contents = await invoke<string>("read_decision_log", { path });
    } else contents = await readCsvFile();
    const imported = movesFromDecisionCsv(contents);
    if (!imported.length) throw new Error("No quarantine records were found in this decision log.");
    let verified = imported;
    if (demo) {
      const demoRoot = "/Sample drive/Proof Pile Quarantine";
      if (imported.some(move => !move.destination.startsWith(`${demoRoot}/`))) throw new Error("A recovery path is outside the sample quarantine folder.");
      verified = imported.map(move => ({ ...move, quarantineRoot: demoRoot }));
    } else {
      if (!isDesktop) throw new Error("Open this decision log in the desktop app to verify its files.");
      const { open } = await import("@tauri-apps/plugin-dialog");
      const quarantineRoot = await open({ directory: true, multiple: false, title: "Choose the quarantine folder for this log" });
      if (!quarantineRoot || Array.isArray(quarantineRoot)) return;
      const { invoke } = await import("@tauri-apps/api/core");
      verified = await invoke<MoveRecord[]>("validate_recovery_records", { records: imported, quarantineDir: quarantineRoot });
    }
    const known = new Set(moves.map(move => `${move.source}\u0000${move.destination}`));
    const added = verified.filter(move => !known.has(`${move.source}\u0000${move.destination}`));
    moves.push(...added);
    persist();
    notice = added.length ? `${added.length} verified recovery record${added.length === 1 ? "" : "s"} imported from the decision log.` : "Those recovery records are already loaded.";
    renderDesk();
  } catch (error) { notice = `The decision log was not imported. ${plainError(error)} Choose a Proof Pile CSV and try again.`; renderDesk(); }
}

function readCsvFile() {
  return new Promise<string>((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".csv,text/csv";
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error("No file was chosen.")); return; }
      try { resolve(await file.text()); } catch { reject(new Error("The selected file could not be read.")); }
    });
    input.click();
  });
}

function plainError(error: unknown) { return String(error).replace(/^Error:\s*/, ""); }

function licenseVerificationUrl(token: string) {
  return `https://api.sociobot.in/api/v1/products/${PRODUCT}/verify?license=${encodeURIComponent(token)}`;
}

function licenseServiceMessage(error: unknown) {
  if (error instanceof LicenseServiceError && error.kind === "rate-limited") return "License checks are busy. Try again in a few minutes.";
  return "License checks are temporarily unavailable. Try again later.";
}

async function verifyLicenseToken(token: string): Promise<LicenseVerdict> {
  let response: Response;
  try {
    response = await fetch(licenseVerificationUrl(token));
  } catch {
    // A CORS failure caused by a failed billing service is indistinguishable
    // from a disconnected browser. Neither is a reason to revoke local work.
    throw new LicenseServiceError("unavailable");
  }
  if (response.status === 429) throw new LicenseServiceError("rate-limited");
  if (!response.ok) throw new LicenseServiceError("unavailable");
  let verdict: unknown;
  try {
    verdict = await response.json();
  } catch {
    throw new LicenseServiceError("invalid-response");
  }
  if (!verdict || typeof verdict !== "object" || typeof (verdict as LicenseVerdict).valid !== "boolean") throw new LicenseServiceError("invalid-response");
  return verdict as LicenseVerdict;
}

function legalPage(kind: "privacy" | "terms") {
  const privacy = `<main id="main" class="prose-page" tabindex="-1"><p class="eyebrow">Policy</p><h1 tabindex="-1">Privacy without photo uploads</h1><p>Last updated 29 August 2026.</p><h2>Your photos stay local</h2><p>The desktop app reads selected folders on your device. It does not upload photos, thumbnails, paths, file identifiers, or decision logs.</p><h2>Data stored on your device</h2><p>The app stores review choices and recovery records, your license token, and cached license status. Demo choices stay only in this browser tab.</p><h2>License checks</h2><p>License verification sends only the license token to the Sociobot billing API.</p><h2>Website requests</h2><p>The download page may request release details from GitHub. We do not run advertising or tracking scripts.</p><h2>Remove your data</h2><p>Reset the demo or clear this site's storage. Desktop quarantine files remain where you chose to place them.</p><p>Questions: <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a></p></main>`;
  const terms = `<main id="main" class="prose-page" tabindex="-1"><p class="eyebrow">Terms</p><h1 tabindex="-1">Terms for careful photo cleanup</h1><p>Last updated 29 August 2026.</p><h2>Use and responsibility</h2><p>Proof Pile helps you review and move files. You remain responsible for your files and backups.</p><h2>Quarantine folders</h2><p>The app moves chosen files to a quarantine folder. Do not empty that folder until you test important backups.</p><h2>License</h2><p>The free tier scans up to 1,000 files at once. A US$29 one-time license removes that scan limit.</p><h2>Payments and refunds</h2><p>Sociobot checkout takes payment. For refunds, email <a href="mailto:support@sociobot.in?subject=Proof%20Pile%20refund">support@sociobot.in</a>.</p><h2>Warranty</h2><p>The software is provided as is. Keep verified backups before changing a photo library.</p><p>Questions: <a href="mailto:support@sociobot.in">support@sociobot.in</a></p></main>`;
  shell(kind === "privacy" ? privacy : terms);
}

function notFound() { shell(`<main id="main" class="not-found" tabindex="-1"><p class="giant">404</p><h1 tabindex="-1">This page was not found</h1><p>Check the address or return to the photo review.</p><a class="button primary route-link" href="/">Return home</a></main>`); }

function scrollKey() { return `${location.pathname}${location.search}${location.hash}`; }
function scrollStorageKey() { return `proof-pile:scroll:${scrollKey()}`; }
function saveScroll() {
  scrollPositions.set(scrollKey(), scrollY);
  sessionStorage.setItem(scrollStorageKey(), String(scrollY));
  history.replaceState({ ...(history.state ?? {}), scrollY }, "", location.href);
}

function navigate(path: string, replace = false) {
  saveScroll();
  if (replace) history.replaceState({ scrollY: 0 }, "", path);
  else history.pushState({ scrollY: 0 }, "", path);
  route(false);
}

function route(restoreScroll = false) {
  notice = "";
  const path = location.pathname.replace(/\/$/, "") || "/";
  const directDemo = path === "/" && new URLSearchParams(location.search).get("demo") === "1";
  if (directDemo || path === "/demo") enterDemo(); else if (path === "/") landing(); else if (path === "/app") appRoute(); else if (path === "/privacy") legalPage("privacy"); else if (path === "/terms") legalPage("terms"); else notFound();
  const meta: Record<string, { title: string; description: string }> = {
    "/": { title: "Proof Pile — Review photo copies before cleanup", description: "Review duplicate photo evidence, quarantine extra copies, and keep a local decision log you can reverse." },
    "/demo": { title: "Demo — Proof Pile", description: "Try a separate sample review with realistic duplicate-photo evidence. Nothing is saved to your real review." },
    "/app": { title: "Proof Pile — Review photo copies", description: "Choose photo folders, compare likely copies, and make a reversible quarantine plan." },
    "/privacy": { title: "Privacy — Proof Pile", description: "Learn what Proof Pile stores locally and what the optional license check sends to Sociobot." },
    "/terms": { title: "Terms — Proof Pile", description: "Read Proof Pile terms, license limits, payment information, and file-care responsibilities." }
  };
  const currentMeta = directDemo ? meta["/demo"] : meta[path] ?? { title: "Page not found — Proof Pile", description: "This Proof Pile page is not available. Return home to review duplicate photos." };
  document.title = currentMeta.title;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute("href", `https://photo-proof-pile.sociobot.in${directDemo ? "/demo" : path}`);
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", currentMeta.description);
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute("content", currentMeta.title);
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute("content", currentMeta.description);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute("content", currentMeta.title);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.setAttribute("content", currentMeta.description);
  const hashTarget = location.hash === "#how" ? document.querySelector<HTMLElement>("#how-title") : null;
  const focusTarget = hashTarget ?? document.querySelector<HTMLElement>("h1");
  document.querySelector(".route-status")!.textContent = focusTarget?.textContent ?? "Page changed";
  const top = restoreScroll ? Number(scrollPositions.get(scrollKey()) ?? sessionStorage.getItem(scrollStorageKey()) ?? history.state?.scrollY ?? 0) : 0;
  requestAnimationFrame(() => {
    focusTarget?.focus({ preventScroll: true });
    if (hashTarget && !restoreScroll) hashTarget.scrollIntoView({ block: "start" });
    else scrollTo(0, top);
  });
}

function bindRoutes() { document.querySelectorAll<HTMLAnchorElement>("a.route-link").forEach(link => link.addEventListener("click", event => { if (link.origin !== location.origin) return; event.preventDefault(); navigate(`${link.pathname}${link.search}${link.hash}`); })); }

function showLicenseDialog() {
  const dialog = document.createElement("dialog");
  dialog.innerHTML = `<form method="dialog"><button class="dialog-close" value="cancel" aria-label="Close license window">×</button><p class="eyebrow">Restore purchase</p><h2>Enter your license</h2><label for="license-token">License token</label><input id="license-token" autocomplete="off"><p id="license-result" role="status">The token is stored only on this device.</p><button class="button primary" id="verify-license" type="button">Verify license</button></form>`;
  document.body.append(dialog); dialog.showModal(); dialog.querySelector<HTMLInputElement>("input")?.focus();
  dialog.addEventListener("close", () => dialog.remove());
  dialog.querySelector("#verify-license")?.addEventListener("click", async () => {
    const token = dialog.querySelector<HTMLInputElement>("input")!.value.trim(); const result = dialog.querySelector<HTMLElement>("#license-result")!;
    if (!token) { result.textContent = "Enter the token from your receipt."; return; }
    result.textContent = "Checking this license…";
    try {
      const verdict = await verifyLicenseToken(token);
      if (!verdict.valid) { result.textContent = "This license is not active. Check the token and try again."; return; }
      localStorage.setItem(LICENSE_KEY, token);
      localStorage.setItem(`${LICENSE_KEY}:verified`, JSON.stringify({ ...verdict, checkedAt: Date.now() }));
      licenseActive = true;
      result.textContent = "License verified. Full-library scans are active.";
    } catch (error) {
      result.textContent = `${licenseServiceMessage(error)} Your saved license was not changed.`;
    }
  });
}

async function verifySavedLicense() {
  const params = new URLSearchParams(location.search); const returned = params.get("license");
  if (returned) { localStorage.setItem(LICENSE_KEY, returned); params.delete("license"); history.replaceState({}, "", `${location.pathname}${params.size ? `?${params}` : ""}`); licenseActive = true; }
  const token = localStorage.getItem(LICENSE_KEY); if (!token) return;
  let cached: { valid?: boolean; checkedAt?: number } | null = null;
  try { cached = JSON.parse(localStorage.getItem(`${LICENSE_KEY}:verified`) || "null"); } catch { localStorage.removeItem(`${LICENSE_KEY}:verified`); }
  if (cached?.checkedAt && Date.now() - cached.checkedAt < 86_400_000) {
    licenseActive = Boolean(cached.valid);
    if (!cached.valid) licenseNotice = "This license is no longer active. Enter another license.";
    return;
  }
  try {
    const verdict = await verifyLicenseToken(token);
    localStorage.setItem(`${LICENSE_KEY}:verified`, JSON.stringify({ ...verdict, checkedAt: Date.now() }));
    licenseActive = Boolean(verdict.valid);
    if (!verdict.valid) licenseNotice = "This license is no longer active. Enter another license.";
  } catch (error) {
    // A checkout return is stored and unlocked before its background check.
    // Keep that local unlock during a service outage; a later valid/invalid
    // response still reconciles it, and a cached invalid verdict stays locked.
    licenseActive = cached ? Boolean(cached.valid) : Boolean(token);
    licenseNotice = licenseActive
      ? `${licenseServiceMessage(error)} Your returned license stays active for now.`
      : `${licenseServiceMessage(error)} Your free review stays available.`;
  }
}

async function showDownloads() {
  const existing = document.querySelector("dialog"); if (existing) existing.remove();
  const dialog = document.createElement("dialog"); dialog.innerHTML = `<div class="download-dialog"><button class="dialog-close" aria-label="Close download window">×</button><p class="eyebrow">Desktop app</p><h2>Desktop downloads</h2><p id="release-state">Checking the latest release…</p><div id="release-links"></div><p class="fine" id="signature-state">Checking release verification…</p></div>`; document.body.append(dialog); dialog.showModal(); dialog.querySelector(".dialog-close")?.addEventListener("click", () => dialog.close()); dialog.addEventListener("close", () => dialog.remove());
  try {
    const releaseKey = `proof-pile:release:v${VERSION}`;
    let release = JSON.parse(localStorage.getItem(releaseKey) || "null"); if (!release || Date.now() - release.savedAt > 3_600_000) { const response = await fetch("https://api.github.com/repos/B-Divyesh/sf-photo-proof-pile/releases?per_page=1"); if (!response.ok) throw new Error(); const releases = await response.json(); if (!Array.isArray(releases) || !releases[0]) throw new Error(); release = { data: releases[0], savedAt: Date.now() }; localStorage.setItem(releaseKey, JSON.stringify(release)); }
    const assets = release.data.assets as { name: string; browser_download_url: string }[];
    const releaseVerified = assets.some(item => item.name === "DESKTOP_RELEASE_VERIFIED.json");
    const signaturesVerified = assets.some(item => item.name === "DESKTOP_SIGNATURES_VERIFIED.json");
    const checksums = assets.some(item => item.name === "SHA256SUMS");
    const manifest = assets.some(item => item.name === "latest.json");
    const macArm = assets.find(item => /\.(dmg)$/i.test(item.name) && /(aarch64|arm64)/i.test(item.name));
    const macIntel = assets.find(item => /\.(dmg)$/i.test(item.name) && /(x86_64|x64|intel)/i.test(item.name));
    const windows = assets.find(item => /\.(msi|exe)$/i.test(item.name));
    const linux = assets.find(item => /\.(AppImage|deb)$/i.test(item.name));
    if (!releaseVerified || !checksums || !manifest || !macArm || !macIntel || !windows || !linux) {
      document.querySelector("#release-state")!.textContent = "Downloads are being prepared.";
      document.querySelector("#signature-state")!.textContent = "No package is offered until the complete matrix and checksums pass.";
      document.querySelector("#release-links")!.replaceChildren();
      return;
    }
    document.querySelector("#release-state")!.textContent = `${release.data.tag_name} is ready.`;
    document.querySelector("#signature-state")!.textContent = signaturesVerified
      ? "Windows is Authenticode signed. macOS is signed and notarized."
      : "macOS and Windows builds are unsigned. Your system will ask you to confirm the first launch.";
    document.querySelector("#release-links")!.innerHTML = [
      `<a class="button quiet" href="${escapeHtml(macArm.browser_download_url)}">Download for macOS (Apple silicon)</a>`,
      `<a class="button quiet" href="${escapeHtml(macIntel.browser_download_url)}">Download for macOS (Intel)</a>`,
      `<a class="button quiet" href="${escapeHtml(windows.browser_download_url)}">Download for Windows</a>`,
      `<a class="button quiet" href="${escapeHtml(linux.browser_download_url)}">Download for Linux</a>`
    ].join("");
  } catch { document.querySelector("#release-state")!.textContent = "Downloads are not published yet. Check again later."; document.querySelector("#signature-state")!.textContent = "No package was offered because release verification could not be checked."; }
}

addEventListener("popstate", () => route(true));
addEventListener("pageshow", event => { if (event.persisted) route(true); });
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
document.addEventListener("click", event => {
  const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a.route-link");
  if (!link || event.defaultPrevented || link.origin !== location.origin || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(`${link.pathname}${link.search}${link.hash}`);
});
document.querySelector<HTMLAnchorElement>(".skip-link")?.addEventListener("click", event => { event.preventDefault(); document.querySelector<HTMLElement>("main")?.focus(); });
if ("serviceWorker" in navigator && !isDesktop) addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => undefined));
verifySavedLicense().finally(() => route(sessionStorage.getItem(scrollStorageKey()) !== null));
