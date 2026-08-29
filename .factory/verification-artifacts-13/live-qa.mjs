import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";

const base = "https://photo-proof-pile.sociobot.in";
const report = { routes: [], errors: [], requests: [], checks: {} };
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const browser = await chromium.launch({ headless: true });

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on("console", message => { if (message.type() === "error") report.errors.push(`console ${page.url()}: ${message.text()}`); });
page.on("pageerror", error => report.errors.push(`page ${page.url()}: ${error.message}`));
page.on("requestfailed", request => report.errors.push(`request ${request.url()}: ${request.failure()?.errorText}`));
page.on("request", request => report.requests.push({ url: request.url(), method: request.method(), resource: request.resourceType() }));

for (const route of ["/", "/demo", "/?demo=1", "/app", "/privacy", "/terms", "/qa-missing-route-13"]) {
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
  assert(data.lang === "en" && data.h1.length === 1 && data.mainCount === 1 && data.missingAlt === 0, `${route}: semantic baseline failed`);
  assert(route.startsWith("/qa-missing") ? response?.status() === 404 : response?.status() === 200, `${route}: wrong status`);
}

await context.clearCookies();
await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil: "networkidle" });
const firstRead = await page.evaluate(() => {
  const action = [...document.querySelectorAll("a,button")].find(node => node.textContent?.trim() === "Try it with sample data");
  return {
    heading: document.querySelector("h1")?.textContent?.trim(),
    audience: document.querySelector(".hero-copy > p:not(.eyebrow)")?.textContent?.trim(),
    action: action?.textContent?.trim(), actionTop: action?.getBoundingClientRect().top, viewportHeight: innerHeight,
    explanation: [...document.querySelectorAll("p,span")].find(node => node.textContent?.trim() === "Opens three ready-to-review groups.")?.textContent?.trim()
  };
});
assert(firstRead.heading === "Review photo copies before you remove them", "first screen does not say the job");
assert(firstRead.audience?.includes("photos across several drives"), "first screen does not name the audience");
assert(firstRead.action === "Try it with sample data" && firstRead.actionTop < firstRead.viewportHeight, "sample action is not visible");
assert(firstRead.explanation === "Opens three ready-to-review groups.", "sample outcome is missing");
report.checks.firstRead = firstRead;
await page.screenshot({ path: ".factory/verification-artifacts-13/live-cold-desktop.png" });

await page.getByRole("link", { name: "Try it with sample data" }).click();
await page.waitForLoadState("networkidle");
assert(new URL(page.url()).pathname === "/demo", "one-click demo did not open /demo");
assert(await page.getByText("Demo — sample data, nothing is saved").isVisible(), "demo banner missing");
assert(await page.getByRole("option").count() === 3, "demo does not immediately show three groups");
assert(await page.getByRole("button", { name: "Reset demo" }).isVisible(), "Reset demo missing");
assert(await page.getByRole("button", { name: "Start for real" }).isVisible(), "Start for real missing");
const demoRequestStart = report.requests.length;
await page.getByRole("button", { name: "Quarantine", exact: true }).first().click();
assert(await page.getByText("Keep one copy in this group before marking another copy for quarantine.").isVisible(), "unsafe decision was not rejected");
assert(await page.locator(".plan-number strong").textContent() === "0", "unsafe decision changed plan");
await page.getByRole("button", { name: "Mark exact extras" }).click();
assert(await page.locator(".plan-number strong").textContent() === "2", "boundary plan count is not 2");
let confirmation = "";
page.once("dialog", async dialog => { confirmation = dialog.message(); await dialog.dismiss(); });
await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
assert(confirmation === "Move 2 files to /Sample drive/Proof Pile Quarantine? You can restore them from the decision log.", "confirmation lacks exact count/destination");
assert(await page.locator(".plan-number strong").textContent() === "2", "cancel did not preserve plan");
page.once("dialog", dialog => dialog.accept());
await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
assert(await page.getByText(/2 sample files moved/).isVisible(), "quarantine completion feedback missing");
const downloadPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "Export decision log" }).click();
const download = await downloadPromise;
const stream = await download.createReadStream();
const chunks = [];
for await (const chunk of stream) chunks.push(Buffer.from(chunk));
const csv = Buffer.concat(chunks).toString("utf8");
assert(download.suggestedFilename() === "proof-pile-decisions.csv" && csv.trim().split("\n").length === 9, "CSV shape failed");
await page.reload({ waitUntil: "networkidle" });
assert(await page.getByRole("button", { name: "Restore last move" }).isVisible(), "recovery did not survive reload");
await page.getByRole("button", { name: "Restore last move" }).click();
assert(await page.getByRole("button", { name: "Cancel" }).evaluate(node => node === document.activeElement), "safe dialog action lacks initial focus");
await page.keyboard.press("Escape");
assert(await page.getByRole("dialog").count() === 0, "Escape did not close recovery dialog");
const chooser = page.waitForEvent("filechooser");
await page.getByRole("button", { name: "Import decision log" }).click();
await (await chooser).setFiles({ name: "invalid.csv", mimeType: "text/csv", buffer: Buffer.from('"path","quarantine_path"\n"/only.jpg","/outside.jpg"') });
assert(await page.getByText(/decision log was not imported/i).isVisible(), "invalid CSV lacks recoverable error");
const selectedBefore = await page.getByRole("option").evaluateAll(nodes => nodes.findIndex(node => node.getAttribute("aria-selected") === "true"));
await page.getByRole("option").nth(selectedBefore).focus();
await page.keyboard.press("ArrowDown");
const selectedAfter = await page.getByRole("option").evaluateAll(nodes => nodes.findIndex(node => node.getAttribute("aria-selected") === "true"));
assert(selectedAfter === (selectedBefore + 1) % 3, "arrow-key selection failed");
const focusStyle = await page.getByRole("option").nth(selectedAfter).evaluate(node => { const css = getComputedStyle(node); return { outline: css.outline, outlineColor: css.outlineColor, outlineWidth: css.outlineWidth }; });
assert(focusStyle.outlineWidth !== "0px" && !focusStyle.outline.startsWith("none"), "focus indicator missing");
const demoRequests = report.requests.slice(demoRequestStart);
assert(demoRequests.every(item => new URL(item.url).origin === base), "demo made an off-origin request");
report.checks.endToEnd = { confirmation, csvRows: csv.trim().split("\n").length, invalidCsvRejected: true, reloadRecovery: true, selectedBefore, selectedAfter, focusStyle, requests: demoRequests };
await page.screenshot({ path: ".factory/verification-artifacts-13/live-demo-final.png", fullPage: true });

