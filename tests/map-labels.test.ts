import { photoSpots } from "../src/features/resort-map/map.legend";
import { overlaps } from "../src/features/resort-map/tram-labels";
import { test, expect } from "bun:test";
import { layoutPhotoSpots, visibleMapLabels } from "../src/features/resort-map/map-labels";

test("overview prioritizes selected label without changing pin coordinates", () => {
  expect([
    ...visibleMapLabels(
      [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 10, y: 0 },
      ],
      "b",
      2,
      1,
    ),
  ]).toEqual(["b"]);
});
test("nearby labels yield to selection and separate as the map zooms", () => {
  const points = [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 70, y: 0 },
  ];
  expect([...visibleMapLabels(points, "b", 4, 1)]).toEqual(["b"]);
  expect(visibleMapLabels(points, "b", 8, 4).size).toBe(2);
});
test("unselected labels do not obscure another pin below them", () => {
  expect(
    visibleMapLabels(
      [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 0, y: 30 },
      ],
      null,
      4,
      1,
    ).has("a"),
  ).toBe(false);
});

test("place labels leave room for Nam Tram station signs", () => {
  expect(
    visibleMapLabels([{ id: "a", x: 100, y: 100 }], null, 4, 1, [
      { x: 50, y: 120, width: 100, height: 30 },
    ]).size,
  ).toBe(0);
});

test("all nine Insta spot buttons remain separate from overview to close zoom", () => {
  for (const scale of [0.15, 0.2, 0.257, 0.5, 1, 2, 4]) {
    const offsets = layoutPhotoSpots(photoSpots, scale);
    expect(offsets.size).toBe(9);
    const boxes = photoSpots.map((spot) => {
      const offset = offsets.get(spot.id)!;
      return {
        x: spot.point.x * scale + offset.x - 22,
        y: spot.point.y * scale + offset.y - 22,
        width: 44,
        height: 44,
      };
    });
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) expect(overlaps(boxes[i]!, boxes[j]!)).toBe(false);
    }
  }
});
