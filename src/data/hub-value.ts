import type { MapPlaceRow, MapLinkRow } from "@/features/resort-map/map.types";
import { currentLinkTranslations, type LinkTranslations } from "@/lib/localized-links";
import {
  groupEvents,
  groupLinks,
  groupPhotos,
  groupPosts,
  groupVideos,
  LEVELS,
  OFFICIAL,
  resolveImage,
  toDestination,
  type Destination,
  type Level,
} from "@/data/resort";
import portraitHero from "@/assets/hero-lobby-portrait-20261023.webp";
import landscapeHero from "@/assets/hero-lobby-landscape-20261023.webp";
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
  heroImage: string;
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
  return resolveImage(reference ?? "") || (format === "landscape" ? landscapeHero : portraitHero);
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

  const photosByDest = groupPhotos(data.photos ?? []);
  const linksByDest = groupLinks(data.links ?? [], data.linkTranslations ?? []);
  const eventsByDest = groupEvents(data.events ?? []);
  const postsByDest = groupPosts(data.posts ?? []);
  const videosByDest = groupVideos(data.videos ?? []);
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
    heroImage: resolveHeroImage(data),
    mapPlaces: data.mapPlaces ?? [],
    mapLinks: data.mapLinks ?? [],
    levels,
    destinations: data.destinations.map((row) => {
      const dest = toDestination(
        row,
        photosByDest[row.id] ?? [],
        linksByDest[row.id] ?? [],
        eventsByDest[row.id] ?? [],
        postsByDest[row.id] ?? [],
        videosByDest[row.id] ?? [],
      );
      return dest;
    }),
    links,
    contact: s["contact"] ?? OFFICIAL.contact,
    whatsapp: s["whatsapp"],
    zalo: s["zalo"],
  };
}
