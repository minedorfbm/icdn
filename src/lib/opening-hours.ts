import { z } from "zod";

export const openingService = z.enum([
  "opening",
  "breakfast",
  "lunch",
  "afternoon_tea",
  "dinner",
  "drinks",
  "food",
]);
const minute = z.number().int().min(0).max(1440);
export const openingHoursRow = z
  .object({
    id: z.string(),
    destination_id: z.string(),
    service: openingService,
    days: z
      .array(z.number().int().min(1).max(7))
      .min(1)
      .max(7)
      .refine((days) => new Set(days).size === days.length),
    opens_minutes: minute,
    closes_minutes: minute,
    last_order_minutes: minute.nullable(),
    display_order: z.number().int(),
  })
  .refine(
    (row) =>
      row.opens_minutes < row.closes_minutes &&
      (row.last_order_minutes === null ||
        (row.last_order_minutes >= row.opens_minutes &&
          row.last_order_minutes <= row.closes_minutes)),
  );
export type OpeningHours = z.infer<typeof openingHoursRow>;

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
