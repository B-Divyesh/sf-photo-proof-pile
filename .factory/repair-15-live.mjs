import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";

const base = "https://photo-proof-pile.sociobot.in";
const commit = "11b315afb2a454b8618659fd648a6e8e1e069ce8";
const out = ".factory/repair-15-artifacts";
const report = { checkedAt: new Date().toISOString(), routes: [], axe: [], checks: {}, errors: [] };
const check = (condition, message) => { if (!condition) throw new Error(message); };
const serious = (results) => results.violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""));
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, serviceWorkers: "block" });
  const page = await context.newPage();
  const requests = [];
  page.on("request", request => requests.push(request.url()));
  page.on("console", message => { if (message.type() === "error") report.errors.push(`console ${page.url()}: ${message.text()}`); });
  page.on("pageerror", error => report.errors.push(`page ${page.url()}: ${error.message}`));

  const rootResponse = await page.goto(`${base}/`, { waitUntil: "networkidle" });
  check(rootResponse?.status() === 200, "root did not return 200");
  check(await page.locator("h1").textContent() === "Review photo copies before you remove them", "first-read job changed");
  check(await page.getByText(/For people with photos across several drives/).isVisible(), "first-read audience is missing");
  check(await page.getByText("Opens three ready-to-review groups.").isVisible(), "sample action result is missing");
  check(await page.getByRole("link", { name: new RegExp(`View source commit ${commit}`) }).isVisible(), "deployed source identity is wrong");
  const sampleAction = page.getByRole("link", { name: "Try it with sample data" });
  await sampleAction.focus();
  const focusAppearance = await sampleAction.evaluate(node => {
    const style = getComputedStyle(node);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, outlineColor: style.outlineColor };
  });
  check(focusAppearance.outlineStyle !== "none" && parseFloat(focusAppearance.outlineWidth) >= 2, `sample action lacks visible focus: ${JSON.stringify(focusAppearance)}`);
  report.checks.focusAppearance = focusAppearance;
  await page.screenshot({ path: `${out}/live-first-read.png`, fullPage: false });

  await sampleAction.click();
  await page.waitForLoadState("networkidle");
  check(page.url() === `${base}/demo`, "one-click demo did not open /demo");
  check(await page.getByText("Demo — sample data, nothing is saved").isVisible(), "demo banner is missing");
  check(await page.getByRole("option").count() === 3, "demo does not contain three groups");
  let sampleFiles = 0;
  for (let index = 0; index < 3; index += 1) {
    await page.getByRole("option").nth(index).click();
    sampleFiles += await page.locator(".file-row").count();
  }
  check(sampleFiles === 8, "demo does not contain eight sample files");
  await page.getByRole("option").first().click();
  await page.getByRole("option").first().focus();
  await page.keyboard.press("ArrowDown");
  check(await page.getByRole("option").nth(1).getAttribute("aria-selected") === "true", "ArrowDown did not change groups");
  await page.getByRole("option").first().click();
  await page.getByRole("button", { name: "Mark exact extras" }).click();
  let confirmation = "";
  page.once("dialog", async dialog => { confirmation = dialog.message(); await dialog.accept(); });
  await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
  await page.getByText(/2 sample files moved/).waitFor();
  check(confirmation.includes("/Sample drive/Proof Pile Quarantine"), "move confirmation omitted its destination");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export decision log" }).click();
  const stream = await (await downloadEvent).createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  check(Buffer.concat(chunks).toString("utf8").trim().split("\n").length === 9, "CSV did not contain eight records plus its header");
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Restore last move" }).click();
  check(await page.getByRole("button", { name: "Cancel" }).evaluate(node => node === document.activeElement), "restore dialog did not focus the safe action");
  await page.keyboard.press("Escape");
  check(await page.getByRole("dialog").count() === 0, "Escape did not close the restore dialog");
  const offOrigin = requests.filter(url => new URL(url).origin !== base);
  check(offOrigin.length === 0, `demo flow made off-origin requests: ${offOrigin.join(", ")}`);
  report.checks.demo = { groups: 3, sampleFiles, csvRows: 9, confirmation, offOrigin };
  await page.screenshot({ path: `${out}/live-demo-flow.png`, fullPage: true });

  for (const colorScheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme });
    for (const route of ["/", "/demo", "/privacy", "/terms"]) {
      const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
      const failures = serious(await new AxeBuilder({ page }).analyze());
      check(response?.status() === 200, `${route} did not return 200`);
      check(await page.locator("h1").count() === 1 && await page.locator("main").count() === 1, `${route} semantic skeleton failed`);
      check(failures.length === 0, `${route} ${colorScheme} has serious/critical Axe findings`);
      report.axe.push({ route, colorScheme, seriousCritical: failures.map(item => item.id) });
    }
  }
  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark", serviceWorkers: "block" });
  const mobilePage = await mobile.newPage();
  for (const route of ["/", "/demo", "/app", "/privacy", "/terms", "/repair-15-missing"]) {
    const response = await mobilePage.goto(`${base}${route}`, { waitUntil: "networkidle" });
    const expectedStatus = route.includes("missing") ? 404 : 200;
    check(response?.status() === expectedStatus, `${route} returned ${response?.status()}`);
    const normalWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    const targets = await mobilePage.locator('a:visible,button:visible,input:visible,[role="option"]:visible,[tabindex="0"]:visible').evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { name: (node.getAttribute("aria-label") || node.textContent || "").trim().replace(/\s+/g, " ").slice(0, 100), width: box.width, height: box.height };
    }).filter(item => item.width < 44 || item.height < 44));
    check(targets.length === 0, `${route} has undersized phone actions: ${JSON.stringify(targets)}`);
    const sourceBox = route === "/demo" ? await mobilePage.getByRole("link", { name: /^View source commit/ }).boundingBox() : null;
    if (sourceBox) check(sourceBox.width >= 44 && sourceBox.height >= 44, `source link is ${sourceBox.width}x${sourceBox.height}`);
    await mobilePage.locator("html").evaluate(node => { node.style.fontSize = "34px"; });
    const enlargedWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    check(normalWidth <= 390 && enlargedWidth <= 390, `${route} overflows at 390px or 200% text`);
    report.routes.push({ route, status: response?.status(), normalWidth, enlargedWidth, undersizedTargets: targets, sourceBox });
  }
  await mobilePage.goto(`${base}/demo`, { waitUntil: "networkidle" });
  await mobilePage.emulateMedia({ reducedMotion: "reduce" });
  await mobilePage.reload();
  const reducedMotion = await mobilePage.locator(".photo-card").first().evaluate(node => getComputedStyle(node).transitionDuration);
  check(parseFloat(reducedMotion) <= 0.00001, `reduced motion remained ${reducedMotion}`);
  report.checks.reducedMotion = reducedMotion;
  await mobilePage.screenshot({ path: `${out}/live-mobile-390.png`, fullPage: true });
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
  check(update.controlled && !update.waiting && update.caches.includes("proof-pile-v22"), "service worker update did not settle on v22");
  await pwa.setOffline(true);
  const offlineResponse = await pwaPage.reload({ waitUntil: "domcontentloaded" });
  check(offlineResponse?.status() === 200 && await pwaPage.getByRole("option").count() === 3, "offline demo reload failed");
  report.checks.pwa = { ...update, offlineStatus: offlineResponse?.status() };
  await pwa.close();

  const release = await browser.newPage();
  release.on("console", message => { if (message.type() === "error") report.errors.push(`console ${release.url()}: ${message.text()}`); });
  await release.goto(`${base}/`, { waitUntil: "networkidle" });
  await release.evaluate(() => localStorage.clear());
  await release.getByRole("button", { name: "Check desktop downloads" }).click();
  await release.getByText("v0.1.26 is ready from this source.").waitFor({ timeout: 30000 });
  const downloads = await release.getByRole("link", { name: /Download for/ }).evaluateAll(nodes => nodes.map(node => ({ label: node.textContent?.trim(), href: node.href })));
  check(downloads.length === 4 && downloads.every(item => item.href.includes("/releases/download/v0.1.26/")), "release picker did not resolve the v0.1.26 package set");
  report.checks.release = { downloads };
  await release.screenshot({ path: `${out}/live-downloads.png`, fullPage: false });
  await release.close();

  check(report.errors.length === 0, `live browser errors: ${report.errors.join(" | ")}`);
  await writeFile(`${out}/live-qa.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
