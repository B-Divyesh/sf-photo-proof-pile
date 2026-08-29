import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function installTauriMock(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const restored: string[] = [];
    let batch = 0;
    (window as unknown as { __PROOF_PILE_TAURI_TEST__: unknown }).__PROOF_PILE_TAURI_TEST__ = { restored };
    (window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = {
      invoke: async (command: string, args: { paths?: string[] }) => {
        if (command === "plugin:dialog|open") return "/Mock quarantine";
        if (command === "execute_quarantine") {
          batch += 1;
          return (args.paths ?? []).map((source, index) => ({
            id: `batch-${batch}-${index}`,
            source,
            destination: `/Mock quarantine/${source.split("/").pop()}`,
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

test("@claim:demo-isolated opens and resets a separate sample review", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Try it with sample data/ }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await expect(page.getByRole("option")).toHaveCount(3);
  await page.getByRole("button", { name: "Mark exact extras" }).click();
  await expect(page.locator(".plan-number strong")).toHaveText("2");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.locator(".plan-number strong")).toHaveText("0");
});

test("@claim:match-evidence shows all three evidence group types", async ({ page }) => {
  await page.goto("/demo");
  const options = page.getByRole("option");
  await expect(options.nth(0)).toContainText("Exact bytes");
  await expect(options.nth(1)).toContainText("Same moment");
  await expect(options.nth(2)).toContainText("Looks alike");
  await expect(page.getByText("Dimensions", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Camera", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Other drives", { exact: true }).first()).toBeVisible();
});

test("@claim:csv-export downloads one decision row per sample file", async ({ page }) => {
  await page.goto("/demo");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
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
  await page.getByRole("button", { name: "Review and run plan" }).click();
  await expect(page.getByText(/2 sample files moved/)).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
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

test("native quarantine keeps and restores recovery records from separate batches", async ({ page }) => {
  await installTauriMock(page);
  await page.goto("/demo");
  await page.getByRole("button", { name: "Mark exact extras" }).click();
  await page.evaluate(() => localStorage.setItem("proof-pile:session", sessionStorage.getItem("demo:photo-proof-pile:session")!));
  await page.goto("/app");

  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Review and run plan" }).click();
  await expect(page.getByText("2 files moved to quarantine. The decision log is ready to export.")).toBeVisible();

  while (await page.locator('.file-row.quarantine button[data-decision="review"]').count()) {
    await page.locator('.file-row.quarantine button[data-decision="review"]').first().click();
  }
  await page.getByRole("option").nth(1).click();
  await page.locator(".file-row").nth(1).getByRole("button", { name: "Quarantine" }).click();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Review and run plan" }).click();
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
  await page.getByRole("button", { name: "Review and run plan" }).click();
  expect(offOrigin).toEqual([]);
});

test("@claim:no-account starts a review without sign-in", async ({ page }) => {
  await page.goto("/demo");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("sample photo pile");
  await expect(page.getByText("Demo — sample data, nothing is saved")).toBeVisible();
  await expect(page.getByRole("textbox", { name: /email|password/i })).toHaveCount(0);
});

test("@claim:paid-license verifies and caches a restored license", async ({ page }) => {
  let checks = 0;
  await page.route("https://api.sociobot.in/**", route => {
    checks += 1;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ valid: true, reason: "ok", expires_at: null }) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Enter a license" }).click();
  await page.getByLabel("License token").fill("test-license-token");
  await page.getByRole("button", { name: "Verify license" }).click();
  await expect(page.getByText("License verified. Full-library scans are active.")).toBeVisible();
  await page.reload();
  expect(checks).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem("sb_license:photo-proof-pile"))).toBe("test-license-token");
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
  await page.getByRole("link", { name: "Buy the desktop license" }).click();
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
    await expect(page.getByRole("button", { name: /Download for/ })).toHaveCount(0);
    await context.close();
  }
});

test("phone policy and not-found actions meet the touch target baseline", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/privacy", "/terms", "/missing-frame"]) {
    await page.goto(path);
    const action = path === "/missing-frame" ? page.getByRole("link", { name: "Return home" }) : page.getByRole("link", { name: /@sociobot\.in/ });
    const box = await action.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
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
  await page.route("https://api.github.com/repos/B-Divyesh/sf-photo-proof-pile/releases/latest", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ tag_name: "v0.1.1", assets: [
      { name: "Proof.Pile_0.1.1_aarch64.dmg", browser_download_url: "https://example.test/arm.dmg" },
      { name: "Proof.Pile_0.1.1_x86_64.dmg", browser_download_url: "https://example.test/intel.dmg" },
      { name: "Proof.Pile_0.1.1_x64_en-US.msi", browser_download_url: "https://example.test/app.msi" }
    ] })
  }));
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("proof-pile:release", JSON.stringify({ savedAt: Date.now(), data: { tag_name: "v0.1.0", assets: [] } })));
  await page.getByRole("button", { name: /Download for/ }).click();
  await expect(page.getByText("v0.1.1 is ready.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Download for macOS (Apple silicon)" })).toHaveAttribute("href", "https://example.test/arm.dmg");
  await expect(page.getByRole("link", { name: "Download for macOS (Intel)" })).toHaveAttribute("href", "https://example.test/intel.dmg");
});

test("routes load without console errors and back restores the page", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await page.getByRole("link", { name: /Try it with sample data/ }).click();
  await expect(page).toHaveTitle("Demo — Proof Pile");
  await page.getByRole("link", { name: "Privacy", exact: true }).first().click();
  await expect(page).toHaveTitle("Privacy — Proof Pile");
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("sample photo pile");
  expect(errors).toEqual([]);
});
