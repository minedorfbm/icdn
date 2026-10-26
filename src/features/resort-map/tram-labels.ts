import type { MapRect } from "./map-camera";

export const overlaps = (a: MapRect, b: MapRect) =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

/** Lay out a column of signs in screen pixels; the leaders retain the true stops. */
export function layoutTramLabels<T extends { x: number; y: number }>(
  stops: T[],
  width: number,
  obstacles: MapRect[],
  viewport: MapRect,
): (T & { box: MapRect })[] {
  const visible = stops
    .filter(
      (p) =>
        p.x > viewport.x &&
        p.x < viewport.x + viewport.width &&
        p.y > viewport.y &&
        p.y < viewport.y + viewport.height,
    )
    .sort((a, b) => a.y - b.y);
  if (!visible.length) return [];
  const ys: number[] = [];
  visible.forEach((p, i) => ys.push(Math.max(p.y, (ys[i - 1] ?? -Infinity) + 36)));
  const offset = ys.reduce((sum, y, i) => sum + y - visible[i]!.y, 0) / visible.length;
  const left = Math.min(...visible.map((p) => p.x));
  const right = Math.max(...visible.map((p) => p.x));
  const candidates = Array.from({ length: 12 }, (_, i) => [
    right + 24 + i * 12,
    left - 24 - width - i * 12,
  ]).flat();
  let best: (T & { box: MapRect })[] = [];
  let bestScore = Infinity;
  for (const x of candidates) {
    if (x < viewport.x + 8 || x + width > viewport.x + viewport.width - 8) continue;
    const signs = visible.map((p, i) => ({
      ...p,
      box: { x, y: ys[i]! - offset - 15, width, height: 30 },
    }));
    const collisions = signs.reduce(
      (count, sign) => count + obstacles.filter((obstacle) => overlaps(sign.box, obstacle)).length,
      0,
    );
    const score = collisions * 1000 + Math.min(Math.abs(x - right), Math.abs(x + width - left));
    if (score < bestScore) {
      bestScore = score;
      best = signs;
    }
  }
  // Near a viewport edge, keep the stops themselves visible rather than detached labels.
  return best;
}
