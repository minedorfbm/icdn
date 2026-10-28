import { preload } from "react-dom";
import { imageSource, imageVariants } from "@/lib/image-source";
import type { MapRequest } from "./map-context";

const canopy = "/resort-map/canopy.webp";

/** The Sharp overview is sufficient until a visitor zooms into the illustration. */
export function mapBackgroundSource(detail = false) {
  if (!detail) {
    const overview = imageVariants(canopy)?.variants.find((image) => image.width === 1600);
    if (overview) return overview.src;
  }
  return imageSource(canopy);
}
export function prepareMapBackground() {
  preload(mapBackgroundSource(), { as: "image", fetchPriority: "high" });
}
export function mapRequest(value: Record<string, unknown>): MapRequest {
  const mode = value["mode"];
  const place = value["place"] ?? value["placeId"];
  const from = value["from"];
  return {
    ...(typeof from === "string" && /^[a-z0-9-]{1,120}$/.test(from) ? { from } : {}),
    ...(typeof place === "string" && /^[a-z0-9-]{1,120}$/.test(place) ? { placeId: place } : {}),
    ...(mode === "explore" || mode === "photos" || mode === "walk" || mode === "tour"
      ? { mode }
      : {}),
  };
}
