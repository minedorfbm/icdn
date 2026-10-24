import { z } from "./validation";
import {
  destinationRow,
  linkRow,
  eventRow,
  mapPlaceRow,
  mapLinkRow,
  linkTranslationRow,
  descriptionRow,
  eventTranslationRow,
  type HubData,
} from "./hub-schema";

/** Explicitly focused data: never prime the complete catalogue cache with this payload. */
export const destinationCardSchema = z.object({
  destination: destinationRow,
  links: z.array(linkRow),
  events: z.array(eventRow),
  mapPlaces: z.array(mapPlaceRow),
  mapLinks: z.array(mapLinkRow),
  linkTranslations: z.array(linkTranslationRow),
  editorial: z.object({
    descriptions: z.array(descriptionRow),
    events: z.array(eventTranslationRow),
  }),
});
export type DestinationCardData = z.infer<typeof destinationCardSchema>;

/** Presentation adapter only; catalogue readiness remains a separate, explicit state. */
export function cardHubData(card: DestinationCardData): HubData {
  const { destination, ...collections } = card;
  return {
    ...collections,
    scope: "card",
    destinations: [destination],
    levels: [],
    relations: [],
    settings: {},
    siteLinkTranslations: [],
  };
}

export function focusDestinationCard(data: HubData, id: string): DestinationCardData | null {
  const destination = data.destinations?.find((row) => row.id === id && row.active);
  if (!destination) return null;
  const links = (data.links ?? []).filter((row) => row.destination_id === id);
  const events = (data.events ?? []).filter((row) => row.destination_id === id);
  const mapLinks = (data.mapLinks ?? []).filter((row) => row.destination_id === id);
  return {
    destination,
    links,
    events,
    mapLinks,
    mapPlaces: (data.mapPlaces ?? []).filter((row) =>
      mapLinks.some((link) => link.place_id === row.id),
    ),
    linkTranslations: (data.linkTranslations ?? []).filter((row) =>
      links.some((link) => link.id === row.link_id),
    ),
    editorial: {
      descriptions: (data.editorial?.descriptions ?? []).filter((row) => row.destination_id === id),
      events: (data.editorial?.events ?? []).filter((row) =>
        events.some((event) => event.id === row.event_id),
      ),
    },
  };
}
