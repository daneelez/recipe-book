import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./client/tests/ui",
  fullyParallel: true,
  retries: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run dev --workspace=server",
      port: 3000,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npm run dev --workspace=client",
      port: 5173,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
