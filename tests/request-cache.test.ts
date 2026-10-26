import { expect, test } from "bun:test";
import { createRequestCache } from "../src/lib/request-cache";

test("an early catalogue request keeps its original freshness deadline", async () => {
  let now = 20;
  const cache = createRequestCache<string>(
    () => true,
    30,
    () => now,
  );
  await cache.read("catalogue", async () => "early", false, 0);
  now = 29;
  expect(cache.peek("catalogue")).toBe("early");
  now = 30;
  expect(cache.peek("catalogue")).toBeUndefined();
  await cache.read("catalogue", async () => "fresh");
  expect(cache.peek("catalogue")).toBe("fresh");
});

test("navigation and media readers share a request, then expire without serving stale data", async () => {
  let now = 0;
  let reads = 0;
  const cache = createRequestCache<string>(
    () => true,
    30,
    () => now,
  );
  const load = async () => `publication-${++reads}`;
  const first = cache.read("catalogue", load);
  expect(cache.read("catalogue", load)).toBe(first);
  expect(await first).toBe("publication-1");
  now = 29;
  expect(await cache.read("catalogue", load)).toBe("publication-1");
  now = 30;
  expect(cache.peek("catalogue")).toBeUndefined();
  await expect(
    cache.read("catalogue", async () => {
      throw new Error("offline");
    }),
  ).rejects.toThrow("offline");
  expect(cache.peek("catalogue")).toBeUndefined();
  expect(await cache.read("catalogue", load)).toBe("publication-2");
});

test("incomplete media and errors are retried; an older completion cannot overwrite a retry", async () => {
  const cache = createRequestCache<string | null>((value) => value !== null);
  await cache.read("citron", async () => null);
  expect(cache.peek("citron")).toBeUndefined();
  let finish!: (value: string) => void;
  const older = cache.read(
    "citron",
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await Promise.resolve();
  await cache.read("citron", async () => "new publication", true);
  finish("old publication");
  await older;
  expect(cache.peek("citron")).toBe("new publication");
  await expect(
    cache.read(
      "citron",
      async () => {
        throw new Error("retry failed");
      },
      true,
    ),
  ).rejects.toThrow("retry failed");
  expect(cache.peek("citron")).toBeUndefined();
});

test("media keys stay isolated and the cache cannot grow with every visited card", async () => {
  const cache = createRequestCache<string>(
    () => true,
    30_000,
    () => 0,
    2,
  );
  await cache.read("citron", async () => "Citron");
  await cache.read("spa", async () => "Spa");
  await cache.read("tingara", async () => "Tingara");
  expect(cache.peek("citron")).toBeUndefined();
  expect(cache.peek("spa")).toBe("Spa");
  expect(cache.peek("tingara")).toBe("Tingara");
});
