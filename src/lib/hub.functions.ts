import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { destinationNoticeRow } from "./destination-notices";
import { openingHoursRow } from "./opening-hours";
import { publicReader } from "./public-collection.server";
import { readHubSnapshot, readPublicSnapshot, publicCache } from "./hub-cache.server";
import {
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

// Only settings block the homepage; its catalogue loads after the hero is displayed.
export const getHubSettings = createServerFn({ method: "GET" }).handler(() =>
  readPublicSnapshot(
    "settings-v1",
    z.record(z.string(), z.string()).nullable(),
    (data) => data !== null,
    async () => {
      const rows = await publicReader()("site_settings", settingRow);
      return rows === null ? null : Object.fromEntries(rows.map((row) => [row.key, row.value]));
    },
    publicCache(),
  ),
);

export const getHubData = createServerFn({ method: "GET" }).handler(async () => {
  const data = await readHubSnapshot(readHubData, publicCache());
  if (!data.levels || !data.destinations) throw new Error("Catalogue temporarily unavailable");
  return data;
});

export async function readHubData(): Promise<HubData> {
  const read = publicReader();
  const [
    levels,
    destinations,
    links,
    events,
    mapPlaces,
    mapLinks,
    linkTranslations,
    siteLinkTranslations,
    descriptions,
    translatedEvents,
  ] = await Promise.all([
    read("levels", levelRow, undefined, "display_order"),
    read("destinations", destinationRow, "active", "display_order"),
    read("destination_links", linkRow, "active", "display_order"),
    read("destination_events", eventRow, "active", "display_order"),
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
    links,
    events,
    mapPlaces,
    mapLinks,
    linkTranslations,
    siteLinkTranslations,
    editorial: { descriptions, events: translatedEvents },
    // These belong to independent loading stages, not to the catalogue cache.
    settings: {},
    photos: [],
    posts: [],
    videos: [],
  };
}

const mediaSchema = z.object({
  photos: z.array(photoRow).nullable(),
  posts: z.array(postRow).nullable(),
  videos: z.array(videoRow).nullable(),
  hours: z.array(openingHoursRow).nullable(),
  notices: z.array(destinationNoticeRow).nullable(),
});
export type DestinationMediaData = z.infer<typeof mediaSchema>;
export const getDestinationMedia = createServerFn({ method: "GET" })
  .inputValidator(
    z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/),
  )
  .handler(({ data: id }) =>
    readPublicSnapshot(
      `media-v3/${id}`,
      mediaSchema,
      (data) => Object.values(data).every((rows) => rows !== null),
      async () => {
        const read = publicReader();
        // The catalogue checks publication before this endpoint is requested. Recheck it
        // here too: this endpoint is public and can be called independently of the UI.
        const published = await read("destinations", destinationRow, "active", undefined, id, "id");
        if (published === null) throw new Error("Catalogue temporarily unavailable");
        if (!published.length) return { photos: [], posts: [], videos: [], hours: [], notices: [] };
        const [photos, posts, videos, hours, notices] = await Promise.all([
          read("destination_photos", photoRow, "active", "display_order", id),
          read("destination_posts", postRow, "active", "display_order", id),
          read("destination_videos", videoRow, "active", "display_order", id),
          read("destination_opening_hours", openingHoursRow, "published", "display_order", id),
          read(
            "published_destination_notices",
            destinationNoticeRow,
            undefined,
            "display_order",
            id,
          ),
        ]);
        return { photos, posts, videos, hours, notices };
      },
      publicCache(),
    ),
  );
