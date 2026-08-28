import "./style.css";
import { countPlan, decisionCsv, formatBytes, sampleGroups, type MoveRecord, type PhotoGroup } from "./model";

declare global { interface Window { __TAURI_INTERNALS__?: unknown } }

const app = document.querySelector<HTMLDivElement>("#app")!;
const isDesktop = Boolean(window.__TAURI_INTERNALS__);
const PRODUCT = "photo-proof-pile";
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

const escapeHtml = (value: unknown) => String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
const safeThumbnail = (value?: string) => value?.startsWith("data:image/webp;base64,") || value?.startsWith("/samples/") ? value : "/favicon.svg";

const icon = (name: "stack" | "check" | "arrow" | "shield") => ({
  stack: `<svg aria-hidden="true" viewBox="0 0 32 32"><path d="M7 5h19v20H7z"/><path d="M3 9h19v19H3"/></svg>`,
  check: `<svg aria-hidden="true" viewBox="0 0 32 32"><path d="M6 17l6 6L27 8"/></svg>`,
  arrow: `<svg aria-hidden="true" viewBox="0 0 32 32"><path d="M5 16h21M18 8l8 8-8 8"/></svg>`,
  shield: `<svg aria-hidden="true" viewBox="0 0 32 32"><path d="M16 3l11 5v8c0 7-4 11-11 14C9 27 5 23 5 16V8z"/><path d="M11 16l3 3 7-7"/></svg>`
})[name];

function header() {
  return `<header class="site-header"><a class="wordmark route-link" href="/" aria-label="Proof Pile home"><span class="registration-mark">PP</span><span>Proof Pile</span></a><nav aria-label="Main navigation"><a class="route-link" href="/demo">Demo</a><a href="/#how">How it works</a><a class="route-link" href="/privacy">Privacy</a></nav></header>`;
}

function footer() {
  return `<footer><p>Proof before photo cleanup.</p><nav aria-label="Footer navigation"><a class="route-link" href="/privacy">Privacy</a><a class="route-link" href="/terms">Terms</a><a href="https://www.sociobot.in" rel="external" aria-label="Built by Param Factory (external site)">Built by Param Factory ↗</a></nav><p class="fine">v0.1.0 · Generated hero imagery.</p></footer>`;
}

function shell(content: string) {
  app.innerHTML = `${header()}${content}<div class="route-status sr-only" aria-live="polite"></div>${footer()}`;
  bindRoutes();
}

function landing() {
  demo = false;
  shell(`<main id="main">
    <section class="hero">
      <div class="hero-copy"><p class="eyebrow">A safer photo cleanup desk</p><h1 tabindex="-1">Review photo copies before you remove them</h1><p class="lede">For people with photos across several drives who fear removing the only meaningful copy.</p><div class="hero-action"><a class="button primary route-link" href="/demo">Try it with sample data ${icon("arrow")}</a><span>Opens three ready-to-review groups.</span></div><button class="download-link" id="download-app" type="button">Download for ${platformName()}</button><ul class="fact-list"><li>${icon("shield")} Photos stay on this device</li><li>${icon("check")} Works without an account</li><li><span aria-hidden="true">₹</span> Free for 1,000 files; desktop license costs US$29 once</li></ul></div>
      <figure class="hero-art"><img src="/hero-proof-table.webp" width="900" height="600" fetchpriority="high" decoding="async" alt="Overlapping photo plates connect to a protected original on an archival work table."><figcaption>Copies line up. Evidence stays attached.</figcaption></figure>
    </section>
    <section class="preview-section" aria-labelledby="preview-title"><div><p class="eyebrow">The review desk</p><h2 id="preview-title">See why files match</h2><p>Compare paths, dimensions, dates, hashes, and backup counts before making a plan.</p></div>${previewGraphic()}</section>
    <section id="how" class="steps" aria-labelledby="how-title"><p class="eyebrow">Three controlled steps</p><h2 id="how-title">How photo cleanup works</h2><ol><li><span>01</span><h3>Scan your folders</h3><p>Choose photo folders on each connected drive. The desktop app reads them in place.</p><figure><img src="/walkthrough/01-groups.webp" width="720" height="746" loading="lazy" decoding="async" alt="Three matching photo groups in the Proof Pile review desk."><figcaption>Start with groups, not a delete list.</figcaption></figure></li><li><span>02</span><h3>Review the evidence</h3><p>Keep one copy and mark extras. Every path and difference remains visible.</p><figure><img src="/walkthrough/02-evidence.webp" width="720" height="623" loading="lazy" decoding="async" alt="Two similar photos with their paths, camera details, and hashes."><figcaption>Compare each copy and its metadata.</figcaption></figure></li><li><span>03</span><h3>Quarantine, then verify</h3><p>Move extras to a folder you choose. Restore them from the decision log.</p><figure><img src="/walkthrough/03-quarantine.webp" width="720" height="747" loading="lazy" decoding="async" alt="A quarantine plan with two sample files marked for a reversible move."><figcaption>Move reviewed files, then restore if needed.</figcaption></figure></li></ol></section>
    <section class="boundaries" aria-labelledby="boundaries-title"><div><p class="eyebrow">Clear limits</p><h2 id="boundaries-title">Your photos are not uploaded</h2><p>Proof Pile has no face recognition, cloud gallery, or permanent-delete command. Backup counts show matching files, not tested restores.</p></div><div class="warning-note"><strong>Keep a tested backup.</strong><p>A matching copy can still live on a failing drive. Open important backups before cleanup.</p></div></section>
    ${pricing()}
  </main>`);
  bindLanding();
}

