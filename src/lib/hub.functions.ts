import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { readHubSnapshot } from "./hub-cache.server";
import {
  readRows,
  levelRow,
  destinationRow,
  photoRow,
  linkRow,
  eventRow,
  postRow,
  videoRow,
  mapPlaceRow,
  mapLinkRow,
  linkTranslationRow,
  siteLinkTranslationRow,
  descriptionRow,
  eventTranslationRow,
  settingRow,
  type HubData,
} from "./hub-schema";
export type { HubData, LevelRow } from "./hub-schema";

export const getHubData = createServerFn({ method: "GET" }).handler(() => {
  const cache = (globalThis as typeof globalThis & { caches?: CacheStorage & { default?: Cache } })
    .caches?.default;
  return readHubSnapshot(readHubData, cache);
});

export async function readHubData(): Promise<HubData> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const unavailable: HubData = {
    levels: null,
    destinations: null,
    photos: null,
    links: null,
    linkTranslations: null,
    siteLinkTranslations: null,
    events: null,
    posts: null,
    videos: null,
    settings: null,
  };
  if (!url || !key) {
    console.warn("[hub] Supabase configuration missing; catalogue unavailable.");
    return unavailable;
  }

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, {
            ...init,
            headers: h,
            signal: init?.signal ?? AbortSignal.timeout(8000),
          });
        },
      },
    });

    const read = async <T extends import("zod").z.ZodRawShape>(
      table: string,
      schema: import("zod").z.ZodObject<T>,
      filter?: "active" | "published",
      order?: string,
    ) => {
      let query = supabase.from(table).select(schema.keyof().options.join(","), { count: "exact" });
      if (filter) query = query.eq(filter, true);
      if (order) query = query.order(order);
      const result = await query;
      // PostgREST may cap responses. A truncated catalogue must not look like a valid publication.
      if (result.error || (result.count != null && result.count > (result.data?.length ?? 0))) {
        console.error("[hub] Collection unavailable or truncated", { table });
        return null;
      }
      return readRows(result, schema);
    };
    const [
      levels,
      destinations,
      photos,
      links,
      events,
      posts,
      videos,
      settings,
      mapPlaces,
      mapLinks,
      linkTranslations,
      siteLinkTranslations,
      descriptions,
      translatedEvents,
    ] = await Promise.all([
      read("levels", levelRow, undefined, "display_order"),
      read("destinations", destinationRow, "active", "display_order"),
      read("destination_photos", photoRow, "active", "display_order"),
      read("destination_links", linkRow, "active", "display_order"),
      read("destination_events", eventRow, "active", "display_order"),
      read("destination_posts", postRow, "active", "display_order"),
      read("destination_videos", videoRow, "active", "display_order"),
      read("site_settings", settingRow),
      read("map_places", mapPlaceRow, "active", "pin"),
      read("map_destination_links", mapLinkRow, "active", "display_order"),
      read("destination_link_translations", linkTranslationRow, "active"),
      read("site_link_translations", siteLinkTranslationRow, "active"),
      read("destination_translations", descriptionRow, "published"),
      read("event_translations", eventTranslationRow, "published"),
    ]);
    return {
      levels,
      destinations,
      photos,
      links,
      events,
      posts,
      videos,
      mapPlaces,
      mapLinks,
      linkTranslations,
      siteLinkTranslations,
      editorial: { descriptions, events: translatedEvents },
      settings:
        settings === null ? null : Object.fromEntries(settings.map((s) => [s.key, s.value])),
    };
  } catch {
    console.error("[hub] Content request failed; catalogue unavailable.");
    return unavailable;
  }
}
