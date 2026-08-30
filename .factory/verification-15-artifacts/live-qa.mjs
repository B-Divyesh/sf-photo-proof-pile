import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";

const base = "https://photo-proof-pile.sociobot.in";
const out = ".factory/verification-15-artifacts";
const report = { routes: [], axe: [], errors: [], expected404Console: [], checks: {} };
const assert = (value, message) => { if (!value) throw new Error(message); };
const serious = results => results.violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await context.newPage();
page.on("console", message => {
  if (message.type() !== "error") return;
  const entry = `console ${page.url()}: ${message.text()}`;
  if (page.url().includes("verification-15-missing") && message.text().includes("404")) report.expected404Console.push(entry);
  else report.errors.push(entry);
});
page.on("pageerror", error => report.errors.push(`page ${page.url()}: ${error.message}`));

for (const route of ["/", "/demo", "/?demo=1", "/app", "/privacy", "/terms", "/verification-15-missing"]) {
  const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  const semantic = await page.evaluate(() => ({
    title: document.title,
    lang: document.documentElement.lang,
    h1: [...document.querySelectorAll("h1")].map(node => node.textContent?.trim()),
    mains: document.querySelectorAll("main").length,
    missingAlt: [...document.images].filter(image => !image.hasAttribute("alt")).length,
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href")
  }));
  const expected = route.includes("missing") ? 404 : 200;
  assert(response?.status() === expected, `${route} returned ${response?.status()}, expected ${expected}`);
  assert(semantic.lang === "en" && semantic.h1.length === 1 && semantic.mains === 1 && semantic.missingAlt === 0, `${route} semantic baseline failed`);
  report.routes.push({ route, status: response?.status(), ...semantic });
}

for (const colorScheme of ["light", "dark"]) {
  await page.emulateMedia({ colorScheme });
  for (const route of ["/", "/demo", "/privacy", "/terms", "/verification-15-missing"]) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).analyze();
    const failures = serious(results);
    report.axe.push({ route, colorScheme, seriousCritical: failures });
    assert(failures.length === 0, `${route} ${colorScheme} has serious/critical axe failures`);
  }
}

await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil: "networkidle" });
const firstRead = await page.evaluate(() => {
  const action = [...document.querySelectorAll("a,button")].find(node => node.textContent?.trim() === "Try it with sample data");
  return {
    heading: document.querySelector("h1")?.textContent?.trim(),
    body: document.querySelector(".hero-copy > p:not(.eyebrow)")?.textContent?.trim(),
    action: action?.textContent?.trim(),
    actionTop: action?.getBoundingClientRect().top,
    viewportHeight: innerHeight,
    explanation: [...document.querySelectorAll("p,span")].find(node => node.textContent?.trim() === "Opens three ready-to-review groups.")?.textContent?.trim(),
    facts: [...document.querySelectorAll(".fact-list li")].map(node => node.textContent?.trim())
  };
});
assert(firstRead.heading === "Review photo copies before you remove them", "first-read job missing");
assert(firstRead.body?.includes("photos across several drives"), "first-read audience missing");
assert(firstRead.action === "Try it with sample data" && firstRead.actionTop < firstRead.viewportHeight, "sample action not visible");
assert(firstRead.explanation === "Opens three ready-to-review groups.", "sample action outcome missing");
report.checks.firstRead = firstRead;

const sampleLink = page.getByRole("link", { name: "Try it with sample data" });
await sampleLink.focus();
const focus = await sampleLink.evaluate(node => { const style = getComputedStyle(node); return { outlineWidth: style.outlineWidth, outlineColor: style.outlineColor }; });
assert(focus.outlineWidth !== "0px", "primary action has no visible focus outline");
await page.keyboard.press("Enter");
await page.waitForLoadState("networkidle");
assert(new URL(page.url()).pathname === "/demo", "keyboard did not open one-click demo");
assert(await page.getByText("Demo — sample data, nothing is saved").isVisible(), "demo banner missing");
assert(await page.getByRole("button", { name: "Reset demo" }).isVisible(), "Reset demo missing");
assert(await page.getByRole("button", { name: "Start for real" }).isVisible(), "Start for real missing");
assert(await page.getByRole("option").count() === 3, "demo lacks three ready groups");
assert(await page.locator(".file-row").count() === 3, "selected group lacks its three sample rows");
await page.screenshot({ path: `${out}/live-demo-one-click.png`, fullPage: false });

