import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function installTauriMock(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const restored: string[] = [];
    const quarantineCalls: { path: string; decision: string; keptCopyPath: string }[][] = [];
    let batch = 0;
    (window as unknown as { __PROOF_PILE_TAURI_TEST__: unknown }).__PROOF_PILE_TAURI_TEST__ = { restored, quarantineCalls };
    (window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = {
      invoke: async (command: string, args: { plan?: { path: string; decision: string; keptCopyPath: string }[] }) => {
        if (command === "plugin:dialog|open") return "/Mock quarantine";
        if (command === "execute_quarantine") {
          batch += 1;
          quarantineCalls.push([...(args.plan ?? [])]);
          return (args.plan ?? []).map((entry, index) => ({
            id: `batch-${batch}-${index}`,
            source: entry.path,
            destination: `/Mock quarantine/${entry.path.split("/").pop()}`,
            movedAt: `2026-08-29T00:0${batch}:00.000Z`,
            sha256: "a".repeat(64),
            quarantineRoot: "/Mock quarantine"
          }));
        }
        if (command === "restore_quarantined") {
          restored.push((args as unknown as { record: { source: string } }).record.source);
          return null;
        }
        throw new Error(`Unexpected native command: ${command}`);
      }
    };
  });
}

test("completed quarantine plans leave no pending work and repeat safely in demo and native flows", async ({ page }) => {
  for (const native of [false, true]) {
    if (native) await installTauriMock(page);
    await page.goto("/");
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto("/demo");
    await page.getByRole("button", { name: "Mark exact extras" }).click();
    if (native) {
      await page.evaluate(() => localStorage.setItem("proof-pile:session", sessionStorage.getItem("demo:photo-proof-pile:session")!));
      await page.goto("/app");
    }

    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
    await expect(page.locator(".plan-number strong")).toHaveText("0");
    await expect(page.getByRole("button", { name: "Choose files to quarantine" })).toBeDisabled();
    await page.locator("#run-plan").dispatchEvent("click");
    await page.getByRole("button", { name: "Mark exact extras" }).click();
    await expect(page.getByText("These exact copies are already in quarantine.")).toBeVisible();
    await expect(page.locator(".plan-number strong")).toHaveText("0");

    const storage = native ? "localStorage" : "sessionStorage";
    const key = native ? "proof-pile:session" : "demo:photo-proof-pile:session";
    expect(await page.evaluate(({ storage, key }) => JSON.parse(window[storage as "localStorage" | "sessionStorage"].getItem(key)!).moves, { storage, key })).toHaveLength(2);
    if (native) {
      expect(await page.evaluate(() => (window as unknown as { __PROOF_PILE_TAURI_TEST__: { quarantineCalls: unknown[][] } }).__PROOF_PILE_TAURI_TEST__.quarantineCalls)).toHaveLength(1);
    }
  }
});

test("keyboard decisions move focus to the next file without restarting traversal", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("option").nth(1).click();
  const secondQuarantine = page.locator(".file-row").nth(1).getByRole("button", { name: "Quarantine" });
  await secondQuarantine.focus();
  await page.keyboard.press("Space");
  await expect(page.locator(".file-row").nth(2).getByRole("button", { name: "Keep" })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await expect(page.locator(".file-row").nth(2).getByRole("button", { name: "Quarantine" })).toBeFocused();
  await expect(page.locator('.file-row button[data-decision="quarantine"][aria-pressed="true"]')).toHaveCount(2);
});

