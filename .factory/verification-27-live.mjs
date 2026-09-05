import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const base = "https://photo-proof-pile.sociobot.in";
const candidate = "b12d5727de44d71c91b4a496eece320e7247a853";
const out = ".factory/verification-27-artifacts";
const report = { checkedAt: new Date().toISOString(), candidate, routes: [], axe: [], checks: {}, errors: [] };
const check = (condition, message) => { if (!condition) throw new Error(message); };
const serious = result => result.violations.filter(v => ["serious", "critical"].includes(v.impact ?? ""));
const watch = page => {
  page.on("pageerror", error => report.errors.push(`page ${page.url()}: ${error.message}`));
  page.on("console", message => { if (message.type() === "error") report.errors.push(`console ${page.url()}: ${message.text()}`); });
};

await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const device of [
    { name: "desktop", viewport: { width: 1440, height: 900 }, userAgent: undefined },
    { name: "phone", viewport: { width: 390, height: 844 }, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36" }
  ]) {
    const context = await browser.newContext({ viewport: device.viewport, userAgent: device.userAgent, serviceWorkers: "block" });
    const page = await context.newPage();
    watch(page);
    const response = await page.goto(base, { waitUntil: "networkidle" });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload({ waitUntil: "networkidle" });
    const firstRead = await page.evaluate(() => ({
      title: document.title,
      headline: document.querySelector("h1")?.textContent?.trim(),
      viewportHeight: innerHeight,
      action: [...document.querySelectorAll("a,button")].find(node => node.textContent?.includes("Try it with sample data"))?.getBoundingClientRect().toJSON(),
      text: document.querySelector("main")?.innerText
    }));
    check(response?.status() === 200, `${device.name} root status ${response?.status()}`);
    check(firstRead.headline === "Review photo copies before you remove them", `${device.name} job missing`);
    check(firstRead.text.includes("For people with photos across several drives who fear removing the only meaningful copy."), `${device.name} audience missing`);
    check(firstRead.text.includes("Opens three ready-to-review groups."), `${device.name} first-action outcome missing`);
    check(firstRead.action && firstRead.action.y + firstRead.action.height <= device.viewport.height, `${device.name} first action below fold`);
    await page.screenshot({ path: `${out}/live-first-read-${device.name}.png`, fullPage: false });
    report.checks[`firstRead:${device.name}`] = firstRead;
    await context.close();
  }

  const routeContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
  const routePage = await routeContext.newPage();
  watch(routePage);
  const expectedTitles = {
    "/": "Proof Pile — Review photo copies before cleanup",
    "/demo": "Demo — Proof Pile",
    "/app": "Proof Pile — Review photo copies",
    "/privacy": "Privacy — Proof Pile",
    "/terms": "Terms — Proof Pile"
  };
  for (const scheme of ["light", "dark"]) {
    await routePage.emulateMedia({ colorScheme: scheme, reducedMotion: "no-preference" });
    for (const [route, expectedTitle] of Object.entries(expectedTitles)) {
      const response = await routePage.goto(`${base}${route}`, { waitUntil: "networkidle" });
      const structure = await routePage.evaluate(() => ({
        title: document.title,
        lang: document.documentElement.lang,
        h1: document.querySelectorAll("h1").length,
        main: document.querySelectorAll("main").length,
        header: document.querySelectorAll("header").length,
        footer: document.querySelectorAll("footer").length,
        missingAlt: [...document.images].filter(image => !image.hasAttribute("alt")).length,
        headingLevels: [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(h => Number(h.tagName.slice(1))),
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        description: document.querySelector('meta[name="description"]')?.content
      }));
      check(response?.status() === 200, `${route} ${scheme} status ${response?.status()}`);
      check(structure.title === expectedTitle, `${route} title ${structure.title}`);
      check(structure.lang === "en" && structure.h1 === 1 && structure.main === 1 && structure.header === 1 && structure.footer === 1 && structure.missingAlt === 0, `${route} structure failed`);
      check(Boolean(structure.canonical && structure.description), `${route} metadata missing`);
      const result = serious(await new AxeBuilder({ page: routePage }).analyze());
      check(result.length === 0, `${route} ${scheme} axe ${result.map(v => v.id).join(",")}`);
      report.routes.push({ route, scheme, status: response.status(), ...structure });
      report.axe.push({ route, scheme, seriousCritical: [] });
    }
  }
  const errorCount = report.errors.length;
  const missing = await routePage.goto(`${base}/verification-27-missing`, { waitUntil: "networkidle" });
  check(missing?.status() === 404, `unknown route status ${missing?.status()}`);
  check(await routePage.title() === "Page not found — Proof Pile", "404 title failed");
  check(await routePage.locator("header").count() === 1 && await routePage.locator("main").count() === 1 && await routePage.locator("footer").count() === 1, "404 shell missing");
  const missingAxe = serious(await new AxeBuilder({ page: routePage }).analyze());
  check(missingAxe.length === 0, `404 axe ${missingAxe.map(v => v.id).join(",")}`);
  const expected404Errors = report.errors.splice(errorCount);
  check(expected404Errors.every(item => item.includes("404") && item.includes("Failed to load resource")), `unexpected 404 console error ${expected404Errors.join(" | ")}`);
  report.checks.notFound = { status: missing.status(), title: await routePage.title(), expected404Errors };

  await routePage.goto(base, { waitUntil: "networkidle" });
  await routePage.evaluate(() => scrollTo(0, 900));
  await routePage.waitForFunction(() => scrollY > 500);
  const beforeBack = await routePage.evaluate(() => scrollY);
  await routePage.evaluate(() => document.querySelector('header a[href="/privacy"]')?.click());
  check(await routePage.locator("h1").evaluate(node => node === document.activeElement), "route h1 did not receive focus");
  await routePage.goBack();
  await routePage.waitForFunction(() => scrollY > 500);
  const afterBack = await routePage.evaluate(() => scrollY);
  await routePage.getByRole("link", { name: "How it works" }).click();
  check(routePage.url().endsWith("/#how"), "How it works URL failed");
  check(await routePage.getByRole("heading", { name: "How photo cleanup works" }).evaluate(node => node === document.activeElement), "How it works focus failed");
  report.checks.routing = { beforeBack, afterBack, hash: routePage.url() };
  await routeContext.close();

  const demoContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, serviceWorkers: "block" });
  const demo = await demoContext.newPage();
  watch(demo);
  const requests = [];
  demo.on("request", request => requests.push({ url: request.url(), method: request.method(), body: request.postData() }));
  const realSentinel = JSON.stringify({ groups: [{ id: "real", files: [{ path: "/Real/untouched.jpg" }] }], moves: [] });
  await demo.addInitScript(value => localStorage.setItem("proof-pile:session", value), realSentinel);
  await demo.goto(base, { waitUntil: "networkidle" });
  const action = demo.getByRole("link", { name: "Try it with sample data" });
  await action.focus();
  const focusRing = await action.evaluate(node => ({ style: getComputedStyle(node).outlineStyle, width: getComputedStyle(node).outlineWidth, color: getComputedStyle(node).outlineColor }));
  await action.press("Enter");
  check(demo.url() === `${base}/demo`, "one-click sample failed");
  check(await demo.getByText("Demo — sample data, nothing is saved").isVisible(), "demo label missing");
  let files = 0;
  const groups = await demo.getByRole("option").count();
  for (let i = 0; i < groups; i += 1) { await demo.getByRole("option").nth(i).click(); files += await demo.locator(".file-row").count(); }
  check(groups === 3 && files === 8, `demo population ${groups}/${files}`);
  await demo.getByRole("option").first().click();
  await demo.getByRole("button", { name: "Quarantine", exact: true }).first().click();
  check(await demo.getByText("Keep one copy in this group before marking another copy for quarantine.").isVisible(), "unsafe decision accepted");
  await demo.getByRole("button", { name: "Mark exact extras" }).click();
  check((await demo.evaluate(() => localStorage.getItem("proof-pile:session"))) === realSentinel, "demo changed real review");
  check(Boolean(await demo.evaluate(() => sessionStorage.getItem("demo:photo-proof-pile:session"))), "demo namespace not written");
  const confirmation = new Promise(resolve => demo.once("dialog", async dialog => { const message = dialog.message(); await dialog.accept(); resolve(message); }));
  await demo.getByRole("button", { name: "Move 2 files to quarantine" }).click();
  const confirmationText = await confirmation;
  check(confirmationText.includes("Move 2 files to /Sample drive/Proof Pile Quarantine?"), "confirmation omitted details");
  const downloadEvent = demo.waitForEvent("download");
  await demo.getByRole("button", { name: "Export decision log" }).click();
  const stream = await (await downloadEvent).createReadStream();
  const chunks = []; for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const csv = Buffer.concat(chunks).toString("utf8");
  check(csv.trim().split("\n").length === 9, "CSV row count failed");
  await demo.reload({ waitUntil: "networkidle" });
  check(await demo.getByRole("button", { name: "Restore last move" }).isVisible(), "recovery did not persist");
  await demo.getByRole("button", { name: "Restore last move" }).click();
  check(await demo.getByRole("button", { name: "Cancel" }).evaluate(node => node === document.activeElement), "dialog safe focus failed");
  await demo.keyboard.press("Escape");
  await demo.getByRole("button", { name: "Reset demo" }).click();
  check((await demo.locator(".plan-number strong").textContent()) === "0", "reset did not clear plan");
  check((await demo.evaluate(() => localStorage.getItem("proof-pile:session"))) === realSentinel, "reset changed real review");
  check((await demo.evaluate(() => sessionStorage.getItem("demo:photo-proof-pile:session"))) === null, "reset retained demo state");
  const chooser = demo.waitForEvent("filechooser");
  await demo.getByRole("button", { name: "Import decision log" }).click();
  await (await chooser).setFiles({ name: "invalid.csv", mimeType: "text/csv", buffer: Buffer.from("wrong,header\nvalue,row") });
  check(await demo.getByText(/not imported.*not a Proof Pile decision log/i).isVisible(), "invalid CSV recovery failed");
  await demo.getByRole("button", { name: "Start for real" }).click();
  check(demo.url() === `${base}/app`, "Start for real failed");
  check((await demo.evaluate(() => localStorage.getItem("proof-pile:session"))) === realSentinel, "exit changed real review");
  check((await demo.evaluate(() => sessionStorage.getItem("demo:photo-proof-pile:session"))) === null, "exit retained demo state");
  check(requests.every(request => new URL(request.url).origin === base), "demo made off-origin request");
  report.checks.demo = { groups, files, csvRows: 9, focusRing, confirmationText, realSentinelPreserved: true, reset: true, invalidCsv: true, onlySameOrigin: true, requests };
  await demo.screenshot({ path: `${out}/live-demo-desktop.png`, fullPage: true });
  await demoContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36", colorScheme: "dark", reducedMotion: "reduce", serviceWorkers: "block" });
  const mobile = await mobileContext.newPage(); watch(mobile);
  for (const route of ["/", "/demo", "/app", "/privacy", "/terms", "/verification-27-mobile-missing"]) {
    const response = await mobile.goto(`${base}${route}`, { waitUntil: "networkidle" });
    const expected = route.includes("missing") ? 404 : 200;
    check(response?.status() === expected, `${route} phone status ${response?.status()}`);
    const dimensions = await mobile.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth, scrollHeight: document.documentElement.scrollHeight }));
    const small = await mobile.locator("a:visible,button:visible,input:visible,[role=option]:visible,[tabindex='0']:visible").evaluateAll(nodes => nodes.map(node => { const b = node.getBoundingClientRect(); return { name: (node.getAttribute("aria-label") || node.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60), width: b.width, height: b.height }; }).filter(x => x.width < 44 || x.height < 44));
    check(dimensions.scrollWidth <= 390, `${route} phone overflow`);
    check(small.length === 0, `${route} small targets ${JSON.stringify(small)}`);
    report.checks[`phone:${route}`] = { status: response.status(), ...dimensions, small };
  }
  await mobile.goto(`${base}/demo`, { waitUntil: "networkidle" });
  const transition = await mobile.locator(".photo-card").first().evaluate(node => getComputedStyle(node).transitionDuration);
  check(parseFloat(transition) <= 0.00001, `reduced motion ${transition}`);
  await mobile.screenshot({ path: `${out}/live-demo-phone.png`, fullPage: true });
  report.checks.reducedMotion = transition;
  await mobileContext.close();

  const pwaContext = await browser.newContext({ serviceWorkers: "allow" });
  const pwa = await pwaContext.newPage(); watch(pwa);
  await pwa.goto(`${base}/demo`, { waitUntil: "networkidle" });
  await pwa.evaluate(async () => { await navigator.serviceWorker.ready; });
  await pwa.reload(); await pwa.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const update = await pwa.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration(); await registration?.update(); return { controlled: Boolean(navigator.serviceWorker.controller), waiting: Boolean(registration?.waiting), caches: await caches.keys() }; });
  check(update.controlled && !update.waiting && update.caches.some(name => name.startsWith("proof-pile-v")), `PWA update ${JSON.stringify(update)}`);
  await pwaContext.setOffline(true);
  const offline = await pwa.reload({ waitUntil: "domcontentloaded" });
  check(offline?.status() === 200 && await pwa.getByRole("option").count() === 3, "offline reload failed");
  report.checks.pwa = { ...update, offlineStatus: offline.status() };
  await pwaContext.close();

  const releaseContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
  const release = await releaseContext.newPage(); watch(release);
  const releaseRequests = []; release.on("request", req => releaseRequests.push(req.url()));
  await release.goto(base, { waitUntil: "networkidle" });
  const footer = (await release.locator("footer").innerText()).replace(/\s+/g, " ").trim();
  const sourceLinks = await release.locator('footer a[href*="/commit/"]').evaluateAll(nodes => nodes.map(node => node.href));
  await release.getByRole("button", { name: "Check desktop downloads" }).click();
  await release.getByRole("dialog").getByText(/Downloads|v0\.1\./).first().waitFor({ timeout: 30000 });
  const downloads = await release.getByRole("dialog").getByRole("link", { name: /Download for/ }).evaluateAll(nodes => nodes.map(node => ({ text: node.textContent.trim(), href: node.href })));
  const dialogText = (await release.getByRole("dialog").innerText()).replace(/\s+/g, " ").trim();
  await release.screenshot({ path: `${out}/live-downloads.png`, fullPage: false });
  report.checks.release = { footer, sourceLinks, candidateLinked: sourceLinks.some(url => url.endsWith(`/commit/${candidate}`)), downloads, dialogText, releaseApi: releaseRequests.find(url => url.includes("api.github.com")) };
  await releaseContext.close();

  const unexpectedErrors = report.errors.filter(item => !(item.includes("Failed to load resource") && item.includes("404")));
  check(unexpectedErrors.length === 0, `unexpected browser errors: ${unexpectedErrors.join(" | ")}`);
  await writeFile(`${out}/live-qa.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ routes: report.routes.length, axe: report.axe.length, errors: report.errors.length, firstRead: Object.keys(report.checks).filter(k => k.startsWith("firstRead")), demo: report.checks.demo, pwa: report.checks.pwa, release: report.checks.release }, null, 2));
} finally {
  await browser.close();
}
