import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";

const base = "https://photo-proof-pile.sociobot.in";
const report = { routes: [], errors: [], checks: {}, requests: [], responses: [] };
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const browser = await chromium.launch({ headless: true });

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on("console", message => { if (message.type() === "error") report.errors.push(`console ${page.url()}: ${message.text()}`); });
page.on("pageerror", error => report.errors.push(`page ${page.url()}: ${error.message}`));
page.on("requestfailed", request => report.errors.push(`request ${request.url()}: ${request.failure()?.errorText}`));
page.on("request", request => report.requests.push({ url: request.url(), method: request.method(), resource: request.resourceType() }));
page.on("response", response => report.responses.push({ url: response.url(), status: response.status(), cacheControl: response.headers()["cache-control"] ?? null, contentType: response.headers()["content-type"] ?? null }));

for (const route of ["/", "/demo", "/?demo=1", "/app", "/privacy", "/terms", "/qa-missing-route"]) {
  const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  const data = await page.evaluate(() => ({
    title: document.title,
    lang: document.documentElement.lang,
    h1: [...document.querySelectorAll("h1")].map(node => node.textContent?.trim()),
    mainCount: document.querySelectorAll("main").length,
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    missingAlt: [...document.querySelectorAll("img")].filter(image => !image.hasAttribute("alt")).length
  }));
  report.routes.push({ route, status: response?.status(), ...data });
  assert(data.lang === "en", `${route}: missing lang=en`);
  assert(data.h1.length === 1, `${route}: expected one h1`);
  assert(data.mainCount === 1, `${route}: expected one main`);
  assert(data.missingAlt === 0, `${route}: image without alt`);
  assert(route === "/qa-missing-route" ? response?.status() === 404 : response?.status() === 200, `${route}: wrong response status`);
}

await context.clearCookies();
await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil: "networkidle" });
const hero = await page.evaluate(() => ({
  heading: document.querySelector("h1")?.textContent?.trim(),
  audience: document.querySelector(".hero-copy > p:not(.eyebrow)")?.textContent?.trim(),
  sampleAction: [...document.querySelectorAll("a,button")].find(node => node.textContent?.trim() === "Try it with sample data")?.textContent?.trim(),
  sampleExplanation: [...document.querySelectorAll("p,span")].find(node => node.textContent?.trim() === "Opens three ready-to-review groups.")?.textContent?.trim(),
  viewportHeight: innerHeight,
  actionTop: [...document.querySelectorAll("a,button")].find(node => node.textContent?.trim() === "Try it with sample data")?.getBoundingClientRect().top
}));
assert(hero.heading === "Review photo copies before you remove them", "cold page does not plainly state the job");
assert(hero.audience?.includes("photos across several drives"), "cold page does not name its audience");
assert(hero.sampleAction === "Try it with sample data" && hero.actionTop < hero.viewportHeight, "one-click sample action is not visible");
assert(hero.sampleExplanation === "Opens three ready-to-review groups.", "sample action lacks its outcome");
report.checks.firstRead = hero;
await page.screenshot({ path: ".factory/verification-artifacts-12/live-cold-desktop.png", fullPage: false });
await page.getByRole("link", { name: "Try it with sample data" }).click();
await page.waitForLoadState("networkidle");
assert(new URL(page.url()).pathname === "/demo", "one-click sample action did not open /demo");
assert(await page.getByText("Demo — sample data, nothing is saved").isVisible(), "demo isolation banner is missing");
assert(await page.getByRole("option").count() === 3, "sample did not immediately show three review groups");
assert(await page.getByRole("button", { name: "Reset demo" }).isVisible(), "Reset demo is missing");
assert(await page.getByRole("button", { name: "Start for real" }).isVisible(), "Start for real is missing");
await page.screenshot({ path: ".factory/verification-artifacts-12/live-demo-one-click.png", fullPage: false });

