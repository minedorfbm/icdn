import { expect, test } from "bun:test";
import { embeddedResortUrl, isResortPdf, resortLinkTarget } from "../src/lib/resort-browser";

test("resort pages, documents and identified restaurant bookings can open in the hub", () => {
  const links = [
    "https://www.danang.intercontinental.com/dining/citron/",
    "https://danang.intercontinental.com/wp-content/uploads/menu.pdf",
    "https://www.tablecheck.com/fr/intercontinental-danang-la-maison/reserve/landing",
    "https://tablecheck.com/en/intercontinental-danang-tingara/reserve/landing?date=2026-10-01",
  ];
  for (const url of links) expect(embeddedResortUrl(url)).toBe(url);
});

test("only published resort PDFs use the in-hub PDF reader", () => {
  expect(
    isResortPdf("https://www.danang.intercontinental.com/wp-content/uploads/2025/menu.pdf?v=2"),
  ).toBe(true);
  for (const url of [
    "https://www.danang.intercontinental.com/dining/citron/?menu=file.pdf",
    "https://www.danang.intercontinental.com/dining/menu.pdf",
    "https://www.danang.intercontinental.com.evil.example/wp-content/uploads/menu.pdf",
    "http://www.danang.intercontinental.com/wp-content/uploads/menu.pdf",
    "https://www.tablecheck.com/fr/intercontinental-danang-la-maison/reserve/file.pdf",
  ])
    expect(isResortPdf(url)).toBe(false);
});

test("lookalike domains, credentials, unsafe schemes and unrelated bookings are never embedded", () => {
  const links = [
    "javascript:alert(1)",
    "http://www.danang.intercontinental.com/",
    "https://www.danang.intercontinental.com.evil.example/",
    "https://www.danang.intercontinental.com@evil.example/",
    "https://user:password@www.danang.intercontinental.com/",
    "https://www.danang.intercontinental.com:8443/",
    "https://www.tablecheck.com/fr/another-resort/reserve/landing",
    "https://www.tablecheck.com/fr/intercontinental-danang-tingara/reservex/landing",
    "https://www.youtube.com/@ICDanang",
    "https://www.instagram.com/intercontinentaldanang/",
    "mailto:misolspa@icdanang.com",
    "tel:+842363938888",
    "/relative-path",
  ];
  for (const url of links) expect(embeddedResortUrl(url)).toBeUndefined();
});

test("IHG Rewards and app downloads are not embedded", () => {
  for (const url of [
    "https://www.ihg.com/onerewards/content/us/en/home",
    "https://apps.apple.com/fr/app/h%C3%B4tels-ihg-r%C3%A9compenses/id368217298",
    "https://play.google.com/store/apps/details?id=com.ihg.apps.android",
  ])
    expect(embeddedResortUrl(url)).toBeUndefined();
});

test("Rewards pages open in the same tab without broadening other external links", () => {
  for (const url of [
    "https://www.ihg.com/onerewards/content/us/en/home",
    "https://www.ihg.com/onerewards/content/gb/ja/home",
    "https://ihg.com/onerewards/content/gb/zh/home?campaign=hub",
  ])
    expect(resortLinkTarget(url)).toBe("_self");
  for (const url of [
    "https://www.ihg.com/hotels/",
    "https://www.ihg.com.evil.example/onerewards/content/us/en/home",
    "https://play.google.com/store/apps/details?id=com.ihg.apps.android",
    "javascript:alert(1)",
  ])
    expect(resortLinkTarget(url)).toBe("_blank");
});
