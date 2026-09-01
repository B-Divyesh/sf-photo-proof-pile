import { defineConfig, devices } from "@playwright/test";

const isCi = process.env.CI === "1" || process.env.CI === "true";

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.spec.ts",
  // Browser and service-worker tests deliberately exercise reload, offline, and
  // native confirmation flows. Keep their scheduling deterministic; CI=1 used
  // by the factory must not silently select half of the available cores.
  fullyParallel: false,
  workers: isCi ? 1 : undefined,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } }
  ],
  webServer: {
    command: "npm run build:site && npm run preview",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 120_000
  }
});
