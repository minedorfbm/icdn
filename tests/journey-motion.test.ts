import { expect, test } from "bun:test";
import { arrivalProgress, journeyPosition } from "../src/lib/journey-motion";

const stations = [800, 2300, 4100, 5400];

test("each chapter aligns exactly with its station even with unequal chapter heights", () => {
  stations.forEach((top, station) => {
    expect(journeyPosition(top, stations, 800)).toEqual({ progress: station / 3, station });
  });
  expect(journeyPosition(0, stations, 800)).toEqual({ progress: 0, station: 0 });
  expect(journeyPosition(7000, stations, 800)).toEqual({ progress: 1, station: 3 });
});

test("the cabin waits while reading cards then follows the next level into view", () => {
  expect(journeyPosition(1500, stations, 800).progress).toBe(0);
  expect(journeyPosition(1960, stations, 800).progress).toBeCloseTo(1 / 6);
  expect(journeyPosition(2300, stations, 800).progress).toBeCloseTo(1 / 3);
  // Reversing or interrupting a gesture returns to the same position without an animation queue.
  expect(journeyPosition(1960, stations, 800).progress).toBeCloseTo(1 / 6);
  expect(journeyPosition(1500, stations, 800).progress).toBe(0);
});

test("short chapters and empty catalogues never produce an invalid rail position", () => {
  expect(journeyPosition(500, [], 800)).toEqual({ progress: 0, station: 0 });
  expect(journeyPosition(500, [100], 800)).toEqual({ progress: 0, station: 0 });
  expect(journeyPosition(200, [100, 300], 800).progress).toBe(0.5);
});

test("entrances are bounded and reversible", () => {
  expect(arrivalProgress(1000, 0, 800)).toBe(0);
  const midway = arrivalProgress(1000, 450, 800);
  expect(midway).toBeGreaterThan(0);
  expect(midway).toBeLessThan(1);
  expect(arrivalProgress(1000, 900, 800)).toBe(1);
  expect(arrivalProgress(1000, 450, 800)).toBe(midway);
});
