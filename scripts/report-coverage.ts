import { appendFileSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

// Bun instruments loaded modules only. List missing source files explicitly so
// the loaded-module percentage cannot be mistaken for whole-application coverage.
const sourceFiles = readdirSync("src", { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(ts|tsx)$/.test(entry.name))
  .map((entry) => `${entry.parentPath}/${entry.name}`.replaceAll("\\", "/"))
  .filter((path) => !path.endsWith(".d.ts") && path !== "src/routeTree.gen.ts")
  .sort((a, b) => a.localeCompare(b));
const sourceSet = new Set(sourceFiles);
const records = readFileSync("coverage/lcov.info", "utf8")
  .split("end_of_record")
  .map((record) => {
    const file = /^SF:(.+)$/m.exec(record)?.[1];
    const lines = [...record.matchAll(/^DA:\d+,(\d+)/gm)];
    return {
      file,
      lines: lines.length,
      covered: lines.filter((line) => Number(line[1]) > 0).length,
    };
  })
  .filter((record) => record.file && sourceSet.has(record.file));
if (!records.length) throw new Error("The LCOV report contains no application sources.");

const measuredFiles = new Set(records.map((record) => record.file));
const unmeasured = sourceFiles.filter((file) => !measuredFiles.has(file));
const total = records.reduce((sum, record) => sum + record.lines, 0);
const covered = records.reduce((sum, record) => sum + record.covered, 0);
if (!total) throw new Error("The LCOV report contains no measured application lines.");

const report = [
  "## Unit-test coverage — loaded modules only",
  "",
  `- Measured lines: **${covered}/${total} (${((covered / total) * 100).toFixed(2)}%)**.`,
  `- Measured source files: **${measuredFiles.size}/${sourceFiles.length}**.`,
  `- Source files not measured by this run: **${unmeasured.length}** (listed below).`,
  "",
  "This is not whole-application coverage. Bun only instruments modules loaded by unit tests. " +
    "Mobile browser scenarios run separately and are not included in this unit LCOV report. " +
    "The unit suite also replays catalogue migrations in an isolated PostgreSQL instance. " +
    "A file absent here may be exercised by those scenarios. Type declarations and the generated route tree " +
    "are omitted from this inventory; no hand-written application source is excluded.",
  "",
  "SonarCloud imports this unit LCOV report alongside coverage/browser/lcov.info when CI analysis is enabled (SONAR_CI_ENABLED=true).",
  "",
  "<details><summary>Sources not measured by the unit-test run</summary>",
  "",
  ...unmeasured.map((file) => `- \`${file}\``),
  "",
  "</details>",
  "",
].join("\n");
writeFileSync("coverage/summary.md", report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
console.log(report);
