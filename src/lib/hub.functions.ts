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
  settings: Record<string, string> | null;
}

const readCachedHubData = createTimedCache<HubData>(120_000, (data) => {
  const publicDataComplete = [
    data.levels,
    data.destinations,
    data.photos,
    data.links,
    data.events,
    data.posts,
    data.settings,
  ].every((collection) => collection !== null);
  const editorialComplete =
    !data.editorial || (data.editorial.descriptions !== null && data.editorial.events !== null);
  return publicDataComplete && editorialComplete;
});

/**
 * Public, read-only hub content. Anonymous read policies cover every table
 * queried here — the experience is opened by scanning a QR code, with no login.
 */
export const getHubData = createServerFn({ method: "GET" }).handler(() =>
  readCachedHubData(readHubData),
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

    const [levels, destinations, photos, links, events, posts, settings] = await Promise.all([
      supabase
        .from("levels")
        .select("id, title, line, image_key, clusters, display_order")
        .order("display_order"),
      supabase
        .from("destinations")
        .select(
          "id, name, level_id, cluster, type, short_description, image_key, discover_url, menu_url, price_list_url, breakfast_menu_url, vegetarian_menu_url, vegan_menu_url, lunch_menu_url, dinner_menu_url, booking_url, instagram_url, booking_message, instagram_spot, display_order, active",
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

    for (const [table, result] of Object.entries({
      levels,
      destinations,
      photos,
      links,
      events,
      posts,
      settings,
    })) {
      if (result.error) console.error(`[hub] Unable to read ${table}`, result.error.code);
    }

    const editorial = await readEditorial(supabase);

    return {
      ...(editorial ? { editorial } : {}),
      levels: levels.error ? null : ((levels.data ?? []) as LevelRow[]),
      destinations: destinations.error ? null : ((destinations.data ?? []) as DestinationRow[]),
      photos: photos.error ? null : ((photos.data ?? []) as DestinationPhotoRow[]),
      links: links.error ? null : ((links.data ?? []) as DestinationLinkRow[]),
      events: events.error ? null : ((events.data ?? []) as DestinationEventRow[]),
      posts: posts.error ? null : ((posts.data ?? []) as DestinationPostRow[]),
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