test("@claim:demo-isolated keeps real storage untouched and discards only the sample session", async ({ page }) => {
  const realReview = JSON.stringify({ groups: [{ id: "real", kind: "Exact bytes", reason: "Saved real review", confidence: 100, files: [{ id: "real-file", name: "real.jpg", path: "/Real/real.jpg", width: 1, height: 1, size: 1, capturedAt: null, camera: null, hash: "real", backupCount: 0, decision: "keep", thumbnail: "/samples/lake-a.svg" }] }], moves: [] });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(value => localStorage.setItem("proof-pile:session", value), realReview);
  await page.goto("/?demo=1");
  await expect(page).toHaveURL(/\?demo=1$/);
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await expect(page.getByRole("option")).toHaveCount(3);
  expect(await page.evaluate(() => sessionStorage.getItem("demo:photo-proof-pile:session"))).toBeNull();
  await page.getByRole("button", { name: "Mark exact extras" }).click();
  await expect(page.locator(".plan-number strong")).toHaveText("2");
  expect(await page.evaluate(() => sessionStorage.getItem("demo:photo-proof-pile:session"))).toContain("lake-import");
  expect(await page.evaluate(() => localStorage.getItem("proof-pile:session"))).toBe(realReview);
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.locator(".plan-number strong")).toHaveText("0");
  expect(await page.evaluate(() => sessionStorage.getItem("demo:photo-proof-pile:session"))).toBeNull();
  await page.getByRole("button", { name: "Start for real" }).click();
  await expect(page).toHaveURL(/\/app$/);
  expect(await page.evaluate(() => sessionStorage.getItem("demo:photo-proof-pile:session"))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem("proof-pile:session"))).toBe(realReview);
  expect(errors).toEqual([]);
});

test("@claim:match-evidence shows every sample file with its complete evidence", async ({ page }) => {
  await page.goto("/demo");
  const options = page.getByRole("option");
  const expected = [
    [
      ["IMG_4812.jpg", "/Photos/2024/Lake/IMG_4812.jpg", "4032 × 3024", "4.8 MB", "2024", "Phone wide camera", "8ac71e52…92ef", "2"],
      ["IMG_4812 (1).jpg", "/Phone imports/July/IMG_4812 (1).jpg", "4032 × 3024", "4.8 MB", "2024", "Phone wide camera", "8ac71e52…92ef", "1"],
      ["IMG_4812.jpg", "/Old drive/DCIM/104APPLE/IMG_4812.jpg", "4032 × 3024", "4.8 MB", "2024", "Phone wide camera", "8ac71e52…92ef", "0"]
    ],
    [
      ["DSC_2081.jpg", "/Photos/Family/Birthday/DSC_2081.jpg", "4032 × 3024", "4.8 MB", "2023", "Phone wide camera", "4319ce77…ba21", "1"],
      ["DSC_2082.jpg", "/Photos/Family/Birthday/DSC_2082.jpg", "4032 × 3024", "4.7 MB", "2023", "Phone wide camera", "38d201a4…903c", "1"],
      ["DSC_2083.jpg", "/Camera card/DCIM/DSC_2083.jpg", "4032 × 3024", "4.6 MB", "2023", "Phone wide camera", "eb02b142…4d61", "0"]
    ],
    [
      ["Milo-park.jpg", "/Photos/Pets/Milo-park.jpg", "6000 × 4000", "8.9 MB", "2024", "Phone wide camera", "a3f1e922…871d", "2"],
      ["Milo-park.jpg", "/Downloads/Milo-park.jpg", "1600 × 1067", "612 KB", "No capture date", "Phone wide camera", "29ad7730…b6cc", "1"]
    ]
  ];
  await expect(options.nth(0)).toContainText("Exact bytes");
  await expect(options.nth(1)).toContainText("Same moment");
  await expect(options.nth(2)).toContainText("Looks alike");
  for (const group of [0, 1, 2]) {
    await options.nth(group).click();
    const rows = page.locator(".file-row");
    const expectedRows = [3, 3, 2][group];
    await expect(rows).toHaveCount(expectedRows);
    for (let index = 0; index < expectedRows; index += 1) {
      const row = rows.nth(index);
      await expect(row.locator(".file-path span")).toContainText("/");
      await expect(row.getByText("Dimensions", { exact: true })).toBeVisible();
      await expect(row.getByText("Size", { exact: true })).toBeVisible();
      await expect(row.getByText("Captured", { exact: true })).toBeVisible();
      await expect(row.getByText("Camera", { exact: true })).toBeVisible();
      await expect(row.getByText("File identifier", { exact: true })).toBeVisible();
      await expect(row.getByText("Other-drive copies", { exact: true })).toBeVisible();
      for (const value of expected[group][index]) await expect(row).toContainText(value);
    }
  }
});

