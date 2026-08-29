import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = "https://photo-proof-pile.sociobot.in";
const output = ".factory/polish-4-artifacts";
const browser = await chromium.launch({ headless: true });
const report = {
  checkedAt: new Date().toISOString(),
  base,
  routes: [],
  checks: {},
  consoleErrors: []
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const normalRequests = [];
page.on("console", message => {
  if (message.type() === "error") report.consoleErrors.push(`${page.url()}: ${message.text()}`);
});
page.on("pageerror", error => report.consoleErrors.push(`${page.url()}: ${error.message}`));
page.on("request", request => normalRequests.push(request.url()));

const routes = [
  ["/", 200, "Proof Pile — Review photo copies before cleanup"],
  ["/demo", 200, "Demo — Proof Pile"],
  ["/?demo=1", 200, "Demo — Proof Pile"],
  ["/app", 200, "Proof Pile — Review photo copies"],
  ["/privacy", 200, "Privacy — Proof Pile"],
  ["/terms", 200, "Terms — Proof Pile"],
  ["/not-a-proof-pile-route", 404, "Page not found — Proof Pile"]
];

for (const [route, expectedStatus, expectedTitle] of routes) {
  const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  const record = {
    route,
    status: response?.status(),
    title: await page.title(),
    description: await page.locator('meta[name="description"]').getAttribute("content"),
    canonical: await page.locator('link[rel="canonical"]').getAttribute("href"),
    lang: await page.locator("html").getAttribute("lang"),
    h1: await page.locator("h1").allTextContents(),
    mainCount: await page.locator("main").count(),
    missingAlt: await page.locator("img:not([alt])").count(),
    privacyLinks: await page.locator('a[href="/privacy"]').count(),
    termsLinks: await page.locator('a[href="/terms"]').count()
  };
  report.routes.push(record);
  assert(record.status === expectedStatus, `${route}: expected ${expectedStatus}, got ${record.status}`);
  assert(record.title === expectedTitle, `${route}: wrong title ${record.title}`);
  assert(record.description && record.description.length <= 155, `${route}: description is missing or too long`);
  assert(record.lang === "en", `${route}: lang is not en`);
  assert(record.h1.length === 1, `${route}: expected one h1`);
  assert(record.mainCount === 1, `${route}: expected one main`);
  assert(record.missingAlt === 0, `${route}: image without alt text`);
  assert(record.privacyLinks > 0 && record.termsLinks > 0, `${route}: legal links are missing`);
}

await page.goto(base, { waitUntil: "networkidle" });
await page.screenshot({ path: `${output}/live-cold-desktop.png`, fullPage: true });
assert(await page.getByRole("heading", { level: 1 }).textContent() === "Review photo copies before you remove them", "first-screen headline is wrong");
assert(await page.getByRole("link", { name: /Try it with sample data/ }).isVisible(), "one-click demo action is missing");
await page.getByRole("link", { name: /Try it with sample data/ }).click();
assert(page.url() === `${base}/demo`, `demo action opened ${page.url()}`);
assert(await page.getByText("Demo — sample data, nothing is saved").isVisible(), "demo banner is missing");
assert(await page.getByRole("option").count() === 3, "demo sample did not load three groups");
await page.screenshot({ path: `${output}/live-demo-one-click.png`, fullPage: true });

await page.getByRole("button", { name: "Quarantine", exact: true }).first().click();
assert(await page.getByText("Keep one copy in this group before marking another copy for quarantine.").isVisible(), "only-copy guard is missing");
await page.getByRole("button", { name: "Mark exact extras" }).click();
let confirmation = "";
page.once("dialog", async dialog => { confirmation = dialog.message(); await dialog.dismiss(); });
await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
assert(confirmation === "Move 2 files to /Sample drive/Proof Pile Quarantine? You can restore them from the decision log.", `wrong move confirmation: ${confirmation}`);
assert(await page.locator(".plan-number strong").textContent() === "2", "cancelling the move did not preserve the plan");
page.once("dialog", dialog => dialog.accept());
await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
assert(await page.getByText(/2 sample files moved/).isVisible(), "demo quarantine result is missing");
const downloadPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "Export decision log" }).click();
const download = await downloadPromise;
const stream = await download.createReadStream();
const chunks = [];
for await (const chunk of stream) chunks.push(Buffer.from(chunk));
const csv = Buffer.concat(chunks).toString("utf8");
assert(csv.trim().split("\n").length === 9, "decision log does not contain a header and eight files");
await page.getByRole("button", { name: "Restore last move" }).click();
assert(await page.getByRole("button", { name: "Cancel" }).evaluate(element => element === document.activeElement), "restore dialog did not focus its safe action");
await page.keyboard.press("Escape");
report.checks.demoJob = { confirmation, csvRows: 9, quarantineFeedback: true, restoreDialogFocus: true };
await page.evaluate(() => sessionStorage.clear());

