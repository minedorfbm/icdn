/** Choose at most one card, ignoring stale velocity after a pause. */
export function swipeStep(
  distance: number,
  travel: number,
  velocity: number,
  idleMs: number,
): number {
  const flick = idleMs < 100 && Math.abs(velocity) > 0.3 && Math.abs(distance) > 12;
  if (!flick && Math.abs(distance) <= travel * 0.28) return 0;
  return (flick ? velocity : distance) < 0 ? 1 : -1;
}
