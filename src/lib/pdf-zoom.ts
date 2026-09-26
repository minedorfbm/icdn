export const MIN_PDF_ZOOM = 1;
export const MAX_PDF_ZOOM = 3;

export type Point = Readonly<{ x: number; y: number }>;

export function pinchDistance(first: Point, second: Point): number {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

export function pinchCenter(first: Point, second: Point): Point {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

export function nextPdfZoom(startZoom: number, startDistance: number, distance: number): number {
  if (startDistance <= 0) return startZoom;
  return Math.min(MAX_PDF_ZOOM, Math.max(MIN_PDF_ZOOM, (startZoom * distance) / startDistance));
}
