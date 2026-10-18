import { expect, test } from "bun:test";
import { collectionCopy, collectionItemRow } from "../src/lib/destination-collection";

const item = collectionItemRow.parse({
  destination_id: "instagram-spots",
  key: "D",
  target_destination_id: "la-maison-1888",
  map_place_id: "la-maison-1888",
  title: "La Maison 1888",
  description: "A culinary portrait.",
  image_url: null,
  display_order: 3,
  translations: {
    ja: {
      title: { source: "La Maison 1888", value: "La Maison 1888" },
      description: { source: "A culinary portrait.", value: "料理を写真に。" },
    },
  },
});
test("collection uses reviewed copy and falls back when the source changes", () => {
  expect(collectionCopy(item, "ja", "description")).toBe("料理を写真に。");
  expect(collectionCopy(item, "en", "description")).toBe(item.description);
  expect(collectionCopy({ ...item, description: "A new story." }, "ja", "description")).toBe(
    "A new story.",
  );
  expect(collectionCopy(item, "vi", "title")).toBe(item.title);
  const blank = {
    ...item,
    translations: {
      ja: { ...item.translations["ja"]!, description: { source: item.description, value: " " } },
    },
  };
  expect(collectionCopy(blank, "ja", "description")).toBe(item.description);
});
test("collection links require a destination", () => {
  expect(collectionItemRow.safeParse({ ...item, target_destination_id: null }).success).toBe(false);
});
