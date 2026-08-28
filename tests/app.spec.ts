import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

test("@claim:reversible-plan quarantines and restores in the sandbox", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Mark exact extras" }).click();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Review and run plan" }).click();
  await expect(page.getByText(/2 sample files moved/)).toBeVisible();
  await page.getByRole("button", { name: "Restore last move" }).click();
  await expect(page.getByText(/restored in the demo/)).toBeVisible();
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

test("pages meet the automated accessibility baseline", async ({ page }) => {
  for (const path of ["/", "/demo", "/privacy", "/terms", "/missing-frame"]) {
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
