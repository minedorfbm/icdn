import { z } from "zod";

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
  starts_at: z.string().datetime({ offset: true }),
  ends_at: z.string().datetime({ offset: true }).nullable(),
  display_order: z.number().int(),
  translations: z.array(localizedNotice),
});
export type DestinationNotice = z.infer<typeof destinationNoticeRow>;

export function currentNotices(notices: DestinationNotice[], now = Date.now()) {
  return notices.filter(
    (row) =>
      Date.parse(row.starts_at) <= now && (row.ends_at === null || now < Date.parse(row.ends_at)),
  );
}
export function noticeCopy(notice: DestinationNotice, locale: string) {
  const row = notice.translations.find((item) => item.locale === locale);
  return row && row.source_title === notice.title && row.source_body === notice.body
    ? { title: row.title, body: row.body }
    : { title: notice.title, body: notice.body };
}
