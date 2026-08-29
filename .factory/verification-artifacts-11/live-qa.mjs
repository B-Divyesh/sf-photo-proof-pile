import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = "https://photo-proof-pile.sociobot.in";
const browser = await chromium.launch({ headless: true });
const report = { routes: [], consoleErrors: [], requests: [], checks: {} };

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on("console", message => {
  if (message.type() === "error") report.consoleErrors.push(`${page.url()}: ${message.text()}`);
});
page.on("pageerror", error => report.consoleErrors.push(`${page.url()}: ${error.message}`));
page.on("request", request => report.requests.push(request.url()));

for (const route of ["/", "/demo", "/privacy", "/terms", "/missing-verifier-route"]) {
  const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  const record = {
    route,
    status: response?.status(),
    title: await page.title(),
    lang: await page.locator("html").getAttribute("lang"),
    h1: await page.locator("h1").allTextContents(),
    mains: await page.locator("main").count()
  };
  report.routes.push(record);
  assert(record.lang === "en", `${route}: lang is not en`);
  assert(record.h1.length === 1, `${route}: expected one h1`);
  assert(record.mains === 1, `${route}: expected one main`);
  assert(route.startsWith("/missing") ? record.status === 404 : record.status === 200, `${route}: wrong HTTP status`);
}

await page.goto(`${base}/demo`, { waitUntil: "networkidle" });
const offOriginBefore = report.requests.filter(url => new URL(url).origin !== base);
assert(offOriginBefore.length === 0, `unexpected off-origin request: ${offOriginBefore.join(", ")}`);

await page.getByRole("button", { name: "Quarantine", exact: true }).first().click();
assert(await page.getByText("Keep one copy in this group before marking another copy for quarantine.").isVisible(), "only-copy safety message missing");
assert(await page.locator(".plan-number strong").textContent() === "0", "invalid only-copy action changed plan");

await page.getByRole("button", { name: "Mark exact extras" }).click();
let confirmation = "";
page.once("dialog", async dialog => { confirmation = dialog.message(); await dialog.dismiss(); });
await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
assert(confirmation.startsWith("Move 2 files to /Sample drive/Proof Pile Quarantine?"), `wrong cancellation confirmation: ${confirmation}`);
assert(await page.locator(".plan-number strong").textContent() === "2", "cancelling move did not preserve plan");

page.once("dialog", dialog => dialog.accept());
await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
assert(await page.getByText(/2 sample files moved/).isVisible(), "successful quarantine feedback missing");
const downloadPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "Export decision log" }).click();
const download = await downloadPromise;
const stream = await download.createReadStream();
const chunks = [];
for await (const chunk of stream) chunks.push(Buffer.from(chunk));
const csv = Buffer.concat(chunks).toString("utf8");
assert(csv.trim().split("\n").length === 9, "CSV does not contain header plus eight records");
assert(csv.includes("quarantine_sha256"), "CSV lacks recovery hashes");

await page.getByRole("button", { name: "Restore last move" }).click();
assert(await page.getByRole("dialog").isVisible(), "restore dialog missing");
assert(await page.getByRole("button", { name: "Cancel" }).evaluate(element => element === document.activeElement), "restore dialog did not focus its safe action");
await page.keyboard.press("Escape");
assert(await page.getByRole("dialog").count() === 0, "Escape did not close restore dialog");

const chooserPromise = page.waitForEvent("filechooser");
await page.getByRole("button", { name: "Import decision log" }).click();
await (await chooserPromise).setFiles({
  name: "not-proof-pile.csv",
  mimeType: "text/csv",
  buffer: Buffer.from('"path","quarantine_path"\n"/original.jpg","/other.jpg"')
});
assert(await page.getByText(/decision log was not imported/i).isVisible(), "invalid CSV error missing");

