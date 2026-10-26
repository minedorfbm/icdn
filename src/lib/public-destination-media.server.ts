import { publicDatabase } from "./public-collection.server";
import { destinationMediaSchema, type DestinationMediaData } from "./destination-media-schema";

/** Publication and the opened card's six collections share one anonymous snapshot. */
export async function readPublicDestinationMedia(
  id: string,
  legacyRead: () => Promise<DestinationMediaData>,
): Promise<DestinationMediaData> {
  const result = await publicDatabase()
    .rpc("published_hub_destination_media_v1", { requested_destination_id: id }, { get: true })
    .retry(false)
    .abortSignal(AbortSignal.timeout(8000));
  if (result.error?.code === "PGRST202") return legacyRead();
  if (result.error) throw new Error("Media temporarily unavailable");
  const parsed = destinationMediaSchema.safeParse(result.data);
  if (!parsed.success) throw new Error("Media temporarily unavailable");
  const collections = Object.values(parsed.data);
  if (collections.some((rows) => rows === null || rows.some((row) => row.destination_id !== id))) {
    throw new Error("Media temporarily unavailable");
  }
  return parsed.data;
}
