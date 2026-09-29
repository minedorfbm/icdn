import { describe, expect, test } from "bun:test";
import { createHubValue, resolveHeroImage } from "../src/data/hub-value";
import { actionsFor, instagramUrl, safeExternalUrl } from "../src/lib/destination-actions";
import { LEVELS, toDestination, youtubeVideoId, type DestinationRow } from "../src/data/resort";
import type { HubData } from "../src/lib/hub.functions";

const row: DestinationRow = {
  id: "citron",
  name: "Citron",
  level_id: "sky",
  cluster: null,
  type: "restaurant",
  short_description: "Current database description",
  image_key: null,
  detail_image_key: null,
  content_kind: "place",
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
  videos: [],
  settings: {},
};

describe("database authority", () => {
  test("expanded image is independent while an unset value keeps the card image", () => {
    const card = toDestination({ ...row, image_key: "d-citron" });
    expect(card.detailImage).toBe(card.image);
    const updated = toDestination({
      ...row,
      image_key: "d-citron",
      detail_image_key: "d-spa",
      content_kind: "offer",
    });
    expect(updated.image).toBe(card.image);
    expect(updated.detailImage).not.toBe(updated.image);
    expect(updated.contentKind).toBe("offer");
  });
  test("intentional empty catalog does not resurrect bundled destinations", () => {
    expect(createHubValue({ ...ready, destinations: [] }).destinations).toEqual([]);
    expect(createHubValue({ ...ready, levels: [] }).levels).toEqual([]);
  });
  test("successful empty media and settings stay empty", () => {
    const hub = createHubValue(ready);
    expect(hub.destinations[0]?.events).toEqual([]);
    expect(hub.destinations[0]?.photos).toEqual([]);
    expect(hub.destinations[0]?.posts).toEqual([]);
    expect(hub.destinations[0]?.videos).toEqual([]);
    expect(hub.links).toEqual([]);
  });
  test("disabled links never fall back to old columns", () => {
    const dest = { ...createHubValue(ready).destinations[0]!, discover_url: "https://example.com" };
    expect(actionsFor(dest)).toEqual([]);
    expect(instagramUrl(dest)).toBeUndefined();
  });
  test("unavailable essentials cannot resurrect an offline catalogue", () => {
    expect(() => createHubValue({ ...ready, destinations: null })).toThrow(
      "Catalogue temporarily unavailable",
    );
    expect(() => createHubValue({ ...ready, levels: null })).toThrow(
      "Catalogue temporarily unavailable",
    );
  });
  test("one unavailable collection does not resurrect other deleted content", () => {
    const dest = createHubValue({ ...ready, events: null }).destinations[0]!;
    expect(dest.events).toEqual([]);
    expect(dest.photos).toEqual([]);
    expect(dest.posts).toEqual([]);
    expect(actionsFor(dest)).toEqual([]);
  });
});

describe("curated YouTube videos", () => {
  test("only recognized HTTPS YouTube links produce video IDs", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ?t=5",
      "https://youtube.com/shorts/dQw4w9WgXcQ",
      "https://youtube.com/live/dQw4w9WgXcQ",
    ]) {
      expect(youtubeVideoId(url)).toBe("dQw4w9WgXcQ");
    }
    for (const url of [
      "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ",
      "javascript:alert(1)",
      "http://youtu.be/dQw4w9WgXcQ",
      "https://youtu.be/invalid-id",
    ]) {
      expect(youtubeVideoId(url)).toBeNull();
    }
  });

  test("only fetched videos appear on their own destination in display order", () => {
    const video = (destination_id: string, video_url: string, display_order: number) => ({
      destination_id,
      video_url,
      title: "Resort film",
      title_translations: { vi: "Phim khu nghỉ dưỡng" },
      display_order,
    });
    const hub = createHubValue({
      ...ready,
      videos: [
        video("other", "https://youtu.be/dQw4w9WgXcQ", 0),
        video("citron", "https://youtu.be/invalid-id", 1),
        video("citron", "https://youtu.be/dQw4w9WgXcQ", 2),
        video("citron", "https://youtube.com/shorts/shorts12345", 3),
        video("citron", "https://youtu.be/abcdefghijk", 0),
      ],
    });
    expect(hub.destinations[0]?.videos).toEqual([
      {
        video_id: "abcdefghijk",
        format: "video",
        title: "Resort film",
        title_translations: { vi: "Phim khu nghỉ dưỡng" },
      },
      {
        video_id: "dQw4w9WgXcQ",
        format: "video",
        title: "Resort film",
        title_translations: { vi: "Phim khu nghỉ dưỡng" },
      },
      {
        video_id: "shorts12345",
        format: "short",
        title: "Resort film",
        title_translations: { vi: "Phim khu nghỉ dưỡng" },
      },
    ]);
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
    const dest = { ...toDestination(row), type: "service" as const };
    expect(actionsFor(dest).some((a) => a.kind === "BOOK")).toBe(false);
  });
  test("an unused booking message cannot generate a WhatsApp button", () => {
    const dest = { ...toDestination(row), booking_message: "Legacy draft" };
    expect(actionsFor(dest).some((a) => a.kind === "BOOK")).toBe(false);
  });
  test("unsafe database URLs never reach rendered actions", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeExternalUrl("not a URL")).toBeUndefined();
    expect(safeExternalUrl("https://example.com/menu")).toBe("https://example.com/menu");
    const dest = toDestination(
      row,
      [],
      [
        { kind: "DISCOVER", url: "javascript:alert(1)" },
        { kind: "MENU", url: "https://example.com/menu" },
      ],
    );
    expect(actionsFor(dest)).toEqual([{ kind: "MENU", url: "https://example.com/menu" }]);
  });
});

describe("CMS image URLs", () => {
  const image = "https://example.supabase.co/storage/v1/object/public/hub-images/photo.webp";
  test("card and level URLs take priority over bundled type images", () => {
    const hub = createHubValue({
      ...ready,
      destinations: [{ ...row, image_key: image }],
      levels: [{ ...ready.levels![0]!, image_key: image }],
    });
    expect(hub.destinations[0]!.image).toBe(image);
    expect(hub.levels[0]!.image).toBe(image);
    expect(toDestination({ ...row, image_key: "unknown-key" }).image).toBe(
      toDestination(row).image,
    );
  });
  test("hero and preload share the configured image, then the dedicated welcome photo", () => {
    const configured = { ...ready, settings: { hero_image: image } };
    expect(createHubValue(configured).heroImage).toBe(image);
    expect(resolveHeroImage(configured)).toBe(image);
    expect(
      resolveHeroImage({
        ...ready,
        levels: [{ ...ready.levels![0]!, id: "heaven", image_key: image }],
      }),
    ).toBe(resolveHeroImage());
    expect(resolveHeroImage()).toBeTruthy();
  });
  test("legacy keys continue to work before storage migration", () => {
    expect(toDestination({ ...row, image_key: "d-citron" }).image).toBeTruthy();
    expect(resolveHeroImage({ ...ready, settings: { hero_image: "heaven" } })).toBe(
      LEVELS[0]!.image,
    );
  });
});
