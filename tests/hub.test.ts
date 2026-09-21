import { describe, expect, test } from "bun:test";
import { createHubValue, FALLBACK } from "../src/data/hub-value";
import { actionsFor, instagramUrl } from "../src/lib/destination-actions";
import { DESTINATIONS, toDestination, type DestinationRow } from "../src/data/resort";
import type { HubData } from "../src/lib/hub.functions";

const row: DestinationRow = {
  id: "citron",
  name: "Citron",
  level_id: "sky",
  cluster: null,
  type: "restaurant",
  short_description: "Current database description",
  image_key: null,
  discover_url: "https://example.com/discover",
  menu_url: "https://example.com/old-menu",
  booking_url: null,
  instagram_url: "https://instagram.com/example",
  booking_message: null,
  price_list_url: null,
  vegetarian_menu_url: null,
  vegan_menu_url: null,
  breakfast_menu_url: null,
  lunch_menu_url: null,
  dinner_menu_url: null,
  instagram_spot: false,
  display_order: 0,
  active: true,
};
const ready: HubData = {
  levels: [{ id: "sky", title: "SKY", line: "", image_key: null, clusters: [], display_order: 0 }],
  destinations: [row],
  photos: [],
  links: [],
  events: [],
  posts: [],
  settings: {},
};

describe("database authority", () => {
  test("intentional empty catalog does not resurrect bundled destinations", () => {
    expect(createHubValue({ ...ready, destinations: [] }).destinations).toEqual([]);
    expect(createHubValue({ ...ready, levels: [] }).levels).toEqual([]);
  });
  test("successful empty media and settings stay empty", () => {
    const hub = createHubValue(ready);
    expect(hub.destinations[0]?.events).toEqual([]);
    expect(hub.destinations[0]?.photos).toEqual([]);
    expect(hub.destinations[0]?.posts).toEqual([]);
    expect(hub.links).toEqual([]);
  });
  test("disabled links never fall back to old columns", () => {
    const dest = createHubValue(ready).destinations[0]!;
    expect(actionsFor(dest)).toEqual([]);
    expect(instagramUrl(dest)).toBeUndefined();
  });
  test("unavailable essentials use the offline catalog", () => {
    expect(createHubValue({ ...ready, destinations: null })).toBe(FALLBACK);
  });
  test("one unavailable collection does not resurrect other deleted content", () => {
    const dest = createHubValue({ ...ready, events: null }).destinations[0]!;
    expect(dest.events?.length).toBeGreaterThan(0);
    expect(dest.photos).toEqual([]);
    expect(dest.posts).toEqual([]);
    expect(actionsFor(dest)).toEqual([]);
  });
});

describe("configured actions", () => {
  test("custom labels, repeated kinds and database order survive", () => {
    const links = [
      { kind: "WEBSITE", label: "Our story", url: "https://example.com/story" },
      { kind: "MENU", label: "Lunch", url: "https://example.com/lunch" },
      { kind: "MENU", label: "Dinner", url: "https://example.com/dinner" },
    ];
    expect(actionsFor(toDestination(row, [], links, [], []))).toEqual(links);
  });
  test("card keeps an explicit booking action and details retain every menu", () => {
    const links = ["DISCOVER", "BREAKFAST_MENU", "LUNCH_MENU", "DINNER_MENU", "BOOK"].map(
      (kind) => ({ kind, url: `https://example.com/${kind}` }),
    );
    const dest = toDestination(row, [], links, [], []);
    expect(actionsFor(dest, 3).map((a) => a.kind)).toEqual(["DISCOVER", "BREAKFAST_MENU", "BOOK"]);
    expect(actionsFor(dest)).toEqual(links);
  });
  test("service type does not fabricate a booking link", () => {
    const dest = { ...DESTINATIONS[0]!, type: "service" as const };
    delete dest.booking_url;
    delete dest.booking_message;
    expect(actionsFor(dest).some((a) => a.kind === "BOOK")).toBe(false);
  });
});

describe("legacy actions", () => {
  test("meal menus replace the generic menu and retain booking and dietary links", () => {
    const dest = {
      ...toDestination(row),
      breakfast_menu_url: "https://example.com/breakfast",
      dinner_menu_url: "https://example.com/dinner",
      booking_url: "https://example.com/book",
      vegetarian_menu_url: "https://example.com/vegetarian",
      vegan_menu_url: "https://example.com/vegan",
      price_list_url: "https://example.com/prices",
    };
    expect(actionsFor(dest).map((a) => a.kind)).toEqual([
      "DISCOVER",
      "BREAKFAST_MENU",
      "DINNER_MENU",
      "BOOK",
      "PRICE_LIST",
      "VEGETARIAN_MENU",
      "VEGAN_MENU",
    ]);
  });
  test("accommodation details become a brochure and explicit booking is appended", () => {
    const dest = {
      ...toDestination(row),
      type: "accommodation" as const,
      booking_url: "https://example.com/book",
    };
    expect(actionsFor(dest)).toEqual([
      { kind: "DISCOVER", url: row.discover_url },
      { kind: "BROCHURE", url: row.menu_url },
      { kind: "BOOK", url: "https://example.com/book" },
    ]);
  });
});
