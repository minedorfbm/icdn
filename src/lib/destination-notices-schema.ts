import { z } from "./validation";

const localizedNotice = z.object({
  locale: z.enum(["vi", "ru", "zh", "ko", "ja"]),
  title: z.string().min(1),
  body: z.string().min(1),
  source_title: z.string(),
  source_body: z.string(),
});
export const destinationNoticeRow = z.object({
  id: z.string(),
  destination_id: z.string(),
  kind: z.enum(["information", "relocation", "closure"]),
  title: z.string().min(1),
  body: z.string().min(1),
  starts_at: z.iso.datetime({ offset: true }),
  ends_at: z.iso.datetime({ offset: true }).nullable(),
  display_order: z.number().int(),
  translations: z.array(localizedNotice),
});
export type DestinationNotice = z.infer<typeof destinationNoticeRow>;
