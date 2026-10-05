import { defineConfig, devices } from "@playwright/test";

// UI tests run against a production build in mock mode, so they don't depend
// on atm-iris-api and don't clash with a `pnpm dev` already running (Next
// allows one dev server per folder). The mocks keep state for the whole run:
// each test uses its own names and never relies on another's leftovers.
const PORT = 3200;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "es-PE",
    timezoneId: "America/Lima",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      AUTH_SOURCE: "mock",
      DATA_SOURCE: "mock",
      SESSION_SECRET: "e2e-only-session-secret-0000000000000000",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
