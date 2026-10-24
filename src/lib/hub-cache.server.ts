import { hubDataSchema, type HubData } from "./hub-schema";
import { completeCatalogue } from "./hub-data-completeness";

import type { z } from "zod";

const CACHE_ROOT = "https://icdn.artdigitaljourney.com/__cache/";
export const CATALOGUE_CACHE_KEY = "catalogue-v10";
const TTL_MS = 120_000;
export type PublicCache = Pick<Cache, "match" | "put">;

/** Read-only cache lookup. It never renews a publication deadline or writes a derived value. */
export async function peekPublicSnapshot<T>(
  key: string,
  schema: z.ZodType<T>,
  isComplete: (data: T) => boolean,
  cache?: PublicCache,
  now = Date.now(),
): Promise<T | undefined> {
  if (cache) {
    try {
      const response = await cache.match(CACHE_ROOT + key);
      const expires = Number(response?.headers.get("x-hub-expires"));
      if (response?.ok && expires > now && expires <= now + TTL_MS) {
        const parsed = schema.safeParse(await response.json());
        if (parsed.success && isComplete(parsed.data)) return parsed.data;
      }
    } catch {
      /* A missing, invalid or unavailable cache remains a miss. */
    }
  }
  return undefined;
}

/** Public data only, independently keyed, with the same hard two-minute expiry. */
export async function readPublicSnapshot<T>(
  key: string,
  schema: z.ZodType<T>,
  isComplete: (data: T) => boolean,
  load: () => Promise<T>,
  cache?: PublicCache,
  now = Date.now(),
): Promise<T> {
  const url = CACHE_ROOT + key;
  const cached = await peekPublicSnapshot(key, schema, isComplete, cache, now);
  if (cached !== undefined) return cached;
  const data = await load();
  if (cache && isComplete(data)) {
    try {
      await cache.put(
        url,
        new Response(JSON.stringify(data), {
          headers: {
            "content-type": "application/json",
            "cache-control": `public, max-age=${TTL_MS / 1000}`,
            "x-hub-expires": String(now + TTL_MS),
          },
        }),
      );
    } catch {
      /* Caching is optional. Never substitute an expired response. */
    }
  }
  return data;
}

export function readHubSnapshot(
  load: () => Promise<HubData>,
  cache?: PublicCache,
  now = Date.now(),
): Promise<HubData> {
  return readPublicSnapshot(
    CATALOGUE_CACHE_KEY,
    hubDataSchema,
    completeCatalogue,
    load,
    cache,
    now,
  );
}

export function publicCache() {
  return (globalThis as typeof globalThis & { caches?: CacheStorage & { default?: Cache } }).caches
    ?.default;
}
