import { test, expect } from "bun:test";
import { visibleMapLabels } from "../src/features/resort-map/map-labels";

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
