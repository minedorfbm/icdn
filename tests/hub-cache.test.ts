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

test("public cache keys isolate settings, catalogue and individual card media", async () => {
  const { readPublicSnapshot } = await import("../src/lib/hub-cache.server");
  const { z } = await import("zod");
  const entries = new Map<string, Response>();
  const cache = {
    match: async (key: RequestInfo | URL) => entries.get(String(key))?.clone(),
    put: async (key: RequestInfo | URL, response: Response) => {
      entries.set(String(key), response);
    },
  };
  const schema = z.object({ value: z.string().nullable() });
  const complete = (data: { value: string | null }) => data.value !== null;
  const read = (key: string, value: string | null, now: number) =>
    readPublicSnapshot(key, schema, complete, async () => ({ value }), cache, now);
  await read("settings-v1", "hero", 0);
  await read("media-v1/citron", "Citron", 0);
  await read("media-v1/tingara", "TINGARA", 0);
  expect(await read("media-v1/citron", "changed", 1)).toEqual({ value: "Citron" });
  expect(await read("settings-v1", "changed", 1)).toEqual({ value: "hero" });
  expect(await read("media-v1/citron", null, 120_000)).toEqual({ value: null });
  expect(await read("media-v1/citron", "new publication", 120_001)).toEqual({
    value: "new publication",
  });
});