test("@claim:csv-export downloads one decision row per sample file", async ({ page }) => {
  await page.goto("/demo");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export decision log" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const rows = Buffer.concat(chunks).toString("utf8").trim().split("\n");
  expect(download.suggestedFilename()).toBe("proof-pile-decisions.csv");
  expect(rows[0]).toContain('"group_id","match","decision","path"');
  expect(rows).toHaveLength(9);
});

test("@claim:reversible-plan persists recovery records, exports them, and imports them again", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Mark exact extras" }).click();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
  await expect(page.getByText(/2 sample files moved/)).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export decision log" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const csv = Buffer.concat(chunks).toString("utf8");
  expect(csv).toContain("/Sample drive/Proof Pile Quarantine/IMG_4812 (1).jpg");
  await page.reload();
  await expect(page.getByRole("button", { name: "Restore last move" })).toBeVisible();
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  const fileChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import decision log" }).click();
  await (await fileChooser).setFiles({ name: "proof-pile-decisions.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  await expect(page.getByText(/2 verified recovery records imported/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Restore last move" })).toBeVisible();
  await page.getByRole("button", { name: "Restore last move" }).click();
  await expect(page.getByRole("dialog")).toContainText("From quarantine");
  await page.getByRole("button", { name: "Restore this file" }).click();
  await expect(page.getByText(/restored in the demo/)).toBeVisible();
});

test("@claim:free-safety-tools keeps quarantine, restore, and decision-log recovery available without a license", async ({ page }) => {
  await installTauriMock(page);
  await page.goto("/demo");
  await page.getByRole("button", { name: "Mark exact extras" }).click();
  await page.evaluate(() => localStorage.setItem("proof-pile:session", sessionStorage.getItem("demo:photo-proof-pile:session")!));
  await page.goto("/app");

  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
  await expect(page.getByText("2 files moved to quarantine. The decision log is ready to export.")).toBeVisible();

  await page.getByRole("option").nth(1).click();
  await page.locator(".file-row").nth(1).getByRole("button", { name: "Quarantine" }).click();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Move 1 file to quarantine" }).click();
  await expect(page.getByText("1 file moved to quarantine. The decision log is ready to export.")).toBeVisible();

  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("proof-pile:session")!).moves)).toHaveLength(3);
  await page.reload();
  await page.getByRole("button", { name: "Restore last move" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("/Mock quarantine/DSC_2082.jpg");
  await expect(dialog).toContainText("/Photos/Family/Birthday/DSC_2082.jpg");
  await page.getByRole("button", { name: "Cancel" }).click();
  expect(await page.evaluate(() => (window as unknown as { __PROOF_PILE_TAURI_TEST__: { restored: string[] } }).__PROOF_PILE_TAURI_TEST__.restored)).toHaveLength(0);
  await page.getByRole("button", { name: "Restore last move" }).click();
  await page.getByRole("button", { name: "Restore this file" }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("proof-pile:session")!).moves.filter((move: { restoredAt?: string }) => move.restoredAt).length)).toBe(1);
  await page.getByRole("button", { name: "Restore last move" }).click();
  await page.getByRole("button", { name: "Restore this file" }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("proof-pile:session")!).moves.filter((move: { restoredAt?: string }) => move.restoredAt).length)).toBe(2);
  const restored = await page.evaluate(() => (window as unknown as { __PROOF_PILE_TAURI_TEST__: { restored: string[] } }).__PROOF_PILE_TAURI_TEST__.restored);
  expect(restored).toHaveLength(2);
  expect(restored.some(path => path.includes("DSC_2082"))).toBe(true);
  expect(restored.some(path => path.includes("IMG_4812"))).toBe(true);
});

test("never allows a plan that quarantines a group's only kept copy", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Quarantine", exact: true }).first().click();
  await expect(page.getByText("Keep one copy in this group before marking another copy for quarantine.")).toBeVisible();
  await expect(page.locator(".plan-number strong")).toHaveText("0");
});

