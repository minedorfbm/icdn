import { expect, test } from "bun:test";
import { embeddedResortUrl, isResortPdf } from "../src/lib/resort-browser";

test("resort pages, documents and identified restaurant bookings can open in the hub", () => {
  const links = [
    "https://www.danang.intercontinental.com/dining/citron/",
    "https://danang.intercontinental.com/wp-content/uploads/menu.pdf",
    "https://www.tablecheck.com/fr/intercontinental-danang-la-maison/reserve/landing",
    "https://tablecheck.com/en/intercontinental-danang-tingara/reserve/landing?date=2026-10-01",
  ];
  for (const url of links) expect(embeddedResortUrl(url)).toBe(url);
});

test("only published resort PDFs use the native document viewer", () => {
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
