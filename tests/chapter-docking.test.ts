import { describe, expect, test } from "bun:test";
import { chapterDockTarget } from "../src/lib/chapter-docking";

describe("chapter arrival assistance", () => {
  test("completes a nearby arrival in either direction", () => {
    expect(chapterDockTarget([1000, 1900], 960, 800, 800)).toBe(1000);
    expect(chapterDockTarget([1000, 1900], 1030, 1200, 800)).toBe(1000);
  });
  test("does not pull departures back or stop a long descent", () => {
    expect(chapterDockTarget([1000], 1040, 1000, 800)).toBeNull();
    expect(chapterDockTarget([1000], 960, 1000, 800)).toBeNull();
    expect(chapterDockTarget([1900], 1870, 1000, 800)).toBeNull();
  });
  test("ignores taps, distant arrivals and already aligned chapters", () => {
    expect(chapterDockTarget([1000], 960, 958, 800)).toBeNull();
    expect(chapterDockTarget([1000], 920, 800, 800)).toBeNull();
    expect(chapterDockTarget([1000], 999, 800, 800)).toBeNull();
  });
});
