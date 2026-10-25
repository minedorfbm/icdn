export type { OpeningHours } from "./opening-hours-schema";

export function hoursTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** ISO weekdays (Monday=1) rendered independently of the visitor's time zone. */
export function hoursDays(days: number[], locale: string, daily: string): string {
  const ordered = [...new Set(days)].sort((a, b) => a - b);
  if (ordered.length === 7) return daily;
  const weekday = (day: number) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2026, 0, 4 + day)));
  const groups: string[] = [];
  for (let i = 0; i < ordered.length; i++) {
    const first = ordered[i]!;
    let last = first;
    while (ordered[i + 1] === last + 1) last = ordered[++i]!;
    groups.push(first === last ? weekday(first) : `${weekday(first)}–${weekday(last)}`);
  }
  return groups.join(", ");
}
