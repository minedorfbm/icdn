import { expect, test } from "bun:test";
import {
  atmosphereMix,
  birdPoses,
  passageProgress,
  plantPoses,
  wavePoses,
} from "../src/lib/atmosphere-motion";

test("whole-world mixing lands on the existing palette even with unequal section heights", () => {
  const tops = [1000, 2000, 3400, 4500];
  expect(atmosphereMix(0, tops, 800)).toMatchObject({ base: 0, blend: 0 });
  expect(atmosphereMix(1904, tops, 800)).toMatchObject({ base: 0, next: 1, blend: 1 });
  expect(atmosphereMix(2000, tops, 800)).toMatchObject({ base: 1, blend: 0 });
  expect(atmosphereMix(4500, tops, 800)).toEqual({ base: 3, next: 3, blend: 0 });
  expect(atmosphereMix(0, [], 0)).toEqual({ base: 0, next: 0, blend: 0 });
});

test("scroll reversal returns to the identical blend and passage pose without a time queue", () => {
  for (const y of [1300, 1500, 1800, 1500, 1300]) {
    const mix = atmosphereMix(y, [1000, 2000, 3000, 4000], 800);
    expect(mix.blend).toBeGreaterThanOrEqual(0);
    expect(mix.blend).toBeLessThanOrEqual(1);
    expect(atmosphereMix(y, [1000, 2000, 3000, 4000], 800)).toEqual(mix);
  }
  expect(passageProgress(1000, 2000, 800)).toBeNull();
  expect(passageProgress(2000, 2000, 800)).toBe(1);
  expect(passageProgress(2200, 2000, 800)).toBeNull();
});

test("the three distinct birds have separate trajectories and completely disappear", () => {
  const birds = birdPoses(0.65, 100, 390, 844);
  expect(birds).toHaveLength(3);
  expect(new Set(birds.map((bird) => bird.x)).size).toBe(3);
  expect(new Set(birds.map((bird) => bird.scale)).size).toBe(3);
  expect(birdPoses(2, 0, 390, 844).every((bird) => bird.opacity === 0)).toBe(true);
});

test("botanical and wave tails finish transparent at mobile and desktop sizes", () => {
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [768, 1024],
    [1440, 900],
  ]) {
    for (const p of [0, 0.3, 0.8, 1, 1.5, 2]) {
      const plants = plantPoses(p, 0, width!, height!),
        waves = wavePoses(p, width!, height!);
      expect(plants).toHaveLength(7);
      expect(waves).toHaveLength(2);
      expect(
        [...plants, ...waves].every((pose) => Object.values(pose).every(Number.isFinite)),
      ).toBe(true);
      expect([...plants, ...waves].every((pose) => pose.opacity >= 0 && pose.opacity <= 1)).toBe(
        true,
      );
      if (p === 2) expect([...plants, ...waves].every((pose) => pose.opacity === 0)).toBe(true);
    }
  }
});
