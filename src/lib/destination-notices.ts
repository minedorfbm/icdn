import type { DestinationNotice } from "./destination-notices-schema";
export type { DestinationNotice } from "./destination-notices-schema";

export function currentNotices(notices: DestinationNotice[], now = Date.now()) {
  return notices.filter(
    (row) =>
      Date.parse(row.starts_at) <= now && (row.ends_at === null || now < Date.parse(row.ends_at)),
  );
}
export function noticeCopy(notice: DestinationNotice, locale: string) {
  const row = notice.translations.find((item) => item.locale === locale);
  return row?.source_title === notice.title && row.source_body === notice.body
    ? { title: row.title, body: row.body }
    : { title: notice.title, body: notice.body };
}