const realReview = JSON.stringify({ groups: [{ id: "real", files: [] }], moves: [] });
await page.evaluate(value => localStorage.setItem("proof-pile:session", value), realReview);
await page.goto(`${base}/?demo=1`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Mark exact extras" }).click();
assert(await page.locator(".plan-number strong").textContent() === "2", "demo plan did not update");
assert((await page.evaluate(() => sessionStorage.getItem("demo:photo-proof-pile:session")))?.includes("lake-import"), "demo data did not use its session namespace");
assert(await page.evaluate(() => localStorage.getItem("proof-pile:session")) === realReview, "demo changed real storage");
await page.getByRole("button", { name: "Reset demo" }).click();
assert(await page.locator(".plan-number strong").textContent() === "0", "Reset demo did not clear the plan");
assert(await page.evaluate(() => sessionStorage.getItem("demo:photo-proof-pile:session")) === null, "Reset demo did not discard demo storage");
await page.getByRole("button", { name: "Start for real" }).click();
assert(page.url() === `${base}/app`, "Start for real did not open /app");
assert(await page.evaluate(() => localStorage.getItem("proof-pile:session")) === realReview, "Start for real changed real storage");
report.checks.demoIsolation = "one click, direct ?demo=1, banner, sample, reset, and Start for real passed";

await page.goto(base, { waitUntil: "networkidle" });
await page.waitForTimeout(150);
const footerPrivacy = page.getByRole("link", { name: "Privacy", exact: true }).last();
await footerPrivacy.scrollIntoViewIfNeeded();
const savedScroll = await page.evaluate(() => scrollY);
assert(savedScroll > 100, `test page did not scroll: ${savedScroll}`);
await footerPrivacy.click();
await page.waitForTimeout(100);
assert(await page.getByRole("heading", { level: 1 }).evaluate(element => element === document.activeElement), "route did not focus its h1");
await page.goBack();
await page.waitForFunction(expected => Math.abs(scrollY - expected) < 3, savedScroll);
const restoredScroll = await page.evaluate(() => scrollY);
assert(Math.abs(restoredScroll - savedScroll) < 3, `back navigation did not restore scroll: ${savedScroll} -> ${restoredScroll}`);
assert(await page.getByRole("heading", { level: 1 }).evaluate(element => element === document.activeElement), "back navigation did not focus its h1");
report.checks.historyAndFocus = { savedScroll, restoredScroll, focusedHeading: true };

await page.goto(`${base}/privacy`, { waitUntil: "networkidle" });
await page.getByRole("link", { name: "How it works" }).click();
await page.waitForFunction(() => location.pathname === "/" && location.hash === "#how");
assert(await page.locator("#how-title").evaluate(element => element === document.activeElement), "How it works did not focus its heading");
report.checks.hashRoute = { url: page.url(), focused: "How photo cleanup works" };

await page.goto(base, { waitUntil: "networkidle" });
const offOriginBeforeDownload = [...new Set(normalRequests.filter(url => new URL(url).origin !== base))];
assert(offOriginBeforeDownload.length === 0, `ordinary use made an off-origin request: ${offOriginBeforeDownload.join(", ")}`);
await page.getByRole("button", { name: /Check signed download/ }).click();
await page.getByText("Trusted downloads are not published yet. Check again later.").waitFor();
assert(await page.getByText("No package was offered because signature status could not be checked.").isVisible(), "signature gate message is missing");
assert(await page.locator("dialog a").count() === 0, "unverified release exposed a package or release link");
await page.screenshot({ path: `${output}/live-download-gate.png`, fullPage: true });
report.checks.downloadGate = "no unsigned release is public; the dialog exposes zero links until signed/notarized verification succeeds";

for (const colorScheme of ["light", "dark"]) {
  await page.emulateMedia({ colorScheme });
  for (const route of ["/", "/demo", "/privacy", "/terms", "/not-a-proof-pile-route"]) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    const result = await new AxeBuilder({ page }).analyze();
    const severe = result.violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""));
    assert(severe.length === 0, `${colorScheme} ${route}: ${severe.map(item => item.id).join(", ")}`);
  }
}
report.checks.axe = "zero serious or critical findings on five routes in light and dark";

