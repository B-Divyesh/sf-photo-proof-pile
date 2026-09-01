import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";

const base = "https://photo-proof-pile.sociobot.in";
const browser = await chromium.launch({ headless: true });
const evidence = {};
const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
const serious = (results) => results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""));

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  const requests = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const rootResponse = await page.goto(`${base}/`, { waitUntil: "networkidle" });
  check(rootResponse?.status() === 200, "root did not return 200");
  check(await page.locator("h1").textContent() === "Review photo copies before you remove them", "cold-page job is unclear");
  check((await page.getByText(/For people with photos across several drives/).count()) === 1, "cold-page audience is missing");
  check((await page.getByRole("link", { name: "Try it with sample data" }).count()) === 1, "sample action is missing");
  check((await page.getByText("Opens three ready-to-review groups.").count()) === 1, "sample action result is missing");
  await page.getByRole("link", { name: "Try it with sample data" }).click();
  await page.waitForLoadState("networkidle");
  check(page.url() === `${base}/demo`, "demo did not open at its real URL");
  check((await page.getByText("Demo — sample data, nothing is saved").count()) === 1, "demo isolation banner is missing");
  check(await page.getByRole("option").count() === 3, "demo did not show three groups");
  let sampleFileCount = 0;
  for (let index = 0; index < 3; index += 1) {
    await page.getByRole("option").nth(index).click();
    sampleFileCount += await page.locator(".file-row").count();
  }
  check(sampleFileCount === 8, "demo did not show eight files across its groups");
  await page.getByRole("option").first().click();

  await page.getByRole("button", { name: "Quarantine", exact: true }).first().click();
  check((await page.getByText("Keep one copy in this group before marking another copy for quarantine.").count()) === 1, "unsafe-only-copy choice was not rejected");
  check(await page.locator(".plan-number strong").textContent() === "0", "unsafe choice entered the plan");

  await page.getByRole("button", { name: "Mark exact extras" }).click();
  check(await page.locator(".plan-number strong").textContent() === "2", "exact extras did not create a two-file plan");
  let dialogText = "";
  page.once("dialog", async (dialog) => { dialogText = dialog.message(); await dialog.dismiss(); });
  await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
  await page.waitForTimeout(100);
  check(dialogText.includes("Move 2 files to /Sample drive/Proof Pile Quarantine?"), "confirmation omitted exact count or destination");
  check(await page.locator(".plan-number strong").textContent() === "2", "cancel did not preserve the plan");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
  await page.getByText(/2 sample files moved/).waitFor();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export decision log" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const csv = Buffer.concat(chunks).toString("utf8");
  const rows = csv.trim().split("\n");
  check(download.suggestedFilename() === "proof-pile-decisions.csv", "CSV filename is wrong");
  check(rows.length === 9 && rows[0].includes('"group_id","match","decision","path"'), "CSV does not contain eight records and its header");
  check(csv.includes("/Sample drive/Proof Pile Quarantine/IMG_4812 (1).jpg"), "CSV omits a recovery destination");

  await page.reload({ waitUntil: "networkidle" });
  check((await page.getByRole("button", { name: "Restore last move" }).count()) === 1, "recovery record did not survive reload");
  await page.getByRole("button", { name: "Restore last move" }).click();
  check(await page.getByRole("button", { name: "Cancel" }).evaluate((node) => node === document.activeElement), "restore dialog did not focus the safe action");
  await page.keyboard.press("Escape");
  check((await page.getByRole("dialog").count()) === 0, "Escape did not dismiss restore dialog");
  await page.getByRole("button", { name: "Restore last move" }).click();
  await page.getByRole("button", { name: "Restore this file" }).click();
  await page.getByText(/restored in the demo/).waitFor();

  const axeDesktop = serious(await new AxeBuilder({ page }).analyze());
  const offOrigin = requests.filter((url) => new URL(url).origin !== base);
  check(offOrigin.length === 0, `demo flow made off-origin requests: ${offOrigin.join(", ")}`);
  check(consoleErrors.length === 0 && pageErrors.length === 0, "live desktop flow logged browser errors");
  check(axeDesktop.length === 0, `desktop axe serious/critical: ${axeDesktop.map((item) => item.id).join(", ")}`);
  await page.screenshot({ path: ".factory/verification-19-artifacts/live-demo-after-restore.png", fullPage: true });
  evidence.desktop = { requests: [...new Set(requests)], offOrigin, consoleErrors, pageErrors, csvRows: rows.length, axeSeriousCritical: axeDesktop, dialogText };
  await context.close();

  const keyboardContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const keyboardPage = await keyboardContext.newPage();
  await keyboardPage.goto(`${base}/`);
  const initialFocus = await keyboardPage.evaluate(() => ({ tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.trim() }));
  check(initialFocus.tag === "H1", "route did not announce itself by focusing its heading");
  await keyboardPage.getByRole("link", { name: "Skip to main content" }).focus();
  const focusStyle = await keyboardPage.getByRole("link", { name: "Skip to main content" }).evaluate((node) => {
    const style = getComputedStyle(node);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, outlineColor: style.outlineColor };
  });
  check(focusStyle.outlineStyle !== "none" && parseFloat(focusStyle.outlineWidth) >= 2, "focus indicator is not visible");
  await keyboardPage.keyboard.press("Enter");
  check(await keyboardPage.locator("main").evaluate((node) => node === document.activeElement), "skip link did not focus main");
  await keyboardPage.goto(`${base}/demo`);
  const options = keyboardPage.getByRole("option");
  await options.first().focus();
  await keyboardPage.keyboard.press("ArrowDown");
  check(await options.nth(1).getAttribute("aria-selected") === "true", "ArrowDown did not change groups");
  const secondQuarantine = keyboardPage.locator(".file-row").nth(1).getByRole("button", { name: "Quarantine" });
  await secondQuarantine.focus();
  await keyboardPage.keyboard.press("Space");
  check(await keyboardPage.locator(".file-row").nth(2).getByRole("button", { name: "Keep" }).evaluate((node) => node === document.activeElement), "keyboard decision did not advance focus");
  await keyboardPage.emulateMedia({ reducedMotion: "reduce" });
  await keyboardPage.reload();
  const reducedTransition = await keyboardPage.locator(".photo-card").first().evaluate((node) => getComputedStyle(node).transitionDuration);
  check(parseFloat(reducedTransition) <= 0.00001, `reduced motion duration remained ${reducedTransition}`);
  evidence.keyboard = { initialFocus, focusStyle, reducedTransition };
  await keyboardContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });
  const mobilePage = await mobileContext.newPage();
  const mobileErrors = [];
  mobilePage.on("console", (message) => { if (message.type() === "error") mobileErrors.push(message.text()); });
  mobilePage.on("pageerror", (error) => mobileErrors.push(error.message));
  await mobilePage.goto(`${base}/`, { waitUntil: "networkidle" });
  check(await mobilePage.getByRole("link", { name: "Try it with sample data" }).isVisible(), "sample action is not visible on the first mobile screen");
  await mobilePage.getByRole("link", { name: "Try it with sample data" }).click();
  check(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= 390), "demo overflows at 390px");
  const action = mobilePage.getByRole("button", { name: "Mark exact extras" });
  await action.scrollIntoViewIfNeeded();
  const actionBox = await action.boundingBox();
  check((actionBox?.height ?? 0) >= 44, "mobile primary review action is below 44px");
  const axeMobile = serious(await new AxeBuilder({ page: mobilePage }).analyze());
  check(axeMobile.length === 0, `mobile dark axe serious/critical: ${axeMobile.map((item) => item.id).join(", ")}`);
  await mobilePage.locator("html").evaluate((node) => { node.style.fontSize = "34px"; });
  check(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= 390), "demo overflows at 200% text");
  check(mobileErrors.length === 0, "mobile flow logged browser errors");
  await mobilePage.screenshot({ path: ".factory/verification-19-artifacts/live-mobile-200-percent.png", fullPage: true });
  evidence.mobile = { width: 390, actionBox, axeSeriousCritical: axeMobile, errors: mobileErrors };
  await mobileContext.close();

  const pwaContext = await browser.newContext({ serviceWorkers: "allow" });
  const pwaPage = await pwaContext.newPage();
  await pwaPage.goto(`${base}/demo`, { waitUntil: "networkidle" });
  await pwaPage.evaluate(async () => { await navigator.serviceWorker.ready; });
  await pwaPage.reload();
  await pwaPage.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const updateState = await pwaPage.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.update();
    return { controlled: Boolean(navigator.serviceWorker.controller), waiting: Boolean(registration?.waiting), script: registration?.active?.scriptURL ?? null };
  });
  check(updateState.controlled && !updateState.waiting, "service worker is not current and controlling");
  await pwaContext.setOffline(true);
  const offlineResponse = await pwaPage.reload();
  check(offlineResponse?.status() === 200, "offline reload did not return the cached page");
  check(await pwaPage.getByRole("option").count() === 3, "offline demo lost its sample groups");
  evidence.pwa = { ...updateState, offlineStatus: offlineResponse?.status() };
  await pwaContext.close();

  const routeContext = await browser.newContext();
  const routePage = await routeContext.newPage();
  const routes = {};
  for (const path of ["/", "/demo", "/app", "/privacy", "/terms", "/verification-19-missing"]) {
    const response = await routePage.goto(`${base}${path}`, { waitUntil: "networkidle" });
    routes[path] = {
      status: response?.status(),
      title: await routePage.title(),
      h1: await routePage.locator("h1").count(),
      main: await routePage.locator("main").count(),
      missingAlt: await routePage.locator("img:not([alt])").count(),
    };
    check(routes[path].h1 === 1 && routes[path].main === 1 && routes[path].missingAlt === 0, `route semantics failed for ${path}`);
  }
  check(routes["/verification-19-missing"].status === 404, "unknown route did not return a real 404");
  evidence.routes = routes;
  await routeContext.close();

  const releaseContext = await browser.newContext();
  const releasePage = await releaseContext.newPage();
  const releaseErrors = [];
  releasePage.on("console", (message) => { if (message.type() === "error") releaseErrors.push(message.text()); });
  await releasePage.goto(`${base}/`);
  await releasePage.getByRole("button", { name: "Check desktop downloads" }).click();
  await releasePage.getByText("v0.1.22 is ready.").waitFor();
  const downloads = await releasePage.getByRole("link", { name: /Download for/ }).evaluateAll((nodes) => nodes.map((node) => ({ text: node.textContent?.trim(), href: node.href })));
  check(downloads.length === 4, "live release picker did not expose four platform choices");
  check(releaseErrors.length === 0, "release picker logged a console error");
  evidence.releasePicker = { downloads, errors: releaseErrors };
  await releaseContext.close();

  await writeFile(".factory/verification-19-artifacts/live-browser.json", `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
