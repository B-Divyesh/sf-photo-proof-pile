import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, chmodSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";

const payload = "proof-pile-test-appimage";
const asset = "Proof.Pile_0.1.1_x64.AppImage";

function runInstaller(checksum: string, releaseAvailable = true) {
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
  *releases*) ${releaseAvailable ? `printf '%s' '[{"assets":[{"browser_download_url": "https://downloads.test/${asset}"},{"browser_download_url": "https://downloads.test/SHA256SUMS"}]}]' > "$out"` : "printf '[]' > \"$out\""} ;;
  *${asset}) printf '%s' '${payload}' > "$out" ;;
  *SHA256SUMS) printf '%s  %s\\n' '${checksum}' '${asset}' > "$out" ;;
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
  const good = runInstaller(createHash("sha256").update(payload).digest("hex"));
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

  const unpublished = runInstaller(createHash("sha256").update(payload).digest("hex"), false);
  try {
    expect(unpublished.result.status).toBe(1);
    expect(unpublished.result.stderr).toContain("A Linux release with a checksum is not published yet");
    expect(existsSync(unpublished.target)).toBe(false);
  } finally { rmSync(unpublished.root, { recursive: true, force: true }); }
});

test("@claim:windows-installer-checksum verifies before opening the MSI", () => {
  const script = readFileSync("public/install.ps1", "utf8");
  const download = script.indexOf("Invoke-WebRequest $asset.browser_download_url -OutFile $download");
  const hash = script.indexOf("Get-FileHash $download -Algorithm SHA256");
  const mismatch = script.indexOf("$expected.ToLowerInvariant() -ne $actual");
  const remove = script.indexOf("Remove-Item $download");
  const install = script.indexOf("Start-Process msiexec.exe");
  expect(script).toContain("SHA256SUMS");
  expect(script).toContain("'\\.msi$'");
  expect(script).toContain('throw "A Windows release with a checksum is not published yet. Nothing was installed."');
  expect(script).not.toContain("DESKTOP_SIGNATURES_VERIFIED.json");
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
