import type { Level } from "@/data/resort";
export type ResortLevel = Level;
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
export interface MapPlaceRow {
  id: string;
  name: string;
  level_id: Level;
  pin: number;
  x: number;
  y: number;
  zoom: number;
  active: boolean;
}
export interface MapLinkRow {
  place_id: string;
  destination_id: string;
  display_order: number;
  is_primary: boolean;
  active: boolean;
}
