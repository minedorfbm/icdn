import { expect, test } from "bun:test";
import { readCardSnapshot } from "../src/lib/card-snapshot.server";
import { CATALOGUE_CACHE_KEY } from "../src/lib/hub-cache.server";
import {
  cardHubData,
  focusDestinationCard,
  type DestinationCardData,
} from "../src/lib/destination-card-schema";
import type { HubData } from "../src/lib/hub-schema";

const card: DestinationCardData = {
  destination: {
    id: "citron",
    name: "Citron",
    active: true,
    level_id: "heaven",
    cluster: "DINING",
    type: "restaurant",
    short_description: "Above the bay",
    image_key: "photo.webp",
    display_order: 0,
  },
  links: [],
  events: [],
  mapPlaces: [],
  mapLinks: [],
  linkTranslations: [],
  editorial: { descriptions: [], events: [] },
};
function fullCatalogue(): HubData {
  const data = cardHubData(card);
  delete data.scope;
  return data;
}
function fixture() {
  const entries = new Map<string, Response>();
  const writes: string[] = [];
  const prefix = "https://icdn.artdigitaljourney.com/__cache/";
  const seed = (key: string, data: unknown, expiry = 120_000) =>
    entries.set(
      prefix + key,
      Response.json(data, { headers: { "x-hub-expires": String(expiry) } }),
    );
  const cache = {
    match: async (key: RequestInfo | URL) => entries.get(String(key))?.clone(),
    put: async (key: RequestInfo | URL, value: Response) => {
      writes.push(String(key));
      entries.set(String(key), value);
    },
  };
  return { entries, writes, prefix, seed, cache };
}
const unexpectedRead = async (): Promise<DestinationCardData> => {
  throw new Error("Unexpected database read");
};

test("a warm complete catalogue supplies exactly the requested card without a database read or new cache deadline", async () => {
  const { cache, seed, writes, entries, prefix } = fixture();
  const catalogue = fullCatalogue();
  seed(CATALOGUE_CACHE_KEY, catalogue);
  let hits = 0;
  expect(await readCardSnapshot("citron", unexpectedRead, cache, 119_999, () => hits++)).toEqual(
    focusDestinationCard(catalogue, "citron"),
  );
  expect(hits).toBe(1);
  expect(writes).toEqual([]);
  expect(entries.has(prefix + "card-v3/citron")).toBe(false);
  expect(entries.get(prefix + CATALOGUE_CACHE_KEY)!.headers.get("x-hub-expires")).toBe("120000");
  let reads = 0;
  expect(
    await readCardSnapshot(
      "citron",
      async () => {
        reads++;
        return card;
      },
      cache,
      120_000,
    ),
  ).toEqual(card);
  expect(reads).toBe(1);
  expect(writes).toEqual([prefix + "card-v3/citron"]);
});

test("the card's own newer snapshot takes precedence over an older catalogue", async () => {
  const { cache, seed, writes } = fixture();
  seed(CATALOGUE_CACHE_KEY, fullCatalogue());
  const newer = { ...card, destination: { ...card.destination, short_description: "Updated" } };
  seed("card-v3/citron", newer);
  expect(await readCardSnapshot("citron", unexpectedRead, cache, 1)).toEqual(newer);
  expect(writes).toEqual([]);
});

test("a destination absent or unpublished in the valid catalogue stays unpublished without a negative card cache", async () => {
  const { cache, seed, writes } = fixture();
  seed(CATALOGUE_CACHE_KEY, {
    ...fullCatalogue(),
    destinations: [{ ...card.destination, active: false }],
  });
  expect(await readCardSnapshot("citron", unexpectedRead, cache, 1)).toBeNull();
  expect(await readCardSnapshot("unknown", unexpectedRead, cache, 1)).toBeNull();
  expect(writes).toEqual([]);
});

test.each([
  { ...fullCatalogue(), links: null },
  { ...fullCatalogue(), openingHours: null },
  { ...fullCatalogue(), editorial: { descriptions: null, events: [] } },
  cardHubData(card),
  { levels: "invalid" },
])(
  "partial, focused or invalid catalogue caches cannot impersonate the complete publication: %j",
  async (invalid) => {
    const { cache, seed } = fixture();
    seed(CATALOGUE_CACHE_KEY, invalid);
    let reads = 0;
    expect(
      await readCardSnapshot(
        "citron",
        async () => {
          reads++;
          return card;
        },
        cache,
        1,
      ),
    ).toEqual(card);
    expect(reads).toBe(1);
  },
);

test("an expired catalogue cannot be extended or resurrected during a database failure", async () => {
  const { cache, seed, writes } = fixture();
  seed(CATALOGUE_CACHE_KEY, fullCatalogue());
  await expect(
    readCardSnapshot(
      "citron",
      async () => {
        throw new Error("offline");
      },
      cache,
      120_000,
    ),
  ).rejects.toThrow("offline");
  expect(writes).toEqual([]);
});

test.each([
  { ...card.destination, id: "other" },
  { ...card.destination, active: false },
])(
  "foreign or inactive card cache entries are ignored and a future-dated catalogue is rejected: %j",
  async (destination) => {
    const { cache, seed } = fixture();
    seed("card-v3/citron", { ...card, destination });
    seed(CATALOGUE_CACHE_KEY, fullCatalogue(), 999_999);
    let reads = 0;
    expect(
      await readCardSnapshot(
        "citron",
        async () => {
          reads++;
          return card;
        },
        cache,
        0,
      ),
    ).toEqual(card);
    expect(reads).toBe(1);
  },
);

test("cache storage outages keep fresh reads available and null results are not stored", async () => {
  const broken = {
    match: async () => {
      throw new Error("cache down");
    },
    put: async () => {
      throw new Error("cache down");
    },
  };
  expect(await readCardSnapshot("citron", async () => card, broken, 1)).toEqual(card);
  const { cache, writes } = fixture();
  expect(await readCardSnapshot("unknown", async () => null, cache, 1)).toBeNull();
  expect(writes).toEqual([]);
  expect(await readCardSnapshot("citron", async () => card, undefined, 1)).toEqual(card);
});
