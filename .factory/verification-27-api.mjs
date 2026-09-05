import { writeFile } from "node:fs/promises";

const endpoint = "https://api.sociobot.in/api/v1/products/photo-proof-pile/verify";
const token = `verification-27-invalid-${Date.now()}`;
const attempts = [];
for (let index = 1; index <= 31; index += 1) {
  const response = await fetch(`${endpoint}?license=${encodeURIComponent(token)}`, {
    headers: { Origin: "https://photo-proof-pile.sociobot.in" }
  });
  let body;
  try { body = await response.json(); } catch { body = null; }
  attempts.push({
    request: index,
    status: response.status,
    retryAfter: response.headers.get("retry-after"),
    allowOrigin: response.headers.get("access-control-allow-origin"),
    cacheControl: response.headers.get("cache-control"),
    body
  });
}
const result = {
  checkedAt: new Date().toISOString(),
  firstThirtyAre200: attempts.slice(0, 30).every(item => item.status === 200),
  request31Is429: attempts[30]?.status === 429,
  request31HasRetryAfter: Boolean(attempts[30]?.retryAfter),
  attempts
};
await writeFile(".factory/verification-27-artifacts/license-allowance.json", `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (!result.firstThirtyAre200 || !result.request31Is429 || !result.request31HasRetryAfter) process.exitCode = 1;
