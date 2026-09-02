import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";

const base = "https://photo-proof-pile.sociobot.in";
const commit = "758ba98390c5a2ba49323b7682a6a86e5eca6103";
const tag = "v0.1.29";
const out = ".factory/repair-18-artifacts";
const report = { checkedAt: new Date().toISOString(), routes: [], axe: [], errors: [], checks: {} };
const check = (condition, message) => { if (!condition) throw new Error(message); };
const serious = results => results.violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""));
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, serviceWorkers: "block" });
  const page = await context.newPage();
  const requests = [];
  page.on("request", request => requests.push(request.url()));
  page.on("console", message => { if (message.type() === "error") report.errors.push(`console ${page.url()}: ${message.text()}`); });
  page.on("pageerror", error => report.errors.push(`page ${page.url()}: ${error.message}`));

  for (const scheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const route of ["/", "/demo", "/privacy", "/terms"]) {
      const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
      const semantics = await page.evaluate(() => ({
        title: document.title,
        lang: document.documentElement.lang,
        h1: document.querySelectorAll("h1").length,
        main: document.querySelectorAll("main").length,
        missingAlt: [...document.images].filter(image => !image.hasAttribute("alt")).length
      }));
      check(response?.status() === 200, `${route} returned ${response?.status()}`);
      check(semantics.lang === "en" && semantics.h1 === 1 && semantics.main === 1 && semantics.missingAlt === 0, `${route} failed semantics`);
      const violations = serious(await new AxeBuilder({ page }).analyze());
      check(violations.length === 0, `${route} ${scheme} has serious/critical Axe findings`);
      report.routes.push({ route, scheme, status: response.status(), ...semantics });
      report.axe.push({ route, scheme, seriousCritical: violations.map(item => item.id) });
    }
  }

  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  await page.goto(base, { waitUntil: "networkidle" });
  check(await page.locator("h1").textContent() === "Review photo copies before you remove them", "first-read job changed");
  check(await page.getByText("Opens three ready-to-review groups.").isVisible(), "sample action outcome is missing");
  check(await page.getByRole("link", { name: new RegExp(`View source commit ${commit}`) }).isVisible(), "site source identity is wrong");
  const action = page.getByRole("link", { name: "Try it with sample data" });
  await action.focus();
  const focus = await action.evaluate(node => ({ width: getComputedStyle(node).outlineWidth, style: getComputedStyle(node).outlineStyle }));
  check(focus.style !== "none" && parseFloat(focus.width) >= 2, "primary action lacks focus visibility");
  await page.screenshot({ path: `${out}/live-desktop.png`, fullPage: false });
  await page.keyboard.press("Enter");
  await page.waitForLoadState("networkidle");
  check(page.url() === `${base}/demo`, "one-click demo did not open /demo");
  check(await page.getByText("Demo — sample data, nothing is saved").isVisible(), "demo banner is missing");
  check(await page.getByRole("option").count() === 3, "demo does not contain three groups");
  let files = 0;
  for (let index = 0; index < 3; index += 1) {
    await page.getByRole("option").nth(index).click();
    files += await page.locator(".file-row").count();
  }
  check(files === 8, "demo does not contain eight sample files");
  await page.getByRole("option").first().click();
  await page.getByRole("button", { name: "Keep", exact: true }).first().focus();
  await page.keyboard.press("Space");
  check(await page.getByRole("button", { name: "Keep", exact: true }).nth(1).evaluate(node => node === document.activeElement), "Space did not move focus to the next decision");
  check(requests.every(url => new URL(url).origin === base), "demo sent a request off origin");
  report.checks.demo = { groups: 3, files, focus, onlySameOrigin: true };

  await context.close();
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark", serviceWorkers: "block" });
  const mobilePage = await mobile.newPage();
  for (const route of ["/", "/demo", "/app", "/privacy", "/terms", "/repair-18-missing"]) {
    const response = await mobilePage.goto(`${base}${route}`, { waitUntil: "networkidle" });
    check(response?.status() === (route.includes("missing") ? 404 : 200), `${route} response status is wrong`);
    const normalWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    const targets = await mobilePage.locator('a:visible,button:visible,input:visible,[role="option"]:visible,[tabindex="0"]:visible').evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { name: (node.getAttribute("aria-label") || node.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80), width: box.width, height: box.height };
    }).filter(item => item.width < 44 || item.height < 44));
    await mobilePage.locator("html").evaluate(node => { node.style.fontSize = "34px"; });
    const enlargedWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    check(normalWidth <= 390 && enlargedWidth <= 390 && targets.length === 0, `${route} failed phone layout`);
    report.checks[`mobile:${route}`] = { normalWidth, enlargedWidth, undersizedTargets: targets };
  }
  await mobilePage.goto(`${base}/demo`, { waitUntil: "networkidle" });
  await mobilePage.emulateMedia({ reducedMotion: "reduce" });
  await mobilePage.reload();
  const transition = await mobilePage.locator(".photo-card").first().evaluate(node => getComputedStyle(node).transitionDuration);
  check(parseFloat(transition) <= 0.00001, "reduced motion did not remove the card transition");
  report.checks.reducedMotion = transition;
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
  check(update.controlled && !update.waiting && update.caches.includes("proof-pile-v0.1.29"), "service-worker update is not settled on v0.1.29");
  await pwa.setOffline(true);
  const offline = await pwaPage.reload({ waitUntil: "domcontentloaded" });
  check(offline?.status() === 200 && await pwaPage.getByRole("option").count() === 3, "offline demo reload failed");
  report.checks.pwa = { ...update, offlineStatus: offline.status() };
  await pwa.close();

  const release = await browser.newPage();
  release.on("console", message => { if (message.type() === "error") report.errors.push(`console ${release.url()}: ${message.text()}`); });
  await release.goto(base, { waitUntil: "networkidle" });
  await release.evaluate(() => localStorage.clear());
  await release.getByRole("button", { name: "Check desktop downloads" }).click();
  await release.getByText(`${tag} is ready from this source.`).waitFor({ timeout: 30000 });
  const downloads = await release.getByRole("link", { name: /Download for/ }).evaluateAll(nodes => nodes.map(node => ({ label: node.textContent?.trim(), href: node.href })));
  check(downloads.length === 4 && downloads.every(item => item.href.includes(`/releases/download/${tag}/`)), "download links do not use v0.1.29");
  report.checks.release = { downloads };
  await release.screenshot({ path: `${out}/live-downloads.png`, fullPage: false });
  await release.close();

  check(report.errors.length === 0, `browser errors: ${report.errors.join(" | ")}`);
  await writeFile(`${out}/live-qa.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ routes: report.routes.length, axeRuns: report.axe.length, errors: report.errors.length, checks: Object.keys(report.checks).length }, null, 2));
} finally {
  await browser.close();
}
