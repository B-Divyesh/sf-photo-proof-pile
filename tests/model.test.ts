import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { countPlan, decisionCsv, formatBytes, movesFromDecisionCsv, normalizeMoves, sampleGroups } from "../src/model";

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

  it("@claim:package-signing-status publishes checksummed unsigned packages when operator certificates are absent", () => {
    const root = mkdtempSync(join(tmpdir(), "proof-pile-signing-status-"));
    const output = join(root, "status.txt");
    try {
      const result = spawnSync("bash", ["scripts/release-signing-status.sh"], {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          GITHUB_OUTPUT: output,
          APPLE_CERTIFICATE: "",
          APPLE_CERTIFICATE_PASSWORD: "",
          APPLE_SIGNING_IDENTITY: "",
          APPLE_ID: "",
          APPLE_PASSWORD: "",
          APPLE_TEAM_ID: "",
          WINDOWS_CERT_PFX: "",
          WINDOWS_CERTIFICATE_PASSWORD: ""
        }
      });
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      expect(readFileSync(output, "utf8")).toBe("macos=unsigned\nwindows=unsigned\n");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }

    const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
    expect(workflow).toContain("release-mode:");
    expect(workflow).toContain("bash scripts/release-signing-status.sh");
    expect(workflow).not.toContain("validate-signing:");
    expect(workflow).not.toContain("Refusing to build or publish untrusted desktop packages.");
    expect(workflow).toContain("needs.release-mode.outputs.windows == 'authenticode-signed'");
    expect(workflow).toContain("needs.release-mode.outputs.macos == 'signed-and-notarized'");
    expect(workflow).toContain("Get-AuthenticodeSignature");
    expect(workflow).toContain("xcrun stapler validate");
    expect(workflow).toContain("Independently verify downloaded Authenticode signatures");
    expect(workflow).toContain("Independently verify downloaded signatures and notarization");
    expect(workflow).toContain("needs: [prepare-release, build, verify-windows-release, verify-macos-release, release-mode]");
    expect(workflow).toContain("DESKTOP_PACKAGE_STATUS.json");
    expect(workflow).not.toContain("DESKTOP_SIGNATURES_VERIFIED.json");
    expect(workflow).toContain(".verification.checksums == \"sha256\"");
  });

  it("releases only the matching version tag and records that tag's immutable commit", () => {
    const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
    expect(workflow).toContain('expected_tag="v${version}"');
    expect(workflow).toContain('if [ "$release_tag" != "$expected_tag" ]');
    expect(workflow).toContain('git rev-parse "${release_tag}^{commit}"');
    expect(workflow).toContain('if [ "$release_commit" != "$(git rev-parse HEAD)" ]');
    expect(workflow).toContain('RELEASE_COMMIT: ${{ needs.prepare-release.outputs.commit }}');
    expect(workflow).toContain('RELEASE_ID: ${{ needs.prepare-release.outputs.release_id }}');
    expect(workflow).toContain('releases/${RELEASE_ID}');
    expect(workflow).not.toContain('releases/tags/${RELEASE_TAG}');
    expect(workflow).toContain('releases/download/${RELEASE_TAG}');
    expect(workflow).not.toContain('url: .browser_download_url');
    expect(workflow).toContain("jq -r '.platforms[][] | .url' latest.json");
    expect(workflow).toContain('jq --arg commit "$RELEASE_COMMIT"');
    expect(workflow).not.toContain('jq --arg commit "$GITHUB_SHA"');
  });
});
