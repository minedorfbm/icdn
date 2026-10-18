import { z } from "./validation";
import type { Lang } from "@/i18n/dictionary";

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

/** A source edit must never keep displaying an obsolete translation. */
export function collectionCopy(item: CollectionItem, lang: Lang, field: "title" | "description") {
  const translation = item.translations[lang]?.[field];
  return translation?.source === item[field] && translation.value.trim()
    ? translation.value
    : item[field];
}
