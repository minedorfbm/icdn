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
