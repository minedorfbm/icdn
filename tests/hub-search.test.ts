import { expect, test } from "bun:test";
import { normalizeSearch, searchEntries } from "../src/features/search/search";
import { searchCopy } from "../src/features/search/search-copy";
import { LANGUAGES } from "../src/i18n/dictionary";

const entries = [
  {
    item: "spa",
    name: "Mi Sol Spa",
    collection: "WELLNESS",
    text: "Massage Đà Nẵng 水疗 마사지 スパ",
  },
  { item: "bar", name: "Buffalo Bar", collection: "DINING", text: "Cocktails beside La Maison" },
  {
    item: "maison",
    name: "La Maison 1888",
    collection: "DINING",
    text: "French restaurant wine tasting",
  },
  { item: "tingara", name: "Tingara", collection: "DINING", text: "Japanese restaurant" },
];

test("search prioritizes names, combines terms, and honors collection filters", () => {
  expect(searchEntries(entries, "maison", "").map((e) => e.item)).toEqual(["maison", "bar"]);
  expect(searchEntries(entries, "wine restaurant", "").map((e) => e.item)).toEqual(["maison"]);
  expect(searchEntries(entries, "wine massage", "")).toEqual([]);
  expect(searchEntries(entries, "", "WELLNESS").map((e) => e.item)).toEqual(["spa"]);
  expect(searchEntries(entries, "Tingara", "WELLNESS")).toEqual([]);
  expect(searchEntries(entries, "", "")).toEqual(entries);
});

test("search handles accents, punctuation, Asian scripts and small name typos", () => {
  expect(normalizeSearch("  ĐÀ-NẴNG  ")).toBe("da nang");
  expect(normalizeSearch("L_O_N_G Bar")).toBe("long bar");
  for (const query of ["da nang", "水疗", "마사지", "スパ", "mi-sol"]) {
    expect(searchEntries(entries, query, "")[0]?.item).toBe("spa");
  }
  for (const query of ["tingra", "tingarra", "tingera"]) {
    expect(searchEntries(entries, query, "")[0]?.item).toBe("tingara");
  }
  expect(searchEntries(entries, "zzzzzzzzz", "")).toEqual([]);
  expect(searchEntries(entries, "car", "")).toEqual([]);
});

test("search interface copy is available in every supported language", () => {
  for (const { code } of LANGUAGES) {
    for (const key of [
      "search",
      "title",
      "placeholder",
      "clear",
      "results",
      "empty",
      "hint",
      "dining",
      "wellness",
      "experiences",
    ] as const) {
      expect(searchCopy(code, key).length).toBeGreaterThan(0);
    }
  }
});
