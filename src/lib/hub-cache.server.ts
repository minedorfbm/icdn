import { hubDataSchema, type HubData } from "./hub-schema";

const CACHE_URL = "https://icdn.artdigitaljourney.com/__cache/public-hub-v4";
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

/** One cache, a hard expiry, and no stale fallback: fresh successful collections always win. */
export async function readHubSnapshot(
  load: () => Promise<HubData>,
  cache?: PublicCache,
  now = Date.now(),
): Promise<HubData> {
  if (cache) {
    try {
      const response = await cache.match(CACHE_URL);
      const expires = Number(response?.headers.get("x-hub-expires"));
      if (response?.ok && expires > now && expires <= now + TTL_MS) {
        const parsed = hubDataSchema.safeParse(await response.json());
        if (parsed.success && complete(parsed.data)) return parsed.data;
      }
    } catch {
      /* The database remains available when cache storage fails. */
    }
  }
  const data = await load();
  if (cache && complete(data)) {
    try {
      await cache.put(
        CACHE_URL,
        new Response(JSON.stringify(data), {
          headers: {
            "content-type": "application/json",
            "cache-control": `public, max-age=${TTL_MS / 1000}`,
            "x-hub-expires": String(now + TTL_MS),
          },
        }),
      );
    } catch {
      /* Caching is optional. Never replace fresh data with an older response. */
    }
  }
  return data;
}
