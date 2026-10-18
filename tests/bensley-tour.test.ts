import { describe, expect, test } from "bun:test";
import { bensleyTour } from "../src/features/resort-map/map.data";
import {
  emptyTourProgress,
  parseTourProgress,
  selectTourStop,
  toggleTourVisit,
} from "../src/features/resort-map/tour-progress";
import { tourStories } from "../src/features/resort-map/tour-stories";
import { tourCopy, tourText } from "../src/features/resort-map/tour-copy";

describe("Bensley discovery progress", () => {
  test("untrusted or obsolete browser storage cannot create unknown stops", () => {
    for (const value of [null, "not json", "null", "[]", '{"version":2}', '"text"']) {
      expect(parseTourProgress(value)).toEqual(emptyTourProgress());
    }
    expect(
      parseTourProgress(
        JSON.stringify({
          version: 1,
          currentId: "missing",
          visited: ["citron", "citron", null, 10, "missing", "lobby"],
        }),
      ),
    ).toEqual({ version: 1, currentId: "lobby", visited: ["citron", "lobby"] });
  });
  test("jumping forwards and backwards never claims a place was discovered", () => {
    let progress = selectTourStop(emptyTourProgress(), "mi-sol-lagoon");
    expect(progress.visited).toEqual([]);
    progress = toggleTourVisit(progress, "mi-sol-lagoon");
    progress = selectTourStop(progress, "citron");
    expect(parseTourProgress(JSON.stringify(progress))).toEqual({
      version: 1,
      currentId: "citron",
      visited: ["mi-sol-lagoon"],
    });
    expect(selectTourStop(progress, "unknown")).toBe(progress);
    expect(toggleTourVisit(progress, "unknown")).toBe(progress);
    expect(toggleTourVisit(progress, "mi-sol-lagoon").visited).toEqual([]);
  });
  test("every official stop has a story and observation in all six supported languages", () => {
    expect(Object.keys(tourStories).sort()).toEqual(bensleyTour.map((stop) => stop.placeId).sort());
    for (const lang of ["en", "vi", "ru", "zh", "ko", "ja"] as const) {
      for (const stop of bensleyTour) {
        const story = tourStories[stop.placeId]!;
        expect(tourText(lang, story.story).length).toBeGreaterThan(10);
        expect(tourText(lang, story.look).length).toBeGreaterThan(10);
      }
      expect(tourCopy(lang, "count")).toContain("{done}");
      expect(tourCopy(lang, "count")).toContain("{total}");
      for (const key of [
        "start",
        "resume",
        "mark",
        "marked",
        "look",
        "details",
        "overview",
        "finish",
      ] as const)
        expect(tourCopy(lang, key)).toBeTruthy();
    }
  });
  test("the tram reaches Heritage Village at Sky and La Maison at Earth", () => {
    expect(bensleyTour.find((stop) => stop.placeId === "heritage-village")).toMatchObject({
      travel: "tram",
      arrivalStation: "sky",
    });
    expect(bensleyTour.find((stop) => stop.placeId === "la-maison-1888")).toMatchObject({
      travel: "tram",
      arrivalStation: "earth",
    });
    expect(bensleyTour.find((stop) => stop.placeId === "nam-tram")?.travel).toBe("walk");
  });
});
