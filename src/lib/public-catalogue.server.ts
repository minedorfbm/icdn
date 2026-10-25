import { publicDatabase } from "./public-collection.server";
import { hubDataSchema, type HubData } from "./hub-schema";
import { completeCatalogue } from "./hub-data-completeness";

const catalogueSnapshotSchema = hubDataSchema.required().partial({ openingHours: true });

/** One anonymous, read-only database snapshot instead of eleven HTTP reads. */
export async function readPublicCatalogue(legacyRead: () => Promise<HubData>): Promise<HubData> {
  const result = await publicDatabase()
    .rpc("published_hub_catalogue_v1", {}, { get: true })
    .retry(false)
    .abortSignal(AbortSignal.timeout(8000));
  // Frontend and database deployments are independent. Only an absent RPC uses
  // the previous reader; an outage or malformed snapshot must remain retryable.
  if (result.error?.code === "PGRST202") return legacyRead();
  if (result.error) throw new Error("Catalogue temporarily unavailable");
  const parsed = catalogueSnapshotSchema.safeParse(result.data);
  if (!parsed.success || !completeCatalogue(parsed.data)) {
    throw new Error("Catalogue temporarily unavailable");
  }
  return parsed.data;
}
