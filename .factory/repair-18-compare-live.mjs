import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.argv[2];
if (!root) throw new Error("Pass the release-site artifact directory.");
const base = "https://photo-proof-pile.sociobot.in";
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else files.push(relative(root, path));
  }
}

await walk(root);
const digest = value => createHash("sha256").update(value).digest("hex");
const compared = [];
for (const path of files.filter(path => path !== "staticwebapp.config.json")) {
  const local = await readFile(join(root, path));
  const response = await fetch(`${base}/${path}`, { headers: { "cache-control": "no-cache" } });
  const live = Buffer.from(await response.arrayBuffer());
  compared.push({ path, status: response.status, bytes: local.length, localSha256: digest(local), liveSha256: digest(live), match: response.status === 200 && local.equals(live) });
}

await writeFile(".factory/repair-18-artifacts/deployment-parity.json", `${JSON.stringify(compared, null, 2)}\n`);
const failed = compared.filter(item => !item.match);
console.log(JSON.stringify({ compared: compared.length, matched: compared.length - failed.length, failed }, null, 2));
if (failed.length) process.exitCode = 1;
