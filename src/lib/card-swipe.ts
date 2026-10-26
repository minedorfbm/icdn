/** Choose at most one card, ignoring stale velocity after a pause. */
export function swipeStep(
  distance: number,
  travel: number,
  velocity: number,
  idleMs: number,
): number {
  const flick = idleMs < 100 && Math.abs(velocity) > 0.3 && Math.abs(distance) > 12;
  if (!flick && Math.abs(distance) <= travel * 0.28) return 0;
  const direction = flick ? velocity : distance;
  return direction < 0 ? 1 : -1;
}

/** Negative drag brings the next card (offset 1) towards the active slot (0). */
export function cardPosition(offset: number, distance: number, travel: number): number {
  return offset + distance / travel;
}

/** Wait through small diagonal movement; yield early to a clear vertical scroll. */
export function destinationSwipeAxis(dx: number, dy: number): "horizontal" | "vertical" | null {
  const x = Math.abs(dx);
  const y = Math.abs(dy);
  if (Math.max(x, y) < 10) return null;
  if (x > y * 1.2) return "horizontal";
  if (y > x * 1.2 || Math.max(x, y) >= 24) return "vertical";
  return null;
}

/** A deliberate drag or short quick flick advances one expanded card. */
export function destinationSwipeStep(
  dx: number,
  dy: number,
  width: number,
  elapsed: number,
): -1 | 0 | 1 {
  if (elapsed < 0 || elapsed > 900 || Math.abs(dx) <= Math.abs(dy) * 1.2) return 0;
  const distance = Math.abs(dx);
  const threshold = Math.min(64, Math.max(40, width * 0.12));
  const flick = distance >= 24 && elapsed <= 250 && distance / Math.max(1, elapsed) >= 0.35;
  if (distance < threshold && !flick) return 0;
  return dx < 0 ? 1 : -1;
}
