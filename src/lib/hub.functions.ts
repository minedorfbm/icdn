import { completeCatalogue } from "./hub-data-completeness";
import { readPublicDestinationCard } from "./public-destination-card.server";
import { destinationCardSchema, focusDestinationCard } from "./destination-card-schema";
import { createServerFn } from "@tanstack/react-start";
import { z } from "./validation";
import { collectionItemRow } from "./destination-collection";
import { destinationNoticeRow } from "./destination-notices";
import { openingHoursRow } from "./opening-hours";
import { publicReader } from "./public-collection.server";
import { readPublicCatalogue } from "./public-catalogue.server";
import { readPublicDestinationMedia } from "./public-destination-media.server";
import { destinationMediaSchema } from "./destination-media-schema";
export type { DestinationMediaData } from "./destination-media-schema";
import { withPublicReadTiming } from "./public-read-timing.server";
import { readHubSnapshot, readPublicSnapshot, publicCache } from "./hub-cache.server";
import {
  levelRow,
  destinationRow,
  destinationRelationRow,
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
export type { HubData } from "./hub-schema";

// Only settings block the homepage; its catalogue loads after the hero is displayed.
export const getHubSettings = createServerFn({ method: "GET" }).handler(() =>
  withPublicReadTiming("settings", (markSource) =>
    readPublicSnapshot(
      "settings-v1",
      z.record(z.string(), z.string()).nullable(),
      (data) => data !== null,
      async () => {
        markSource("database");
        const rows = await publicReader()("site_settings", settingRow);
        return rows === null ? null : Object.fromEntries(rows.map((row) => [row.key, row.value]));
      },
      publicCache(),
    ),
  ),
);

export const getHubData = createServerFn({ method: "GET" }).handler(() =>
  withPublicReadTiming("catalogue", async (markSource) => {
    const data = await readHubSnapshot(() => {
      markSource("rpc");
      return readPublicCatalogue(() => {
        markSource("compatibility");
        return readHubData();
      });
    }, publicCache());
    if (!data.levels || !data.destinations) throw new Error("Catalogue temporarily unavailable");
    return data;
  }),
);

async function readHubData(): Promise<HubData> {
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
    relations,
  ] = await Promise.all([
    read("levels", levelRow, undefined, "display_order"),
    read("destinations", destinationRow, "active", "display_order"),
    read("destination_links", linkRow, "active", "display_order"),
    read("published_destination_events", eventRow, "active", "display_order"),
    read("map_places", mapPlaceRow, "active", "pin"),
    read("map_destination_links", mapLinkRow, "active", "display_order"),
    read("destination_link_translations", linkTranslationRow, "active"),
    read("site_link_translations", siteLinkTranslationRow, "active"),
    read("destination_translations", descriptionRow, "published"),
    read("event_translations", eventTranslationRow, "published"),
    read("destination_relations", destinationRelationRow, "active", "display_order"),
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
    relations,
    // These belong to independent loading stages, not to the catalogue cache.
    settings: {},
  };
}

export const getDestinationMedia = createServerFn({ method: "GET" })
  .validator(
    z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/),
  )
  .handler(({ data: id }) =>
    withPublicReadTiming("media", (markSource) =>
      readPublicSnapshot(
        `media-v4/${id}`,
        destinationMediaSchema,
        (data) => Object.values(data).every((rows) => rows !== null),
        () => {
          markSource("rpc");
          return readPublicDestinationMedia(id, () => {
            markSource("compatibility");
            return readDestinationMedia(id);
          });
        },
        publicCache(),
      ),
    ),
  );

async function readDestinationMedia(id: string) {
  const read = publicReader();
  // This public endpoint must also check publication when called independently of the catalogue.
  const published = await read("destinations", destinationRow, "active", undefined, id, "id");
  if (published === null) throw new Error("Catalogue temporarily unavailable");
  if (!published.length)
    return { photos: [], posts: [], videos: [], hours: [], notices: [], collection: [] };
  const [photos, posts, videos, hours, notices, collection] = await Promise.all([
    read("destination_photos", photoRow, "active", "display_order", id),
    read("destination_posts", postRow, "active", "display_order", id),
    read("destination_videos", videoRow, "active", "display_order", id),
    read("destination_opening_hours", openingHoursRow, "published", "display_order", id),
    read("published_destination_notices", destinationNoticeRow, undefined, "display_order", id),
    read("destination_collection_items", collectionItemRow, "active", "display_order", id),
  ]);
  return { photos, posts, videos, hours, notices, collection };
}

export const getDestinationCard = createServerFn({ method: "GET" })
  .validator(
    z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/),
  )
  .handler(({ data: id }) =>
    withPublicReadTiming("card", (markSource) =>
      readPublicSnapshot(
        `card-v1/${id}`,
        destinationCardSchema.nullable(),
        (data) => data !== null,
        () => {
          markSource("rpc");
          return readPublicDestinationCard(id, async () => {
            markSource("compatibility");
            const catalogue = await getHubData();
            if (!completeCatalogue(catalogue)) throw new Error("Card temporarily unavailable");
            return focusDestinationCard(catalogue, id);
          });
        },
        publicCache(),
      ),
    ),
  );