const demoRequests = [];
page.on("request", request => demoRequests.push({ url: request.url(), method: request.method(), resourceType: request.resourceType() }));
const selectedBefore = await page.getByRole("option").evaluateAll(nodes => nodes.findIndex(node => node.getAttribute("aria-selected") === "true"));
await page.getByRole("option").nth(selectedBefore).focus();
await page.keyboard.press("ArrowDown");
const selectedAfter = await page.getByRole("option").evaluateAll(nodes => nodes.findIndex(node => node.getAttribute("aria-selected") === "true"));
assert(selectedAfter === (selectedBefore + 1) % 3, "group rail arrow navigation failed");
await page.getByRole("option").first().click();
await page.getByRole("button", { name: "Quarantine", exact: true }).first().click();
assert(await page.getByText("Keep one copy in this group before marking another copy for quarantine.").isVisible(), "unsafe only-copy choice was not rejected");
assert(await page.locator(".plan-number strong").textContent() === "0", "unsafe choice changed the plan");
await page.getByRole("button", { name: "Mark exact extras" }).click();
assert(await page.locator(".plan-number strong").textContent() === "2", "exact extra shortcut did not create two-item plan");
let confirmMessage = "";
page.once("dialog", async dialog => { confirmMessage = dialog.message(); await dialog.dismiss(); });
await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
assert(confirmMessage === "Move 2 files to /Sample drive/Proof Pile Quarantine? You can restore them from the decision log.", "confirmation lacks exact count/destination/recovery");
assert(await page.locator(".plan-number strong").textContent() === "2", "cancel did not preserve pending plan");
page.once("dialog", dialog => dialog.accept());
await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
assert(await page.getByText(/2 sample files moved/).isVisible(), "move completion feedback missing");
const downloadEvent = page.waitForEvent("download");
await page.getByRole("button", { name: "Export decision log" }).click();
const download = await downloadEvent;
const stream = await download.createReadStream();
const chunks = [];
for await (const chunk of stream) chunks.push(Buffer.from(chunk));
const csv = Buffer.concat(chunks).toString("utf8");
assert(download.suggestedFilename() === "proof-pile-decisions.csv", "CSV filename is wrong");
assert(csv.trim().split("\n").length === 9, "CSV does not contain header plus eight file rows");
await page.reload({ waitUntil: "networkidle" });
assert(await page.getByRole("button", { name: "Restore last move" }).isVisible(), "recovery did not survive reload");
await page.getByRole("button", { name: "Restore last move" }).click();
assert(await page.getByRole("button", { name: "Cancel" }).evaluate(node => node === document.activeElement), "recovery dialog did not focus safe action");
await page.keyboard.press("Escape");
assert(await page.getByRole("dialog").count() === 0, "Escape did not close recovery dialog");
const invalidChooser = page.waitForEvent("filechooser");
await page.getByRole("button", { name: "Import decision log" }).click();
await (await invalidChooser).setFiles({ name: "edited.csv", mimeType: "text/csv", buffer: Buffer.from('"path","quarantine_path"\n"/only.jpg","/outside.jpg"') });
await page.getByText(/decision log was not imported/i).waitFor();
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: "networkidle" });
const goodChooser = page.waitForEvent("filechooser");
await page.getByRole("button", { name: "Import decision log" }).click();
await (await goodChooser).setFiles({ name: "proof-pile-decisions.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
await page.getByText(/2 verified recovery records imported/).waitFor();
await page.getByRole("button", { name: "Restore last move" }).waitFor();
await page.getByRole("button", { name: "Restore last move" }).click();
await page.getByRole("button", { name: "Restore this file" }).click();
await page.getByText(/restored in the demo/i).waitFor();
assert(demoRequests.every(item => new URL(item.url).origin === base), "demo workflow made an off-origin request");
report.checks.endToEnd = { selectedBefore, selectedAfter, focus, confirmMessage, csvRows: csv.trim().split("\n").length, invalidCsvRejected: true, reloadRecovery: true, importedRecoveryRestored: true, requests: [...demoRequests] };
await page.screenshot({ path: `${out}/live-demo-final.png`, fullPage: true });

await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto(`${base}/demo`, { waitUntil: "networkidle" });
const reducedMotion = await page.locator(".photo-card").first().evaluate(node => ({ transitionDuration: getComputedStyle(node).transitionDuration, animationName: getComputedStyle(node).animationName }));
assert(["0s", "0.00001s", "1e-05s"].includes(reducedMotion.transitionDuration), "reduced motion does not remove the card transition");
report.checks.reducedMotion = reducedMotion;

await page.evaluate(() => navigator.serviceWorker.ready);
await page.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration(); await registration?.update(); });
await page.waitForTimeout(500);
const serviceWorker = await page.evaluate(async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  return { controller: Boolean(navigator.serviceWorker.controller), active: registration?.active?.state, waiting: registration?.waiting?.state ?? null, caches: await caches.keys() };
});
assert(serviceWorker.controller && serviceWorker.active === "activated" && serviceWorker.waiting === null, "service worker update is not settled");
await context.setOffline(true);
const offlineResponse = await page.reload({ waitUntil: "domcontentloaded" });
assert(offlineResponse?.status() === 200, "offline reload did not return cached response");
assert(await page.getByRole("option").count() === 3, "offline reload lost demo sample groups");
await context.setOffline(false);
report.checks.serviceWorker = { ...serviceWorker, offlineStatus: offlineResponse?.status() };

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mobilePage = await mobile.newPage();
for (const route of ["/", "/demo", "/app", "/privacy", "/terms", "/404.html"]) {
  await mobilePage.goto(`${base}${route}`, { waitUntil: "networkidle" });
  const normalWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
  assert(normalWidth <= 390, `${route} overflows at 390px`);
  await mobilePage.locator("html").evaluate(node => { node.style.fontSize = "34px"; });
  const zoomWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
  assert(zoomWidth <= 390, `${route} overflows at 390px and 200% text`);
  const undersized = await mobilePage.locator('a:visible,button:visible,input:visible,[tabindex="0"]:visible').evaluateAll(nodes => nodes.map(node => { const rect = node.getBoundingClientRect(); return { text: (node.textContent || node.getAttribute("aria-label") || "").trim(), width: rect.width, height: rect.height }; }).filter(item => item.width < 44 || item.height < 44));
  assert(undersized.length === 0, `${route} has undersized targets: ${JSON.stringify(undersized)}`);
  report.checks[`mobile${route}`] = { normalWidth, zoomWidth, undersized };
}
await mobilePage.goto(`${base}/demo`, { waitUntil: "networkidle" });
const mobileAxe = serious(await new AxeBuilder({ page: mobilePage }).analyze());
assert(mobileAxe.length === 0, "mobile demo has serious/critical axe failures");
await mobilePage.screenshot({ path: `${out}/live-demo-mobile-390.png`, fullPage: true });
await mobile.close();

await page.emulateMedia({ reducedMotion: "no-preference" });
await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.removeItem("proof-pile:release"));
await page.getByRole("button", { name: "Check download for Linux" }).click();
await page.getByText("v0.1.17 is ready.").waitFor();
const release = {
  state: await page.locator("#release-state").textContent(),
  linuxHref: await page.getByRole("link", { name: "Download for Linux" }).getAttribute("href"),
  unsignedWarning: await page.getByText(/macOS and Windows builds are unsigned/).textContent()
};
assert(release.linuxHref?.includes("/releases/download/v0.1.17/"), "live download does not point at v0.1.17");
report.checks.release = release;
await page.screenshot({ path: `${out}/live-download-gate.png`, fullPage: false });

assert(report.errors.length === 0, `browser errors: ${report.errors.join(" | ")}`);
await writeFile(`${out}/live-qa.json`, `${JSON.stringify(report, null, 2)}\n`);
await browser.close();
console.log(JSON.stringify({ routes: report.routes.length, axeRuns: report.axe.length, errors: report.errors.length, checks: Object.keys(report.checks).length }, null, 2));
