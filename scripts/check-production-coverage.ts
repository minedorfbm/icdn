import { readFileSync, readdirSync } from "node:fs";

export function checkProductionCoverage(directory: string) {
  const files = readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.[cm]?js$/.test(entry.name))
    .map((entry) => `${entry.parentPath}/${entry.name}`);
  if (!files.length)
    throw new Error("Build the production application before checking its assets.");
  for (const file of files) {
    if (readFileSync(file, "utf8").includes("__coverage__")) {
      throw new Error(`Test instrumentation leaked into production: ${file}`);
    }
  }
  return files.length;
}

if (import.meta.main) {
  console.log(
    `Production coverage isolation: ${checkProductionCoverage(".output/public")} JavaScript assets checked.`,
  );
}
