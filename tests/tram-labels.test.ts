import { expect, test } from "bun:test";
import { layoutTramLabels, overlaps } from "../src/features/resort-map/tram-labels";

test("close stops get separate signs without changing station coordinates", () => {
  const stops = [
    { x: 120, y: 210 },
    { x: 126, y: 220 },
    { x: 132, y: 230 },
    { x: 138, y: 240 },
  ];
  const obstacles = [{ x: 162, y: 190, width: 40, height: 40 }];
  const signs = layoutTramLabels(stops, 100, obstacles, { x: 0, y: 0, width: 390, height: 700 });
  expect(signs).toHaveLength(4);
  signs.forEach((sign, i) => {
    expect({ x: sign.x, y: sign.y }).toEqual(stops[i]);
    expect(signs.some((other) => other !== sign && overlaps(sign.box, other.box))).toBe(false);
    expect(obstacles.some((obstacle) => overlaps(sign.box, obstacle))).toBe(false);
    expect(sign.box.x).toBeGreaterThanOrEqual(8);
    expect(sign.box.x + sign.box.width).toBeLessThanOrEqual(382);
  });
});

test("offscreen stations do not leave floating labels behind", () => {
  expect(
    layoutTramLabels([{ x: -20, y: 90 }], 100, [], { x: 0, y: 0, width: 390, height: 700 }),
  ).toEqual([]);
});
