import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const urls = [
  "https://photo-proof-pile.sociobot.in/",
  "https://photo-proof-pile.sociobot.in/sw.js",
  "https://photo-proof-pile.sociobot.in/assets/index-DHC-IFsa.js",
  "https://photo-proof-pile.sociobot.in/verification-15-missing"
];
const results = [];
for (const url of urls) {
  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  results.push({ url, status: response?.status(), headers: await response?.allHeaders() });
}
await writeFile(".factory/verification-15-artifacts/browser-response-headers.json", `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results.map(({ url, status, headers }) => ({ url, status, cacheControl: headers?.["cache-control"], csp: headers?.["content-security-policy"], hsts: headers?.["strict-transport-security"] })), null, 2));
await browser.close();
