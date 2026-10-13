import type { Destination } from "@/data/resort";
import type { MapLinkRow, MapPlaceRow, Place, PlaceCategory } from "./map.types";

export function linkedDestinations(
  placeId: string,
  links: MapLinkRow[],
  destinations: Destination[],
): Destination[] {
  const byId = new Map(destinations.filter((d) => d.active).map((d) => [d.id, d]));
  return links
    .filter((l) => l.active && l.place_id === placeId)
    .sort((a, b) => a.display_order - b.display_order)
    .flatMap((l) => {
      const d = byId.get(l.destination_id);
      return d ? [d] : [];
    });
}

export function destinationPlace(
  destinationId: string,
  links: MapLinkRow[],
  places: MapPlaceRow[],
): string | undefined {
  const published = new Set(places.filter((p) => p.active).map((p) => p.id));
  return links
    .filter((l) => l.active && l.destination_id === destinationId && published.has(l.place_id))
    .sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.display_order - b.display_order,
    )[0]?.place_id;
}

export function liveMapPlaces(
  rows: MapPlaceRow[],
  links: MapLinkRow[],
  destinations: Destination[],
): Place[] {
  return rows
    .filter((p) => p.active)
    .map((p) => {
      const related = linkedDestinations(p.id, links, destinations);
      const categories: PlaceCategory[] = p.accommodation_group
        ? ["accommodation"]
        : [
            ...new Set(
              related
                .map((d) => d.cluster?.toLowerCase())
                .filter(
                  (c): c is PlaceCategory =>
                    c === "dining" || c === "wellness" || c === "experiences",
                ),
            ),
          ];
      return {
        id: p.id,
        pin: p.pin,
        name: p.accommodation_group ? p.name : (related[0]?.name ?? p.name),
        level: p.accommodation_group ? p.level_id : (related[0]?.level ?? p.level_id),
        coveredLevels: p.covered_levels?.length ? p.covered_levels : [p.level_id],
        ...(p.accommodation_group ? { accommodationGroup: p.accommodation_group } : {}),
        ...(p.room_numbers ? { roomNumbers: p.room_numbers } : {}),
        point: { x: p.x, y: p.y },
        focus: { x: p.x, y: p.y, zoom: p.zoom },
        categories,
      };
    });
}
