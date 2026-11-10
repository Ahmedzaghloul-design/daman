// Browser tests for the website and the app, run locally only.
//   npx playwright test            (uses the dev servers if already running)
// Every /api call is sent to a separate mock API (GEMINI_MOCK=true, port 8797),
// so tests never use the Gemini quota or touch real data.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: { ...devices["Desktop Chrome"], trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 860 } } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    { command: "npm run dev -w @daman/website", url: "http://localhost:5173", reuseExistingServer: true, timeout: 60_000 },
    { command: "npm run dev -w @daman/app", url: "http://localhost:5174", reuseExistingServer: true, timeout: 60_000 },
    {
      command: "node api/index.js",
      url: "http://localhost:8797/api/health",
      reuseExistingServer: true,
      env: { API_PORT: "8797", GEMINI_MOCK: "true" },
      timeout: 30_000,
    },
  ],
});
