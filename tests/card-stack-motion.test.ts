import { expect, test } from "bun:test";
import {
  stackFrame,
  stackNavigationFrame,
  stackVerticalBounds,
  STACK_ORIGIN,
} from "../src/lib/card-stack-motion";

const boxes = [
  { width: 240, height: 388, top: 0, stageHeight: 388 },
  { width: 292.5, height: 561, top: 0, stageHeight: 561 },
  { width: 292.5, height: 600, top: 12, stageHeight: 624 },
  { width: 555, height: 730, top: 12, stageHeight: 754 },
];

test("resting front and previews retain the original slot geometry", () => {
  const front = stackFrame(0, 0, 300, false, boxes[0]!);
  expect(front).toMatchObject({
    position: 0,
    scale: 1,
    rotation: 0,
    tilt: 0,
    y: 0,
    opacity: 1,
    brightness: 1,
    photoX: 0,
    photoScale: 1,
  });
  const next = stackFrame(1, 0, 300, false, boxes[0]!);
  expect(next).toMatchObject({
    scale: 0.88,
    rotation: -16,
    tilt: 0,
    brightness: 0.65,
    photoX: 0,
    photoScale: 1.03,
  });
  expect(stackFrame(-1, 0, 300, false, boxes[0]!).opacity).toBe(0);
});

test("the suspended card follows the finger and stays inside the existing vertical envelope", () => {
  for (const box of boxes)
    for (const sign of [-1, 1])
      for (const progress of [0.02, 0.15, 0.35, 0.5, 0.75, 1]) {
        const distance = sign * progress * box.width;
        const frame = stackFrame(0, distance, box.width, true, box);
        expect(Math.abs(frame.tilt)).toBeLessThanOrEqual(6);
        expect(frame.transform).toContain(`${distance}px`);
        const bounds = stackVerticalBounds(box, frame.scale, frame.rotation, frame.tilt);
        expect(bounds.min + frame.y).toBeGreaterThanOrEqual(-0.01);
        expect(bounds.max + frame.y).toBeLessThanOrEqual(box.stageHeight + 0.01);
        expect(Math.abs(frame.photoX)).toBeLessThanOrEqual(6);
        expect(frame.photoScale).toBeGreaterThanOrEqual(
          1 + (2 * Math.abs(frame.photoX)) / box.width,
        );
      }
});

test("short mobile gestures already expose the tilt, still capped at six degrees", () => {
  expect(Math.abs(stackFrame(0, -70, 292.5, true, boxes[1]!).tilt)).toBeGreaterThan(3);
  expect(Math.abs(stackFrame(0, -150, 292.5, true, boxes[1]!).tilt)).toBe(6);
});

test("click choreography tilts midway and lands exactly on the next or previous resting slot", () => {
  for (const delta of [-1, 1]) {
    expect(Math.abs(stackNavigationFrame(0, delta, 0.5, boxes[1]!).tilt)).toBe(6);
    for (const offset of [-1, 0, 1, 2]) {
      const end = stackNavigationFrame(offset, delta, 1, boxes[1]!);
      expect(end).toEqual(stackFrame(offset - delta, 0, 1, false, boxes[1]!));
    }
  }
});

test("incoming previews advance continuously while photo overscan covers the tiny offset", () => {
  const box = boxes[1]!;
  expect(stackFrame(1, -box.width / 2, box.width, true, box).scale).toBeCloseTo(0.94);
  expect(stackFrame(1, -box.width, box.width, true, box)).toMatchObject({
    position: 0,
    scale: 1,
    rotation: 0,
    photoX: 0,
  });
  expect(stackFrame(-1, box.width, box.width, true, box)).toMatchObject({
    position: 0,
    scale: 1,
    rotation: 0,
    tilt: 0,
    photoX: 0,
  });
});

test("an interrupted native settle carries its current position into the next gesture", () => {
  const origin = {
    ...STACK_ORIGIN,
    position: 0.4,
    x: 28,
    scale: 0.96,
    rotation: -4,
    tilt: 2,
    y: 3,
  };
  const box = { ...boxes[1]!, top: 50, stageHeight: 700 };
  const first = stackFrame(0, 0, box.width, true, box, origin);
  expect(first.transform).toContain("28px");
  expect(first.scale).toBeCloseTo(origin.scale);
  expect(first.tilt).toBe(origin.tilt);
  expect(first.rotation).toBe(origin.rotation);
});

test("reduced motion retains still geometry through a drag and disables photographic depth", () => {
  for (const distance of [-300, 150]) {
    expect(stackFrame(0, distance, 300, true, boxes[1]!, STACK_ORIGIN, true)).toMatchObject({
      position: 0,
      scale: 1,
      rotation: 0,
      tilt: 0,
      photoX: 0,
      photoScale: 1,
    });
  }
});
