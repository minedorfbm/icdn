import type { HubData } from "./hub-schema";
import type { DestinationCardData } from "./destination-card-schema";
export type { DestinationCardData } from "./destination-card-schema";

/** Presentation adapter only; catalogue readiness remains a separate, explicit state. */
export function cardHubData(card: DestinationCardData): HubData {
  const { destination, hours, ...collections } = card;
  return {
    ...collections,
    ...(hours !== undefined ? { openingHours: hours } : {}),
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
    ...(data.openingHours !== undefined && data.openingHours !== null
      ? { hours: data.openingHours.filter((row) => row.destination_id === id) }
      : {}),
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
