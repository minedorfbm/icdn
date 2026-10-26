import type { Lang } from "@/i18n/dictionary";
import type { CollectionItem } from "./destination-collection-schema";
export type { CollectionItem } from "./destination-collection-schema";

/** A source edit must never keep displaying an obsolete translation. */
export function collectionCopy(item: CollectionItem, lang: Lang, field: "title" | "description") {
  const translation = item.translations[lang]?.[field];
  return translation?.source === item[field] && translation.value.trim()
    ? translation.value
    : item[field];
}
