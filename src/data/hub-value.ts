import type { MapPlaceRow, MapLinkRow } from "@/features/resort-map/map.types";
import { currentLinkTranslations, type LinkTranslations } from "@/lib/localized-links";
import {
  groupEvents,
  groupLinks,
  LEVELS,
  OFFICIAL,
  resolveImage,
  toDestination,
  type Destination,
  type Level,
} from "@/data/resort";
import { imageSource } from "@/lib/image-source";
import type { HubData } from "@/lib/hub.functions";

interface HubLevel {
  id: Level;
  title: string;
  line: string;
  image: string;
  clusters?: string[];
}

export interface HubValue {
  relations: NonNullable<HubData["relations"]>;
  mapPlaces: MapPlaceRow[];
  mapLinks: MapLinkRow[];
  levels: HubLevel[];
  destinations: Destination[];
  links: { label: string; url: string; translations?: LinkTranslations }[];
  contact: string;
  whatsapp: string | undefined;
  zalo: string | undefined;
}

/** The hero and its matching preload share the same CMS source for each format. */
export function resolveHeroImage(
  data?: Pick<HubData, "settings">,
  format: "portrait" | "landscape" = "portrait",
): string {
  const settings = data?.settings;
  const reference =
    format === "landscape"
      ? (settings?.["hero_image_landscape"] ?? settings?.["hero_image"])
      : settings?.["hero_image"];
  const resolved = resolveImage(reference ?? "");
  // Retire the previous portrait without changing landscape or future CMS choices.
  const previousPortrait = imageSource(
    "src/assets/hero-lobby-portrait-no-chandelier-e29f7810e97a.webp",
  );
  if (format === "portrait" && (!resolved || resolved === previousPortrait))
    return imageSource("/hero-lobby-portrait-fountain-20261029.webp");
  return resolved || imageSource("src/assets/hero-lobby-landscape-no-chandelier-f06bd383569a.webp");
}

export function createHubValue(data?: HubData): HubValue {
  if (!data?.levels || !data.destinations) throw new Error("Catalogue temporarily unavailable");

  const levels: HubLevel[] = data.levels.map((l) => ({
    id: l.id,
    title: l.title,
    line: l.line,
    image: resolveImage(l.image_key ?? "") || LEVELS.find((x) => x.id === l.id)?.image || "",
    ...(l.clusters.length > 0 ? { clusters: l.clusters } : {}),
  }));

  const linksByDest = groupLinks(data.links ?? [], data.linkTranslations ?? []);
  const eventsByDest = groupEvents(data.events ?? []);
  const s = data.settings ?? {};
  const links = (
    [
      ["Website", s["website"]],
      ["Instagram", s["instagram"]],
      ["YouTube", s["youtube"]],
      ["X", s["x"]],
      ["Facebook", s["facebook"]],
      ["LinkedIn", s["linkedin"]],
      ["IHG One Rewards", s["ihg"]],
      ["Resort Map", s["map"]],
      ["Contact", s["contact"]],
    ] as [string, string | undefined][]
  )
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([label, url]) => ({
      label,
      url,
      ...(label === "Website"
        ? {
            translations: currentLinkTranslations(
              (data.siteLinkTranslations ?? []).filter((item) => item.setting_key === "website"),
              url,
            ),
          }
        : {}),
    }));

  return {
    relations: data.relations ?? [],
    mapPlaces: data.mapPlaces ?? [],
    mapLinks: data.mapLinks ?? [],
    levels,
    destinations: data.destinations.map((row) => {
      const dest = toDestination(
        row,
        undefined,
        linksByDest[row.id] ?? [],
        eventsByDest[row.id] ?? [],
      );
      if (data.openingHours) {
        dest.initialHours = data.openingHours.filter((hours) => hours.destination_id === row.id);
      }
      return dest;
    }),
    links,
    contact: s["contact"] ?? OFFICIAL.contact,
    whatsapp: s["whatsapp"],
    zalo: s["zalo"],
  };
}
