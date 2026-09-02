import { describe, expect, it } from "vitest";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { countPlan, decisionCsv, formatBytes, movesFromDecisionCsv, normalizeMoves, sampleGroups } from "../src/model";
import { resolvePublishedDesktopRelease } from "../src/release";

describe("review model", () => {
  it("counts only files marked for quarantine", () => {
    const groups = sampleGroups();
    groups[0].files[1].decision = "quarantine";
    expect(countPlan(groups)).toEqual({ files: 1, bytes: 4_820_112 });
  });

  it("excludes completed moves from the pending plan and repairs duplicate active recovery records", () => {
    const groups = sampleGroups();
    const file = groups[0].files[1];
    file.decision = "quarantine";
    const move = { id: "move-1", source: file.path, destination: `/Quarantine/${file.name}`, movedAt: "2026-08-29", sha256: "a".repeat(64), quarantineRoot: "/Quarantine" };
    expect(countPlan(groups, [move])).toEqual({ files: 0, bytes: 0 });
    expect(countPlan(groups, [{ ...move, restoredAt: "2026-08-30" }])).toEqual({ files: 1, bytes: file.size });
    expect(normalizeMoves([move, { ...move, id: "duplicate" }])).toEqual([move]);
  });

  it("quotes every CSV cell and preserves paths", () => {
    const groups = sampleGroups();
    groups[0].files[0].path = '/Photos/A "good" day/photo.jpg';
    const csv = decisionCsv(groups);
    expect(csv.split("\n")).toHaveLength(9);
    expect(csv).toContain('"/Photos/A ""good"" day/photo.jpg"');
  });

  it("recovers quoted quarantine paths from a decision log", () => {
    const groups = sampleGroups();
    groups[0].files[0].path = '/Photos/A "good" day/photo.jpg';
    const moves = [{ id: "move-1", source: '/Photos/A "good" day/photo.jpg', destination: '/Quarantine/A "good" day/photo.jpg', movedAt: "2026-08-28", sha256: "a".repeat(64), quarantineRoot: "/Quarantine" }];
    const recovered = movesFromDecisionCsv(decisionCsv(groups, moves));
    expect(recovered).toEqual([{ id: "import-1", source: '/Photos/A "good" day/photo.jpg', destination: '/Quarantine/A "good" day/photo.jpg', movedAt: "Imported from decision log", restoredAt: undefined, sha256: "a".repeat(64), quarantineRoot: "" }]);
  });

  it("rejects legacy or edited recovery rows without a verifiable hash", () => {
    const hostile = '"path","quarantine_path","restored_at"\n"/tmp/new-location/important.txt","/tmp/unrelated/important.txt",""';
    expect(() => movesFromDecisionCsv(hostile)).toThrow("cannot verify quarantined files");

    const badHash = '"path","quarantine_path","quarantine_sha256"\n"/tmp/new-location/important.txt","/tmp/unrelated/important.txt","not-a-hash"';
    expect(() => movesFromDecisionCsv(badHash)).toThrow("no valid file hash");
  });

  it("formats byte totals for review", () => {
    expect(formatBytes(550_000)).toBe("550 KB");
    expect(formatBytes(4_820_112)).toBe("4.8 MB");
  });

  it("keeps the static 404 release identity in sync with the product version", () => {
    const version = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
    const notFound = readFileSync(new URL("../public/404.html", import.meta.url), "utf8");
    const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
    const tauri = JSON.parse(readFileSync(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
    const cargo = readFileSync(new URL("../src-tauri/Cargo.toml", import.meta.url), "utf8");
    const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
    expect(notFound).toContain(`<p>v${version}</p>`);
    expect(notFound).toContain("<h1>This page was not found</h1>");
    expect(notFound).toContain('href="/#how"');
    expect(notFound).not.toContain("Generated hero imagery");
    expect(index).not.toContain("without permanent deletion");
    for (const route of ["/demo", "/app", "/privacy", "/terms"]) expect(sitemap).toContain(`photo-proof-pile.sociobot.in${route}`);
    expect(tauri.version).toBe(version);
    expect(cargo).toMatch(new RegExp(`\\[package\\][\\s\\S]*?version = "${version}"`));
    expect(main).toContain(`const VERSION = "${version}"`);
  });

  it("keeps CI browser flows serial and isolates offline, reload, and confirmation state", () => {
    const config = readFileSync(new URL("../playwright.config.ts", import.meta.url), "utf8");
    const browserTests = readFileSync(new URL("./app.spec.ts", import.meta.url), "utf8");
    expect(config).toContain('const isCi = process.env.CI === "1" || process.env.CI === "true"');
    expect(config).toContain("fullyParallel: false");
    expect(config).toContain("workers: isCi ? 1 : undefined");
    expect(browserTests).toContain("async function withIsolatedPage");
    expect(browserTests).toContain("async function waitForServiceWorkerControl");
    expect(browserTests).toContain("await waitForServiceWorkerControl(page);");
    expect(browserTests).toContain("async function respondToNativeDialog");
    expect(browserTests).toContain("const handledDialog = new Promise<void>");
    expect(browserTests).toContain("await handledDialog;");
    expect(browserTests).not.toContain("browser.close(");
  });

  it("publishes complete desktop assets with checksums and a release manifest", () => {
    const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
    const preparation = readFileSync(new URL("../scripts/prepare-release-assets.sh", import.meta.url), "utf8");
    const verification = readFileSync(new URL("../scripts/verify-published-release.sh", import.meta.url), "utf8");
    expect(workflow).toContain('tags: ["v*"]');
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("macos-latest");
    expect(workflow).toContain("windows-latest");
    expect(workflow).toContain("ubuntu-latest");
    expect(workflow).toContain("bundles: dmg");
    expect(workflow).toContain("bundles: msi,nsis");
    expect(workflow).toContain("bundles: appimage,deb,rpm");
    expect(workflow).toContain("SHA256SUMS");
    expect(preparation).toContain("latest.json");
    expect(workflow).toContain("softprops/action-gh-release@v2");
    expect(preparation).toContain("sha256sum -c SHA256SUMS");
    expect(preparation).toContain('"no_developer_id"');
    expect(preparation).toContain('"not_signed"');
    expect(workflow).toContain("files: release-assets/published/*");
    expect(workflow).toContain("bash scripts/prepare-release-assets.sh release-assets");
    expect(workflow).toContain('tag_commit=$(git rev-parse "${release_tag}^{}")');
    expect(workflow).toContain('if [ "$tag_commit" != "$release_commit" ]');
    expect(workflow).toContain("BUILD_COMMIT: ${{ needs.prepare-release.outputs.commit }}");
    expect(verification).toContain("Published SHA-256 mismatch for $asset.");
  });

  it("flattens nested builder artifacts before checksumming and publishing them", () => {
    const root = mkdtempSync(join(tmpdir(), "proof-pile-release-assets-"));
    const artifacts = join(root, "release-assets");
    const files = [
      ["aarch64-apple-darwin/release/bundle/dmg/Proof Pile_0.1.23_aarch64.dmg", "mac arm"],
      ["x86_64-apple-darwin/release/bundle/dmg/Proof Pile_0.1.23_x64.dmg", "mac intel"],
      ["x86_64-pc-windows-msvc/release/bundle/msi/Proof Pile_0.1.23_x64_en-US.msi", "windows"],
      ["x86_64-pc-windows-msvc/release/bundle/nsis/Proof Pile_0.1.23_x64-setup.exe", "windows exe"],
      ["x86_64-unknown-linux-gnu/release/bundle/appimage/Proof Pile_0.1.23_amd64.AppImage", "appimage"],
      ["x86_64-unknown-linux-gnu/release/bundle/deb/Proof Pile_0.1.23_amd64.deb", "deb"],
      ["x86_64-unknown-linux-gnu/release/bundle/rpm/Proof Pile-0.1.23-1.x86_64.rpm", "rpm"],
    ] as const;
    for (const [relative, content] of files) {
      const destination = join(artifacts, relative);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, content);
    }

    execFileSync("bash", [fileURLToPath(new URL("../scripts/prepare-release-assets.sh", import.meta.url)), artifacts], {
      env: { ...process.env, RELEASE_TAG: "v0.1.23", RELEASE_COMMIT: "a".repeat(40), REPOSITORY: "B-Divyesh/sf-photo-proof-pile" },
    });

    const published = join(artifacts, "published");
    const manifest = JSON.parse(readFileSync(join(published, "latest.json"), "utf8"));
    const sums = readFileSync(join(published, "SHA256SUMS"), "utf8");
    expect(manifest).toMatchObject({ version: "v0.1.23", commit: "a".repeat(40), signatures: { macos: "no_developer_id", windows: "not_signed" } });
    expect(manifest.platforms.macos).toHaveLength(2);
    expect(manifest.platforms.windows).toHaveLength(2);
    expect(manifest.platforms.linux).toHaveLength(3);
    for (const [relative] of files) expect(sums).toContain(`  ${relative.split("/").at(-1)?.replaceAll(" ", "-")}`);
  });

  it("releases only the matching version tag and records that tag's immutable commit", () => {
    const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
    const preparation = readFileSync(new URL("../scripts/prepare-release-assets.sh", import.meta.url), "utf8");
    const verification = readFileSync(new URL("../scripts/verify-published-release.sh", import.meta.url), "utf8");
    expect(workflow).toContain('expected_tag="v${version}"');
    expect(workflow).toContain('if [ "$release_tag" != "$expected_tag" ]');
    expect(workflow).toContain('ref: ${{ inputs.source_commit || inputs.tag || github.ref }}');
    expect(workflow).toContain('release_commit=$(git rev-parse HEAD)');
    expect(workflow).toContain('if [ -n "$REQUESTED_COMMIT" ] && [ "$release_commit" != "$REQUESTED_COMMIT" ]');
    expect(workflow).toContain('RELEASE_COMMIT: ${{ needs.prepare-release.outputs.commit }}');
    expect(workflow).toContain('target_commitish: ${{ needs.prepare-release.outputs.commit }}');
    expect(verification).toContain('releases/download/${RELEASE_TAG}');
    expect(preparation).toContain('--arg commit "$RELEASE_COMMIT"');
    expect(preparation).not.toContain('jq --arg commit "$GITHUB_SHA"');
    expect(workflow).toContain("Verify public release identity, manifest, and checksums");
    expect(workflow).toContain("bash scripts/verify-published-release.sh");
    expect(workflow).not.toContain("Verify one published Linux asset against SHA256SUMS");
    expect(preparation).toContain('sha256sum -c SHA256SUMS');
  });

  it("rejects verification 23's exact v0.1.27 candidate/release target mismatch before a package is accepted", () => {
    const root = mkdtempSync(join(tmpdir(), "proof-pile-published-release-"));
    const expectedCommit = "36734eeecd6f0ff8e4971f3d8ac8322953521633";
    const oldCommit = "c77f662186677f7514fd1a7aea51b74013f74b22";
    const tag = "v0.1.27";
    const repository = "B-Divyesh/sf-photo-proof-pile";
    const assets = [
      "Proof-Pile_0.1.27_aarch64.dmg", "Proof-Pile_0.1.27_x64.dmg", "Proof-Pile_0.1.27_x64_en-US.msi",
      "Proof-Pile_0.1.27_x64-setup.exe", "Proof-Pile_0.1.27_amd64.AppImage", "Proof-Pile_0.1.27_amd64.deb",
      "Proof-Pile-0.1.27-1.x86_64.rpm", "latest.json", "SHA256SUMS"
    ];
    const release = {
      tag_name: tag,
      target_commitish: oldCommit,
      assets: assets.map(name => ({ name, browser_download_url: `https://fixture.test/${name}` }))
    };
    const manifest = {
      version: tag,
      commit: oldCommit,
      platforms: {
        macos: assets.slice(0, 2).map(name => ({ name, url: `https://github.com/${repository}/releases/download/${tag}/${name}` })),
        windows: [{ name: assets[2], url: `https://github.com/${repository}/releases/download/${tag}/${assets[2]}` }],
        linux: assets.slice(3, 5).map(name => ({ name, url: `https://github.com/${repository}/releases/download/${tag}/${name}` }))
      }
    };
    const releasePath = join(root, "release.json");
    const manifestPath = join(root, "latest.json");
    const checksumPath = join(root, "SHA256SUMS");
    writeFileSync(releasePath, JSON.stringify(release));
    writeFileSync(manifestPath, JSON.stringify(manifest));
    writeFileSync(checksumPath, assets.slice(0, 7).map((name, index) => `${String(index).padStart(64, "0")}  ${name}`).join("\n"));
    const curlPath = join(root, "curl");
    writeFileSync(curlPath, `#!/bin/sh
out=""
previous=""
for arg in "$@"; do
  if [ "$previous" = "--output" ]; then out="$arg"; fi
  previous="$arg"
done
for url do :; done
case "$url" in
  *latest.json) cp "$RELEASE_FIXTURE_LATEST" "$out" ;;
  *SHA256SUMS) cp "$RELEASE_FIXTURE_SUMS" "$out" ;;
  *) cp "$RELEASE_FIXTURE" "$out" ;;
esac
`);
    chmodSync(curlPath, 0o755);
    const run = () => execFileSync("bash", [fileURLToPath(new URL("../scripts/verify-published-release.sh", import.meta.url))], {
      env: {
        ...process.env,
        PATH: `${root}:${process.env.PATH}`,
        RELEASE_TAG: tag,
        RELEASE_COMMIT: expectedCommit,
        REPOSITORY: repository,
        RELEASE_FIXTURE: releasePath,
        RELEASE_FIXTURE_LATEST: manifestPath,
        RELEASE_FIXTURE_SUMS: checksumPath
      },
      stdio: "pipe"
    });
    expect(run).toThrow(/Published release tag or target commit does not match the build identity/);
  });

  it("verifies every published desktop package byte against SHA256SUMS", () => {
    const root = mkdtempSync(join(tmpdir(), "proof-pile-release-checksums-"));
    const assetsRoot = join(root, "assets");
    mkdirSync(assetsRoot);
    const tag = "v0.1.28";
    const commit = "b".repeat(40);
    const repository = "B-Divyesh/sf-photo-proof-pile";
    const packageNames = [
      "Proof-Pile_0.1.28_aarch64.dmg", "Proof-Pile_0.1.28_x64.dmg",
      "Proof-Pile_0.1.28_x64_en-US.msi", "Proof-Pile_0.1.28_x64-setup.exe",
      "Proof-Pile_0.1.28_amd64.AppImage", "Proof-Pile_0.1.28_amd64.deb", "Proof-Pile-0.1.28-1.x86_64.rpm"
    ];
    const contents = new Map(packageNames.map((name, index) => [name, `package-${index}`]));
    for (const [name, content] of contents) writeFileSync(join(assetsRoot, name), content);
    const releasePath = join(root, "release.json");
    const manifestPath = join(root, "latest.json");
    const checksumPath = join(root, "SHA256SUMS");
    const url = (name: string) => `https://github.com/${repository}/releases/download/${tag}/${name}`;
    writeFileSync(releasePath, JSON.stringify({
      tag_name: tag,
      target_commitish: commit,
      assets: [...packageNames, "latest.json", "SHA256SUMS"].map(name => ({ name, browser_download_url: url(name) }))
    }));
    writeFileSync(manifestPath, JSON.stringify({
      version: tag,
      commit,
      signatures: { macos: "no_developer_id", windows: "not_signed" },
      platforms: {
        macos: packageNames.slice(0, 2).map(name => ({ name, url: url(name) })),
        windows: packageNames.slice(2, 4).map(name => ({ name, url: url(name) })),
        linux: packageNames.slice(4).map(name => ({ name, url: url(name) }))
      }
    }));
    writeFileSync(checksumPath, packageNames.map(name => `${createHash("sha256").update(contents.get(name)!).digest("hex")}  ${name}`).join("\n"));
    const curlPath = join(root, "curl");
    writeFileSync(curlPath, `#!/bin/sh
out=""
url=""
previous=""
for arg in "$@"; do
  if [ "$previous" = "--output" ]; then out="$arg"; fi
  case "$arg" in http*) url="$arg" ;; esac
  previous="$arg"
done
case "$url" in
  *releases/tags*) cp "$RELEASE_FIXTURE" "$out" ;;
  *latest.json) cp "$RELEASE_FIXTURE_LATEST" "$out" ;;
  *SHA256SUMS) cp "$RELEASE_FIXTURE_SUMS" "$out" ;;
  *) cp "$RELEASE_FIXTURE_ASSETS/\${url##*/}" "$out" ;;
esac
`);
    chmodSync(curlPath, 0o755);
    const run = () => execFileSync("bash", [fileURLToPath(new URL("../scripts/verify-published-release.sh", import.meta.url))], {
      env: {
        ...process.env,
        PATH: `${root}:${process.env.PATH}`,
        RELEASE_TAG: tag,
        RELEASE_COMMIT: commit,
        REPOSITORY: repository,
        RELEASE_FIXTURE: releasePath,
        RELEASE_FIXTURE_LATEST: manifestPath,
        RELEASE_FIXTURE_SUMS: checksumPath,
        RELEASE_FIXTURE_ASSETS: assetsRoot
      },
      stdio: "pipe"
    });
    expect(() => run()).not.toThrow();
    writeFileSync(join(assetsRoot, packageNames[6]), "tampered-rpm");
    expect(run).toThrow(new RegExp(`Published SHA-256 mismatch for ${packageNames[6]}`));
  });

  it("@claim:desktop-release-identity rejects the verifier's exact v0.1.23 source mismatch", () => {
    const assets = [
      "Proof-Pile_0.1.23_aarch64.dmg", "Proof-Pile_0.1.23_x64.dmg", "Proof-Pile_0.1.23_x64_en-US.msi",
      "Proof-Pile_0.1.23_x64-setup.exe", "Proof-Pile_0.1.23_amd64.AppImage", "Proof-Pile_0.1.23_amd64.deb",
      "Proof-Pile-0.1.23-1.x86_64.rpm", "SHA256SUMS", "latest.json"
    ].map(name => ({ name, browser_download_url: `https://example.test/${name}` }));
    const published = resolvePublishedDesktopRelease({
      tag_name: "v0.1.23",
      target_commitish: "10c5525cc2c227d275296ba1cb583b1a83f3c8d1",
      assets
    }, { version: "0.1.23", commit: "f0fd4b8e37c1da44380ab111b368279795c4b815" });
    expect(published).toBeNull();
  });

  it("@claim:unsigned-package-state checks the built Windows and macOS packages before publication", () => {
    const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
    const macCheck = readFileSync(new URL("../scripts/verify-unsigned-macos-dmg.sh", import.meta.url), "utf8");
    const windowsCheck = readFileSync(new URL("../scripts/verify-unsigned-windows.ps1", import.meta.url), "utf8");
    expect(workflow).toContain("Verify unsigned macOS package state (@claim:unsigned-package-state)");
    expect(workflow).toContain("Verify unsigned Windows package state (@claim:unsigned-package-state)");
    expect(workflow).toContain("verify-unsigned-macos-dmg.sh src-tauri/target/**/release/bundle/dmg/*.dmg");
    expect(workflow).toContain("verify-unsigned-windows.ps1 -Path src-tauri/target");
    expect(macCheck).toContain("codesign -dv --verbose=4");
    expect(macCheck).toContain("Expected no macOS distribution signature");
    expect(windowsCheck).toContain("Get-AuthenticodeSignature");
    expect(windowsCheck).toContain('"NotSigned"');
  });
});
