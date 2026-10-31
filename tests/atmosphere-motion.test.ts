import { expect, test } from "bun:test";
import {
  atmosphereMix,
  birdPoses,
  passageProgress,
  plantPoses,
  waveLayout,
  heavenEntryLead,
  settlePlantPoses,
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
      expect(waves).toHaveLength(4);
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

test("four differently sized waves share a right-to-left direction on separate rows and finish cleanly", () => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    const card = { width: width * 0.75 };
    const layout = waveLayout(width, 844, card);
    expect(layout.width).toBeLessThanOrEqual(card.width * 0.5);
    const early = wavePoses(0.4, width, 844, card),
      late = wavePoses(0.8, width, 844, card);
    expect(new Set(late.map((wave) => wave.y)).size).toBe(4);
    expect(new Set(late.map((wave) => wave.scale)).size).toBe(4);
    early.forEach((wave, index) => expect(wave.x).toBeGreaterThan(late[index]!.x));
  }
  const arriving = wavePoses(1, 390, 844),
    justArrived = wavePoses(1.00001, 390, 844),
    leaving = wavePoses(1.8, 390, 844);
  arriving.forEach((wave, index) => {
    const next = justArrived[index]!,
      retreat = leaving[index]!;
    expect(Math.abs(next.x - wave.x)).toBeLessThan(0.01);
    expect(Math.abs(next.y - wave.y)).toBeLessThan(0.01);
    expect(Math.abs(next.opacity - wave.opacity)).toBeLessThan(0.01);
    expect(retreat.x).toBeLessThan(wave.x);
    expect(retreat.y).toBe(wave.y);
    expect(retreat.opacity).toBeLessThanOrEqual(wave.opacity);
  });
});

test("Heaven announces its entrance slightly before the section without adding flow", () => {
  expect(heavenEntryLead(400)).toBe(36);
  expect(heavenEntryLead(844)).toBeCloseTo(50.64);
  expect(heavenEntryLead(2000)).toBe(64);
});

test("wave rows follow the preceding counter and SEA subtitle, and reach beyond the left edge", () => {
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [768, 1024],
    [1440, 900],
  ]) {
    const card = { width: width! * 0.75 };
    for (const boundary of [0, 100, 200]) {
      const entry = { top: boundary - 90, bottom: boundary + (width! >= 1024 ? 450 : 135) };
      const layout = waveLayout(width!, height!, card, boundary, entry);
      const baseHeight = (layout.width * 130) / 360;
      for (const wave of wavePoses(0.85, width!, height!, card, boundary, entry)) {
        const center = wave.y + baseHeight / 2;
        expect(center - (baseHeight * wave.scale) / 2).toBeGreaterThanOrEqual(entry.top);
        expect(center + (baseHeight * wave.scale) / 2).toBeLessThanOrEqual(entry.bottom);
      }
      for (const wave of wavePoses(1.94, width!, height!, card, boundary, entry)) {
        expect(wave.x).toBeLessThan(0);
        expect(wave.opacity).toBeGreaterThan(0);
      }
      for (const wave of wavePoses(2, width!, height!, card, boundary, entry)) {
        expect(wave.x + layout.width * wave.scale).toBeLessThanOrEqual(0);
        expect(wave.opacity).toBe(0);
      }
    }
  }
});

test("plants interpolate coarse scroll steps without overshoot, reverse, and settle to an idle pose", () => {
  const start = plantPoses(0.3, 400, 390, 844),
    target = plantPoses(0.65, 160, 390, 844);
  let result = settlePlantPoses(start, target, 16.67);
  expect(result.moving).toBe(true);
  expect(result.poses[0]!.y).toBeLessThan(start[0]!.y);
  expect(result.poses[0]!.y).toBeGreaterThan(target[0]!.y);
  const reversed = settlePlantPoses(result.poses, start, 16.67);
  expect(reversed.poses[0]!.y).toBeGreaterThan(result.poses[0]!.y);
  for (let i = 0; i < 50; i++) result = settlePlantPoses(result.poses, target, 16.67);
  expect(result.moving).toBe(false);
  expect(result.poses).toEqual(target);
  expect(settlePlantPoses(undefined, target, 16.67).moving).toBe(false);
});

test("plant smoothing uses elapsed time consistently at slow and fast frame rates", () => {
  const start = plantPoses(0.3, 400, 390, 844),
    target = plantPoses(0.65, 160, 390, 844);
  let fast = start,
    slow = start;
  for (let i = 0; i < 12; i++) fast = settlePlantPoses(fast, target, 16.67).poses;
  for (let i = 0; i < 3; i++) slow = settlePlantPoses(slow, target, 66.68).poses;
  expect(Math.abs(fast[0]!.y - slow[0]!.y)).toBeLessThan(0.1);
});

test("mobile foliage follows coarse steps more gently and still reaches an exact idle pose", () => {
  const start = plantPoses(0.3, 400, 390, 844),
    target = plantPoses(0.65, 160, 390, 844);
  const desktop = settlePlantPoses(start, target, 16.67);
  let mobile = settlePlantPoses(start, target, 16.67, 90);
  expect(Math.abs(mobile.poses[0]!.y - start[0]!.y)).toBeLessThan(
    Math.abs(desktop.poses[0]!.y - start[0]!.y),
  );
  for (let i = 0; i < 80; i++) mobile = settlePlantPoses(mobile.poses, target, 16.67, 90);
  expect(mobile.moving).toBe(false);
  expect(mobile.poses).toEqual(target);
});
