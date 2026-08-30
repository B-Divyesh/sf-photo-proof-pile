import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = "https://photo-proof-pile.sociobot.in";
const output = ".factory/polish-6-artifacts";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = { checkedAt: new Date().toISOString(), base, routes: [], checks: {}, consoleErrors: [] };
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const requests = [];
page.on("console", message => {
  if (message.type() === "error") report.consoleErrors.push(`${page.url()}: ${message.text()}`);
});
page.on("pageerror", error => report.consoleErrors.push(`${page.url()}: ${error.message}`));
page.on("request", request => requests.push(request.url()));

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
    skipLinks: await page.locator('a[href="#main"]').count(),
    privacyLinks: await page.locator('a[href="/privacy"]').count(),
    termsLinks: await page.locator('a[href="/terms"]').count()
  };
  report.routes.push(record);
  assert(record.status === expectedStatus, `${route}: expected ${expectedStatus}, got ${record.status}`);
  assert(record.title === expectedTitle, `${route}: wrong title ${record.title}`);
  assert(record.description && record.description.length <= 155, `${route}: description is missing or too long`);
  const expectedCanonical = route === "/?demo=1" ? "/demo" : route === "/not-a-proof-pile-route" ? "/404" : route;
  assert(record.canonical === `${base}${expectedCanonical}`, `${route}: wrong canonical`);
  assert(record.lang === "en", `${route}: lang is not en`);
  assert(record.h1.length === 1 && record.mainCount === 1, `${route}: expected one h1 and one main`);
  assert(record.missingAlt === 0, `${route}: image without alt text`);
  assert(record.skipLinks > 0 && record.privacyLinks > 0 && record.termsLinks > 0, `${route}: structural links are missing`);
}

await page.goto(base, { waitUntil: "networkidle" });
await page.screenshot({ path: `${output}/live-cold-desktop.png`, fullPage: true });
assert(await page.getByRole("heading", { level: 1 }).textContent() === "Review photo copies before you remove them", "first-screen headline is wrong");
assert(await page.getByText("For people with photos across several drives who fear removing the only meaningful copy.").isVisible(), "first-screen audience sentence is missing");
assert(await page.getByText("Opens three ready-to-review groups.").isVisible(), "first-screen action outcome is missing");
assert(await page.getByRole("link", { name: /Try it with sample data/ }).isVisible(), "one-click demo action is missing");
assert(await page.getByRole("button", { name: "Check desktop downloads", exact: true }).isVisible(), "desktop download action is unclear");

const ordinaryOffOrigin = [...new Set(requests.filter(url => new URL(url).origin !== base))];
assert(ordinaryOffOrigin.length === 0, `ordinary use made an off-origin request: ${ordinaryOffOrigin.join(", ")}`);
await page.getByRole("button", { name: "Check desktop downloads", exact: true }).click();
await page.getByText("Downloads are not published yet. Check again later.").waitFor();
assert(await page.getByText("No package was offered because release verification could not be checked.").isVisible(), "signature refusal is missing");
assert(await page.locator('dialog a[download], dialog a[href*="/download/"]').count() === 0, "an unverified package link was exposed");
assert(await page.getByRole("link", { name: "View release status on GitHub (external site)" }).isVisible(), "release status link is missing");
await page.screenshot({ path: `${output}/live-download-gate.png`, fullPage: true });
report.checks.downloadGate = { packageLinksExposed: 0, publicState: "no release", signatureRefusal: true, exactButtonLabel: true };

await page.goto(base, { waitUntil: "networkidle" });
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
assert(confirmation === "Move 2 files to /Sample drive/Proof Pile Quarantine? You can restore them from the decision log.", `wrong confirmation: ${confirmation}`);
assert(await page.locator(".plan-number strong").textContent() === "2", "cancel did not preserve the plan");
page.once("dialog", dialog => dialog.accept());
await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
assert(await page.getByText(/2 sample files moved/).isVisible(), "demo move result is missing");
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
assert((await page.evaluate(() => sessionStorage.getItem("demo:photo-proof-pile:session")))?.includes("lake-import"), "demo did not use its session namespace");
assert(await page.evaluate(() => localStorage.getItem("proof-pile:session")) === realReview, "demo changed real storage");
await page.getByRole("button", { name: "Reset demo" }).click();
assert(await page.locator(".plan-number strong").textContent() === "0", "Reset demo did not clear the plan");
assert(await page.evaluate(() => sessionStorage.getItem("demo:photo-proof-pile:session")) === null, "Reset demo did not clear demo storage");
await page.getByRole("button", { name: "Start for real" }).click();
assert(page.url() === `${base}/app`, "Start for real did not open /app");
assert(await page.evaluate(() => localStorage.getItem("proof-pile:session")) === realReview, "Start for real changed real storage");
report.checks.demoIsolation = "direct ?demo=1, separate session namespace, reset, and Start for real passed";

