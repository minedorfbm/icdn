import { focusDestinationCard } from "./destination-card";
import { readPublicCatalogue } from "./public-catalogue.server";
import { completeCatalogue } from "./hub-data-completeness";
import type { HubData } from "./hub-schema";
import { publicDatabase } from "./public-collection.server";
import { destinationCardSchema, type DestinationCardData } from "./destination-card-schema";

/** Only the requested published card blocks its first HTML. RLS still runs as anon. */
export async function readPublicDestinationCard(
  id: string,
  legacyCatalogueRead: () => Promise<HubData>,
  onCompatibility?: () => void,
): Promise<DestinationCardData | null> {
  const result = await publicDatabase()
    .rpc("published_hub_destination_card_v1", { requested_destination_id: id }, { get: true })
    .retry(false)
    .abortSignal(AbortSignal.timeout(8000));
  if (result.error?.code === "PGRST202") {
    onCompatibility?.();
    // Read fresh: projecting a cached catalogue and caching it again would extend
    // its original publication deadline by another card-cache lifetime.
    const catalogue = await readPublicCatalogue(legacyCatalogueRead);
    if (!completeCatalogue(catalogue)) throw new Error("Card temporarily unavailable");
    return focusDestinationCard(catalogue, id);
  }
  if (result.error) throw new Error("Card temporarily unavailable");
  if (result.data === null) return null;
  const parsed = destinationCardSchema.safeParse(result.data);
  if (!parsed.success) throw new Error("Card temporarily unavailable");
  const card = parsed.data;
  if (
    card.hours?.some((row) => row.destination_id !== id) ||
    card.destination.id !== id ||
    !card.destination.active ||
    [...card.links, ...card.events, ...card.mapLinks, ...card.editorial.descriptions].some(
      (row) => row.destination_id !== id,
    ) ||
    card.mapPlaces.some(
      (row) => !row.active || !card.mapLinks.some((link) => link.place_id === row.id),
    ) ||
    card.mapLinks.some((row) => !row.active) ||
    card.linkTranslations.some((row) => !card.links.some((link) => link.id === row.link_id)) ||
    card.editorial.events.some((row) => !card.events.some((event) => event.id === row.event_id))
  ) {
    throw new Error("Card temporarily unavailable");
  }
  return card;
}