const selectedBefore = await page.getByRole("option").evaluateAll(options => options.findIndex(option => option.getAttribute("aria-selected") === "true"));
await page.getByRole("option").nth(selectedBefore).focus();
await page.keyboard.press("ArrowDown");
const selectedAfter = await page.getByRole("option").evaluateAll(options => options.findIndex(option => option.getAttribute("aria-selected") === "true"));
assert(selectedAfter === (selectedBefore + 1) % 3, `arrow-key group navigation failed: ${selectedBefore} -> ${selectedAfter}`);
const focusStyle = await page.getByRole("option").nth(selectedAfter).evaluate(element => {
  const css = getComputedStyle(element);
  return { outlineStyle: css.outlineStyle, outlineWidth: css.outlineWidth, outlineColor: css.outlineColor };
});
assert(focusStyle.outlineStyle !== "none" && focusStyle.outlineWidth !== "0px", "focused review rail has no visible outline");
report.checks.demo = { confirmation, csvRows: csv.trim().split("\n").length, focusStyle };
await page.screenshot({ path: ".factory/verification-artifacts-11/live-demo-desktop-final.png", fullPage: true });

for (const colorScheme of ["light", "dark"]) {
  await page.emulateMedia({ colorScheme });
  for (const route of ["/", "/demo", "/privacy", "/terms"]) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    const result = await new AxeBuilder({ page }).analyze();
    const severe = result.violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""));
    assert(severe.length === 0, `${colorScheme} ${route}: ${severe.map(item => item.id).join(", ")}`);
  }
}
report.checks.axe = "zero serious or critical findings on /, /demo, /privacy, /terms in light and dark";
await context.close();

const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: "reduce", colorScheme: "light" });
const mobile = await mobileContext.newPage();
const mobileErrors = [];
mobile.on("console", message => { if (message.type() === "error") mobileErrors.push(message.text()); });
mobile.on("pageerror", error => mobileErrors.push(error.message));
await mobile.goto(`${base}/demo`, { waitUntil: "networkidle" });
const dimensions = await mobile.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
assert(dimensions.document <= dimensions.viewport, `mobile horizontal overflow: ${JSON.stringify(dimensions)}`);
for (const target of await mobile.locator("button:visible, header a:visible, footer a:visible").all()) {
  const box = await target.boundingBox();
  assert(Boolean(box && box.width >= 44 && box.height >= 44), `small touch target: ${await target.textContent()} ${JSON.stringify(box)}`);
}
const transitionDuration = await mobile.locator(".photo-card").first().evaluate(element => getComputedStyle(element).transitionDuration);
assert(transitionDuration === "0.00001s" || transitionDuration === "1e-05s", `reduced motion not applied: ${transitionDuration}`);
await mobile.locator("html").evaluate(element => { element.style.fontSize = "34px"; });
const zoomDimensions = await mobile.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
assert(zoomDimensions.document <= zoomDimensions.viewport, `200% text overflow: ${JSON.stringify(zoomDimensions)}`);
const mobileAxe = await new AxeBuilder({ page: mobile }).analyze();
assert(mobileAxe.violations.filter(item => ["serious", "critical"].includes(item.impact ?? "")).length === 0, "mobile axe serious/critical violation");
await mobile.screenshot({ path: ".factory/verification-artifacts-11/live-demo-mobile-390.png", fullPage: true });
report.checks.mobile = { dimensions, zoomDimensions, transitionDuration, errors: mobileErrors };
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
await offline.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
await offlineContext.setOffline(true);
const offlineResponse = await offline.reload({ waitUntil: "domcontentloaded" });
assert(await offline.getByText("Demo — sample data, nothing is saved").isVisible(), "offline demo banner missing after reload");
assert(await offline.getByRole("option").count() === 3, "offline sample groups missing");
report.checks.pwa = { swBefore, offlineReloadResponse: offlineResponse?.status() ?? null };
await offlineContext.close();

const unexpectedConsoleErrors = report.consoleErrors.filter(item => !(item.includes("/missing-verifier-route") && item.includes("404")));
assert(unexpectedConsoleErrors.length === 0, `console errors: ${unexpectedConsoleErrors.join(" | ")}`);
report.checks.expected404ConsoleNoise = report.consoleErrors.filter(item => !unexpectedConsoleErrors.includes(item));
report.checks.offOriginRequests = [...new Set(report.requests.filter(url => new URL(url).origin !== base))];
assert(report.checks.offOriginRequests.length === 0, "unexpected off-origin requests in non-license flow");
console.log(JSON.stringify(report, null, 2));
await browser.close();
