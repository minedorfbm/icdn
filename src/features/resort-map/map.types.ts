import type { z } from "zod";
import type { mapPlaceRow, mapLinkRow } from "@/lib/hub-schema";
import type { Level } from "@/data/resort";
export type PlaceCategory = "dining" | "wellness" | "experiences" | "beach" | "bensley";
export type MapPoint = { x: number; y: number };
export type Place = {
  id: string;
  pin: number;
  name: string;
  level: Level;
  categories: PlaceCategory[];
  point: MapPoint;
  focus: MapPoint & { zoom: number };
  tourOrder?: number;
};
export type TourStop = { placeId: string; order: number; travel: "walk" | "tram" };
export type MapPlaceRow = z.infer<typeof mapPlaceRow>;
export type MapLinkRow = z.infer<typeof mapLinkRow>;
