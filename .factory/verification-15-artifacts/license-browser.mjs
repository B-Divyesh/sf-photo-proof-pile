import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const token = "verification-15-browser-token";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const requests = [];
const errors = [];
page.on("request", request => {
  if (request.url().includes("api.sociobot.in")) requests.push({ url: request.url(), method: request.method(), body: request.postData(), headers: request.headers() });
});
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", error => errors.push(error.message));
const response = await page.goto(`https://photo-proof-pile.sociobot.in/?license=${token}`, { waitUntil: "networkidle" });
const result = { navigationStatus: response?.status(), finalUrl: page.url(), requests, errors, notice: await page.locator("body").innerText(), storedToken: await page.evaluate(() => localStorage.getItem("sb_license:photo-proof-pile")) };
if (requests.length !== 1 || requests[0].url !== `https://api.sociobot.in/api/v1/products/photo-proof-pile/verify?license=${token}` || requests[0].method !== "GET" || requests[0].body !== null || errors.length || page.url().includes("license=")) process.exitCode = 1;
await writeFile(".factory/verification-15-artifacts/license-browser.json", `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ navigationStatus: result.navigationStatus, finalUrl: result.finalUrl, requests, errors, invalidNotice: result.notice.includes("license is no longer active") }, null, 2));
await browser.close();
