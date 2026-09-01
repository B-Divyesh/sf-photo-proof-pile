import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  serviceWorkers: 'block',
});
const page = await context.newPage();
const requests = [];
const consoleErrors = [];
const pageErrors = [];
page.on('request', (request) => requests.push({ method: request.method(), url: request.url(), type: request.resourceType() }));
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));
const response = await page.goto('https://photo-proof-pile.sociobot.in/', { waitUntil: 'networkidle' });
await page.screenshot({ path: '.factory/live-first-read.png', fullPage: false });
const viewportText = await page.locator('body').evaluate((body) => {
  const bottom = window.innerHeight;
  return [...body.querySelectorAll('h1,h2,p,a,button,li')]
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.top < bottom && rect.bottom > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    })
    .map((element) => ({ tag: element.tagName, text: element.textContent?.trim(), top: Math.round(element.getBoundingClientRect().top) }));
});
console.log(JSON.stringify({
  finalUrl: page.url(),
  status: response?.status(),
  title: await page.title(),
  lang: await page.locator('html').getAttribute('lang'),
  h1: await page.locator('h1').allTextContents(),
  viewportText,
  requests,
  consoleErrors,
  pageErrors,
  headers: await response?.allHeaders(),
}, null, 2));
await browser.close();
