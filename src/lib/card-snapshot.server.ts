import { focusDestinationCard } from "./destination-card";
import {
  CATALOGUE_CACHE_KEY,
  peekPublicSnapshot,
  readPublicSnapshot,
  type PublicCache,
} from "./hub-cache.server";
import { hubDataSchema } from "./hub-schema";
import { completeCatalogue } from "./hub-data-completeness";
import { destinationCardSchema, type DestinationCardData } from "./destination-card-schema";

const cardSchema = destinationCardSchema.nullable();
// A focused payload (including its scope marker) must never impersonate a full catalogue.
const catalogueSchema = hubDataSchema.strict();

/** Prefer the card's own snapshot, then reuse a still-valid complete catalogue.
 * A derived card is returned without a new cache write: its source deadline stays authoritative. */
export async function readCardSnapshot(
  id: string,
  load: () => Promise<DestinationCardData | null>,
  cache?: PublicCache,
  now = Date.now(),
  onCatalogueHit?: () => void,
): Promise<DestinationCardData | null> {
  const key = `card-v3/${id}`;
  const completeCard = (data: DestinationCardData | null) =>
    data !== null && data.destination.id === id && data.destination.active;
  const card = await peekPublicSnapshot(key, cardSchema, completeCard, cache, now);
  if (card !== undefined) return card;
  const catalogue = await peekPublicSnapshot(
    CATALOGUE_CACHE_KEY,
    catalogueSchema,
    completeCatalogue,
    cache,
    now,
  );
  if (catalogue !== undefined) {
    onCatalogueHit?.();
    return focusDestinationCard(catalogue, id);
  }
  return readPublicSnapshot(key, cardSchema, completeCard, load, cache, now);
}
