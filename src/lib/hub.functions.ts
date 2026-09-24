import type {
  EditorialTranslations,
  DescriptionTranslation,
  EventTranslation,
} from "@/i18n/editorial";
import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createTimedCache } from "./timed-cache";
import type {
  DestinationEventRow,
  DestinationLinkRow,
  DestinationPhotoRow,
  DestinationPostRow,
  DestinationVideoRow,
  DestinationRow,
} from "@/data/resort";

export interface LevelRow {
  id: string;
  title: string;
  line: string;
  image_key: string | null;
  clusters: string[];
  display_order: number;
}

export interface HubData {
  editorial?: EditorialTranslations;
  levels: LevelRow[] | null;
  destinations: DestinationRow[] | null;
  photos: DestinationPhotoRow[] | null;
  links: DestinationLinkRow[] | null;
  events: DestinationEventRow[] | null;
  posts: DestinationPostRow[] | null;
  videos: DestinationVideoRow[] | null;
  settings: Record<string, string> | null;
}

function isCompleteHubData(data: HubData): boolean {
  const publicDataComplete = [
    data.levels,
    data.destinations,
    data.photos,
    data.links,
    data.events,
    data.posts,
    data.videos,
    data.settings,
  ].every((collection) => collection !== null);
  const editorialComplete =
    !data.editorial || (data.editorial.descriptions !== null && data.editorial.events !== null);
  return publicDataComplete && editorialComplete;
}

const readCachedHubData = createTimedCache<HubData>(120_000, isCompleteHubData);

const CACHE_URL = "https://icdnd.artdigitaljourney.com/__cache/public-hub-v1";
const CACHE_SECONDS = 120;

/** Reuse complete public data across Worker instances in the same Cloudflare data center. */
async function readEdgeCachedHubData(): Promise<HubData> {
  const edgeCache = (
    globalThis as typeof globalThis & { caches?: CacheStorage & { default?: Cache } }
  ).caches?.default;
  if (edgeCache) {
    try {
      const response = await edgeCache.match(CACHE_URL);
      if (response?.ok) return (await response.json()) as HubData;
    } catch {
      // Local previews and cache outages still use the database directly.
    }
  }

  const data = await readHubData();
  if (edgeCache && isCompleteHubData(data)) {
    try {
      await edgeCache.put(
        CACHE_URL,
        new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `public, max-age=${CACHE_SECONDS}`,
          },
        }),
      );
    } catch {
      // Cache storage is an optimization, never a prerequisite for serving the hub.
    }
  }
  return data;
}

/**
 * Public, read-only hub content. Anonymous read policies cover every table
 * queried here — the experience is opened by scanning a QR code, with no login.
 */
export const getHubData = createServerFn({ method: "GET" }).handler(() =>
  readCachedHubData(readEdgeCachedHubData),
);

async function readHubData(): Promise<HubData> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const unavailable: HubData = {
    levels: null,
    destinations: null,
    photos: null,
    links: null,
    events: null,
    posts: null,
    videos: null,
    settings: null,
  };
  if (!url || !key) {
    console.warn("[hub] Supabase configuration missing; using bundled content.");
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

    const editorialPromise = readEditorial(supabase);
    const videosPromise = Promise.resolve(
      supabase
        .from("destination_videos")
        .select("destination_id, video_url, title, title_translations, display_order")
        .eq("active", true)
        .order("display_order"),
    );
    const [levels, destinations, photos, links, events, posts, settings] = await Promise.all([
      supabase
        .from("levels")
        .select("id, title, line, image_key, clusters, display_order")
        .order("display_order"),
      supabase
        .from("destinations")
        .select(
          "id, name, level_id, cluster, type, short_description, image_key, instagram_spot, display_order, active",
        )
        .eq("active", true)
        .order("display_order"),
      supabase
        .from("destination_photos")
        .select("destination_id, image_url, caption, post_url, display_order")
        .eq("active", true)
        .order("display_order"),
      supabase
        .from("destination_links")
        .select("destination_id, kind, label, url, display_order")
        .eq("active", true)
        .order("display_order"),
      supabase
        .from("destination_events")
        .select("id, destination_id, title, schedule, description, url, display_order")
        .eq("active", true)
        .order("display_order"),
      supabase
        .from("destination_posts")
        .select("destination_id, post_url, account, caption, image_url, posted_at, display_order")
        .eq("active", true)
        .order("display_order"),
      supabase.from("site_settings").select("key, value"),
    ]);
    const videos = await videosPromise;

    for (const [table, result] of Object.entries({
      levels,
      destinations,
      photos,
      links,
      events,
      posts,
      videos,
      settings,
    })) {
      if (result.error) console.error(`[hub] Unable to read ${table}`, result.error.code);
    }

    const editorial = await editorialPromise;

    return {
      ...(editorial ? { editorial } : {}),
      levels: levels.error ? null : ((levels.data ?? []) as LevelRow[]),
      destinations: destinations.error ? null : ((destinations.data ?? []) as DestinationRow[]),
      photos: photos.error ? null : ((photos.data ?? []) as DestinationPhotoRow[]),
      links: links.error ? null : ((links.data ?? []) as DestinationLinkRow[]),
      events: events.error ? null : ((events.data ?? []) as DestinationEventRow[]),
      posts: posts.error ? null : ((posts.data ?? []) as DestinationPostRow[]),
      videos: videos.error ? null : ((videos.data ?? []) as DestinationVideoRow[]),
      settings: settings.error
        ? null
        : Object.fromEntries(
            ((settings.data ?? []) as { key: string; value: string }[]).map((s) => [
              s.key,
              s.value,
            ]),
          ),
    };
  } catch {
    console.error("[hub] Content request failed; using bundled content.");
    return unavailable;
  }
}

async function readEditorial(supabase: SupabaseClient): Promise<EditorialTranslations | undefined> {
  if (process.env["HUB_TRANSLATIONS_FROM_DATABASE"] !== "true") return undefined;
  const [descriptions, eventTranslations] = await Promise.all([
    supabase
      .from("destination_translations")
      .select("destination_id, locale, description, source_description")
      .eq("published", true),
    supabase
      .from("event_translations")
      .select(
        "event_id, locale, title, schedule, description, source_title, source_schedule, source_description",
      )
      .eq("published", true),
  ]);
  if (descriptions.error || eventTranslations.error) {
    console.error(
      "[hub] Translation storage unavailable; using source-checked bundled translations.",
    );
  }
  return {
    descriptions: descriptions.error
      ? null
      : ((descriptions.data ?? []) as DescriptionTranslation[]),
    events: eventTranslations.error ? null : ((eventTranslations.data ?? []) as EventTranslation[]),
  };
}
