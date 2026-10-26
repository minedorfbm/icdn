import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CoverageMapData, FileCoverageData } from "istanbul-lib-coverage";
import { checkProductionCoverage } from "../scripts/check-production-coverage";
import { loadBrowserCoverage, writeBrowserCoverage } from "../scripts/report-browser-coverage";

const temporary: string[] = [];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "hub-coverage-"));
  temporary.push(root);
  const raw = join(root, "raw");
  mkdirSync(raw);
  return { root, raw };
}
afterEach(() =>
  temporary.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true })),
);

function fileCoverage(path: string, hit = 1): FileCoverageData {
  return {
    path,
    statementMap: {
      "0": { start: { line: 2, column: 0 }, end: { line: 2, column: 12 } },
      "1": { start: { line: 4, column: 0 }, end: { line: 4, column: 12 } },
    },
    s: { "0": hit, "1": 0 },
    fnMap: {},
    f: {},
    branchMap: {},
    b: {},
  };
}
function snapshot(root: string): CoverageMapData {
  return Object.fromEntries(
    ["ResortMap.tsx", "PdfMenu.tsx", "InstagramPostEmbed.tsx", "use-destination-swipe.ts"].map(
      (name) => {
        const path = join(root, "src", name);
        return [path, fileCoverage(path)];
      },
    ),
  );
}

test("browser report preserves uncovered lines, merges visits and emits relative source paths", async () => {
  const { root, raw } = fixture();
  const data = snapshot(root);
  writeFileSync(join(raw, "visit-1.json"), JSON.stringify(data));
  writeFileSync(join(raw, "visit-2.json"), JSON.stringify(data));
  const coverage = await loadBrowserCoverage(raw, root);
  expect(coverage.getCoverageSummary().lines).toMatchObject({ total: 8, covered: 4, pct: 50 });
  writeBrowserCoverage(coverage, join(root, "report"));
  const lcov = readFileSync(join(root, "report/lcov.info"), "utf8");
  expect(lcov).toContain("SF:src/PdfMenu.tsx");
  expect(lcov).toContain("DA:2,2");
  expect(lcov).toContain("DA:4,0");
  expect(lcov).not.toContain(root);
});

test("missing collection, unexecuted lazy features and third-party sources fail clearly", async () => {
  const { root, raw } = fixture();
  await expect(loadBrowserCoverage(raw, root)).rejects.toThrow("No browser coverage");
  const data = snapshot(root);
  data[join(root, "src/PdfMenu.tsx")] = fileCoverage(join(root, "src/PdfMenu.tsx"), 0);
  writeFileSync(join(raw, "data.json"), JSON.stringify(data));
  await expect(loadBrowserCoverage(raw, root)).rejects.toThrow("PdfMenu.tsx");
  delete data[join(root, "src/PdfMenu.tsx")];
  writeFileSync(join(raw, "data.json"), JSON.stringify(data));
  await expect(loadBrowserCoverage(raw, root)).rejects.toThrow("PdfMenu.tsx");
  data[join(root, "node_modules/provider.js")] = fileCoverage(
    join(root, "node_modules/provider.js"),
  );
  writeFileSync(join(raw, "data.json"), JSON.stringify(data));
  await expect(loadBrowserCoverage(raw, root)).rejects.toThrow("Unexpected coverage source");
});

test("production guard rejects missing assets and coverage counters in nested JavaScript", () => {
  const { root } = fixture();
  expect(() => checkProductionCoverage(root)).toThrow("Build the production application");
  mkdirSync(join(root, "assets"));
  writeFileSync(join(root, "assets/app.js"), "console.log('application');");
  expect(checkProductionCoverage(root)).toBe(1);
  writeFileSync(join(root, "assets/lazy.mjs"), "globalThis.__coverage__ = {};");
  expect(() => checkProductionCoverage(root)).toThrow("instrumentation leaked");
});
