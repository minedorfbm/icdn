import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type {
  DestinationEventRow,
  DestinationLinkRow,
  DestinationPhotoRow,
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
  levels: LevelRow[];
  destinations: DestinationRow[];
  photos: DestinationPhotoRow[];
  links: DestinationLinkRow[];
  events: DestinationEventRow[];
  settings: Record<string, string>;
}

/**
 * Public, read-only hub content. Anonymous read policies cover every table
 * queried here — the experience is opened by scanning a QR code, with no login.
 */
export const getHubData = createServerFn({ method: "GET" }).handler(async (): Promise<HubData> => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key)
    return { levels: [], destinations: [], photos: [], links: [], events: [], settings: {} };

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const [levels, destinations, photos, links, events, settings] = await Promise.all([
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
      .select("destination_id, title, schedule, description, url, display_order")
      .eq("active", true)
      .order("display_order"),
    supabase.from("site_settings").select("key, value"),
  ]);

  return {
    levels: (levels.data ?? []) as LevelRow[],
    destinations: (destinations.data ?? []) as DestinationRow[],
    photos: (photos.data ?? []) as DestinationPhotoRow[],
    links: (links.data ?? []) as DestinationLinkRow[],
    events: (events.data ?? []) as DestinationEventRow[],
    settings: Object.fromEntries(
      ((settings.data ?? []) as { key: string; value: string }[]).map((s) => [s.key, s.value]),
    ),
  };
});
