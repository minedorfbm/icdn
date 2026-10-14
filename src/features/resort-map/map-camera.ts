import type { MapPoint } from "./map.types";

export type MapRect = { x: number; y: number; width: number; height: number };
export type MapViewport = MapRect & { frame: MapRect };
export type MapCamera = { x: number; y: number; scale: number };

// Extent of the registered resort illustration, including the western pavilion,
// eastern residences and entrance. The surrounding sea is not a pan destination.
export const RESORT_BOUNDS: MapRect = { x: 120, y: -46, width: 1332, height: 996 };
// Trim the empty corners of the rectangular extent while retaining the bay,
// both ends of the resort and the entrance. These are camera limits, not new pins.
const RESORT_ENVELOPE: MapPoint[] = [
  { x: 120, y: 104 },
  { x: 198, y: 71 },
  { x: 1320, y: -46 },
  { x: 1452, y: -46 },
  { x: 1440, y: 920 },
  { x: 1056, y: 950 },
];
export const MAX_MAP_SCALE = 8;
export const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export const overviewScale = ({ frame }: MapViewport) =>
  Math.min(frame.width / RESORT_BOUNDS.width, frame.height / RESORT_BOUNDS.height, MAX_MAP_SCALE);

function constrainAxis(
  position: number,
  scale: number,
  start: number,
  length: number,
  frameStart: number,
  frameLength: number,
) {
  const projectedLength = length * scale;
  // A short axis stays centred instead of floating through a large empty canvas.
  if (projectedLength <= frameLength)
    return frameStart + (frameLength - projectedLength) / 2 - start * scale;
  return clamp(
    position,
    frameStart + frameLength - (start + length) * scale,
    frameStart - start * scale,
  );
}

function clipEnvelope(
  points: MapPoint[],
  axis: "x" | "y",
  edge: number,
  keepAbove: boolean,
): MapPoint[] {
  const result: MapPoint[] = [];
  points.forEach((point, i) => {
    const previous = points[(i + points.length - 1) % points.length]!;
    const inside = keepAbove ? point[axis] >= edge : point[axis] <= edge;
    const previousInside = keepAbove ? previous[axis] >= edge : previous[axis] <= edge;
    if (inside !== previousInside) {
      const ratio = (edge - previous[axis]) / (point[axis] - previous[axis]);
      result.push({
        x: previous.x + (point.x - previous.x) * ratio,
        y: previous.y + (point.y - previous.y) * ratio,
      });
    }
    if (inside) result.push(point);
  });
  return result;
}

function nearestInEnvelope(point: MapPoint, polygon: MapPoint[]): MapPoint {
  if (!polygon.length) return point;
  const edges = polygon.map((a, i) => [a, polygon[(i + 1) % polygon.length]!] as const);
  if (
    edges.every(
      ([a, b]) => (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x) >= -0.0001,
    )
  )
    return point;
  return edges
    .map(([a, b]) => {
      const dx = b.x - a.x,
        dy = b.y - a.y;
      const t = clamp(
        ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy || 1),
        0,
        1,
      );
      return { x: a.x + t * dx, y: a.y + t * dy };
    })
    .reduce(
      (best, candidate) =>
        Math.hypot(candidate.x - point.x, candidate.y - point.y) <
        Math.hypot(best.x - point.x, best.y - point.y)
          ? candidate
          : best,
      polygon[0]!,
    );
}

export function constrainMapCamera(camera: MapCamera, viewport: MapViewport): MapCamera {
  const scale = clamp(camera.scale, overviewScale(viewport), MAX_MAP_SCALE);
  const { frame } = viewport;
  const bounded = {
    scale,
    x: constrainAxis(camera.x, scale, RESORT_BOUNDS.x, RESORT_BOUNDS.width, frame.x, frame.width),
    y: constrainAxis(camera.y, scale, RESORT_BOUNDS.y, RESORT_BOUNDS.height, frame.y, frame.height),
  };
  const halfWidth = Math.min(RESORT_BOUNDS.width / 2, frame.width / scale / 2);
  const halfHeight = Math.min(RESORT_BOUNDS.height / 2, frame.height / scale / 2);
  let envelope = clipEnvelope(RESORT_ENVELOPE, "x", RESORT_BOUNDS.x + halfWidth, true);
  envelope = clipEnvelope(envelope, "x", RESORT_BOUNDS.x + RESORT_BOUNDS.width - halfWidth, false);
  envelope = clipEnvelope(envelope, "y", RESORT_BOUNDS.y + halfHeight, true);
  envelope = clipEnvelope(
    envelope,
    "y",
    RESORT_BOUNDS.y + RESORT_BOUNDS.height - halfHeight,
    false,
  );
  const centre = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 };
  const mapCentre = { x: (centre.x - bounded.x) / scale, y: (centre.y - bounded.y) / scale };
  const limited = nearestInEnvelope(mapCentre, envelope);
  return { scale, x: centre.x - limited.x * scale, y: centre.y - limited.y * scale };
}

export function focusMapCamera(point: MapPoint, scale: number, viewport: MapViewport): MapCamera {
  const { frame } = viewport;
  return constrainMapCamera(
    {
      scale,
      x: frame.x + frame.width / 2 - point.x * scale,
      y: frame.y + frame.height / 2 - point.y * scale,
    },
    viewport,
  );
}

export const fitMapCamera = (viewport: MapViewport) =>
  focusMapCamera(
    {
      x: RESORT_BOUNDS.x + RESORT_BOUNDS.width / 2,
      y: RESORT_BOUNDS.y + RESORT_BOUNDS.height / 2,
    },
    overviewScale(viewport),
    viewport,
  );
