import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const browserCoverage = process.env["HUB_BROWSER_COVERAGE"] === "1";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env["CI"] ? 1 : 0,
  use: { ...devices["iPhone 13"], baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  projects: [
    { name: "iphone-webkit", use: { browserName: "webkit" } },
    { name: "android-chrome", use: { ...devices["Pixel 7"], browserName: "chromium" } },
  ],
  webServer: [
    { command: "bun e2e/mock-supabase.ts", port: 54329, reuseExistingServer: false },
    {
      command: `bun x --no-install wrangler dev --config ${browserCoverage ? ".output/browser-coverage/server/wrangler.json" : ".output/server/wrangler.json"} --persist-to .wrangler/e2e/state-${process.pid} --ip 127.0.0.1 --port 4173 --var SUPABASE_URL:http://127.0.0.1:54329 --var SUPABASE_PUBLISHABLE_KEY:sb_publishable_test`,
      url: "http://127.0.0.1:4173/intercontinental-favicon.png",
      reuseExistingServer: false,
      env: {
        WRANGLER_SEND_METRICS: "false",
        XDG_CONFIG_HOME: resolve(".wrangler/e2e/config"),
        WRANGLER_LOG_PATH: resolve(".wrangler/e2e/wrangler.log"),
        SUPABASE_URL: "http://127.0.0.1:54329",
        SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      },
    },
  ],
});
