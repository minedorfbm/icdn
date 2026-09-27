const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Hold at each station while its cards are explored; travel as the next level enters. */
export function journeyPosition(scrollY: number, stationTops: readonly number[], viewport: number) {
  const last = stationTops.length - 1;
  if (last <= 0 || scrollY <= stationTops[0]!) return { progress: 0, station: 0 };
  for (let index = 1; index <= last; index++) {
    const destination = stationTops[index]!;
    if (scrollY >= destination) continue;
    const departure = Math.max(stationTops[index - 1]!, destination - viewport * 0.85);
    const fraction = clamp((scrollY - departure) / Math.max(1, destination - departure));
    const position = index - 1 + fraction;
    return { progress: position / last, station: Math.round(position) };
  }
  return { progress: 1, station: last };
}

/** A reversible entrance driven by scrolling, with a visible fallback before JS runs. */
export function arrivalProgress(elementTop: number, scrollY: number, viewport: number) {
  return clamp((viewport * 0.94 - (elementTop - scrollY)) / Math.max(1, viewport * 0.5));
}