function previewGraphic() {
  return `<div class="preview-stack" aria-label="Example duplicate group"><div class="mini-photo rear"></div><div class="mini-photo middle"></div><div class="mini-photo front"><img src="/samples/lake-a.svg" width="320" height="210" alt="Illustrated lake sunset sample photo."></div><div class="evidence-tag exact">Exact bytes</div><div class="evidence-line">3 copies · 2 drives</div></div>`;
}

function pricing() {
  return `<section class="pricing" aria-labelledby="price-title"><div><p class="eyebrow">One-time desktop license</p><h2 id="price-title">Review a full library for US$29</h2><p>The free app scans 1,000 files at a time. A license removes that scan limit.</p>${licenseNotice ? `<p class="license-notice" role="status">${escapeHtml(licenseNotice)}</p>` : ""}</div><div class="price-actions"><a class="button primary" href="https://api.sociobot.in/api/v1/products/${PRODUCT}/checkout">Buy the desktop license — secure checkout</a><button class="button quiet" id="restore-license" type="button">Enter a license</button><p>Sociobot is the merchant of record. Refunds are handled there.</p></div></section>`;
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

function enterDemo() {
  demo = true;
  groups = readGroups(sessionStorage, DEMO_KEY) ?? sampleGroups();
  moves = [];
  activeGroup = 0;
  renderDesk();
}

function appRoute() {
  demo = false;
  groups = readGroups(localStorage, REAL_KEY) ?? [];
  moves = [];
  activeGroup = 0;
  renderDesk();
}

function readGroups(storage: Storage, key: string): PhotoGroup[] | null {
  const saved = storage.getItem(key);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch {
    storage.removeItem(key);
    notice = "The saved review could not be read. Start a new scan.";
    return null;
  }
}

function renderDesk() {
  const group = groups[activeGroup];
  const plan = countPlan(groups);
  const title = demo ? "Review a sample photo pile" : groups.length ? "Review your photo pile" : "Choose folders to scan";
  shell(`<main id="main" class="desk-page">
    ${demo ? `<aside class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data, nothing is saved</strong><div><button id="reset-demo" type="button">Reset demo</button><button id="start-real" type="button">Start for real</button></div></aside>` : ""}
    <div class="desk-heading"><div><p class="eyebrow">${demo ? "Sample review" : "Local review"}</p><h1 tabindex="-1">${title}</h1><p>${groups.length ? `${groups.length} groups need a decision.` : "Add two or more folders. Proof Pile will compare image files in place."}</p></div><div class="desk-tools"><button class="button quiet" id="scan-folders" type="button">${isDesktop ? "Choose photo folders" : "Get the desktop app"}</button>${groups.length ? `<button class="button quiet" id="export-csv" type="button">Export CSV</button>` : ""}</div></div>
    ${notice ? `<div class="notice" role="status">${escapeHtml(notice)}</div>` : ""}
    ${groups.length && group ? deskContent(group, plan.files, plan.bytes) : emptyState()}
  </main>`);
  bindDesk();
}

function emptyState() {
  return `<section class="empty-state" aria-labelledby="empty-title">${icon("stack")}<h2 id="empty-title">No photo groups yet</h2><p>Matching photo groups will appear here after a local scan.</p><button class="button primary" id="empty-action" type="button">${isDesktop ? "Choose photo folders" : "Try sample data"}</button></section>`;
}

function deskContent(group: PhotoGroup, planFiles: number, planBytes: number) {
  return `<div class="desk-layout">
    <aside class="group-rail" aria-label="Photo groups"><div class="rail-heading"><h2>Groups</h2><span>${groups.length}</span></div><div role="listbox" aria-label="Duplicate groups">${groups.map((item, index) => `<button type="button" role="option" aria-selected="${index === activeGroup}" data-group="${index}"><span class="group-thumb"><img src="${safeThumbnail(item.files[0].thumbnail)}" alt=""></span><span><strong>${escapeHtml(item.kind)}</strong><small>${item.files.length} files · ${item.confidence}% match</small></span></button>`).join("")}</div><p class="key-hint">Use ↑ and ↓ to change groups.</p></aside>
    <section class="evidence" aria-labelledby="group-title"><div class="evidence-heading"><div><span class="match-badge">${escapeHtml(group.kind)}</span><h2 id="group-title">${escapeHtml(humanGroup(group.id))}</h2><p>${escapeHtml(group.reason)}</p></div><div class="confidence"><strong>${group.confidence}%</strong><span>match</span></div></div>
      <div class="photo-strip">${group.files.map((file, index) => `<figure class="photo-card ${file.decision}"><img src="${safeThumbnail(file.thumbnail || group.files[0].thumbnail)}" width="320" height="210" alt="${escapeHtml(humanGroup(group.id))} copy ${index + 1}."><figcaption>${file.decision === "keep" ? "Keep" : file.decision === "quarantine" ? "Quarantine" : "Needs review"}</figcaption></figure>`).join("")}</div>
      <div class="file-list" aria-label="Copy evidence">${group.files.map(fileRow).join("")}</div>
      <div class="group-actions"><button class="button quiet" id="keep-best" type="button">Keep largest copy</button><button class="button quiet" id="mark-extras" type="button">Mark exact extras</button></div>
    </section>
    <aside class="plan-rail" aria-labelledby="plan-title"><p class="eyebrow">Reversible plan</p><h2 id="plan-title">Quarantine plan</h2><div class="plan-number"><strong>${planFiles}</strong><span>files marked</span></div><p>${formatBytes(planBytes)} would move. Originals stay unchanged until you run the plan.</p><label for="quarantine-folder">Quarantine folder</label><input id="quarantine-folder" value="${demo ? "/Sample drive/Proof Pile Quarantine" : ""}" readonly placeholder="Choose a folder"><button class="button primary" id="run-plan" type="button" ${planFiles ? "" : "disabled"}>Review and run plan</button><p class="safety-copy">Nothing is permanently deleted. Test a backup before freeing drive space.</p>${moves.length ? `<button class="button quiet" id="restore-last" type="button">Restore last move</button>` : ""}</aside>
  </div>`;
}

function fileRow(file: PhotoGroup["files"][number]) {
  const date = file.capturedAt ? new Date(file.capturedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "No capture date";
  return `<article class="file-row ${file.decision}"><div class="file-path"><strong title="${escapeHtml(file.path)}">${escapeHtml(file.name)}</strong><span>${escapeHtml(file.path)}</span></div><dl><div><dt>Dimensions</dt><dd>${file.width} × ${file.height}</dd></div><div><dt>Size</dt><dd>${formatBytes(file.size)}</dd></div><div><dt>Captured</dt><dd>${escapeHtml(date)}</dd></div><div><dt>Camera</dt><dd>${escapeHtml(file.camera || "Not recorded")}</dd></div><div><dt>Hash</dt><dd><code>${escapeHtml(file.hash)}</code></dd></div><div><dt>Other drives</dt><dd>${file.backupCount}</dd></div></dl><fieldset><legend>Decision for ${escapeHtml(file.name)}</legend>${decisionButton(file.id, "keep", "Keep")}${decisionButton(file.id, "quarantine", "Quarantine")}${decisionButton(file.id, "review", "Review")}</fieldset></article>`;
}

function decisionButton(id: string, value: string, label: string) {
  const current = groups[activeGroup]?.files.find(file => file.id === id)?.decision;
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
    if (file) file.decision = button.dataset.decision as typeof file.decision;
    persist(); renderDesk();
  }));
  document.querySelector("#keep-best")?.addEventListener("click", keepBest);
  document.querySelector("#mark-extras")?.addEventListener("click", markExtras);
  document.querySelector("#run-plan")?.addEventListener("click", runPlan);
  document.querySelector("#restore-last")?.addEventListener("click", restoreLast);
  document.querySelector("#export-csv")?.addEventListener("click", exportCsv);
}

