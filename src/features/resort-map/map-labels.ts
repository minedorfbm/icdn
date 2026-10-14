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
