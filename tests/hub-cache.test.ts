import { expect, test } from "bun:test";
import { readHubSnapshot } from "../src/lib/hub-cache.server";
import { destinationRow, readRows, type HubData } from "../src/lib/hub-schema";

const data: HubData = {
  levels: [],
  destinations: [],
  photos: [],
  links: [],
  events: [],
  posts: [],
  videos: [],
  settings: {},
  mapPlaces: [],
  mapLinks: [],
  linkTranslations: [],
  siteLinkTranslations: [],
  editorial: { descriptions: [], events: [] },
};
function memoryCache() {
  let value: Response | undefined;
  return {
    match: async () => value?.clone(),
    put: async (_: unknown, response: Response) => {
      value = response;
    },
  };
}
test("a single two-minute expiry cannot retain an old publication after partial failure", async () => {
  const cache = memoryCache();
  let reads = 0;
  const load = async () => {
    reads++;
    return data;
  };
  await readHubSnapshot(load, cache, 0);
  await readHubSnapshot(load, cache, 119_999);
  expect(reads).toBe(1);
  const fresh = { ...data, videos: null, settings: { status: "new publication" } };
  expect(await readHubSnapshot(async () => fresh, cache, 120_000)).toEqual(fresh);
  expect(await readHubSnapshot(async () => fresh, cache, 86_400_000)).toEqual(fresh);
  await expect(
    readHubSnapshot(
      async () => {
        throw new Error("offline");
      },
      cache,
      86_400_000,
    ),
  ).rejects.toThrow("offline");
});
test("invalid cached shapes and unavailable cache storage cannot prevent a fresh read", async () => {
  const invalid = {
    match: async () => new Response('{"levels":"bad"}', { headers: { "x-hub-expires": "120000" } }),
    put: async () => {},
  };
  expect(await readHubSnapshot(async () => data, invalid, 0)).toEqual(data);
  const broken = {
    match: async () => {
      throw new Error("cache down");
    },
    put: async () => {
      throw new Error("cache down");
    },
  };
  expect(await readHubSnapshot(async () => data, broken, 0)).toEqual(data);
});
test("a malformed database collection is unavailable, while intentional emptiness is valid", () => {
  expect(readRows({ error: null, data: [] }, destinationRow)).toEqual([]);
  expect(
    readRows({ error: null, data: [{ id: "citron", level_id: "unknown" }] }, destinationRow),
  ).toBeNull();
  expect(readRows({ error: {}, data: [] }, destinationRow)).toBeNull();
});
