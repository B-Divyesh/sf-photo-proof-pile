import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [root, source, release] = process.argv.slice(2);
if (!root || !source || !release) {
  throw new Error("Usage: node scripts/stamp-release-source.mjs <root> <source-version> <release-version>");
}

const at = path => resolve(root, path);
const replaceOnce = (path, before, after) => {
  const file = at(path);
  const value = readFileSync(file, "utf8");
  const found = before instanceof RegExp ? before.test(value) : value.includes(before);
  if (!found) throw new Error(`${path} does not contain the expected source value`);
  writeFileSync(file, value.replace(before, after));
};
const updateJson = (path, update) => {
  const file = at(path);
  const value = JSON.parse(readFileSync(file, "utf8"));
  update(value);
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};

updateJson("package.json", value => { value.version = release; });
updateJson("package-lock.json", value => {
  value.version = release;
  value.packages[""].version = release;
});
updateJson("src-tauri/tauri.conf.json", value => { value.version = release; });
replaceOnce("src-tauri/Cargo.toml", `version = "${source}"`, `version = "${release}"`);
const escapedSource = source.replaceAll(".", "\\.");
replaceOnce("src-tauri/Cargo.lock", new RegExp(`(name = "proof-pile"\\r?\\nversion = ")${escapedSource}(")`), `$1${release}$2`);
replaceOnce("src/main.ts", `const VERSION = "${source}"`, `const VERSION = "${release}"`);
replaceOnce("public/404.html", `<p>v${source}</p>`, `<p>v${release}</p>`);
replaceOnce("public/sw.js", /const CACHE = "[^"]+";/, `const CACHE = "proof-pile-v${release}";`);
