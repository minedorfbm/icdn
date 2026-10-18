import { expect, test } from "bun:test";
import { BENSLEY_TOUR_SOURCE, tourCopy } from "../src/features/resort-map/tour-copy";
import { embeddedResortUrl } from "../src/lib/resort-browser";

test("official tour uses the approved resort origin and provides navigation in every hub language", () => {
  expect(embeddedResortUrl(BENSLEY_TOUR_SOURCE)).toBe(BENSLEY_TOUR_SOURCE);
  for (const lang of ["en", "vi", "ru", "zh", "ko", "ja"] as const) {
    expect(tourCopy(lang, "backToMap")).toBeTruthy();
    expect(tourCopy(lang, "source")).toBeTruthy();
  }
});