function persist() {
  try {
    if (demo) sessionStorage.setItem(DEMO_KEY, JSON.stringify(groups));
    else localStorage.setItem(REAL_KEY, JSON.stringify(groups, (key, value) => key === "thumbnail" ? undefined : value));
  } catch {
    notice = "The review changed, but this device could not save it. Export the CSV before closing the app.";
  }
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
  group.files.forEach(file => file.decision = file.id === keep.id ? "keep" : "quarantine");
  notice = `${group.files.length - 1} exact copies added to the quarantine plan.`; persist(); renderDesk();
}

async function runPlan() {
  const selected = groups.flatMap(group => group.files).filter(file => file.decision === "quarantine");
  if (!selected.length) return;
  if (!confirm(`Move ${selected.length} files to quarantine? You can restore them from this session.`)) return;
  if (demo) {
    const stamp = new Date().toISOString();
    moves.push(...selected.map((file, i) => ({ id: `demo-${i}`, source: file.path, destination: `/Sample drive/Proof Pile Quarantine/${file.name}`, movedAt: stamp })));
    notice = `${selected.length} sample files moved to the demo quarantine. No files on your device changed.`; renderDesk(); return;
  }
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const destination = await open({ directory: true, multiple: false, title: "Choose a quarantine folder" });
    if (!destination || Array.isArray(destination)) return;
    const { invoke } = await import("@tauri-apps/api/core");
    moves = await invoke<MoveRecord[]>("execute_quarantine", { paths: selected.map(file => file.path), quarantineDir: destination });
    notice = `${moves.length} files moved to quarantine. The decision log is ready to export.`; renderDesk();
  } catch (error) { notice = `The plan did not run. ${plainError(error)} Choose a writable quarantine folder and try again.`; renderDesk(); }
}

