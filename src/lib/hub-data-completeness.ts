import type { HubData } from "./hub-schema";

export function completeCatalogue(data: HubData): boolean {
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
