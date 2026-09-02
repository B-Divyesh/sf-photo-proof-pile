import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";

const base = "https://photo-proof-pile.sociobot.in";
const candidate = "d70a334ba782ae62a9bd3053cece835909f99cf5";
const out = ".factory/evidence-25";
const report = { checkedAt: new Date().toISOString(), candidate, routes: [], axe: [], errors: [], checks: {} };
const check = (condition, message) => { if (!condition) throw new Error(message); };
const serious = results => results.violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""));
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, serviceWorkers: "block" });
  const page = await context.newPage();
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(`console ${page.url()}: ${message.text()}`); });
  page.on("pageerror", error => errors.push(`page ${page.url()}: ${error.message}`));

  for (const scheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "no-preference" });
    for (const route of ["/", "/demo", "/app", "/privacy", "/terms"]) {
      const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
      const semantics = await page.evaluate(() => ({
        title: document.title,
        lang: document.documentElement.lang,
        h1: document.querySelectorAll("h1").length,
        main: document.querySelectorAll("main").length,
        missingAlt: [...document.images].filter(image => !image.hasAttribute("alt")).length
      }));
      check(response?.status() === 200, `${route} returned ${response?.status()}`);
      check(semantics.lang === "en" && semantics.h1 === 1 && semantics.main === 1 && semantics.missingAlt === 0, `${route} semantics failed`);
      const violations = serious(await new AxeBuilder({ page }).analyze());
      report.routes.push({ route, scheme, status: response.status(), ...semantics });
      report.axe.push({ route, scheme, seriousCritical: violations.map(item => item.id) });
      check(violations.length === 0, `${route} ${scheme} has serious/critical Axe findings`);
    }
  }

  const privacyContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, serviceWorkers: "block" });
  const demo = await privacyContext.newPage();
  const demoRequests = [];
  demo.on("request", request => demoRequests.push({ method: request.method(), url: request.url(), postData: request.postData() }));
  demo.on("console", message => { if (message.type() === "error") errors.push(`console ${demo.url()}: ${message.text()}`); });
  demo.on("pageerror", error => errors.push(`page ${demo.url()}: ${error.message}`));
  await demo.goto(base, { waitUntil: "networkidle" });
  await demo.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await demo.reload({ waitUntil: "networkidle" });
  const h1 = await demo.locator("h1").textContent();
  const who = await demo.getByText("For people with photos across several drives who fear removing the only meaningful copy.").textContent();
  const firstAction = demo.getByRole("link", { name: "Try it with sample data" });
  check(h1 === "Review photo copies before you remove them", "first-read job is unclear");
  check(Boolean(who), "first-read audience is unclear");
  check(await firstAction.isVisible(), "sample action is not visible");
  check(await demo.getByText("Opens three ready-to-review groups.").isVisible(), "sample action outcome is missing");
  await firstAction.focus();
  const focus = await firstAction.evaluate(node => ({ outlineWidth: getComputedStyle(node).outlineWidth, outlineStyle: getComputedStyle(node).outlineStyle, outlineColor: getComputedStyle(node).outlineColor }));
  check(focus.outlineStyle !== "none" && parseFloat(focus.outlineWidth) >= 2, "first action has no visible focus ring");
  await firstAction.press("Enter");
  await demo.waitForLoadState("networkidle");
  check(demo.url() === `${base}/demo`, "one-click demo did not open /demo");
  check(await demo.getByText("Demo — sample data, nothing is saved").isVisible(), "demo banner missing");
  check(await demo.getByRole("button", { name: "Reset demo" }).isVisible(), "Reset demo missing");
  check(await demo.getByRole("button", { name: "Start for real" }).isVisible(), "Start for real missing");
  const groups = await demo.getByRole("option").count();
  let files = 0;
  for (let index = 0; index < groups; index += 1) {
    await demo.getByRole("option").nth(index).click();
    files += await demo.locator(".file-row").count();
  }
  check(groups === 3 && files === 8, `sample contains ${groups} groups and ${files} files`);

  await demo.getByRole("option").first().click();
  await demo.getByRole("button", { name: "Quarantine", exact: true }).first().click();
  check(await demo.getByText("Keep one copy in this group before marking another copy for quarantine.").isVisible(), "unsafe quarantine was not rejected");
  check((await demo.locator(".plan-number strong").textContent()) === "0", "unsafe choice entered plan");
  await demo.getByRole("button", { name: "Mark exact extras" }).click();
  check((await demo.locator(".plan-number strong").textContent()) === "2", "exact extras did not create two-file plan");
  const dialogMessage = new Promise(resolve => demo.once("dialog", async dialog => { const message = dialog.message(); await dialog.accept(); resolve(message); }));
  await demo.getByRole("button", { name: "Move 2 files to quarantine" }).click();
  const confirmation = await dialogMessage;
  check(confirmation === "Move 2 files to /Sample drive/Proof Pile Quarantine? You can restore them from the decision log.", "confirmation did not name exact count and destination");
  check(await demo.getByText("2 sample files moved to the demo quarantine. No files on your device changed.").isVisible(), "sample quarantine result missing");
  const downloadPromise = demo.waitForEvent("download");
  await demo.getByRole("button", { name: "Export decision log" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const csv = Buffer.concat(chunks).toString("utf8");
  check(download.suggestedFilename() === "proof-pile-decisions.csv" && csv.trim().split("\n").length === 9, "CSV did not contain header plus eight records");
  check(csv.includes("/Sample drive/Proof Pile Quarantine/IMG_4812 (1).jpg"), "CSV omitted recovery destination");
  await demo.reload({ waitUntil: "networkidle" });
  await demo.getByRole("button", { name: "Restore last move" }).click();
  check(await demo.getByRole("dialog").getByText("From quarantine").isVisible(), "restore dialog omitted source details");
  await demo.getByRole("button", { name: "Restore this file" }).click();
  await demo.getByText(/restored in the demo/).waitFor();
  await demo.getByRole("button", { name: "Reset demo" }).click();
  check((await demo.locator(".plan-number strong").textContent()) === "0", "Reset demo did not clear the plan");
  check(await demo.evaluate(() => sessionStorage.getItem("demo:photo-proof-pile:session")) === null, "Reset demo retained sample storage");

  const chooser = demo.waitForEvent("filechooser");
  await demo.getByRole("button", { name: "Import decision log" }).click();
  await (await chooser).setFiles({ name: "invalid.csv", mimeType: "text/csv", buffer: Buffer.from("not,a,proof,pile,log\n1,2,3,4,5") });
  await demo.getByText(/The decision log was not imported/).waitFor();

  await demo.getByRole("option").first().focus();
  await demo.keyboard.press("ArrowDown");
  check(await demo.getByRole("option").nth(1).getAttribute("aria-selected") === "true", "ArrowDown did not change group");
  const decision = demo.locator(".file-row").nth(1).getByRole("button", { name: "Quarantine" });
  await decision.focus();
  await demo.keyboard.press("Space");
  check(await demo.locator(".file-row").nth(2).getByRole("button", { name: "Keep" }).evaluate(node => node === document.activeElement), "keyboard decision did not advance focus");
  check(demoRequests.every(request => new URL(request.url).origin === base), "demo made an off-origin request");
  await demo.screenshot({ path: `${out}/live-demo-desktop.png`, fullPage: false });
  report.checks.firstRead = { h1, who, action: "Try it with sample data", outcome: "Opens three ready-to-review groups.", focus };
  report.checks.demo = { groups, files, confirmation, csvRows: csv.trim().split("\n").length, invalidCsvRejected: true, keyboard: true, onlySameOrigin: true, requests: demoRequests };
  await privacyContext.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark", reducedMotion: "reduce", serviceWorkers: "block" });
  const mobilePage = await mobile.newPage();
  for (const route of ["/", "/demo", "/app", "/privacy", "/terms", "/qa-25-missing"]) {
    const response = await mobilePage.goto(`${base}${route}`, { waitUntil: "networkidle" });
    check(response?.status() === (route.includes("missing") ? 404 : 200), `${route} returned ${response?.status()} on mobile`);
    const width = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    const targets = await mobilePage.locator("a:visible,button:visible,input:visible,[role=option]:visible,[tabindex='0']:visible").evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { name: (node.getAttribute("aria-label") || node.textContent || "").trim().replace(/\s+/g, " ").slice(0, 90), width: box.width, height: box.height };
    }).filter(item => item.width < 44 || item.height < 44));
    await mobilePage.locator("html").evaluate(node => { node.style.fontSize = "34px"; });
    const enlargedWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    check(width <= 390 && enlargedWidth <= 390, `${route} overflows at 390px/200% text`);
    check(targets.length === 0, `${route} has undersized targets: ${JSON.stringify(targets)}`);
    report.checks[`mobile:${route}`] = { status: response.status(), width, enlargedWidth, undersizedTargets: targets };
  }
  await mobilePage.goto(`${base}/demo`, { waitUntil: "networkidle" });
  const transitionDuration = await mobilePage.locator(".photo-card").first().evaluate(node => getComputedStyle(node).transitionDuration);
  check(parseFloat(transitionDuration) <= 0.00001, `reduced motion transition remains ${transitionDuration}`);
  report.checks.reducedMotion = transitionDuration;
  await mobilePage.screenshot({ path: `${out}/live-demo-mobile-390.png`, fullPage: true });
  await mobile.close();

  const pwa = await browser.newContext({ serviceWorkers: "allow" });
  const pwaPage = await pwa.newPage();
  await pwaPage.goto(`${base}/demo`, { waitUntil: "networkidle" });
  await pwaPage.evaluate(async () => { await navigator.serviceWorker.ready; });
  await pwaPage.reload();
  await pwaPage.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const update = await pwaPage.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.update();
    return { controlled: Boolean(navigator.serviceWorker.controller), waiting: Boolean(registration?.waiting), caches: await caches.keys() };
  });
  check(update.controlled && !update.waiting && update.caches.includes("proof-pile-v29"), "service-worker update did not settle");
  await pwa.setOffline(true);
  const offline = await pwaPage.reload({ waitUntil: "domcontentloaded" });
  check(offline?.status() === 200 && await pwaPage.getByRole("option").count() === 3, "offline demo reload failed");
  report.checks.pwa = { ...update, offlineStatus: offline.status() };
  await pwa.close();

  const release = await browser.newPage();
  await release.goto(base, { waitUntil: "networkidle" });
  await release.evaluate(() => localStorage.clear());
  await release.reload({ waitUntil: "networkidle" });
  await release.getByRole("button", { name: "Check desktop downloads" }).click();
  await release.getByText("Downloads for this build are being published.").waitFor({ timeout: 30000 });
  const releaseState = await release.getByRole("dialog").innerText();
  const downloadLinks = await release.getByRole("dialog").getByRole("link", { name: /Download for/ }).count();
  check(downloadLinks === 0, "candidate mismatch unexpectedly exposed a desktop package");
  report.checks.release = { releaseState, downloadLinks, deployedCandidate: candidate, expectedResult: "refusal because latest release commit differs" };
  await release.screenshot({ path: `${out}/live-download-refusal.png`, fullPage: false });
  await release.close();

  report.errors = errors;
  check(errors.length === 0, `browser errors: ${errors.join(" | ")}`);
  await writeFile(`${out}/live-qa.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ routes: report.routes.length, axeRuns: report.axe.length, errors: report.errors.length, demo: report.checks.demo, release: report.checks.release, pwa: report.checks.pwa }, null, 2));
} finally {
  await browser.close();
}
