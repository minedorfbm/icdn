import { hubDataSchema, type HubData } from "./hub-schema";

import type { z } from "zod";

const CACHE_ROOT = "https://icdn.artdigitaljourney.com/__cache/";
const TTL_MS = 120_000;
type PublicCache = Pick<Cache, "match" | "put">;

function complete(data: HubData): boolean {
  return (
    Object.values(data).every((value) => value !== null) &&
    data.mapPlaces != null &&
    data.mapLinks != null &&
    data.linkTranslations != null &&
    data.siteLinkTranslations != null &&
    data.editorial?.descriptions != null &&
    data.editorial.events != null
  );
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
  if (cache) {
    try {
      const response = await cache.match(url);
      const expires = Number(response?.headers.get("x-hub-expires"));
      if (response?.ok && expires > now && expires <= now + TTL_MS) {
        const parsed = schema.safeParse(await response.json());
        if (parsed.success && isComplete(parsed.data)) return parsed.data;
      }
    } catch {
      /* The database remains available when cache storage fails. */
    }
  }
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
  return readPublicSnapshot("catalogue-v6", hubDataSchema, complete, load, cache, now);
}

export function publicCache() {
  return (globalThis as typeof globalThis & { caches?: CacheStorage & { default?: Cache } }).caches
    ?.default;
}
