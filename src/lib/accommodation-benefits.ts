import { z } from "./validation";
import type { Lang } from "@/i18n/dictionary";

const items = z.array(z.string().trim().min(1)).min(1).max(40);
export const benefitRow = z.object({ id: z.string(), items });
export const benefitTranslationRow = z.object({
  benefits_id: z.string(),
  locale: z.enum(["en", "vi", "ru", "zh", "ko", "ja"]),
  items,
  source_items: items,
});
export const benefitContent = z.object({
  group: benefitRow.nullable(),
  translations: z.array(benefitTranslationRow),
});
export type BenefitContent = z.infer<typeof benefitContent>;

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
