import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv();

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "e2e",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false,
  workers: 1,
  retries: isCI ? 1 : 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    navigationTimeout: 60_000,
    actionTimeout: 30_000
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npx inngest-cli dev -u http://localhost:3000/api/inngest --no-discovery --port 8288",
      url: "http://127.0.0.1:8288/dev",
      reuseExistingServer: !isCI,
      timeout: 60_000
    },
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: !isCI,
      timeout: 180_000
    }
  ]
});
