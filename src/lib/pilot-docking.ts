/** Complete a short approach in its original direction; never pull a departure back. */
export function pilotDockTarget(tops: number[], y: number, startY: number, viewport: number) {
  const travel = y - startY;
  if (Math.abs(travel) < 8 || Math.abs(travel) > viewport * 0.65) return null;
  return (
    tops.find((top) => {
      const remaining = top - y;
      return (
        Math.sign(remaining) === Math.sign(travel) &&
        Math.abs(remaining) > 2 &&
        Math.abs(remaining) <= 64
      );
    }) ?? null
  );
}