test("@claim:review-before-move requires reviewed choices and confirms the exact destination", async ({ page }) => {
  await installTauriMock(page);
  await page.goto("/demo");
  await page.getByRole("button", { name: "Mark exact extras" }).click();
  await page.evaluate(() => localStorage.setItem("proof-pile:session", sessionStorage.getItem("demo:photo-proof-pile:session")!));
  await page.goto("/app");

  await page.getByRole("button", { name: "Mark for review" }).nth(1).click();
  await expect(page.getByRole("button", { name: "Move 1 file to quarantine" })).toBeVisible();
  await page.getByRole("button", { name: "Quarantine", exact: true }).first().click();
  await expect(page.getByText("Keep one copy in this group before marking another copy for quarantine.")).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __PROOF_PILE_TAURI_TEST__: { quarantineCalls: unknown[] } }).__PROOF_PILE_TAURI_TEST__.quarantineCalls)).toHaveLength(0);

  await page.getByRole("button", { name: "Mark exact extras" }).click();
  page.once("dialog", async dialog => {
    expect(dialog.message()).toContain("Move 2 files to /Mock quarantine?");
    await dialog.dismiss();
  });
  await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
  expect(await page.evaluate(() => (window as unknown as { __PROOF_PILE_TAURI_TEST__: { quarantineCalls: unknown[] } }).__PROOF_PILE_TAURI_TEST__.quarantineCalls)).toHaveLength(0);

  page.once("dialog", async dialog => {
    expect(dialog.message()).toContain("Move 2 files to /Mock quarantine?");
    await dialog.accept();
  });
  await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
  await expect(page.getByText("2 files moved to quarantine. The decision log is ready to export.")).toBeVisible();
  const calls = await page.evaluate(() => (window as unknown as { __PROOF_PILE_TAURI_TEST__: { quarantineCalls: { path: string; decision: string; keptCopyPath: string }[][] } }).__PROOF_PILE_TAURI_TEST__.quarantineCalls);
  expect(calls).toHaveLength(1);
  expect(calls[0]).toHaveLength(2);
  expect(calls[0].every(entry => entry.decision === "quarantine" && entry.keptCopyPath.endsWith("IMG_4812.jpg"))).toBe(true);
});

