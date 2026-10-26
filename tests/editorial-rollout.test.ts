import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  new URL("../supabase/migrations/20261012120000_editorial_catalogue_rollout.sql", import.meta.url),
  "utf8",
);
const copy = JSON.parse(migration.split("$headings$")[1]!) as {
  id: string;
  headings: Record<string, string[]>;
}[];

test("rollout copy covers the whole catalogue, including the two hidden destinations", () => {
  expect(copy).toHaveLength(75);
  expect(new Set(copy.map((card) => card.id)).size).toBe(75);
  expect(copy.map((card) => card.id)).toContain("information");
  expect(copy.map((card) => card.id)).toContain("reception");
  for (const card of copy) {
    expect(Object.keys(card.headings).sort()).toEqual(["instagram", "links", "video"]);
    for (const values of Object.values(card.headings)) {
      expect(values).toHaveLength(6);
      for (const value of values) {
        expect(value.trim().length).toBeGreaterThan(0);
        expect(value.length).toBeLessThanOrEqual(160);
      }
      // Proper names can be shared, but every heading must actually be localized.
      for (const value of values.slice(1)) expect(value).not.toBe(values[0]);
    }
  }
});

test("the four approved cards keep their authored section headings", () => {
  const maison = copy.find((card) => card.id === "la-maison-1888")!;
  expect(maison.headings.video![0]).toBe("The art of an evening.");
  expect(maison.headings.instagram![0]).toBe("Moments worth sharing.");
  expect(copy.find((card) => card.id === "citron")!.headings.links![0]).toBe(
    "Flavours above the bay.",
  );
  for (const id of ["long-bar", "mi-sol-spa"]) {
    expect(copy.find((card) => card.id === id)?.headings.video).toHaveLength(6);
  }
});
