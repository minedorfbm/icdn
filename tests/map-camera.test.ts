import { expect, test } from "bun:test";
import {
  constrainMapCamera,
  fitMapCamera,
  focusMapCamera,
  RESORT_BOUNDS,
  type MapViewport,
} from "../src/features/resort-map/map-camera";

const viewports: MapViewport[] = [
  {
    x: 0,
    y: -1000,
    width: 1500,
    height: 3000,
    frame: { x: 90, y: -900, width: 1320, height: 2200 },
  },
  {
    x: 0,
    y: -1000,
    width: 1500,
    height: 3000,
    frame: { x: 90, y: -900, width: 1320, height: 1200 },
  },
  { x: -750, y: 0, width: 3000, height: 1000, frame: { x: -700, y: 50, width: 1500, height: 650 } },
];

test("overview centres the whole resort in the visible frame, including above the place sheet", () => {
  for (const viewport of viewports) {
    const camera = fitMapCamera(viewport);
    const { frame } = viewport;
    expect(camera.x + (RESORT_BOUNDS.x + RESORT_BOUNDS.width / 2) * camera.scale).toBeCloseTo(
      frame.x + frame.width / 2,
    );
    expect(camera.y + (RESORT_BOUNDS.y + RESORT_BOUNDS.height / 2) * camera.scale).toBeCloseTo(
      frame.y + frame.height / 2,
    );
    expect(RESORT_BOUNDS.width * camera.scale).toBeLessThanOrEqual(frame.width);
    expect(RESORT_BOUNDS.height * camera.scale).toBeLessThanOrEqual(frame.height);
  }
});

test("extreme drag and zoom cannot leave empty space beyond a resort edge", () => {
  for (const viewport of viewports)
    for (const scale of [0.01, 1.5, 4, 8, 20])
      for (const direction of [-1, 1]) {
        const camera = constrainMapCamera(
          { x: direction * 100000, y: direction * 100000, scale },
          viewport,
        );
        const { frame } = viewport;
        for (const [position, start, length, frameStart, frameLength] of [
          [camera.x, RESORT_BOUNDS.x, RESORT_BOUNDS.width, frame.x, frame.width],
          [camera.y, RESORT_BOUNDS.y, RESORT_BOUNDS.height, frame.y, frame.height],
        ] as const) {
          if (length * camera.scale >= frameLength) {
            expect(position + start * camera.scale).toBeLessThanOrEqual(frameStart + 0.001);
            expect(position + (start + length) * camera.scale).toBeGreaterThanOrEqual(
              frameStart + frameLength - 0.001,
            );
          } else
            expect(position + (start + length / 2) * camera.scale).toBeCloseTo(
              frameStart + frameLength / 2,
            );
        }
        expect(camera.scale).toBeLessThanOrEqual(8);
      }
});

test("edge venues remain inside the available frame when focused", () => {
  for (const viewport of viewports)
    for (const point of [
      { x: 238.8, y: 146 },
      { x: 972.9, y: 854.6 },
      { x: 1320, y: 150 },
      { x: 704.4, y: 478.7 },
    ]) {
      const camera = focusMapCamera(point, 4.93, viewport);
      const { frame } = viewport;
      expect(point.x * camera.scale + camera.x).toBeGreaterThanOrEqual(frame.x);
      expect(point.x * camera.scale + camera.x).toBeLessThanOrEqual(frame.x + frame.width);
      expect(point.y * camera.scale + camera.y).toBeGreaterThanOrEqual(frame.y);
      expect(point.y * camera.scale + camera.y).toBeLessThanOrEqual(frame.y + frame.height);
    }
});

test("high zoom cannot drift into the empty southwest corner and bounds remain stable", () => {
  const viewport = viewports[0]!;
  const camera = constrainMapCamera({ x: 100000, y: -100000, scale: 8 }, viewport);
  const centre = {
    x: (viewport.frame.x + viewport.frame.width / 2 - camera.x) / camera.scale,
    y: (viewport.frame.y + viewport.frame.height / 2 - camera.y) / camera.scale,
  };
  // At this latitude the resort lies east of its diagonal western boundary.
  expect(centre.x).toBeGreaterThanOrEqual(120 + ((centre.y - 104) * 936) / 846 - 0.001);
  const again = constrainMapCamera(camera, viewport);
  expect(again.x).toBeCloseTo(camera.x);
  expect(again.y).toBeCloseTo(camera.y);
});