await page.goto(base, { waitUntil: "networkidle" });
await page.waitForTimeout(150);
const footerPrivacy = page.getByRole("link", { name: "Privacy", exact: true }).last();
await footerPrivacy.scrollIntoViewIfNeeded();
const savedScroll = await page.evaluate(() => scrollY);
await footerPrivacy.click();
assert(await page.getByRole("heading", { level: 1 }).evaluate(element => element === document.activeElement), "route did not focus h1");
await page.goBack();
await page.waitForFunction(expected => Math.abs(scrollY - expected) < 3, savedScroll);
const restoredScroll = await page.evaluate(() => scrollY);
assert(await page.getByRole("heading", { level: 1 }).evaluate(element => element === document.activeElement), "back did not focus h1");
report.checks.historyAndFocus = { savedScroll, restoredScroll, focusedHeading: true };

await page.goto(`${base}/privacy`, { waitUntil: "networkidle" });
await page.getByRole("link", { name: "How it works" }).click();
await page.waitForFunction(() => location.pathname === "/" && location.hash === "#how");
assert(await page.locator("#how-title").evaluate(element => element === document.activeElement), "hash route did not focus its heading");
report.checks.hashRoute = { url: page.url(), focused: "How photo cleanup works" };

for (const colorScheme of ["light", "dark"]) {
  await page.emulateMedia({ colorScheme });
  for (const route of ["/", "/demo", "/privacy", "/terms", "/not-a-proof-pile-route"]) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    const result = await new AxeBuilder({ page }).analyze();
    const severe = result.violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""));
    assert(severe.length === 0, `${colorScheme} ${route}: ${severe.map(item => item.id).join(", ")}`);
  }
}
const unexpectedErrors = report.consoleErrors.filter(item => !(item.includes("not-a-proof-pile-route") && item.includes("404")));
assert(unexpectedErrors.length === 0, `console errors: ${unexpectedErrors.join(" | ")}`);
report.expected404NetworkErrors = report.consoleErrors.filter(item => item.includes("not-a-proof-pile-route") && item.includes("404"));
report.consoleErrors = unexpectedErrors;
const disallowedRequests = [...new Set(requests.filter(url => new URL(url).origin !== base && !url.startsWith("https://api.github.com/")))];
assert(disallowedRequests.length === 0, `unexpected off-origin request: ${disallowedRequests.join(", ")}`);
report.checks.requestPrivacy = { beforeDownloadCheck: ordinaryOffOrigin, explicitDownloadCheckOrigin: "https://api.github.com" };
await context.close();

const mobileContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  reducedMotion: "reduce",
  colorScheme: "light",
  userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36"
});
const mobile = await mobileContext.newPage();
const mobileErrors = [];
mobile.on("console", message => { if (message.type() === "error") mobileErrors.push(message.text()); });
mobile.on("pageerror", error => mobileErrors.push(error.message));
await mobile.goto(base, { waitUntil: "networkidle" });
assert(await mobile.getByText("Open this page on a desktop computer to check signed downloads.").isVisible(), "mobile download guidance is missing");
assert(await mobile.getByRole("button", { name: "Check desktop downloads", exact: true }).count() === 0, "mobile exposed a misleading download button");
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
const serviceWorker = await offline.evaluate(async () => ({
  caches: await caches.keys(),
  registrations: (await navigator.serviceWorker.getRegistrations()).length,
  script: (await navigator.serviceWorker.getRegistration())?.active?.scriptURL
}));
await offlineContext.setOffline(true);
const offlineResponse = await offline.reload({ waitUntil: "domcontentloaded" });
assert(await offline.getByText("Demo — sample data, nothing is saved").isVisible(), "offline demo banner is missing");
assert(await offline.getByRole("option").count() === 3, "offline demo sample is missing");
report.checks.offline = { serviceWorker, reloadStatus: offlineResponse?.status() ?? null, sampleGroups: 3 };
await offlineContext.close();

await writeFile(`${output}/live-qa.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
await browser.close();