await page.goto(base, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Check download for Linux" }).click();
await page.waitForTimeout(1200);
const downloadGate = {
  state: await page.locator("#release-state").textContent(),
  signatureState: await page.locator("#signature-state").textContent(),
  links: await page.locator("#release-links a").evaluateAll(nodes => nodes.map(node => ({ text: node.textContent?.trim(), href: node.getAttribute("href") })))
};
assert(downloadGate.state?.includes("v0.1.15 is ready"), "live release is not ready");
assert(downloadGate.links.length === 4, `expected four platform links, got ${downloadGate.links.length}`);
assert(downloadGate.signatureState?.includes("unsigned"), "unsigned package warning missing");
report.checks.downloadGate = downloadGate;
await page.screenshot({ path: ".factory/verification-artifacts-13/live-download-gate.png" });

for (const colorScheme of ["light", "dark"]) {
  await page.emulateMedia({ colorScheme });
  for (const route of ["/", "/demo", "/app", "/privacy", "/terms"]) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    const axe = await new AxeBuilder({ page }).analyze();
    const severe = axe.violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""));
    assert(severe.length === 0, `${colorScheme} ${route}: axe ${severe.map(item => item.id).join(",")}`);
  }
}
report.checks.axe = "zero serious/critical on five routes in light and dark";
await page.goto(base, { waitUntil: "networkidle" });
await page.getByRole("link", { name: "Skip to main content" }).focus();
await page.keyboard.press("Enter");
assert(await page.locator("main").evaluate(node => node === document.activeElement), "skip link did not focus main");
report.checks.keyboard = "skip link, ArrowDown, activation, safe dialog focus, and Escape passed";
await context.close();

const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
const mobile = await mobileContext.newPage();
const mobileErrors = [];
mobile.on("console", message => { if (message.type() === "error") mobileErrors.push(message.text()); });
mobile.on("pageerror", error => mobileErrors.push(error.message));
await mobile.goto(`${base}/demo`, { waitUntil: "networkidle" });
const dimensions = await mobile.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
assert(dimensions.document <= dimensions.viewport, "390px horizontal overflow");
const smallTargets = [];
for (const node of await mobile.locator("button:visible, header a:visible, footer a:visible").all()) {
  const box = await node.boundingBox();
  if (!box || box.width < 44 || box.height < 44) smallTargets.push({ text: await node.textContent(), box });
}
assert(smallTargets.length === 0, `targets below 44px: ${JSON.stringify(smallTargets)}`);
const transitionDuration = await mobile.locator(".photo-card").first().evaluate(node => getComputedStyle(node).transitionDuration);
assert(["0s", "1e-05s", "0.00001s"].includes(transitionDuration), `reduced motion is ${transitionDuration}`);
await mobile.locator("html").evaluate(node => { node.style.fontSize = "34px"; });
const resized = await mobile.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
assert(resized.document <= resized.viewport, "200% text caused overflow");
const mobileAxe = await new AxeBuilder({ page: mobile }).analyze();
assert(mobileAxe.violations.filter(item => ["serious", "critical"].includes(item.impact ?? "")).length === 0, "mobile axe failed");
assert(mobileErrors.length === 0, `mobile errors: ${mobileErrors.join(" | ")}`);
await mobile.screenshot({ path: ".factory/verification-artifacts-13/live-demo-mobile-390.png", fullPage: true });
report.checks.mobile = { dimensions, resized, smallTargets, transitionDuration };
await mobileContext.close();

const offlineContext = await browser.newContext();
const offlinePage = await offlineContext.newPage();
await offlinePage.goto(`${base}/demo`, { waitUntil: "networkidle" });
await offlinePage.waitForFunction(() => navigator.serviceWorker?.controller);
const sw = await offlinePage.evaluate(async () => ({ caches: await caches.keys(), script: (await navigator.serviceWorker.getRegistration())?.active?.scriptURL }));
await offlinePage.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
await offlineContext.setOffline(true);
const offlineResponse = await offlinePage.reload({ waitUntil: "domcontentloaded" });
assert(await offlinePage.getByText("Demo — sample data, nothing is saved").isVisible(), "offline reload lost demo banner");
assert(await offlinePage.getByRole("option").count() === 3, "offline reload lost sample groups");
report.checks.pwa = { ...sw, offlineStatus: offlineResponse?.status() };
await offlineContext.close();

const unexpectedErrors = report.errors.filter(item => !(item.includes("qa-missing-route-13") && item.includes("404")));
assert(unexpectedErrors.length === 0, `unexpected browser errors: ${unexpectedErrors.join(" | ")}`);
report.checks.expected404Noise = report.errors.filter(item => !unexpectedErrors.includes(item));
await writeFile(".factory/verification-artifacts-13/live-qa.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.checks, null, 2));
await browser.close();
