import { test as base, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import type { CoverageMapData } from "istanbul-lib-coverage";

declare global {
  interface Window {
    __coverage__?: CoverageMapData;
    __saveHubCoverage?: (id: string, coverage: CoverageMapData) => Promise<void>;
    __hubCoverageDocument?: string;
  }
}

export const test = base.extend({
  context: async ({ context }, runWithContext) => {
    // Keep browser regressions deterministic. Playback-specific page routes override this.
    await context.route("https://www.youtube-nocookie.com/embed/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<button>YouTube Play</button>" }),
    );
    if (process.env["HUB_BROWSER_COVERAGE"] !== "1") {
      await runWithContext(context);
      return;
    }
    // Replace each document's last snapshot instead of double-counting pagehide/teardown.
    // The binding is Playwright-only: no collection endpoint exists in the application.
    const snapshots = new Map<string, CoverageMapData>();
    await context.exposeBinding("__saveHubCoverage", ({ frame }, id, coverage) => {
      if (new URL(frame.url()).origin === "http://127.0.0.1:4173") snapshots.set(id, coverage);
    });
    await context.addInitScript(() => {
      window.__hubCoverageDocument = crypto.randomUUID();
      window.addEventListener("pagehide", () => {
        if (window.__coverage__) {
          void window.__saveHubCoverage?.(window.__hubCoverageDocument!, window.__coverage__);
        }
      });
    });
    await runWithContext(context);
    for (const page of context.pages()) {
      await page.evaluate(async () => {
        if (window.__coverage__) {
          await window.__saveHubCoverage?.(window.__hubCoverageDocument!, window.__coverage__);
        }
      });
    }
    mkdirSync("coverage/browser/raw", { recursive: true });
    for (const coverage of snapshots.values()) {
      writeFileSync(`coverage/browser/raw/${randomUUID()}.json`, JSON.stringify(coverage));
    }
  },
});

export { expect };
export type { Page, Locator } from "@playwright/test";
