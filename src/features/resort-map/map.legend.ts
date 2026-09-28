import { fromOfficialPlan } from "./map.geometry";
import type { MapPoint } from "./map.types";

// Geometry only. Names, descriptions and levels are resolved from the hub database.
export type PhotoSpot = {
  id: string;
  point: MapPoint;
  offset: MapPoint;
  parentId?: string;
};
export const photoSpots: PhotoSpot[] = [
  {
    id: "A",
    point: fromOfficialPlan(1529.5, 1145),
    offset: { x: -12, y: 0 },
    parentId: "summit",
  },
  {
    id: "B",
    point: fromOfficialPlan(1350, 928.5),
    offset: { x: 12, y: 24 },
    parentId: "lobby",
  },
  {
    id: "C",
    point: fromOfficialPlan(1248, 851),
    offset: { x: -24, y: -12 },
    parentId: "citron",
  },
  {
    id: "D",
    point: fromOfficialPlan(1318.5, 676.5),
    offset: { x: -26, y: 0 },
    parentId: "la-maison-1888",
  },
  {
    id: "E",
    parentId: "wall-of-lanterns",
    point: fromOfficialPlan(1447.5, 613),
    offset: { x: -8, y: 28 },
  },
  {
    id: "F",
    point: fromOfficialPlan(1426, 517.5),
    offset: { x: -18, y: -28 },
    parentId: "garden-pool",
  },
  {
    id: "G",
    point: fromOfficialPlan(1528, 557),
    offset: { x: -8, y: -32 },
    parentId: "long-bar",
  },
  {
    id: "H",
    point: fromOfficialPlan(1573, 563.5),
    offset: { x: 20, y: 21 },
    parentId: "long-bar",
  },
  {
    id: "I",
    parentId: "coconut-beach",
    point: fromOfficialPlan(1720.5, 360),
    offset: { x: 0, y: -24 },
  },
];

export const walkingTimes = [
  { x: 488, y: 322.5, minutes: 8, direction: "right" },
  { x: 907.5, y: 443.5, minutes: 5, direction: "right" },
  { x: 696.5, y: 508.5, minutes: 6, direction: "right" },
  { x: 1214, y: 551, minutes: 2, direction: "right" },
  { x: 1024, y: 622, minutes: 3, direction: "right" },
  { x: 940.5, y: 671.5, minutes: 3, direction: "right" },
  { x: 1484, y: 1086.5, minutes: 5, direction: "left" },
].map(({ x, y, ...rest }) => ({ ...rest, point: fromOfficialPlan(x, y) }));

export type LegendLayers = { trail: boolean; walking: boolean };
