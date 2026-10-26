import { z } from "./validation";

const translatedText = z.object({ source: z.string(), value: z.string() });
export const collectionItemRow = z.object({
  destination_id: z.string(),
  key: z.string(),
  target_destination_id: z.string(),
  title: z.string(),
  description: z.string(),
  translations: z.record(
    z.string(),
    z.object({ title: translatedText, description: translatedText }),
  ),
  display_order: z.number().int(),
});
export type CollectionItem = z.infer<typeof collectionItemRow>;
