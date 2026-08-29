import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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
    const tauri = JSON.parse(readFileSync(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
    const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
    expect(notFound).toContain(`<p>v${version}</p>`);
    expect(notFound).toContain("<h1>This page was not found</h1>");
    expect(notFound).not.toContain("Generated hero imagery");
    expect(index).not.toContain("without permanent deletion");
    expect(tauri.version).toBe(version);
    expect(main).toContain(`const VERSION = "${version}"`);
  });
});
