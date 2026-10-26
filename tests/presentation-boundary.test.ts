import { expect, test } from "bun:test";

test("browser presentation utilities do not pull in runtime data validators", async () => {
  const result = await Bun.build({
    entrypoints: [
      "destination-card",
      "opening-hours",
      "destination-collection",
      "destination-notices",
      "accommodation-benefits",
    ].map((name) => new URL(`../src/lib/${name}.ts`, import.meta.url).pathname),
    target: "browser",
    packages: "external",
    minify: true,
  });
  expect(result.success).toBe(true);
  expect(result.outputs.length).toBeGreaterThan(0);
  for (const output of result.outputs) {
    const code = await output.text();
    expect(code).not.toMatch(/\b(?:from|import)\s*["']zod(?:\/[^"']*)?["']/);
    expect(code).not.toContain("jitless");
  }
});
