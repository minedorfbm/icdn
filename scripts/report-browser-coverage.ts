import { readFileSync, readdirSync, appendFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { createCoverageMap } from "istanbul-lib-coverage";
import { createSourceMapStore } from "istanbul-lib-source-maps";
import { createContext } from "istanbul-lib-report";
import { create } from "istanbul-reports";

export async function loadBrowserCoverage(rawDirectory: string, root = process.cwd()) {
  const files = readdirSync(rawDirectory).filter((file) => file.endsWith(".json"));
  if (!files.length)
    throw new Error("No browser coverage was captured; use the instrumented test build.");
  const raw = createCoverageMap({});
  for (const file of files) raw.merge(JSON.parse(readFileSync(`${rawDirectory}/${file}`, "utf8")));
  const remapped = await createSourceMapStore().transformCoverage(raw);
  const coverage = createCoverageMap({});
  for (const file of remapped.files()) {
    const path = relative(root, resolve(root, file)).replaceAll("\\", "/");
    if (!path.startsWith("src/")) throw new Error(`Unexpected coverage source: ${path}`);
    const data = remapped.fileCoverageFor(file).toJSON();
    coverage.addFileCoverage({ ...data, path });
  }
  // Catch an inert fixture or missing lazy chunks before sending a misleading report.
  for (const name of [
    "ResortMap.tsx",
    "PdfMenu.tsx",
    "InstagramPostEmbed.tsx",
    "use-destination-swipe.ts",
  ]) {
    const file = coverage.files().find((path) => path.endsWith(`/${name}`));
    if (!file || coverage.fileCoverageFor(file).toSummary().lines.covered === 0) {
      throw new Error(`Mobile suite did not capture executed lines for ${name}`);
    }
  }
  return coverage;
}

export function writeBrowserCoverage(
  coverage: ReturnType<typeof createCoverageMap>,
  directory: string,
) {
  const context = createContext({ dir: directory, coverageMap: coverage });
  for (const format of ["lcovonly", "json-summary"] as const) create(format).execute(context);
  const lines = coverage.getCoverageSummary().lines;
  const summary = `## Mobile browser coverage\n\n${lines.covered}/${lines.total} measured lines (${lines.pct}%) across ${coverage.files().length} application files.\n\nCaptured during the iPhone/WebKit and Android/Chromium scenarios from the test-only instrumented build, remapped to TypeScript and imported alongside unit coverage. External provider internals and server execution are not measured by this browser report. Missing sources remain in Sonar's scope. Mobile device emulation does not replace physical-device validation.\n`;
  writeFileSync(`${directory}/summary.md`, summary);
  return summary;
}

if (import.meta.main) {
  const summary = writeBrowserCoverage(
    await loadBrowserCoverage("coverage/browser/raw"),
    "coverage/browser",
  );
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
