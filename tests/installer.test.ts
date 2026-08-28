import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, chmodSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";

const payload = "proof-pile-test-appimage";
const asset = "Proof.Pile_0.1.1_x64.AppImage";

function runInstaller(checksum: string) {
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
  *releases/latest) printf '%s' '{"assets":[{"browser_download_url": "https://downloads.test/${asset}"},{"browser_download_url": "https://downloads.test/SHA256SUMS"}]}' > "$out" ;;
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

// @claim:installer-checksum
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
});
