import { expect, test } from "bun:test";
import { destination } from "./fixtures/destination";
import { groupLinks, toDestination } from "../src/data/resort";
import {
  detailActions,
  detailHeading,
  adjacentDestination,
  relatedDestinations,
} from "../src/lib/destination-presentation";
import { destinationRow } from "../src/lib/hub-schema";

test("the exact published link is featured once even when several menus share a kind", () => {
  const links = groupLinks([
    {
      id: "one",
      destination_id: "citron",
      kind: "MENU",
      url: "https://example.com/one.pdf",
      label: "Set menu",
      display_order: 0,
    },
    {
      id: "two",
      destination_id: "citron",
      kind: "MENU",
      url: "https://example.com/two.pdf",
      label: "Vegan menu",
      display_order: 1,
    },
    {
      id: "book",
      destination_id: "citron",
      kind: "BOOK",
      url: "https://example.com/book",
      label: null,
      display_order: 2,
    },
  ])["citron"]!;
  const selected = detailActions({ ...destination, links, primaryLinkId: "two" }, "en");
  expect(selected.primary?.url).toBe("https://example.com/two.pdf");
  expect(selected.secondary.map((x) => x.id)).toEqual(["one", "book"]);
  expect(detailActions({ ...destination, links }, "en").primary?.id).toBe("book");
  expect(
    detailActions({ ...destination, links, primaryLinkId: "unpublished" }, "en").primary,
  ).toBeUndefined();
  expect(
    detailActions(
      {
        ...destination,
        links: [{ id: "bad", kind: "BOOK", url: "javascript:alert(1)" }],
        primaryLinkId: "bad",
      },
      "en",
    ).primary,
  ).toBeUndefined();
});

test("personalized headings use only current translations and disappear without a source", () => {
  const card = {
    ...destination,
    headings: { video: "An evening." },
    headingTranslations: { ja: { video: { source: "An evening.", value: "夜のひととき。" } } },
  };
  expect(detailHeading(card, "video", "ja")).toBe("夜のひととき。");
  expect(detailHeading({ ...card, headings: { video: "A new evening." } }, "video", "ja")).toBe(
    "A new evening.",
  );
  expect(detailHeading({ ...card, headings: {} }, "video", "ja")).toBeUndefined();
});

test("related cards reuse active catalogue data in both directions without duplicates", () => {
  const maison = { ...destination, id: "maison", name: "Current Maison name" };
  const wine = { ...destination, id: "wine", name: "Current Wine name", image: "/new.webp" };
  const hidden = { ...destination, id: "hidden", active: false };
  const relations = [
    { destination_id: "maison", related_destination_id: "wine", display_order: 0 },
    { destination_id: "hidden", related_destination_id: "maison", display_order: 1 },
  ];
  expect(relatedDestinations("maison", [maison, wine, hidden], relations)).toEqual([wine]);
  expect(relatedDestinations("wine", [maison, wine, hidden], relations)).toEqual([maison]);
  expect(relatedDestinations("maison", [maison, hidden], relations)).toEqual([]);
});

test("continue follows the current deck, skips unpublished cards and wraps without opening itself", () => {
  const a = { ...destination, id: "a", display_order: 1 };
  const b = { ...destination, id: "b", display_order: 2 };
  const c = { ...destination, id: "c", display_order: 3 };
  const hidden = { ...destination, id: "hidden", active: false };
  expect(adjacentDestination("a", [c, b, a, hidden], ["a", "hidden", "c", "b"])?.id).toBe("c");
  expect(adjacentDestination("b", [c, b, a, hidden], ["a", "c", "b"])?.id).toBe("a");
  expect(adjacentDestination("a", [c, b, a])?.id).toBe("b");
  expect(adjacentDestination("a", [c, b, a], ["a", "c", "b"], -1)?.id).toBe("b");
  expect(adjacentDestination("a", [c, b, a], undefined, -1)?.id).toBe("c");
  expect(adjacentDestination("a", [a, hidden])).toBeUndefined();
  expect(adjacentDestination("missing", [a, b])).toBeUndefined();
});

test("all destination rows use the shared model and preserve independent images", () => {
  const row = destinationRow.parse({
    id: "citron",
    name: "Citron",
    level_id: "heaven",
    cluster: null,
    type: "restaurant",
    short_description: "Intro",
    image_key: "d-citron",
    detail_image_key: "d-spa",
    active: true,
    display_order: 0,
  });
  expect(toDestination(row).detailLayout).toBe("editorial");
  expect(toDestination({ ...row, active: false, detail_layout: "classic" }).detailLayout).toBe(
    "editorial",
  );
  expect(toDestination({ ...row, detail_layout: "editorial" }).detailLayout).toBe("editorial");
  expect(toDestination(row).image).not.toBe(toDestination(row).detailImage);
});
