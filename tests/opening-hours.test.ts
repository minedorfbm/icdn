import { expect, test } from "bun:test";
import { hoursDays, hoursTime, openingHoursRow } from "../src/lib/opening-hours";

test("weekday ranges use ISO weekdays and retain a separate Sunday", () => {
  expect(hoursDays([7, 1, 2, 3, 4, 5], "en", "Daily")).toBe("Mon–Fri, Sun");
  expect(hoursDays([6], "en", "Daily")).toBe("Sat");
  expect(hoursDays([1, 2, 3, 4, 5, 6, 7], "ja", "毎日")).toBe("毎日");
  expect(hoursDays([4, 5], "ja", "毎日")).toBe("木–金");
});

test("times preserve midnight, 24-hour closing and last order", () => {
  expect(hoursTime(0)).toBe("00:00");
  expect(hoursTime(390)).toBe("06:30");
  expect(hoursTime(1440)).toBe("24:00");
  const row = {
    id: "dinner",
    destination_id: "la-maison-1888",
    service: "dinner",
    days: [1, 2, 3, 4, 5, 6, 7],
    opens_minutes: 1110,
    closes_minutes: 1260,
    last_order_minutes: 1245,
    display_order: 0,
  };
  expect(openingHoursRow.safeParse(row).success).toBe(true);
  expect(openingHoursRow.safeParse({ ...row, days: [1, 1] }).success).toBe(false);
  expect(openingHoursRow.safeParse({ ...row, last_order_minutes: 1320 }).success).toBe(false);
  expect(openingHoursRow.safeParse({ ...row, closes_minutes: 1000 }).success).toBe(false);
});