const requestIndex = report.requests.length;
await page.getByRole("button", { name: "Quarantine", exact: true }).first().click();
assert(await page.getByText("Keep one copy in this group before marking another copy for quarantine.").isVisible(), "unsafe only-copy action lacks recovery guidance");
assert(await page.locator(".plan-number strong").textContent() === "0", "invalid only-copy action changed the plan");
await page.getByRole("button", { name: "Mark exact extras" }).click();
assert(await page.locator(".plan-number strong").textContent() === "2", "exact-extra shortcut did not make a two-file plan");
let confirmation = "";
page.once("dialog", async dialog => { confirmation = dialog.message(); await dialog.dismiss(); });
await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
assert(confirmation === "Move 2 files to /Sample drive/Proof Pile Quarantine? You can restore them from the decision log.", `unexpected confirmation: ${confirmation}`);
assert(await page.locator(".plan-number strong").textContent() === "2", "cancel did not preserve the plan");
page.once("dialog", dialog => dialog.accept());
await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
assert(await page.getByText(/2 sample files moved/).isVisible(), "successful sample quarantine feedback is missing");
const downloadPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "Export decision log" }).click();
const download = await downloadPromise;
const stream = await download.createReadStream();
const chunks = [];
for await (const chunk of stream) chunks.push(Buffer.from(chunk));
const csv = Buffer.concat(chunks).toString("utf8");
assert(download.suggestedFilename() === "proof-pile-decisions.csv", "wrong CSV filename");
assert(csv.trim().split("\n").length === 9, "CSV is not one header plus eight files");
assert(csv.includes("quarantine_sha256") && csv.includes("/Sample drive/Proof Pile Quarantine/"), "CSV lacks reversible-move evidence");
await page.getByRole("button", { name: "Restore last move" }).click();
assert(await page.getByRole("button", { name: "Cancel" }).evaluate(node => node === document.activeElement), "restore dialog did not focus its safe action");
await page.keyboard.press("Escape");
assert(await page.getByRole("dialog").count() === 0, "Escape did not dismiss restore dialog");
const chooserPromise = page.waitForEvent("filechooser");
await page.getByRole("button", { name: "Import decision log" }).click();
await (await chooserPromise).setFiles({ name: "bad.csv", mimeType: "text/csv", buffer: Buffer.from('"path","quarantine_path"\n"/only.jpg","/other.jpg"') });
assert(await page.getByText(/decision log was not imported/i).isVisible(), "invalid CSV did not provide an error and recovery step");

const selectedBefore = await page.getByRole("option").evaluateAll(options => options.findIndex(option => option.getAttribute("aria-selected") === "true"));
await page.getByRole("option").nth(selectedBefore).focus();
await page.keyboard.press("ArrowDown");
const selectedAfter = await page.getByRole("option").evaluateAll(options => options.findIndex(option => option.getAttribute("aria-selected") === "true"));
assert(selectedAfter === (selectedBefore + 1) % 3, "arrow-key group navigation failed");
const focusStyle = await page.getByRole("option").nth(selectedAfter).evaluate(node => { const css = getComputedStyle(node); return { outline: css.outline, outlineColor: css.outlineColor, outlineWidth: css.outlineWidth }; });
assert(focusStyle.outlineWidth !== "0px" && !focusStyle.outline.startsWith("none"), "group focus is not visible");
const demoRequests = report.requests.slice(requestIndex);
const offOriginDemo = demoRequests.filter(item => new URL(item.url).origin !== base);
assert(offOriginDemo.length === 0, `demo sent an off-origin request: ${offOriginDemo.map(item => item.url).join(", ")}`);
report.checks.endToEnd = { confirmation, csvRows: csv.trim().split("\n").length, selectedBefore, selectedAfter, focusStyle, requests: demoRequests };
await page.screenshot({ path: ".factory/verification-artifacts-12/live-demo-final.png", fullPage: true });

await page.goto(base, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Check signed download for Linux" }).click();
await page.waitForTimeout(700);
const downloadGate = {
  state: await page.locator("#release-state").textContent(),
  signatureState: await page.locator("#signature-state").textContent(),
  offeredLinks: await page.locator("#release-links a").count()
};
assert(downloadGate.offeredLinks === 0, "unverified packages were exposed");
report.checks.downloadGate = downloadGate;
await page.screenshot({ path: ".factory/verification-artifacts-12/live-download-gate.png", fullPage: false });

for (const colorScheme of ["light", "dark"]) {
  await page.emulateMedia({ colorScheme });
  for (const route of ["/", "/demo", "/app", "/privacy", "/terms"]) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    const axe = await new AxeBuilder({ page }).analyze();
    const severe = axe.violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""));
    assert(severe.length === 0, `${colorScheme} ${route}: axe ${severe.map(item => item.id).join(", ")}`);
  }
}
report.checks.axe = "0 serious/critical findings on /, /demo, /app, /privacy, and /terms in light and dark";

