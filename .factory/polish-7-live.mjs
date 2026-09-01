import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";

const base = "https://photo-proof-pile.sociobot.in";
const evidencePath = ".factory/polish-7-artifacts/live-qa.json";
const check = (condition, message) => { if (!condition) throw new Error(message); };
const serious = (result) => result.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""));
const browser = await chromium.launch({ headless: true });
const evidence = { checkedAt: new Date().toISOString(), base, releaseSafety: {}, routes: {}, desktop: {}, mobile: {} };

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));

  const root = await page.goto(`${base}/`, { waitUntil: "networkidle" });
  check(root?.status() === 200, "root did not return 200");
  check(await page.locator("h1").textContent() === "Review photo copies before you remove them", "first-screen headline changed");
  check(await page.getByRole("link", { name: "Try it with sample data" }).isVisible(), "first-screen sample action is absent");
  check(await page.getByText("Opens three ready-to-review groups.").isVisible(), "sample-action result is absent");
  await page.screenshot({ path: ".factory/polish-7-artifacts/live-cold-root.png", fullPage: false });
  await page.getByRole("link", { name: "Try it with sample data" }).click();
  await page.waitForLoadState("networkidle");
  check(new URL(page.url()).pathname === "/demo", "one-click demo did not use /demo");
  check(await page.getByText("Demo — sample data, nothing is saved").isVisible(), "demo isolation banner is absent");
  check(await page.getByRole("option").count() === 3, "demo does not show three groups");
  let sampleFiles = 0;
  for (let index = 0; index < 3; index += 1) { await page.getByRole("option").nth(index).click(); sampleFiles += await page.locator(".file-row").count(); }
  check(sampleFiles === 8, "demo does not show eight sample files");
  await page.screenshot({ path: ".factory/polish-7-artifacts/live-demo-one-click.png", fullPage: true });
  evidence.desktop.demo = { sampleFiles, groups: 3, errors: [...errors] };
  check(errors.length === 0, `cold root/demo logged errors: ${errors.join(" | ")}`);
  await context.close();

  const directContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
  const directPage = await directContext.newPage();
  const directResponse = await directPage.goto(`${base}/?demo=1`, { waitUntil: "networkidle" });
  check(directResponse?.status() === 200, "?demo=1 did not return 200");
  check(await directPage.getByText("Demo — sample data, nothing is saved").isVisible(), "?demo=1 did not enter demo");
  check(await directPage.getByRole("option").count() === 3, "?demo=1 did not seed sample groups");
  await directContext.close();

  const routeContext = await browser.newContext({ serviceWorkers: "block" });
  const routePage = await routeContext.newPage();
  for (const [path, title] of Object.entries({
    "/": "Proof Pile — Review photo copies before cleanup",
    "/demo": "Demo — Proof Pile",
    "/app": "Proof Pile — Review photo copies",
    "/privacy": "Privacy — Proof Pile",
    "/terms": "Terms — Proof Pile"
  })) {
    const response = await routePage.goto(`${base}${path}`, { waitUntil: "networkidle" });
    const axe = serious(await new AxeBuilder({ page: routePage }).analyze());
    evidence.routes[path] = { status: response?.status(), title: await routePage.title(), h1: await routePage.locator("h1").count(), main: await routePage.locator("main").count(), axeSeriousCritical: axe.map((item) => item.id) };
    check(response?.status() === 200, `${path} did not return 200`);
    check(await routePage.title() === title, `${path} title is wrong`);
    check(await routePage.locator("h1").count() === 1 && await routePage.locator("main").count() === 1, `${path} semantic skeleton failed`);
    check(axe.length === 0, `${path} axe serious/critical: ${axe.map((item) => item.id).join(", ")}`);
  }
  const missing = await routePage.goto(`${base}/polish-7-missing`, { waitUntil: "networkidle" });
  evidence.routes["/polish-7-missing"] = { status: missing?.status(), title: await routePage.title(), h1: await routePage.locator("h1").count(), main: await routePage.locator("main").count() };
  check(missing?.status() === 404, "unknown route did not return HTTP 404");
  check(await routePage.title() === "Page not found — Proof Pile", "404 title is wrong");
  await routeContext.close();

  const releaseContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
  const releasePage = await releaseContext.newPage();
  const releaseErrors = [];
  releasePage.on("console", (message) => { if (message.type() === "error") releaseErrors.push(message.text()); });
  await releasePage.goto(`${base}/`, { waitUntil: "networkidle" });
  await releasePage.getByRole("button", { name: "Check desktop downloads" }).click();
  await releasePage.getByText("Downloads are not published yet. Check again later.").waitFor();
  const packageLinks = await releasePage.getByRole("link", { name: /Download for/ }).count();
  check(packageLinks === 0, "release dialog offered an unverified package");
  check(await releasePage.getByText("No package was offered because release verification could not be checked.").isVisible(), "release refusal explanation is absent");
  check(releaseErrors.length === 0, `release dialog logged errors: ${releaseErrors.join(" | ")}`);
  await releasePage.screenshot({ path: ".factory/polish-7-artifacts/live-download-refusal.png", fullPage: false });
  evidence.releaseSafety = { publicPackagesOffered: packageLinks, dialogErrors: releaseErrors };
  await releaseContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark", serviceWorkers: "block" });
  const mobilePage = await mobileContext.newPage();
  const mobileErrors = [];
  mobilePage.on("console", (message) => { if (message.type() === "error") mobileErrors.push(message.text()); });
  await mobilePage.goto(`${base}/?demo=1`, { waitUntil: "networkidle" });
  check(await mobilePage.getByText("Demo — sample data, nothing is saved").isVisible(), "mobile direct demo is absent");
  const action = mobilePage.getByRole("button", { name: "Mark exact extras" });
  await action.scrollIntoViewIfNeeded();
  const actionBox = await action.boundingBox();
  const axe = serious(await new AxeBuilder({ page: mobilePage }).analyze());
  check((actionBox?.height ?? 0) >= 44, "mobile action is below 44px");
  check(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= 390), "mobile demo has horizontal overflow");
  check(axe.length === 0, `mobile axe serious/critical: ${axe.map((item) => item.id).join(", ")}`);
  check(mobileErrors.length === 0, `mobile demo logged errors: ${mobileErrors.join(" | ")}`);
  await mobilePage.screenshot({ path: ".factory/polish-7-artifacts/live-demo-mobile.png", fullPage: true });
  evidence.mobile = { actionBox, horizontalOverflow: false, axeSeriousCritical: axe.map((item) => item.id), errors: mobileErrors };
  await mobileContext.close();

  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