const unexpectedConsoleErrors = report.consoleErrors.filter(item => !(item.includes("not-a-proof-pile-route") && item.includes("404")));
assert(unexpectedConsoleErrors.length === 0, `console errors: ${unexpectedConsoleErrors.join(" | ")}`);
report.expected404NetworkErrors = report.consoleErrors.filter(item => item.includes("not-a-proof-pile-route") && item.includes("404"));
report.consoleErrors = unexpectedConsoleErrors;
const normalOffOrigin = [...new Set(normalRequests.filter(url => new URL(url).origin !== base && !url.startsWith("https://api.github.com/")))];
assert(normalOffOrigin.length === 0, `unexpected off-origin request: ${normalOffOrigin.join(", ")}`);
report.checks.normalFlowRequests = { beforeDownloadCheck: offOriginBeforeDownload, allowedAfterExplicitCheck: "https://api.github.com" };
await context.close();

const mobileContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  reducedMotion: "reduce",
  colorScheme: "light"
});
const mobile = await mobileContext.newPage();
const mobileErrors = [];
mobile.on("console", message => { if (message.type() === "error") mobileErrors.push(message.text()); });
mobile.on("pageerror", error => mobileErrors.push(error.message));
await mobile.goto(base, { waitUntil: "networkidle" });
const landingDimensions = await mobile.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
assert(landingDimensions.document <= landingDimensions.viewport, `mobile landing overflow: ${JSON.stringify(landingDimensions)}`);
await mobile.screenshot({ path: `${output}/live-cold-mobile-390.png`, fullPage: true });
await mobile.getByRole("link", { name: /Try it with sample data/ }).click();
const demoDimensions = await mobile.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
assert(demoDimensions.document <= demoDimensions.viewport, `mobile demo overflow: ${JSON.stringify(demoDimensions)}`);
for (const target of await mobile.locator("button:visible, header a:visible, footer a:visible").all()) {
  const box = await target.boundingBox();
  assert(Boolean(box && box.width >= 44 && box.height >= 44), `small touch target: ${await target.textContent()} ${JSON.stringify(box)}`);
}
const transitionDuration = await mobile.locator(".photo-card").first().evaluate(element => getComputedStyle(element).transitionDuration);
assert(transitionDuration === "0.00001s" || transitionDuration === "1e-05s", `reduced motion not applied: ${transitionDuration}`);
await mobile.locator("html").evaluate(element => { element.style.fontSize = "32px"; });
const enlargedDimensions = await mobile.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
assert(enlargedDimensions.document <= enlargedDimensions.viewport, `200% text overflow: ${JSON.stringify(enlargedDimensions)}`);
const mobileAxe = await new AxeBuilder({ page: mobile }).analyze();
assert(mobileAxe.violations.filter(item => ["serious", "critical"].includes(item.impact ?? "")).length === 0, "mobile axe serious/critical violation");
await mobile.screenshot({ path: `${output}/live-demo-mobile-390.png`, fullPage: true });
assert(mobileErrors.length === 0, `mobile console errors: ${mobileErrors.join(" | ")}`);
report.checks.mobile = { landingDimensions, demoDimensions, enlargedDimensions, transitionDuration, touchTargets: ">=44px" };
await mobileContext.close();

const offlineContext = await browser.newContext();
const offline = await offlineContext.newPage();
await offline.goto(`${base}/demo`, { waitUntil: "networkidle" });
await offline.waitForFunction(() => navigator.serviceWorker?.controller);
const swBefore = await offline.evaluate(async () => ({
  caches: await caches.keys(),
  registrations: (await navigator.serviceWorker.getRegistrations()).length,
  script: (await navigator.serviceWorker.getRegistration())?.active?.scriptURL
}));
await offlineContext.setOffline(true);
const offlineResponse = await offline.reload({ waitUntil: "domcontentloaded" });
assert(await offline.getByText("Demo — sample data, nothing is saved").isVisible(), "offline demo banner is missing");
assert(await offline.getByRole("option").count() === 3, "offline demo sample is missing");
report.checks.offline = { swBefore, reloadStatus: offlineResponse?.status() ?? null, sampleGroups: 3 };
await offlineContext.close();

await writeFile(`${output}/live-qa.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
await browser.close();
