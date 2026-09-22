import { expect, test } from "bun:test";
import { cardPosition, swipeStep } from "../src/lib/card-swipe";

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

test("both swipe directions reach the same slots as their committed index", () => {
  for (const travel of [292.5, 960]) {
    // Forward: the next card reaches slot zero; the outgoing card exits left.
    expect(cardPosition(1, -travel, travel)).toBe(0);
    expect(cardPosition(0, -travel, travel)).toBe(-1);
    // Backward: the previous card enters from the left; current recedes behind it.
    expect(cardPosition(-1, travel, travel)).toBe(0);
    expect(cardPosition(0, travel, travel)).toBe(1);
    // An interrupted gesture returns to the original slots without changing index.
    expect(cardPosition(0, -travel / 2, travel)).toBe(-0.5);
    expect(cardPosition(0, 0, travel)).toBe(0);
  }
});
