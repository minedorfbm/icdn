import { bensleyTour } from "./map.data";

export const TOUR_PROGRESS_KEY = "icdn.bensley-tour.v1";
export type TourProgress = { version: 1; currentId: string; visited: string[] };
const ids = new Set(bensleyTour.map((stop) => stop.placeId));
export const emptyTourProgress = (): TourProgress => ({
  version: 1,
  currentId: bensleyTour[0]!.placeId,
  visited: [],
});

/** Stored progress is untrusted, optional, and independent of the catalogue's visibility. */
export function parseTourProgress(raw: string | null): TourProgress {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1)
      return emptyTourProgress();
    const currentId =
      "currentId" in value && typeof value.currentId === "string" && ids.has(value.currentId)
        ? value.currentId
        : bensleyTour[0]!.placeId;
    const visited =
      "visited" in value && Array.isArray(value.visited)
        ? [
            ...new Set(
              value.visited.filter((id): id is string => typeof id === "string" && ids.has(id)),
            ),
          ]
        : [];
    return { version: 1, currentId, visited };
  } catch {
    return emptyTourProgress();
  }
}

export function readTourProgress(): TourProgress {
  try {
    return parseTourProgress(window.localStorage.getItem(TOUR_PROGRESS_KEY));
  } catch {
    return emptyTourProgress();
  }
}

export function saveTourProgress(progress: TourProgress): void {
  try {
    window.localStorage.setItem(TOUR_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* The tour remains usable when browser storage is unavailable. */
  }
}

export function selectTourStop(progress: TourProgress, id: string): TourProgress {
  return ids.has(id) ? { ...progress, currentId: id } : progress;
}

export function toggleTourVisit(progress: TourProgress, id: string): TourProgress {
  if (!ids.has(id)) return progress;
  return {
    ...progress,
    visited: progress.visited.includes(id)
      ? progress.visited.filter((visited) => visited !== id)
      : [...progress.visited, id],
  };
}
