import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const base = "https://photo-proof-pile.sociobot.in";
const tag = "v0.1.30";
const commit = "b12d5727de44d71c91b4a496eece320e7247a853";
const out = ".factory/repair-20-artifacts";
const report = { checkedAt: new Date().toISOString(), tag, commit, routes: [], axe: [], checks: {}, errors: [] };
const check = (condition, message) => { if (!condition) throw new Error(message); };
const serious = results => results.violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""));

await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  const routeContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
  const routePage = await routeContext.newPage();
  routePage.on("console", message => { if (message.type() === "error") report.errors.push(`console ${routePage.url()}: ${message.text()}`); });
  routePage.on("pageerror", error => report.errors.push(`page ${routePage.url()}: ${error.message}`));
  for (const scheme of ["light", "dark"]) {
    await routePage.emulateMedia({ colorScheme: scheme, reducedMotion: "no-preference" });
    for (const route of ["/", "/demo", "/app", "/privacy", "/terms"]) {
      const response = await routePage.goto(`${base}${route}`, { waitUntil: "networkidle" });
      const semantics = await routePage.evaluate(() => ({
        title: document.title,
        lang: document.documentElement.lang,
        h1: document.querySelectorAll("h1").length,
        main: document.querySelectorAll("main").length,
        missingAlt: [...document.images].filter(image => !image.hasAttribute("alt")).length
      }));
      check(response?.status() === 200, `${route} returned ${response?.status()}`);
      check(semantics.lang === "en" && semantics.h1 === 1 && semantics.main === 1 && semantics.missingAlt === 0, `${route} semantics failed`);
      const violations = serious(await new AxeBuilder({ page: routePage }).analyze());
      check(violations.length === 0, `${route} ${scheme} Axe: ${violations.map(item => item.id).join(", ")}`);
      report.routes.push({ route, scheme, status: response.status(), ...semantics });
      report.axe.push({ route, scheme, seriousCritical: violations.map(item => item.id) });
    }
  }
  const errorsBeforeMissingRoute = report.errors.length;
  const missingResponse = await routePage.goto(`${base}/repair-20-missing`, { waitUntil: "networkidle" });
  check(missingResponse?.status() === 404, `unknown route returned ${missingResponse?.status()}`);
  check(await routePage.locator("h1").count() === 1 && await routePage.locator("main").count() === 1, "404 semantics failed");
  const expected404Console = report.errors.splice(errorsBeforeMissingRoute);
  check(expected404Console.every(message => message.includes("Failed to load resource") && message.includes("404")), `unexpected 404 console output: ${expected404Console.join(" | ")}`);
  report.checks.notFound = { status: missingResponse.status(), title: await routePage.title(), expected404Console };
  await routeContext.close();

  const demoContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, serviceWorkers: "block" });
  const demo = await demoContext.newPage();
  const requests = [];
  demo.on("request", request => requests.push({ method: request.method(), url: request.url(), postData: request.postData() }));
  demo.on("console", message => { if (message.type() === "error") report.errors.push(`console ${demo.url()}: ${message.text()}`); });
  demo.on("pageerror", error => report.errors.push(`page ${demo.url()}: ${error.message}`));
  await demo.goto(base, { waitUntil: "networkidle" });
  await demo.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await demo.reload({ waitUntil: "networkidle" });
  check(await demo.locator("h1").textContent() === "Review photo copies before you remove them", "first-read headline changed");
  check(await demo.getByText("For people with photos across several drives who fear removing the only meaningful copy.").isVisible(), "first-read audience missing");
  const firstAction = demo.getByRole("link", { name: "Try it with sample data" });
  check(await firstAction.isVisible(), "sample action is not visible");
  check(await demo.getByText("Opens three ready-to-review groups.").isVisible(), "sample outcome is missing");
  await firstAction.focus();
  const focus = await firstAction.evaluate(node => ({ outlineStyle: getComputedStyle(node).outlineStyle, outlineWidth: getComputedStyle(node).outlineWidth }));
  check(focus.outlineStyle !== "none" && parseFloat(focus.outlineWidth) >= 2, "primary action has no visible focus ring");
  await firstAction.press("Enter");
  check(demo.url() === `${base}/demo`, "one-click demo did not open /demo");
  check(await demo.getByText("Demo — sample data, nothing is saved").isVisible(), "demo isolation banner missing");
  const groups = await demo.getByRole("option").count();
  let files = 0;
  for (let index = 0; index < groups; index += 1) {
    await demo.getByRole("option").nth(index).click();
    files += await demo.locator(".file-row").count();
  }
  check(groups === 3 && files === 8, `demo has ${groups} groups and ${files} files`);
  await demo.getByRole("option").first().click();
  await demo.getByRole("button", { name: "Quarantine", exact: true }).first().click();
  check(await demo.getByText("Keep one copy in this group before marking another copy for quarantine.").isVisible(), "unsafe plan was accepted");
  await demo.getByRole("button", { name: "Mark exact extras" }).click();
  const confirmation = new Promise(resolve => demo.once("dialog", async dialog => { const message = dialog.message(); await dialog.accept(); resolve(message); }));
  await demo.getByRole("button", { name: "Move 2 files to quarantine" }).click();
  const confirmationText = await confirmation;
  check(confirmationText.includes("Move 2 files to /Sample drive/Proof Pile Quarantine?"), "confirmation omitted exact plan details");
  const downloadPromise = demo.waitForEvent("download");
  await demo.getByRole("button", { name: "Export decision log" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const csv = Buffer.concat(chunks).toString("utf8");
  check(csv.trim().split("\n").length === 9, "decision log did not contain eight records");
  await demo.reload({ waitUntil: "networkidle" });
  check(await demo.getByRole("button", { name: "Restore last move" }).isVisible(), "recovery state did not survive reload");
  await demo.getByRole("button", { name: "Restore last move" }).click();
  check(await demo.getByRole("button", { name: "Cancel" }).evaluate(node => node === document.activeElement), "safe dialog action did not receive focus");
  await demo.keyboard.press("Escape");
  await demo.getByRole("option").first().focus();
  await demo.keyboard.press("ArrowDown");
  check(await demo.getByRole("option").nth(1).getAttribute("aria-selected") === "true", "ArrowDown did not select the next group");
  const decision = demo.locator(".file-row").nth(1).getByRole("button", { name: "Quarantine" });
  await decision.focus();
  await demo.keyboard.press("Space");
  check(await demo.locator(".file-row").nth(2).getByRole("button", { name: "Keep" }).evaluate(node => node === document.activeElement), "keyboard decision did not advance focus");
  check(requests.every(request => new URL(request.url).origin === base), "demo sent a request off origin");
  report.checks.demo = { groups, files, csvRows: 9, confirmation: confirmationText, keyboard: true, onlySameOrigin: true, requests };
  await demo.screenshot({ path: `${out}/live-demo-desktop.png`, fullPage: true });
  await demoContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark", reducedMotion: "reduce", serviceWorkers: "block" });
  const mobile = await mobileContext.newPage();
  for (const route of ["/", "/demo", "/app", "/privacy", "/terms", "/repair-20-mobile-missing"]) {
    const response = await mobile.goto(`${base}${route}`, { waitUntil: "networkidle" });
    const expectedStatus = route.includes("missing") ? 404 : 200;
    check(response?.status() === expectedStatus, `${route} returned ${response?.status()} on mobile`);
    const width = await mobile.evaluate(() => document.documentElement.scrollWidth);
    const undersized = await mobile.locator("a:visible,button:visible,input:visible,[role=option]:visible,[tabindex='0']:visible").evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { name: (node.getAttribute("aria-label") || node.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80), width: box.width, height: box.height };
    }).filter(item => item.width < 44 || item.height < 44));
    await mobile.locator("html").evaluate(node => { node.style.fontSize = "34px"; });
    const enlargedWidth = await mobile.evaluate(() => document.documentElement.scrollWidth);
    check(width <= 390 && enlargedWidth <= 390, `${route} overflows at 390px or 200% text`);
    check(undersized.length === 0, `${route} has undersized targets: ${JSON.stringify(undersized)}`);
    report.checks[`mobile:${route}`] = { status: response.status(), width, enlargedWidth, undersized };
  }
  await mobile.goto(`${base}/demo`, { waitUntil: "networkidle" });
  const transition = await mobile.locator(".photo-card").first().evaluate(node => getComputedStyle(node).transitionDuration);
  check(parseFloat(transition) <= 0.00001, `reduced-motion duration is ${transition}`);
  report.checks.reducedMotion = transition;
  await mobile.screenshot({ path: `${out}/live-demo-mobile-390.png`, fullPage: true });
  await mobileContext.close();

  const pwaContext = await browser.newContext({ serviceWorkers: "allow" });
  const pwa = await pwaContext.newPage();
  await pwa.goto(`${base}/demo`, { waitUntil: "networkidle" });
  await pwa.evaluate(async () => { await navigator.serviceWorker.ready; });
  await pwa.reload();
  await pwa.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const update = await pwa.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.update();
    return { controlled: Boolean(navigator.serviceWorker.controller), waiting: Boolean(registration?.waiting), caches: await caches.keys() };
  });
  check(update.controlled && !update.waiting && update.caches.includes("proof-pile-v0.1.30"), `service-worker update is wrong: ${JSON.stringify(update)}`);
  await pwaContext.setOffline(true);
  const offlineResponse = await pwa.reload({ waitUntil: "domcontentloaded" });
  check(offlineResponse?.status() === 200 && await pwa.getByRole("option").count() === 3, "offline demo reload failed");
  report.checks.pwa = { ...update, offlineStatus: offlineResponse.status() };
  await pwaContext.close();

  const releaseContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
  const releasePage = await releaseContext.newPage();
  const releaseRequests = [];
  releasePage.on("request", request => releaseRequests.push(request.url()));
  releasePage.on("console", message => { if (message.type() === "error") report.errors.push(`console ${releasePage.url()}: ${message.text()}`); });
  releasePage.on("pageerror", error => report.errors.push(`page ${releasePage.url()}: ${error.message}`));
  await releasePage.goto(base, { waitUntil: "networkidle" });
  const sourceHref = await releasePage.locator(`a[href$="/commit/${commit}"]`).getAttribute("href");
  check(Boolean(sourceHref), "footer does not link to the candidate source");
  await releasePage.getByRole("button", { name: "Check desktop downloads" }).click();
  await releasePage.getByText(`${tag} is ready from this source.`).waitFor({ timeout: 30_000 });
  const downloads = await releasePage.getByRole("dialog").getByRole("link", { name: /Download for/ }).evaluateAll(nodes => nodes.map(node => ({ text: node.textContent?.trim(), href: node.href })));
  check(downloads.length === 4, `download dialog exposed ${downloads.length} platform links`);
  check(downloads.every(item => item.href.includes(`/releases/download/${tag}/`)), "a download URL does not use the immutable release tag");
  check(releaseRequests.some(url => url.endsWith(`/releases/tags/${tag}`)), "download dialog did not request the matching release tag");
  report.checks.release = { sourceHref, downloads, releaseApi: releaseRequests.find(url => url.includes("api.github.com")) };
  await releasePage.screenshot({ path: `${out}/live-downloads.png`, fullPage: false });
  await releaseContext.close();

  check(report.errors.length === 0, `browser errors: ${report.errors.join(" | ")}`);
  await writeFile(`${out}/live-qa.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ routes: report.routes.length, axeRuns: report.axe.length, errors: report.errors.length, demo: report.checks.demo, pwa: report.checks.pwa, release: report.checks.release }, null, 2));
} finally {
  await browser.close();
}
