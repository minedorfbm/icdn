import { expect, test } from "bun:test";
import { placeMapBubble } from "../src/features/resort-map/map-bubble";
import { overlaps } from "../src/features/resort-map/tram-labels";

test("bubbles stay in the usable map area and leave the selected pin clear", () => {
  for (const frame of [
    { x: 12, y: 68, width: 296, height: 474 },
    { x: 12, y: 60, width: 820, height: 248 },
    { x: 12, y: 68, width: 1256, height: 550 },
  ]) {
    const size = { width: Math.min(300, frame.width), height: 212 };
    for (const anchor of [
      { x: frame.x + frame.width / 2, y: frame.y + 35 },
      { x: frame.x + frame.width / 2, y: frame.y + frame.height - 35 },
      { x: frame.x + 40, y: frame.y + frame.height / 2 },
    ]) {
      const bubble = placeMapBubble(anchor, size, frame);
      expect(bubble.x).toBeGreaterThanOrEqual(frame.x);
      expect(bubble.y).toBeGreaterThanOrEqual(frame.y);
      expect(bubble.x + size.width).toBeLessThanOrEqual(frame.x + frame.width);
      expect(bubble.y + size.height).toBeLessThanOrEqual(frame.y + frame.height);
      if (bubble.side !== "none") {
        expect(
          overlaps(
            { ...bubble, ...size },
            { x: anchor.x - 22, y: anchor.y - 22, width: 44, height: 44 },
          ),
        ).toBe(false);
        expect(bubble.tail).toBeGreaterThanOrEqual(22);
      }
    }
  }
});

test("the pointer follows the available side and disappears when no anchored placement fits", () => {
  const frame = { x: 12, y: 68, width: 366, height: 500 };
  const size = { width: 300, height: 200 };
  expect(placeMapBubble({ x: 190, y: 120 }, size, frame).side).toBe("top");
  expect(placeMapBubble({ x: 190, y: 520 }, size, frame).side).toBe("bottom");
  expect(placeMapBubble({ x: 120, y: 180 }, size, { ...frame, width: 820, height: 240 }).side).toBe(
    "left",
  );
  expect(placeMapBubble({ x: 700, y: 180 }, size, { ...frame, width: 820, height: 240 }).side).toBe(
    "right",
  );
  expect(
    placeMapBubble(
      { x: 170, y: 250 },
      { width: 296, height: 430 },
      { ...frame, width: 296, height: 440 },
    ).side,
  ).toBe("none");
});

test("panning an anchor off screen retains an accessible bubble without a misleading pointer", () => {
  const frame = { x: 12, y: 68, width: 366, height: 500 };
  const bubble = placeMapBubble({ x: -400, y: 120 }, { width: 300, height: 200 }, frame);
  expect(bubble.side).toBe("none");
  expect(bubble.x).toBe(frame.x);
});