test("hostile decision CSV cannot become an authoritative desktop recovery record", async ({ page }) => {
  await page.addInitScript(() => {
    const calls: string[] = [];
    (window as unknown as { __RESTORE_TEST_CALLS__: string[] }).__RESTORE_TEST_CALLS__ = calls;
    (window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = {
      invoke: async (command: string, args: unknown) => {
        calls.push(command);
        if (command === "plugin:dialog|open") {
          const title = (args as { options?: { title?: string } }).options?.title ?? "";
          return title.includes("quarantine folder") ? "/safe/quarantine" : "/tmp/hostile.csv";
        }
        if (command === "read_decision_log") return `"path","quarantine_path","quarantine_sha256","restored_at"\n"/tmp/new-location/important.txt","/tmp/unrelated/important.txt","${"a".repeat(64)}",""`;
        if (command === "validate_recovery_records") throw new Error("A recovery path is outside the selected quarantine folder.");
        throw new Error(`Unexpected native command: ${command}`);
      }
    };
  });
  await page.goto("/app");
  await page.getByRole("button", { name: "Import decision log" }).click();
  await expect(page.getByText(/outside the selected quarantine folder/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Restore last move" })).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __RESTORE_TEST_CALLS__: string[] }).__RESTORE_TEST_CALLS__)).toContain("validate_recovery_records");
});

test("@claim:local-privacy sends no sample photo data off origin", async ({ page }) => {
  const offOrigin: string[] = [];
  page.on("request", request => {
    if (new URL(request.url()).origin !== "http://127.0.0.1:4173") offOrigin.push(request.url());
  });
  await page.goto("/demo");
  await page.getByRole("button", { name: "Mark exact extras" }).click();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Move 2 files to quarantine" }).click();
  expect(offOrigin).toEqual([]);
});

test("@claim:no-ad-tracking loads no advertising or tracking scripts", async ({ page }) => {
  const offOrigin: string[] = [];
  page.on("request", request => {
    if (new URL(request.url()).origin !== "http://127.0.0.1:4173") offOrigin.push(request.url());
  });
  for (const path of ["/", "/demo", "/privacy"]) {
    await page.goto(path);
    await expect(page.locator('script[src^="http"]')).toHaveCount(0);
  }
  await expect(page.getByText("We do not run advertising or tracking scripts.")).toBeVisible();
  expect(offOrigin).toEqual([]);
});

test("@claim:license-request-privacy sends only the license token to Sociobot", async ({ page }) => {
  const requests: { url: string; method: string; body: string | null }[] = [];
  await page.addInitScript(() => {
    localStorage.setItem("proof-pile:session", JSON.stringify({
      groups: [{ files: [{ path: "/Photos/private/Milo.jpg", hash: "secret-photo-hash", thumbnail: "base64-photo" }] }],
      moves: [{ source: "/Photos/private/Milo.jpg", destination: "/Quarantine/Milo.jpg", sha256: "secret-move-hash" }]
    }));
  });
  await page.route("https://api.sociobot.in/**", async route => {
    const request = route.request();
    requests.push({ url: request.url(), method: request.method(), body: request.postData() });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok" }) });
  });
  await page.goto("/?license=only-this-token");
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).toEqual({
    url: "https://api.sociobot.in/api/v1/products/photo-proof-pile/verify?license=only-this-token",
    method: "GET",
    body: null
  });
});

test("@claim:no-account starts a review without sign-in", async ({ page }) => {
  await page.goto("/demo");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("sample photo pile");
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await expect(page.getByRole("textbox", { name: /email|password/i })).toHaveCount(0);
});

test("@claim:paid-license restores a license and checks it at most once per 24 hours", async ({ page }) => {
  const checkedAt = Date.UTC(2026, 7, 29, 12, 0, 0);
  await page.addInitScript(() => {
    const actualNow = Date.now.bind(Date);
    Date.now = () => {
      try {
        const mocked = localStorage.getItem("proof-pile:test-clock");
        return mocked ? Number(mocked) : actualNow();
      } catch {
        return actualNow();
      }
    };
  });
  let checks = 0;
  await page.route("https://api.sociobot.in/**", route => {
    checks += 1;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok", expires_at: null }) });
  });
  await page.goto("/");
  await page.evaluate(time => localStorage.setItem("proof-pile:test-clock", String(time)), checkedAt);
  await page.reload();
  await page.getByRole("button", { name: "Restore a purchase" }).click();
  await page.getByLabel("License token").fill("test-license-token");
  await page.getByRole("button", { name: "Verify license" }).click();
  await expect(page.getByText("License verified. Full-library scans are active.")).toBeVisible();
  expect(checks).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem("sb_license:photo-proof-pile"))).toBe("test-license-token");

  await page.evaluate(time => localStorage.setItem("proof-pile:test-clock", String(time)), checkedAt + 86_399_999);
  await page.reload();
  expect(checks).toBe(1);

  await page.evaluate(time => localStorage.setItem("proof-pile:test-clock", String(time)), checkedAt + 86_400_000);
  await page.reload();
  await expect.poll(() => checks).toBe(2);
  await page.reload();
  expect(checks).toBe(2);
});

test("a fresh invalid license verdict is reused without another request", async ({ page }) => {
  let checks = 0;
  await page.addInitScript(() => {
    localStorage.setItem("sb_license:photo-proof-pile", "revoked-license-token");
    localStorage.setItem("sb_license:photo-proof-pile:verified", JSON.stringify({ valid: false, reason: "revoked", checkedAt: Date.now() }));
  });
  await page.route("https://api.sociobot.in/**", route => {
    checks += 1;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ valid: false, reason: "revoked", expires_at: null }) });
  });
  await page.goto("/");
  await expect(page.getByText("This license is no longer active. Enter another license.")).toBeVisible();
  await page.reload();
  await page.reload();
  expect(checks).toBe(0);
});

