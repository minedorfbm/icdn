import areas from "../docs/accommodation-map-areas.json";
import { describe, expect, test } from "bun:test";
import {
  destinationPlace,
  linkedDestinations,
  liveMapPlaces,
} from "../src/features/resort-map/map-links";
import { mapCopy } from "../src/features/resort-map/map-copy";
import { LANGUAGES } from "../src/i18n/dictionary";
import type { Destination } from "../src/data/resort";
import type { MapPlaceRow, MapLinkRow } from "../src/features/resort-map/map.types";
const place = (id: string): MapPlaceRow => ({
  id,
  name: "Spatial landmark",
  level_id: "earth",
  pin: 1,
  x: 500,
  y: 300,
  zoom: 2,
  active: true,
});
const destination = (id: string, active = true): Destination => ({
  id,
  name: `Live ${id}`,
  level: "sky",
  type: "restaurant",
  short_description: "Supabase description",
  contentFamily: "resort",
  audienceTags: ["all"],
  image: "https://example.com/image.webp",
  detailImage: "https://example.com/image.webp",
  display_order: 0,
  active,
  cluster: "DINING",
});
const link = (
  place_id: string,
  destination_id: string,
  primary = true,
  display_order = 0,
): MapLinkRow => ({ place_id, destination_id, is_primary: primary, display_order, active: true });

describe("Supabase map associations", () => {
  test("one landmark exposes several live cards in editorial order, never hidden ones", () => {
    const cards = [destination("maison"), destination("bar"), destination("hidden", false)];
    expect(
      linkedDestinations(
        "mansion",
        [
          link("mansion", "bar", true, 1),
          link("mansion", "hidden"),
          link("mansion", "maison"),
          link("other", "bar"),
        ],
        cards,
      ).map((d) => d.id),
    ).toEqual(["maison", "bar"]);
  });
  test("the hub supplies names, levels and collections even when imported spatial metadata differs", () => {
    const [p] = liveMapPlaces(
      [place("mansion")],
      [link("mansion", "maison")],
      [destination("maison")],
    );
    expect(p?.name).toBe("Live maison");
    expect(p?.level).toBe("sky");
    expect(p?.categories).toEqual(["dining"]);
    expect(p?.point).toEqual({ x: 500, y: 300 });
  });
  test("primary spa location wins over reception and inactive anchors cannot be opened", () => {
    const links = [link("reception", "spa", false), link("lagoon", "spa")];
    expect(destinationPlace("spa", links, [place("reception"), place("lagoon")])).toBe("lagoon");
    expect(destinationPlace("spa", links, [{ ...place("lagoon"), active: false }])).toBeUndefined();
  });
  test("unmapped offers never receive an invented location", () => {
    expect(
      destinationPlace("ihg-one-rewards", [link("mansion", "maison")], [place("mansion")]),
    ).toBeUndefined();
  });
  test("empty database results stay empty instead of reviving bundled cards or links", () => {
    expect(liveMapPlaces([], [], [])).toEqual([]);
    expect(linkedDestinations("mansion", [], [destination("maison")])).toEqual([]);
  });
  test("all six hub languages have map navigation labels", () => {
    for (const { code } of LANGUAGES)
      for (const key of [
        "open",
        "locate",
        "discover",
        "unavailable",
        "walkNote",
        "tourNote",
      ] as const)
        expect(mapCopy(code, key).length).toBeGreaterThan(0);
  });
});

describe("accommodation areas from the official plan", () => {
  test("all fifteen existing categories have one primary area without fabricated villa-level pins", () => {
    const rows = areas.areas.map((a) => ({ ...a, active: true }));
    const links = rows.flatMap((a) =>
      a.destination_ids.map((id, display_order) => link(a.id, id, true, display_order)),
    );
    const cards = links.map((l) => ({
      ...destination(l.destination_id),
      type: "accommodation",
      cluster: "EXPERIENCES",
    }));
    expect(new Set(links.map((l) => l.destination_id)).size).toBe(15);
    const places = liveMapPlaces(rows, links, cards);
    expect(places).toHaveLength(5);
    for (const a of rows) {
      const mapped = places.find((p) => p.id === a.id)!;
      expect(mapped.name).toBe(a.name);
      expect(mapped.coveredLevels).toEqual(a.covered_levels);
      expect(mapped.categories).toEqual(["accommodation"]);
      expect(mapped.point).toEqual({ x: a.x, y: a.y });
      for (const id of a.destination_ids) expect(destinationPlace(id, links, rows)).toBe(a.id);
    }
    expect(places.find((p) => p.id === "hillside-rooms")?.coveredLevels).toEqual([
      "heaven",
      "sky",
      "earth",
    ]);
    expect(linkedDestinations("seaside-villas", links, cards)).toHaveLength(7);
    expect(
      liveMapPlaces(
        rows.map((r) => ({ ...r, active: false })),
        links,
        cards,
      ),
    ).toEqual([]);
  });
  test("area labels are available in all six languages", () => {
    for (const { code } of LANGUAGES)
      for (const key of [
        "accommodation",
        "roomNumbers",
        "villaNumbers",
        "penthouseNumbers",
        "rooms",
        "penthouses",
        "earthVillas",
        "seasideVillas",
        "lagoonVillas",
      ] as const)
        expect(mapCopy(code, key).trim()).toBeTruthy();
  });
});
