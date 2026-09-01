import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";

const payload = "proof-pile-test-appimage";
const asset = "Proof.Pile_0.1.1_x64.AppImage";
const verifiedMarker = '{"macos":"signed-and-notarized","windows":"authenticode-signed"}';

function runInstaller(checksum: string, releaseAvailable = true, marker = verifiedMarker) {
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
  *releases*) ${releaseAvailable ? `printf '%s' '[{"assets":[{"browser_download_url": "https://downloads.test/${asset}"},{"browser_download_url": "https://downloads.test/SHA256SUMS"},{"browser_download_url": "https://downloads.test/DESKTOP_SIGNATURES_VERIFIED.json"}]}' > "$out"` : "printf '[]' > \"$out\""} ;;
  *${asset}) printf '%s' '${payload}' > "$out" ;;
  *SHA256SUMS) printf '%s  %s\\n' '${checksum}' '${asset}' > "$out" ;;
  *DESKTOP_SIGNATURES_VERIFIED.json) printf '%s' '${marker}' > "$out" ;;
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

  const incomplete = runInstaller(checksum, true, '{"macos":"missing","windows":"missing"}');
  try {
    expect(incomplete.result.status).toBe(1);
    expect(incomplete.result.stderr).toContain("Desktop signature verification is incomplete");
    expect(existsSync(incomplete.target)).toBe(false);
  } finally { rmSync(incomplete.root, { recursive: true, force: true }); }

  const unpublished = runInstaller(checksum, false);
  try {
    expect(unpublished.result.status).toBe(1);
    expect(unpublished.result.stderr).toContain("A trusted Linux release is not published yet");
    expect(existsSync(unpublished.target)).toBe(false);
  } finally { rmSync(unpublished.root, { recursive: true, force: true }); }
});

test("@claim:windows-installer-checksum verifies trusted packages before opening the MSI", () => {
  const script = readFileSync("public/install.ps1", "utf8");
  const marker = script.indexOf("DESKTOP_SIGNATURES_VERIFIED.json");
  const markerCheck = script.indexOf("Desktop release verification is incomplete");
  const download = script.indexOf("Invoke-WebRequest $asset.browser_download_url -OutFile $download");
  const hash = script.indexOf("Get-FileHash $download -Algorithm SHA256");
  const mismatch = script.indexOf("$expected.ToLowerInvariant() -ne $actual");
  const remove = script.indexOf("Remove-Item $download");
  const install = script.indexOf("Start-Process msiexec.exe");
  expect(script).toContain("SHA256SUMS");
  expect(script).toContain("'\\.msi$'");
  expect(script).toContain('throw "A trusted Windows release is not published yet. Nothing was installed."');
  expect(marker).toBeGreaterThan(-1);
  expect(markerCheck).toBeGreaterThan(marker);
  expect(download).toBeGreaterThan(-1);
  expect(hash).toBeGreaterThan(download);
  expect(mismatch).toBeGreaterThan(hash);
  expect(remove).toBeGreaterThan(mismatch);
  expect(install).toBeGreaterThan(remove);
  expect(install).toBeGreaterThan(markerCheck);

  if (process.platform === "win32") {
    const result = spawnSync("pwsh", ["-NoProfile", "-File", "tests/install-windows.ps1"], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  }
});
