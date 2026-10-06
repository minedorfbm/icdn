import { expect, test } from "bun:test";
import { currentNotices, noticeCopy, type DestinationNotice } from "../src/lib/destination-notices";
const notice: DestinationNotice = {
  id: "temporary",
  destination_id: "la-maison-1888",
  kind: "relocation",
  title: "New location",
  body: "Served at Heaven",
  starts_at: "2026-10-06T00:00:00Z",
  ends_at: "2026-10-08T00:00:00Z",
  display_order: 0,
  translations: [
    {
      locale: "vi",
      title: "Địa điểm mới",
      body: "Tại Heaven",
      source_title: "New location",
      source_body: "Served at Heaven",
    },
  ],
};
test("notices respect start and exclusive end, including cached expired notices", () => {
  expect(currentNotices([notice], Date.parse("2026-10-05T23:59:59Z"))).toEqual([]);
  expect(currentNotices([notice], Date.parse(notice.starts_at))).toEqual([notice]);
  expect(currentNotices([notice], Date.parse(notice.ends_at!))).toEqual([]);
  expect(
    currentNotices([{ ...notice, ends_at: null }], Date.parse("2027-01-01T00:00:00Z")),
  ).toHaveLength(1);
});
test("notice translations require both current source fields", () => {
  expect(noticeCopy(notice, "vi").body).toBe("Tại Heaven");
  expect(noticeCopy({ ...notice, title: "Changed" }, "vi").body).toBe(notice.body);
  expect(noticeCopy({ ...notice, body: "Changed" }, "vi").body).toBe("Changed");
  expect(noticeCopy(notice, "ja").title).toBe(notice.title);
});
