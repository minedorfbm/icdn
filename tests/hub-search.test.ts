import { expect, test } from "bun:test";
import { normalizeSearch, searchCollection, searchEntries } from "../src/features/search/search";
import { searchCopy } from "../src/features/search/search-copy";
import { LANGUAGES } from "../src/i18n/dictionary";

const entries = [
  {
    item: "spa",
    name: "Mi Sol Spa",
    collection: "WELLNESS",
    text: "Massage Đà Nẵng 水疗 마사지 スパ",
    keywords: ["spa", "relax", "rain"],
  },
  { item: "bar", name: "Buffalo Bar", collection: "DINING", text: "Cocktails beside La Maison" },
  {
    item: "maison",
    name: "La Maison 1888",
    collection: "DINING",
    text: "French restaurant wine tasting",
    keywords: ["dining", "french", "wine", "romantic", "dinner", "rain"],
  },
  {
    item: "tingara",
    name: "Tingara",
    collection: "DINING",
    text: "Japanese restaurant",
    keywords: ["dining", "japanese", "romantic", "dinner", "rain"],
  },
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
  for (const query of ["tingra", "tingarra", "tingera", "tignara"]) {
    expect(searchEntries(entries, query, "")[0]?.item).toBe("tingara");
  }
  expect(searchEntries(entries, "zzzzzzzzz", "")).toEqual([]);
  expect(searchEntries(entries, "car", "")).toEqual([]);
});

test("cuisine and natural requests work across languages regardless of the UI locale", () => {
  for (const query of [
    "restaurant japonais",
    "je voudrais manger japonais",
    "japonais",
    "japo",
    "restauran japonais",
    "Japanese restaurant",
    "nhà hàng nhật bản",
    "tôi muốn tìm nhà hàng nhật bản",
    "японский ресторан",
    "日本餐厅",
    "和食 レストラン",
    "일식 레스토랑",
  ]) {
    expect(searchEntries(entries, query, "").map((e) => e.item)).toEqual(["tingara"]);
  }
});

test("moods combine with categories, retain unknown constraints and rank curated choices", () => {
  const moods = [
    ...entries,
    {
      item: "kids",
      name: "Planet Trekkers",
      collection: "EXPERIENCES",
      text: "Creative crafts",
      keywords: ["family", "activity", "rain"],
    },
    {
      item: "nature",
      name: "Nature",
      collection: "EXPERIENCES",
      text: "Rainforest and wildlife",
      keywords: ["nature", "activity"],
    },
    {
      item: "romantic-offer",
      name: "Stay for two",
      collection: "EXPERIENCES",
      text: "A romantic stay",
    },
  ];
  expect(searchEntries(moods, "j'ai envie de calme", "")[0]?.item).toBe("spa");
  expect(searchEntries(moods, "restaurant romantique", "").map((e) => e.item)).toEqual([
    "maison",
    "tingara",
  ]);
  expect(
    searchEntries(moods, "une activité avec les enfants quand il pleut", "").map((e) => e.item),
  ).toEqual(["kids"]);
  expect(searchEntries(moods, "spa japonais", "")).toEqual([]);
  expect(searchEntries(moods, "restaurant sans gluten", "")).toEqual([]);
  expect(searchEntries(moods, "relax", "DINING")).toEqual([]);
  expect(searchEntries(moods, "je voudrais", "")).toEqual([]);
  expect(searchEntries(moods, "romantic", "")[0]?.item).not.toBe("romantic-offer");
  expect(searchEntries(moods, "rain", "").some((e) => e.item === "nature")).toBe(false);
});

test("moods and extra marketing synonyms work in the six hub languages plus French", () => {
  for (const query of [
    "relax",
    "détente",
    "thư giãn",
    "расслабиться",
    "放松",
    "リラックス",
    "휴식",
  ]) {
    expect(searchEntries(entries, query, "")[0]?.item).toBe("spa");
  }
  const custom = [
    {
      item: "spa",
      name: "Mi Sol",
      collection: "WELLNESS",
      text: "",
      keywords: ["sound therapy", "soin sonore"],
    },
  ];
  expect(searchEntries(custom, "sound therapy", "")[0]?.item).toBe("spa");
  expect(searchEntries(custom, "soin sonore", "")[0]?.item).toBe("spa");
});

test("curated profiles avoid incidental moods and activities while preserving exact names", () => {
  const candidates = [
    {
      item: "tour",
      name: "The Quiet Magic of Hoi An",
      text: "A peaceful tour",
      collection: "EXPERIENCES",
      keywords: ["explore", "culture"],
    },
    {
      item: "italian",
      name: "Terra Mare",
      text: "Italian cooking by the sea",
      collection: "DINING",
      keywords: ["dining", "italian"],
    },
    {
      item: "class",
      name: "Culinary Activities",
      text: "Hands-on lessons",
      collection: "EXPERIENCES",
      keywords: ["cooking"],
    },
  ];
  expect(searchEntries(candidates, "calme", "")).toEqual([]);
  expect(searchEntries(candidates, "cours de cuisine", "").map((e) => e.item)).toEqual(["class"]);
  expect(searchEntries(candidates, "The Quiet Magic of Hoi An", "")[0]?.item).toBe("tour");
  expect(searchEntries(candidates, "restaurant italien", "")[0]?.item).toBe("italian");
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
      "accommodation",
      "moods",
      "relax",
      "romantic",
      "family",
      "active",
      "nature",
      "rain",
    ] as const) {
      expect(searchCopy(code, key).length).toBeGreaterThan(0);
    }
  }
});

test("accommodation is a separate search collection regardless of its stored cluster", () => {
  const destinations = [
    { type: "accommodation", cluster: "EXPERIENCES", name: "Resort room" },
    { type: "accommodation", cluster: null, name: "Beach villa" },
    { type: "experience", cluster: "EXPERIENCES", name: "Design tour" },
    { type: "restaurant", cluster: "DINING", name: "Citron" },
  ].map((d) => ({ item: d.name, name: d.name, text: d.name, collection: searchCollection(d) }));
  expect(searchEntries(destinations, "", "ACCOMMODATION").map((d) => d.item)).toEqual([
    "Resort room",
    "Beach villa",
  ]);
  expect(searchEntries(destinations, "", "EXPERIENCES").map((d) => d.item)).toEqual([
    "Design tour",
  ]);
  expect(searchEntries(destinations, "Beach villa", "ACCOMMODATION").map((d) => d.item)).toEqual([
    "Beach villa",
  ]);
});

test("every translated mood suggestion is understood by the search vocabulary", () => {
  for (const { code } of LANGUAGES) {
    for (const intent of ["relax", "romantic", "family", "active", "nature", "rain"] as const) {
      const candidates = [
        { item: intent, name: "Test place", text: "", collection: "", keywords: [intent] },
      ];
      expect(searchEntries(candidates, searchCopy(code, intent), "")[0]?.item).toBe(intent);
    }
  }
});
