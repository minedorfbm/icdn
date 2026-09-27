import { createContext, useContext } from "react";
export type MapMode = "explore" | "photos" | "walk" | "tour";
export interface MapRequest {
  placeId?: string;
  mode?: MapMode;
}
export const MapContext = createContext<{
  openMap: (request?: MapRequest) => void;
  locate: (id: string) => string | undefined;
}>({ openMap: () => undefined, locate: () => undefined });
export const useResortMap = () => useContext(MapContext);
