import { describe, expect, test } from "bun:test";
import { nextPdfZoom, pinchCenter, pinchDistance } from "../src/lib/pdf-zoom";

describe("PDF pinch zoom", () => {
  test("measures the distance and center of two fingers", () => {
    const first = { x: 20, y: 30 };
    const second = { x: 80, y: 110 };
    expect(pinchDistance(first, second)).toBe(100);
    expect(pinchCenter(first, second)).toEqual({ x: 50, y: 70 });
  });

  test("keeps the current zoom when the fingers do not move", () => {
    expect(nextPdfZoom(1.5, 100, 100)).toBe(1.5);
    expect(nextPdfZoom(1.5, 0, 100)).toBe(1.5);
  });

  test("allows zooming in and out without shrinking below the fitted page", () => {
    expect(nextPdfZoom(1, 100, 200)).toBe(2);
    expect(nextPdfZoom(2, 200, 100)).toBe(1);
    expect(nextPdfZoom(1, 100, 20)).toBe(1);
    expect(nextPdfZoom(2, 100, 200)).toBe(3);
  });
});
