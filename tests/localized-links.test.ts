import { describe, expect, test } from "bun:test";
import { groupLinks, DESTINATIONS } from "../src/data/resort";
import { createHubValue } from "../src/data/hub-value";
import { actionsFor } from "../src/lib/destination-actions";
import { currentLinkTranslations, localizedLinkUrl } from "../src/lib/localized-links";
import { LANGUAGES } from "../src/i18n/dictionary";
import type { HubData } from "../src/lib/hub.functions";

const original = "https://www.danang.intercontinental.com/dining/citron/";
const japanese = "https://www.danang.intercontinental.com/ja/dining/citron/";
const translated = {
  link_id: "citron-discover",
  locale: "ja",
  source_url: original,
  url: japanese,
};
const row = {
  id: "citron-discover",
  destination_id: "citron",
  kind: "DISCOVER",
  url: original,
  label: null,
  display_order: 0,
};

describe("language-specific discovery links", () => {
  test("both card and full detail resolve the selected language without duplicating actions", () => {
    const links = groupLinks([row], [translated])["citron"]!;
    const dest = { ...DESTINATIONS.find((d) => d.id === "citron")!, links };
    expect(actionsFor(dest, 3, "ja")).toEqual(actionsFor(dest, undefined, "ja"));
    expect(actionsFor(dest, undefined, "ja")[0]?.url).toBe(japanese);
    for (const { code } of LANGUAGES.filter((l) => l.code !== "ja")) {
      expect(actionsFor(dest, 3, code)[0]?.url).toBe(original);
    }
    expect(dest.links[0]?.url).toBe(original);
  });

  test("shared menus, bookings and other actions never use variants", () => {
    const variants = { ja: japanese };
    for (const kind of [
      "MENU",
      "BREAKFAST_MENU",
      "DINNER_MENU",
      "BOOK",
      "BROCHURE",
      "INSTAGRAM",
      "DETAILS",
    ]) {
      expect(localizedLinkUrl(kind, original, variants, "ja")).toBe(original);
    }
    expect(localizedLinkUrl("WEBSITE", original, variants, "ja")).toBe(japanese);
  });

  test("unavailable translations and stale source URLs retain the current shared URL", () => {
    expect(currentLinkTranslations([translated], "https://example.com/new-page")).toEqual({});
    expect(currentLinkTranslations([{ ...translated, locale: "xx" }], original)).toEqual({});
    for (const rows of [
      [],
      [{ ...translated, link_id: "another-link" }],
      [{ ...translated, source_url: "https://example.com/old" }],
    ]) {
      const link = groupLinks([row], rows)["citron"]![0]!;
      expect(localizedLinkUrl(link.kind, link.url, link.translations, "ja")).toBe(original);
    }
  });

  test("untrusted optional variants cannot replace the link with an unsafe URL", () => {
    for (const url of [
      "javascript:alert(1)",
      "http://example.com/",
      "mailto:a@example.com",
      "//example.com",
      "https://user:pass@example.com/",
      "not a URL",
      "",
    ]) {
      expect(localizedLinkUrl("DISCOVER", original, { ja: url }, "ja")).toBe(original);
    }
  });

  test("Website in the footer follows its own current setting; other footer links stay shared", () => {
    const data: HubData = {
      levels: [],
      destinations: [],
      links: [],
      photos: [],
      events: [],
      posts: [],
      videos: [],
      settings: { website: original, dining: original },
      siteLinkTranslations: [{ setting_key: "website", ...translated }],
    };
    const hub = createHubValue(data);
    const website = hub.links.find((l) => l.label === "Website")!;
    expect(localizedLinkUrl("WEBSITE", website.url, website.translations, "ja")).toBe(japanese);
    expect(hub.links.find((l) => l.label === "Dining")?.translations).toBeUndefined();
    const changed = createHubValue({ ...data, settings: { website: "https://example.com/new" } })
      .links[0]!;
    expect(changed.translations).toEqual({});
    expect(createHubValue({ ...data, siteLinkTranslations: null }).links[0]?.url).toBe(original);
  });
});