test("@claim:paid-checkout shows the price, opens hosted checkout, and stores a returned license", async ({ page }) => {
  let checkoutRequests = 0;
  let verifyRequests = 0;
  await page.route("https://api.sociobot.in/api/v1/products/photo-proof-pile/checkout", route => {
    checkoutRequests += 1;
    return route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Hosted checkout</title>" });
  });
  await page.goto("/");
  await expect(page.getByText("US$29", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "support@sociobot.in" })).toHaveAttribute("href", "mailto:support@sociobot.in?subject=Proof%20Pile%20refund");
  await page.getByRole("link", { name: "Buy via Sociobot checkout ↗" }).click();
  await expect(page).toHaveURL("https://api.sociobot.in/api/v1/products/photo-proof-pile/checkout");
  expect(checkoutRequests).toBe(1);

  await page.route("https://api.sociobot.in/api/v1/products/photo-proof-pile/verify?license=returned-token", route => {
    verifyRequests += 1;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok", expires_at: null }) });
  });
  await page.goto("/?license=returned-token");
  await expect(page).toHaveURL("/");
  expect(await page.evaluate(() => localStorage.getItem("sb_license:photo-proof-pile"))).toBe("returned-token");
  expect(verifyRequests).toBe(1);
});

test("@claim:offline-reload reloads the demo without a network", async ({ page, context }) => {
  await page.goto("/demo");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("sample photo pile");
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await expect(page.getByRole("option")).toHaveCount(3);
});

