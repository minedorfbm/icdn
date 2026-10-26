import type { Lang } from "@/i18n/dictionary";
import type { BenefitContent } from "./accommodation-benefits-schema";
export type { BenefitContent } from "./accommodation-benefits-schema";

/** Never show a translation after the marketing team has changed its source. */
export function localizedBenefits(content: BenefitContent, locale: Lang): string[] {
  const group = content.group;
  if (!group) return [];
  const translated = content.translations.find(
    (row) =>
      row.benefits_id === group.id &&
      row.locale === locale &&
      JSON.stringify(row.source_items) === JSON.stringify(group.items),
  );
  return translated?.items ?? group.items;
}
