import { z } from "./validation";

const openingService = z.enum([
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
