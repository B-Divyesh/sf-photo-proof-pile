import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
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

const verifiedReleaseTag = "v0.1.30";
const verifiedReleaseCommit = "b12d5727de44d71c91b4a496eece320e7247a853";
const repository = "B-Divyesh/sf-photo-proof-pile";

function deploymentSiteFixture(root: string, tag: string, commit: string) {
  const site = join(root, "site");
  mkdirSync(join(site, "assets"), { recursive: true });
  writeFileSync(join(site, "index.html"), '<!doctype html><html lang="en"><main><h1>Review photo copies</h1></main></html>');
  writeFileSync(join(site, "404.html"), `<p>${tag}</p>`);
  writeFileSync(join(site, "install.sh"), `expected_tag="${tag}"\nexpected_commit="${commit}"\n`);
  writeFileSync(join(site, "install.ps1"), `$expectedTag = "${tag}"\n$expectedCommit = "${commit}"\n`);
  writeFileSync(join(site, "sw.js"), `const CACHE = "proof-pile-${tag}";`);
  writeFileSync(join(site, "staticwebapp.config.json"), "{}");
  writeFileSync(join(site, "assets", "app.js"), `const VERSION="${tag.slice(1)}",BUILD_COMMIT="${commit}";`);
  return site;
}

function releaseFixture(root: string) {
  const names = [
    "Proof-Pile_0.1.30_aarch64.dmg", "Proof-Pile_0.1.30_x64.dmg",
    "Proof-Pile_0.1.30_x64_en-US.msi", "Proof-Pile_0.1.30_x64-setup.exe",
    "Proof-Pile_0.1.30_amd64.AppImage", "Proof-Pile_0.1.30_amd64.deb",
    "Proof-Pile-0.1.30-1.x86_64.rpm"
  ];
  const base = `https://github.com/${repository}/releases/download/${verifiedReleaseTag}/`;
  const release = join(root, "release.json");
  const manifest = join(root, "latest.json");
  writeFileSync(release, JSON.stringify({
    tag_name: verifiedReleaseTag,
    target_commitish: verifiedReleaseCommit,
    assets: [...names, "SHA256SUMS", "latest.json"].map(name => ({ name, browser_download_url: `${base}${name}` }))
  }));
  writeFileSync(manifest, JSON.stringify({
    version: verifiedReleaseTag,
    commit: verifiedReleaseCommit,
    platforms: {
      macos: names.slice(0, 2).map(name => ({ name, url: `${base}${name}` })),
      windows: names.slice(2, 4).map(name => ({ name, url: `${base}${name}` })),
      linux: names.slice(4).map(name => ({ name, url: `${base}${name}` }))
    }
  }));
  const bin = join(root, "bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "curl"), `#!/bin/sh
out=""
url=""
previous=""
for arg in "$@"; do
  if [ "$previous" = "--output" ]; then out="$arg"; fi
  case "$arg" in http*) url="$arg" ;; esac
  previous="$arg"
done
case "$url" in
  *latest.json) cp "$DEPLOY_FIXTURE_MANIFEST" "$out" ;;
  *) cp "$DEPLOY_FIXTURE_RELEASE" "$out" ;;
esac
`);
  chmodSync(join(bin, "curl"), 0o755);
  return { release, manifest, bin };
}

test("deployment gate accepts only a release-site whose public identity agrees", () => {
  const root = mkdtempSync(join(tmpdir(), "proof-pile-deployment-site-"));
  try {
    const site = deploymentSiteFixture(root, verifiedReleaseTag, verifiedReleaseCommit);
    const fixture = releaseFixture(root);
    const result = spawnSync("bash", [fileURLToPath(new URL("../scripts/verify-deployment-site.sh", import.meta.url)), site], {
      env: {
        ...process.env,
        PATH: `${fixture.bin}:${process.env.PATH}`,
        RELEASE_TAG: verifiedReleaseTag,
        RELEASE_COMMIT: verifiedReleaseCommit,
        REPOSITORY: repository,
        RELEASE_API_URL: "https://fixture.test/release.json",
        RELEASE_MANIFEST_URL: "https://fixture.test/latest.json",
        DEPLOY_FIXTURE_RELEASE: fixture.release,
        DEPLOY_FIXTURE_MANIFEST: fixture.manifest
      },
      encoding: "utf8"
    });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(result.stdout).toContain(`Verified deployment site ${verifiedReleaseTag} at ${verifiedReleaseCommit}`);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("deployment gate rejects verification 26's exact v0.1.29 site and v0.1.30 desktop release mismatch", () => {
  const root = mkdtempSync(join(tmpdir(), "proof-pile-deployment-mismatch-"));
  try {
    const site = deploymentSiteFixture(root, "v0.1.29", verifiedReleaseCommit);
    const result = spawnSync("bash", [fileURLToPath(new URL("../scripts/verify-deployment-site.sh", import.meta.url)), site], {
      env: {
        ...process.env,
        RELEASE_TAG: verifiedReleaseTag,
        RELEASE_COMMIT: verifiedReleaseCommit,
        REPOSITORY: repository,
        RELEASE_API_URL: "https://fixture.test/must-not-be-requested"
      },
      encoding: "utf8"
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Linux installer release tag does not match v0.1.30");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("production preparation downloads only the successful matching release-site artifact", () => {
  const script = readFileSync(fileURLToPath(new URL("../scripts/fetch-release-site.sh", import.meta.url)), "utf8");
  const packageJson = JSON.parse(readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"));
  expect(packageJson.scripts["prepare:deployment"]).toBe("bash scripts/fetch-release-site.sh");
  expect(script).toContain('.head_sha == $commit');
  expect(script).toContain('.conclusion == "success"');
  expect(script).toContain('.name == "release-site" and .expired == false');
  expect(script).toContain('verify-deployment-site.sh" "$output_dir"');
});