test("pages meet the automated accessibility baseline in light and dark presentations", async ({ page }) => {
  for (const colorScheme of ["light", "dark"] as const) for (const path of ["/", "/demo", "/privacy", "/terms", "/missing-frame"]) {
    await page.emulateMedia({ colorScheme });
    await page.goto(path);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    const results = await new AxeBuilder({ page: page as never }).analyze();
    expect(results.violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
  }
});

test("the phone layout keeps actions usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const action = page.getByRole("button", { name: "Mark exact extras" });
  await action.scrollIntoViewIfNeeded();
  expect((await action.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await page.locator(".photo-strip").focus();
  await expect(page.locator(".photo-strip")).toBeFocused();
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
  for (const link of await page.locator("header a:visible, footer a:visible").all()) {
    const box = await link.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test("review decision controls meet the 44px target baseline on desktop and phone", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/demo");
    const decisions = page.locator(".file-row").first().getByRole("button");
    await expect(decisions).toHaveCount(3);
    for (const decision of await decisions.all()) {
      const box = await decision.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  }
});

test("Android and iPhone visitors see truthful desktop availability", async ({ browser }) => {
  const phones = [
    { userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Mobile Safari/537.36", wrongLabel: "Download for Linux" },
    { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1", wrongLabel: "Download for macOS" }
  ];
  for (const phone of phones) {
    const context = await browser.newContext({ userAgent: phone.userAgent, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByText("The desktop app requires macOS, Windows, or Linux.")).toBeVisible();
    await expect(page.getByText(phone.wrongLabel)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Check signed download/ })).toHaveCount(0);
    await context.close();
  }
});

test("phone policy and not-found actions meet the touch target baseline", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/privacy", "/terms", "/missing-frame"]) {
    await page.goto(path);
    const actions = path === "/missing-frame" ? [page.getByRole("link", { name: "Return home" })] : await page.locator('a[href^="mailto:"]').all();
    for (const action of actions) {
      const box = await action.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  }
});

test("the 390px review keeps all content available at 200% text size", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo");
  await page.locator("html").evaluate(element => { element.style.fontSize = "34px"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  for (const option of await page.getByRole("option").all()) {
    expect(await option.evaluate(element => element.scrollWidth)).toBeLessThanOrEqual(await option.evaluate(element => element.clientWidth));
  }
});

test("the skip link moves keyboard focus to main", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Skip to main content" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});

test("download picker offers both published macOS architectures", async ({ page }) => {
  await page.route("https://api.github.com/repos/B-Divyesh/sf-photo-proof-pile/releases?per_page=1", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([{ tag_name: "v0.1.1", assets: [
      { name: "Proof.Pile_0.1.1_aarch64.dmg", browser_download_url: "https://example.test/arm.dmg" },
      { name: "Proof.Pile_0.1.1_x86_64.dmg", browser_download_url: "https://example.test/intel.dmg" },
      { name: "Proof.Pile_0.1.1_x64_en-US.msi", browser_download_url: "https://example.test/app.msi" },
      { name: "Proof.Pile_0.1.1_amd64.AppImage", browser_download_url: "https://example.test/app.AppImage" },
      { name: "DESKTOP_SIGNATURES_VERIFIED.json", browser_download_url: "https://example.test/signatures.json" }
    ] }])
  }));
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("proof-pile:release", JSON.stringify({ savedAt: Date.now(), data: { tag_name: "v0.1.0", assets: [] } })));
  await page.getByRole("button", { name: /Check signed download/ }).click();
  await expect(page.getByText("v0.1.1 is ready.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Download for macOS (Apple silicon)" })).toHaveAttribute("href", "https://example.test/arm.dmg");
  await expect(page.getByRole("link", { name: "Download for macOS (Intel)" })).toHaveAttribute("href", "https://example.test/intel.dmg");
  await expect(page.getByText("Windows is Authenticode signed. macOS is signed and notarized.")).toBeVisible();
});

test("@claim:verified-downloads-only refuses packages without verified signatures", async ({ page }) => {
  await page.route("https://api.github.com/repos/B-Divyesh/sf-photo-proof-pile/releases?per_page=1", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([{ tag_name: "v0.1.13", assets: [
      { name: "Proof.Pile_0.1.13_aarch64.dmg", browser_download_url: "https://example.test/app.dmg" },
      { name: "Proof.Pile_0.1.13_x64_en-US.msi", browser_download_url: "https://example.test/app.msi" },
      { name: "Proof.Pile_0.1.13_amd64.deb", browser_download_url: "https://example.test/app.deb" }
    ] }])
  }));
  await page.goto("/");
  await page.getByRole("button", { name: /Check signed download/ }).click();
  await expect(page.getByText("Trusted downloads are being prepared.")).toBeVisible();
  await expect(page.getByText("No package is offered until Windows and macOS signature checks pass.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Download for/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /releases/i })).toHaveCount(0);
});

test("routes load without console errors and Back restores the previous scroll position", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await page.evaluate(() => scrollTo(0, 900));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500);
  await page.evaluate(() => (document.querySelector('header a[href="/privacy"]') as HTMLAnchorElement).click());
  await expect(page).toHaveTitle("Privacy — Proof Pile");
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("proof-pile:scroll:/"))).not.toBeNull();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /stores locally/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Privacy — Proof Pile");
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Review photo copies");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500);
  await page.getByRole("link", { name: /Try it with sample data/ }).click();
  await expect(page).toHaveTitle("Demo — Proof Pile");
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", "Demo — Proof Pile");
  await page.getByRole("link", { name: "Privacy", exact: true }).first().click();
  await expect(page).toHaveTitle("Privacy — Proof Pile");
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("sample photo pile");
  expect(errors).toEqual([]);
});

test("How it works keeps its hash and focuses the section from home and another route", async ({ page }) => {
  for (const start of ["/", "/privacy"]) {
    await page.goto(start);
    await page.getByRole("link", { name: "How it works" }).click();
    await expect(page).toHaveURL(/\/#how$/);
    await expect(page.getByRole("heading", { name: "How photo cleanup works" })).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.querySelector("#how-title")?.getBoundingClientRect().top ?? 9999)).toBeLessThan(180);
  }
  await page.goto("/#how");
  await expect(page.getByRole("heading", { name: "How photo cleanup works" })).toBeFocused();
});

test("the app route uses a product-first title and route metadata", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveTitle("Proof Pile — Review photo copies");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://photo-proof-pile.sociobot.in/app");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Proof Pile — Review photo copies");
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", "Proof Pile — Review photo copies");
});
