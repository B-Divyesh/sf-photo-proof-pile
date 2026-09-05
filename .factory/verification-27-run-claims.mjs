import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve, join } from "node:path";

const checkout = resolve(process.argv[2]);
const output = resolve(process.argv[3]);
const claims = JSON.parse(await readFile(join(checkout, ".factory/claims.json"), "utf8"));
const results = [];
for (const claim of claims) {
  const started = Date.now();
  const run = spawnSync("bash", ["-lc", claim.test], {
    cwd: checkout,
    env: { ...process.env, CI: "1" },
    encoding: "utf8",
    timeout: 600_000,
    maxBuffer: 20 * 1024 * 1024
  });
  const combined = `${run.stdout ?? ""}\n${run.stderr ?? ""}`.trim();
  const result = {
    id: claim.id,
    command: claim.test,
    status: run.status,
    signal: run.signal,
    durationMs: Date.now() - started,
    outputTail: combined.slice(-8000)
  };
  results.push(result);
  console.log(`${claim.id}: ${run.status === 0 ? "PASS" : "FAIL"} (${result.durationMs} ms)`);
}

async function sources(dir) {
  const found = [];
  for (const entry of await readdir(dir)) {
    if (["node_modules", "dist", "target", "test-results"].includes(entry)) continue;
    const path = join(dir, entry);
    const info = await stat(path);
    if (info.isDirectory()) found.push(...await sources(path));
    else if (/\.(ts|tsx|js|mjs|rs)$/.test(entry)) found.push(path);
  }
  return found;
}
const sourceLines = (await Promise.all((await sources(checkout)).map(path => readFile(path, "utf8")))).join("\n").split("\n");
const tagCounts = Object.fromEntries(claims.map(claim => [claim.id, sourceLines.filter(line =>
  line.includes(`@claim:${claim.id}`) && (/^\s*\/\/\s*@claim:/.test(line) || /\b(?:test|it)\s*\(\s*["'`]/.test(line))
).length]));
const summary = {
  checkedAt: new Date().toISOString(),
  checkout,
  head: spawnSync("git", ["rev-parse", "HEAD"], { cwd: checkout, encoding: "utf8" }).stdout.trim(),
  clean: spawnSync("git", ["status", "--porcelain"], { cwd: checkout, encoding: "utf8" }).stdout.trim() === "",
  total: claims.length,
  passed: results.filter(result => result.status === 0).length,
  failed: results.filter(result => result.status !== 0).length,
  tagCounts,
  results
};
await writeFile(output, `${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed || Object.values(tagCounts).some(count => count !== 1)) process.exitCode = 1;
