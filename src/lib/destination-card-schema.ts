import { z } from "./validation";
import { openingHoursRow } from "./opening-hours-schema";
import {
  destinationRow,
  linkRow,
  eventRow,
  mapPlaceRow,
  mapLinkRow,
  linkTranslationRow,
  descriptionRow,
  eventTranslationRow,
} from "./hub-schema";

/** Explicitly focused data: never prime the complete catalogue cache with this payload. */
export const destinationCardSchema = z.object({
  destination: destinationRow,
  hours: z.array(openingHoursRow).optional(),
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
