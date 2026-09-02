import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";

const payload = "proof-pile-test-appimage";
const releaseTag = "v__PROOF_PILE_RELEASE_VERSION__";
const releaseCommit = "__PROOF_PILE_RELEASE_COMMIT__";
const asset = "Proof.Pile_0.1.30_amd64.AppImage";
const downloadBase = `https://github.com/B-Divyesh/sf-photo-proof-pile/releases/download/${releaseTag}/`;
function runInstaller(checksum: string, releaseAvailable = true, publishedCommit = releaseCommit) {
  const root = mkdtempSync(join(tmpdir(), "proof-pile-installer-"));
  const bin = join(root, "bin");
  const target = join(root, "installed", "proof-pile.AppImage");
  mkdirSync(bin);
  const curl = `#!/bin/sh
out=""
for arg in "$@"; do
  if [ "$previous" = "-o" ]; then out="$arg"; fi
  previous="$arg"
  case "$arg" in http*) url="$arg" ;; esac
done
case "$url" in
  https://api.github.com/*) ${releaseAvailable ? `printf '%s\n' '{' '"tag_name": "${releaseTag}",' '"target_commitish": "${publishedCommit}",' '"assets": [' '{"browser_download_url": "${downloadBase}${asset}"},' '{"browser_download_url": "${downloadBase}SHA256SUMS"},' '{"browser_download_url": "${downloadBase}latest.json"}' ']}' > "$out"` : "exit 22"} ;;
  *latest.json) printf '%s\n' '{' '"version": "${releaseTag}",' '"commit": "${publishedCommit}"' '}' > "$out" ;;
  *SHA256SUMS) printf '%s  %s\\n' '${checksum}' '${asset}' > "$out" ;;
  *${asset}) printf '%s' '${payload}' > "$out" ;;
  *) exit 1 ;;
esac
`;
  writeFileSync(join(bin, "curl"), curl);
  chmodSync(join(bin, "curl"), 0o755);
  const result = spawnSync("sh", ["public/install.sh"], {
    cwd: process.cwd(),
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, XDG_BIN_HOME: join(root, "installed"), HOME: root },
    encoding: "utf8"
  });
  return { root, target, result };
}

test("@claim:installer-checksum installs only a package matching SHA256SUMS", () => {
  const checksum = createHash("sha256").update(payload).digest("hex");
  const good = runInstaller(checksum);
  try {
    expect(good.result.status, `${good.result.stdout}\n${good.result.stderr}`).toBe(0);
    expect(readFileSync(good.target, "utf8")).toBe(payload);
  } finally { rmSync(good.root, { recursive: true, force: true }); }

  const bad = runInstaller("0".repeat(64));
  try {
    expect(bad.result.status).toBe(1);
    expect(bad.result.stderr).toContain("Checksum verification failed");
    expect(existsSync(bad.target)).toBe(false);
  } finally { rmSync(bad.root, { recursive: true, force: true }); }

  const unpublished = runInstaller(checksum, false);
  try {
    expect(unpublished.result.status).toBe(1);
    expect(unpublished.result.stderr).toContain("A Linux release is not published yet");
    expect(existsSync(unpublished.target)).toBe(false);
  } finally { rmSync(unpublished.root, { recursive: true, force: true }); }

  const wrongSource = runInstaller(checksum, true, "758ba98390c5a2ba49323b7682a6a86e5eca6103");
  try {
    expect(wrongSource.result.status).toBe(1);
    expect(wrongSource.result.stderr).toContain("does not match this site build");
    expect(existsSync(wrongSource.target)).toBe(false);
  } finally { rmSync(wrongSource.root, { recursive: true, force: true }); }
});

test("@claim:windows-installer-checksum verifies packages before opening the MSI", () => {
  const script = readFileSync("public/install.ps1", "utf8");
  const download = script.indexOf("Invoke-WebRequest $asset.browser_download_url -OutFile $download");
  const hash = script.indexOf("Get-FileHash $download -Algorithm SHA256");
  const mismatch = script.indexOf("$expected.ToLowerInvariant() -ne $actual");
  const remove = script.indexOf("Remove-Item $download");
  const install = script.indexOf("Start-Process msiexec.exe");
  expect(script).toContain("SHA256SUMS");
  expect(script).toContain("$release.target_commitish -ne $expectedCommit");
  expect(script).toContain("$manifest.commit -ne $expectedCommit");
  expect(script).toContain("releases/tags/$expectedTag");
  expect(script).toContain("'\\.msi$'");
  expect(script).toContain('throw "A Windows release is not published yet. Nothing was installed."');
  expect(download).toBeGreaterThan(-1);
  expect(hash).toBeGreaterThan(download);
  expect(mismatch).toBeGreaterThan(hash);
  expect(remove).toBeGreaterThan(mismatch);
  expect(install).toBeGreaterThan(remove);

  if (process.platform === "win32") {
    const result = spawnSync("pwsh", ["-NoProfile", "-File", "tests/install-windows.ps1"], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  }
});