async function restoreLast() {
  const move = [...moves].reverse().find(item => !item.restoredAt); if (!move) return;
  if (demo) { move.restoredAt = new Date().toISOString(); notice = `${move.source.split("/").pop()} restored in the demo.`; renderDesk(); return; }
  try { const { invoke } = await import("@tauri-apps/api/core"); await invoke("restore_quarantined", { record: move }); move.restoredAt = new Date().toISOString(); notice = `${move.source.split("/").pop()} restored.`; renderDesk(); }
  catch (error) { notice = `The file was not restored. ${plainError(error)} Check both folders and try again.`; renderDesk(); }
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

function plainError(error: unknown) { return String(error).replace(/^Error:\s*/, ""); }

function legalPage(kind: "privacy" | "terms") {
  const privacy = `<main id="main" class="prose-page"><p class="eyebrow">Policy</p><h1 tabindex="-1">Privacy without photo uploads</h1><p>Last updated 28 August 2026.</p><h2>Your photos stay local</h2><p>The desktop app reads selected folders on your device. It does not upload photos, thumbnails, paths, hashes, or decision logs.</p><h2>Data stored on your device</h2><p>The app stores review choices, your license token, and cached license status. Demo choices use a separate session-only key.</p><h2>License checks</h2><p>License verification sends the license token to the Sociobot billing API. It does not send photo data.</p><h2>Website requests</h2><p>The download page may request release details from GitHub. We do not run advertising or tracking scripts.</p><h2>Remove your data</h2><p>Reset the demo or clear this site's storage. Desktop quarantine files remain where you chose to place them.</p><p>Questions: <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a></p></main>`;
  const terms = `<main id="main" class="prose-page"><p class="eyebrow">Terms</p><h1 tabindex="-1">Terms for careful photo cleanup</h1><p>Last updated 28 August 2026.</p><h2>Use and responsibility</h2><p>Proof Pile helps you review and move files. You remain responsible for your files and backups.</p><h2>No permanent deletion</h2><p>The app moves chosen files to a quarantine folder. Do not empty that folder until you test important backups.</p><h2>License</h2><p>The free tier scans up to 1,000 files at once. A US$29 one-time license removes that scan limit.</p><h2>Payments and refunds</h2><p>Sociobot and Dodo handle checkout as merchant of record. A refunded license may stop working.</p><h2>Warranty</h2><p>The software is provided as is. Keep verified backups before changing a photo library.</p><p>Questions: <a href="mailto:support@sociobot.in">support@sociobot.in</a></p></main>`;
  shell(kind === "privacy" ? privacy : terms);
}

function notFound() { shell(`<main id="main" class="not-found"><p class="giant">404</p><h1 tabindex="-1">This frame is not in the pile</h1><p>The page may have moved. Your photos have not.</p><a class="button primary route-link" href="/">Return home</a></main>`); }

function navigate(path: string, replace = false) { (replace ? history.replaceState : history.pushState).call(history, {}, "", path); route(); }

function route() {
  notice = "";
  const path = location.pathname.replace(/\/$/, "") || "/";
  if (path === "/") landing(); else if (path === "/demo") enterDemo(); else if (path === "/app") appRoute(); else if (path === "/privacy") legalPage("privacy"); else if (path === "/terms") legalPage("terms"); else notFound();
  const titles: Record<string, string> = { "/": "Proof Pile — Review photo copies before cleanup", "/demo": "Demo — Proof Pile", "/app": "Review — Proof Pile", "/privacy": "Privacy — Proof Pile", "/terms": "Terms — Proof Pile" };
  document.title = titles[path] ?? "Page not found — Proof Pile";
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute("href", `https://photo-proof-pile.sociobot.in${path}`);
  document.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
  document.querySelector(".route-status")!.textContent = document.querySelector("h1")?.textContent ?? "Page changed";
  scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
}

function bindRoutes() { document.querySelectorAll<HTMLAnchorElement>("a.route-link").forEach(link => link.addEventListener("click", event => { if (link.origin !== location.origin) return; event.preventDefault(); navigate(link.pathname); })); }

function showLicenseDialog() {
  const dialog = document.createElement("dialog");
  dialog.innerHTML = `<form method="dialog"><button class="dialog-close" value="cancel" aria-label="Close license window">×</button><p class="eyebrow">Restore purchase</p><h2>Enter your license</h2><label for="license-token">License token</label><input id="license-token" autocomplete="off"><p id="license-result" role="status">The token is stored only on this device.</p><button class="button primary" id="verify-license" type="button">Verify license</button></form>`;
  document.body.append(dialog); dialog.showModal(); dialog.querySelector<HTMLInputElement>("input")?.focus();
  dialog.addEventListener("close", () => dialog.remove());
  dialog.querySelector("#verify-license")?.addEventListener("click", async () => {
    const token = dialog.querySelector<HTMLInputElement>("input")!.value.trim(); const result = dialog.querySelector<HTMLElement>("#license-result")!;
    if (!token) { result.textContent = "Enter the token from your receipt."; return; }
    result.textContent = "Checking this license…";
    try { const response = await fetch(`https://api.sociobot.in/api/v1/products/${PRODUCT}/verify?license=${encodeURIComponent(token)}`); if (!response.ok) throw new Error("The license service did not respond."); const verdict = await response.json(); if (!verdict.valid) throw new Error("This license is not active."); localStorage.setItem(LICENSE_KEY, token); localStorage.setItem(`${LICENSE_KEY}:verified`, JSON.stringify({ valid: true, checkedAt: Date.now() })); licenseActive = true; result.textContent = "License verified. Full-library scans are active."; }
    catch (error) { result.textContent = `${plainError(error)} Check the token and your connection.`; }
  });
}

async function verifySavedLicense() {
  const params = new URLSearchParams(location.search); const returned = params.get("license");
  if (returned) { localStorage.setItem(LICENSE_KEY, returned); params.delete("license"); history.replaceState({}, "", `${location.pathname}${params.size ? `?${params}` : ""}`); licenseActive = true; }
  const token = localStorage.getItem(LICENSE_KEY); if (!token) return;
  let cached: { valid?: boolean; checkedAt?: number } | null = null;
  try { cached = JSON.parse(localStorage.getItem(`${LICENSE_KEY}:verified`) || "null"); } catch { localStorage.removeItem(`${LICENSE_KEY}:verified`); }
  if (cached?.valid && cached.checkedAt && Date.now() - cached.checkedAt < 86_400_000) { licenseActive = true; return; }
  try { const response = await fetch(`https://api.sociobot.in/api/v1/products/${PRODUCT}/verify?license=${encodeURIComponent(token)}`); if (!response.ok) throw new Error(); const verdict = await response.json(); localStorage.setItem(`${LICENSE_KEY}:verified`, JSON.stringify({ ...verdict, checkedAt: Date.now() })); licenseActive = Boolean(verdict.valid); if (!verdict.valid) licenseNotice = "This license is no longer active. Enter another license or buy a new one."; }
  catch { licenseActive = Boolean(cached?.valid); }
}

async function showDownloads() {
  const existing = document.querySelector("dialog"); if (existing) existing.remove();
  const dialog = document.createElement("dialog"); dialog.innerHTML = `<div class="download-dialog"><button class="dialog-close" aria-label="Close download window">×</button><p class="eyebrow">Desktop app</p><h2>Choose your download</h2><p id="release-state">Checking the latest release…</p><div id="release-links"></div><a href="https://github.com/B-Divyesh/sf-photo-proof-pile/releases" rel="external">Open all releases ↗</a><p class="fine">Current builds are unsigned. Your system may ask you to confirm the first launch.</p></div>`; document.body.append(dialog); dialog.showModal(); dialog.querySelector(".dialog-close")?.addEventListener("click", () => dialog.close()); dialog.addEventListener("close", () => dialog.remove());
  try {
    let release = JSON.parse(localStorage.getItem("proof-pile:release") || "null"); if (!release || Date.now() - release.savedAt > 3_600_000) { const response = await fetch("https://api.github.com/repos/B-Divyesh/sf-photo-proof-pile/releases/latest"); if (!response.ok) throw new Error(); release = { data: await response.json(), savedAt: Date.now() }; localStorage.setItem("proof-pile:release", JSON.stringify(release)); }
    const assets = release.data.assets as { name: string; browser_download_url: string }[]; const picks = [["macOS", /\.(dmg)$/], ["Windows", /\.(msi|exe)$/], ["Linux", /\.(AppImage|deb)$/]] as const;
    document.querySelector("#release-state")!.textContent = `${release.data.tag_name} is ready.`;
    document.querySelector("#release-links")!.innerHTML = picks.map(([label, regex]) => { const asset = assets.find(item => regex.test(item.name)); return asset ? `<a class="button quiet" href="${escapeHtml(asset.browser_download_url)}">Download for ${label}</a>` : ""; }).join("");
  } catch { document.querySelector("#release-state")!.textContent = "Downloads are being published. Use the releases page to check again."; }
}

addEventListener("popstate", route);
if ("serviceWorker" in navigator && !isDesktop) addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => undefined));
verifySavedLicense().finally(route);
