import { describe, expect, it } from "vitest";
import { countPlan, decisionCsv, formatBytes, movesFromDecisionCsv, sampleGroups } from "../src/model";

describe("review model", () => {
  it("counts only files marked for quarantine", () => {
    const groups = sampleGroups();
    groups[0].files[1].decision = "quarantine";
    expect(countPlan(groups)).toEqual({ files: 1, bytes: 4_820_112 });
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
});
