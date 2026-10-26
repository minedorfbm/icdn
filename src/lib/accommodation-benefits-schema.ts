import { z } from "./validation";

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
