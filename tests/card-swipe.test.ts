import { expect, test } from "bun:test";
import { swipeStep } from "../src/lib/card-swipe";

test("a short flick advances but a paused short drag returns to the same card", () => {
  expect(swipeStep(-30, 300, -0.6, 10)).toBe(1);
  expect(swipeStep(-30, 300, -0.6, 150)).toBe(0);
  expect(swipeStep(3, 300, 2, 0)).toBe(0);
});

test("distance thresholds scale with the card width in both directions", () => {
  expect(swipeStep(-90, 300, 0, 150)).toBe(1);
  expect(swipeStep(90, 300, 0, 150)).toBe(-1);
  expect(swipeStep(-90, 600, 0, 150)).toBe(0);
  expect(swipeStep(-200, 600, 0, 150)).toBe(1);
});
