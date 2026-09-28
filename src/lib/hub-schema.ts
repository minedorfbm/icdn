import { z } from "zod";

// Validate at the server boundary; frontend types are inferred, never asserted from JSON.
const text = z.string();
const optionalText = text.nullable();
const order = z.number().int();
export const levelId = z.enum(["heaven", "sky", "earth", "sea"]);
export const destinationType = z.enum([
  "restaurant",
  "bar",
  "spa",
  "experience",
  "pool",
  "fitness",
  "kids",
  "retail",
  "gallery",
  "accommodation",
  "service",
  "beach",
  "recreation",
]);
export const levelRow = z.object({
  id: levelId,
  title: text,
  line: text,
  image_key: optionalText,
  clusters: z.array(text),
  display_order: order,
});
export const destinationRow = z.object({
  id: text,
  name: text,
  level_id: levelId,
  cluster: optionalText,
  type: destinationType,
  short_description: text,
  image_key: optionalText,
  instagram_spot: z.boolean().nullable().optional(),
  display_order: order,
  active: z.boolean(),
});
export const photoRow = z.object({
  destination_id: text,
  image_url: text,
  caption: optionalText,
  post_url: optionalText,
  display_order: order,
});
export const linkRow = z.object({
  id: text.optional(),
  destination_id: text,
  kind: text,
  label: optionalText,
  url: text,
  display_order: order,
});
export const eventRow = z.object({
  id: text.optional(),
  destination_id: text,
  title: text,
  schedule: z.array(text),
  description: text,
  url: optionalText,
  display_order: order,
});
export const postRow = z.object({
  destination_id: text,
  post_url: text,
  account: optionalText,
  caption: optionalText,
  image_url: optionalText,
  posted_at: optionalText,
  display_order: order,
});
export const videoRow = z.object({
  destination_id: text,
  video_url: text,
  title: text,
  title_translations: z.record(text, text).nullable(),
  display_order: order,
});
export const mapPlaceRow = z.object({
  id: text,
  name: text,
  level_id: levelId,
  pin: order,
  x: z.number().finite(),
  y: z.number().finite(),
  zoom: z.number().positive(),
  active: z.boolean(),
});
export const mapLinkRow = z.object({
  place_id: text,
  destination_id: text,
  display_order: order,
  is_primary: z.boolean(),
  active: z.boolean(),
});
const linkTranslation = z.object({ locale: text, url: text, source_url: text });
export const linkTranslationRow = linkTranslation.extend({ link_id: text });
export const siteLinkTranslationRow = linkTranslation.extend({ setting_key: text });
export const descriptionRow = z.object({
  destination_id: text,
  locale: text,
  description: text,
  source_description: text,
});
export const eventTranslationRow = z.object({
  event_id: text,
  locale: text,
  title: text,
  schedule: z.array(text),
  description: text,
  source_title: text,
  source_schedule: z.array(text),
  source_description: text,
});
export const settingRow = z.object({ key: text, value: text });
export const hubDataSchema = z.object({
  levels: z.array(levelRow).nullable(),
  destinations: z.array(destinationRow).nullable(),
  photos: z.array(photoRow).nullable(),
  links: z.array(linkRow).nullable(),
  events: z.array(eventRow).nullable(),
  posts: z.array(postRow).nullable(),
  videos: z.array(videoRow).nullable(),
  settings: z.record(text, text).nullable(),
  mapPlaces: z.array(mapPlaceRow).nullable().optional(),
  mapLinks: z.array(mapLinkRow).nullable().optional(),
  linkTranslations: z.array(linkTranslationRow).nullable().optional(),
  siteLinkTranslations: z.array(siteLinkTranslationRow).nullable().optional(),
  editorial: z
    .object({
      descriptions: z.array(descriptionRow).nullable(),
      events: z.array(eventTranslationRow).nullable(),
    })
    .optional(),
});
export type HubData = z.infer<typeof hubDataSchema>;
export type LevelRow = z.infer<typeof levelRow>;

/** A malformed collection is unavailable, never silently truncated or partially published. */
export function readRows<T>(
  result: { error: unknown; data: unknown },
  schema: z.ZodType<T>,
): T[] | null {
  if (result.error) return null;
  const parsed = z.array(schema).safeParse(result.data);
  if (!parsed.success) {
    console.error("[hub] Invalid collection shape");
    return null;
  }
  return parsed.data;
}
