import { overlaps } from "./tram-labels";
import type { MapRect } from "./map-camera";
/** Label boxes are measured in screen pixels; pins retain their actual map coordinates. */
export function visibleMapLabels(
  points: { id: string; x: number; y: number }[],
  selectedId: string | null,
  scale: number,
  pixelsPerMapUnit: number,
  reserved: MapRect[] = [],
): Set<string> {
  const labels = new Set<string>();
  const occupied: { x: number; y: number }[] = [];
  const ordered = [...points].sort(
    (a, b) => Number(b.id === selectedId) - Number(a.id === selectedId),
  );
  for (const point of ordered) {
    if (point.id !== selectedId && scale < 3.5) continue;
    const x = point.x * pixelsPerMapUnit;
    const y = point.y * pixelsPerMapUnit;
    if (
      point.id !== selectedId &&
      reserved.some((box) => overlaps(box, { x: x - 96, y: y + 19, width: 192, height: 34 }))
    )
      continue;
    // Reserve a full 184px label below its pin, with a small vertical gap.
    if (
      point.id !== selectedId &&
      occupied.some((p) => Math.abs(p.x - x) < 192 && Math.abs(p.y - y) < 38)
    )
      continue;
    if (
      point.id !== selectedId &&
      points.some(
        (p) =>
          p.id !== point.id &&
          Math.abs(p.x * pixelsPerMapUnit - x) < 112 &&
          p.y * pixelsPerMapUnit - y > 7 &&
          p.y * pixelsPerMapUnit - y < 61,
      )
    )
      continue;
    labels.add(point.id);
    occupied.push({ x, y });
  }
  return labels;
}

/** Separate letter buttons in screen pixels while keeping their map anchors fixed. */
export function layoutPhotoSpots(
  spots: { id: string; point: { x: number; y: number }; offset: { x: number; y: number } }[],
  pixelsPerMapUnit: number,
): Map<string, { x: number; y: number }> {
  const offsets = new Map<string, { x: number; y: number }>();
  const occupied: MapRect[] = [];
  const shifts = Array.from({ length: 13 }, (_, row) =>
    Array.from({ length: 13 }, (_, col) => ({ x: (col - 6) * 24, y: (row - 6) * 24 })),
  )
    .flat()
    .sort((a, b) => a.x * a.x + a.y * a.y - b.x * b.x - b.y * b.y);
  for (const spot of spots) {
    for (const shift of shifts) {
      const offset = { x: spot.offset.x + shift.x, y: spot.offset.y + shift.y };
      const box = {
        x: spot.point.x * pixelsPerMapUnit + offset.x - 25,
        y: spot.point.y * pixelsPerMapUnit + offset.y - 25,
        width: 50,
        height: 50,
      };
      if (occupied.some((other) => overlaps(box, other))) continue;
      occupied.push(box);
      offsets.set(spot.id, offset);
      break;
    }
  }
  return offsets;
}