await page.goto(base, { waitUntil: "networkidle" });
await page.keyboard.press("Tab");
const firstTabFromRoutedHeading = (await page.locator(":focus").textContent())?.trim() ?? null;
await page.getByText("Skip to main content", { exact: true }).focus();
await page.keyboard.press("Enter");
assert(await page.locator("main").evaluate(node => node === document.activeElement), "skip link did not focus main");
report.checks.keyboard = { firstTabFromRoutedHeading, result: "skip link, ArrowDown group selection, Space/Enter controls, safe dialog focus, and Escape dismissal passed" };
await context.close();

const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce", colorScheme: "light" });
const mobile = await mobileContext.newPage();
const mobileErrors = [];
mobile.on("console", message => { if (message.type() === "error") mobileErrors.push(message.text()); });
mobile.on("pageerror", error => mobileErrors.push(error.message));
await mobile.goto(`${base}/demo`, { waitUntil: "networkidle" });
const dimensions = await mobile.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
assert(dimensions.document <= dimensions.viewport, `390px horizontal overflow: ${JSON.stringify(dimensions)}`);
const smallTargets = [];
for (const node of await mobile.locator("button:visible, header a:visible, footer a:visible").all()) {
  const box = await node.boundingBox();
  if (!box || box.width < 44 || box.height < 44) smallTargets.push({ text: await node.textContent(), box });
}
assert(smallTargets.length === 0, `mobile targets under 44px: ${JSON.stringify(smallTargets)}`);
const transitionDuration = await mobile.locator(".photo-card").first().evaluate(node => getComputedStyle(node).transitionDuration);
assert(["0s", "1e-05s", "0.00001s"].includes(transitionDuration), `reduced motion duration is ${transitionDuration}`);
await mobile.locator("html").evaluate(node => { node.style.fontSize = "34px"; });
const resized = await mobile.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
assert(resized.document <= resized.viewport, `200% text caused horizontal overflow: ${JSON.stringify(resized)}`);
const mobileAxe = await new AxeBuilder({ page: mobile }).analyze();
assert(mobileAxe.violations.filter(item => ["serious", "critical"].includes(item.impact ?? "")).length === 0, "mobile axe found serious/critical issues");
assert(mobileErrors.length === 0, `mobile errors: ${mobileErrors.join(" | ")}`);
await mobile.screenshot({ path: ".factory/verification-artifacts-12/live-demo-mobile-390.png", fullPage: true });
report.checks.mobile = { dimensions, resized, smallTargets, transitionDuration };
await mobileContext.close();

const offlineContext = await browser.newContext();
const offlinePage = await offlineContext.newPage();
await offlinePage.goto(`${base}/demo`, { waitUntil: "networkidle" });
await offlinePage.waitForFunction(() => navigator.serviceWorker?.controller);
const swBefore = await offlinePage.evaluate(async () => ({
  caches: await caches.keys(),
  registrations: (await navigator.serviceWorker.getRegistrations()).length,
  script: (await navigator.serviceWorker.getRegistration())?.active?.scriptURL
}));
await offlinePage.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
await offlineContext.setOffline(true);
const offlineResponse = await offlinePage.reload({ waitUntil: "domcontentloaded" });
assert(await offlinePage.getByText("Demo — sample data, nothing is saved").isVisible(), "offline reload lost the demo banner");
assert(await offlinePage.getByRole("option").count() === 3, "offline reload lost sample groups");
report.checks.pwa = { ...swBefore, offlineStatus: offlineResponse?.status() ?? null };
await offlineContext.close();

const unexpectedErrors = report.errors.filter(item => !(item.includes("qa-missing-route") && item.includes("404")));
assert(unexpectedErrors.length === 0, `unexpected browser errors: ${unexpectedErrors.join(" | ")}`);
report.checks.expected404Noise = report.errors.filter(item => !unexpectedErrors.includes(item));
await writeFile(".factory/verification-artifacts-12/live-qa.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.checks, null, 2));
await browser.close();
