import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  ASSET_BY_KEY,
  DESTINATIONS,
  FALLBACK_PHOTOS,
  groupEvents,
  groupLinks,
  groupPhotos,
  groupPosts,
  LEVELS,
  OFFICIAL,
  resolveImage,
  toDestination,
  type Destination,
  type Level,
} from "@/data/resort";
import { EVENTS_BY_DESTINATION } from "@/data/events";
import type { HubData } from "@/lib/hub.functions";

export interface HubLevel {
  id: Level;
  title: string;
  line: string;
  image: string;
  clusters?: string[];
}

interface HubValue {
  levels: HubLevel[];
  destinations: Destination[];
  links: { label: string; url: string }[];
  contact: string;
}

const FALLBACK_LINKS = [
  ["Website", OFFICIAL.website],
  ["Instagram", OFFICIAL.instagram],
  ["Dining", OFFICIAL.dining],
  ["Spa", OFFICIAL.spa],
  ["IHG One Rewards", OFFICIAL.ihg],
  ["Resort Map", OFFICIAL.map],
  ["Contact", OFFICIAL.contact],
] as [string, string][];

/** Bundled photos and events, used only when the database is unreachable. */
const withFallbackMedia = (list: Destination[]): Destination[] =>
  list.map((dest) => {
    const photos = (FALLBACK_PHOTOS[dest.id] ?? [])
      .map((key) => resolveImage(key))
      .filter(Boolean)
      .map((image) => ({ image }));
    const events = dest.events ?? EVENTS_BY_DESTINATION[dest.id];
    const gallery = dest.photos ?? (photos.length > 0 ? photos : undefined);
    // A destination whose Instagram link already points at a single post gets a
    // featured post automatically, even before an entry exists in the database.
    const handleMatch = dest.instagram_url?.match(/instagram\.com\/([^/?]+)/);
    const handle =
      handleMatch && !["p", "reel", "reels"].includes(handleMatch[1] ?? "")
        ? handleMatch[1]
        : undefined;
    const inferred =
      dest.instagram_url && /instagram\.com\//.test(dest.instagram_url)
        ? [
            {
              post_url: dest.instagram_url,
              account: handle ?? "intercontinentaldanang",
              ...(gallery?.[0]?.image ? { image: gallery[0].image } : {}),
              caption: dest.short_description,
            },
          ]
        : undefined;
    const posts = dest.posts ?? inferred;
    return {
      ...dest,
      ...(gallery ? { photos: gallery } : {}),
      ...(events ? { events } : {}),
      ...(posts ? { posts } : {}),
    };
  });

const FALLBACK: HubValue = {
  levels: LEVELS,
  destinations: withFallbackMedia(DESTINATIONS),
  links: FALLBACK_LINKS.map(([label, url]) => ({ label, url })),
  contact: OFFICIAL.contact,
};

const HubContext = createContext<HubValue>(FALLBACK);

/** Database content, with the bundled editorial data as a safety net. */
export function HubProvider({ data, children }: { data?: HubData; children: ReactNode }) {
  const value = useMemo<HubValue>(() => {
    if (!data || data.levels.length === 0 || data.destinations.length === 0) return FALLBACK;

    const levels: HubLevel[] = data.levels.map((l) => ({
      id: l.id as Level,
      title: l.title,
      line: l.line,
      image:
        (l.image_key ? ASSET_BY_KEY[l.image_key] : undefined) ??
        LEVELS.find((x) => x.id === l.id)?.image ??
        "",
      ...(l.clusters.length > 0 ? { clusters: l.clusters } : {}),
    }));

    const photosByDest = groupPhotos(data.photos ?? []);
    const linksByDest = groupLinks(data.links ?? []);
    const eventsByDest = groupEvents(data.events ?? []);
    const postsByDest = groupPosts(data.posts ?? []);
    const s = data.settings;
    const links = (
      [
        ["Website", s["website"]],
        ["Instagram", s["instagram"]],
        ["Dining", s["dining"]],
        ["Spa", s["spa"]],
        ["IHG One Rewards", s["ihg"]],
        ["Resort Map", s["map"]],
        ["Contact", s["contact"]],
      ] as [string, string | undefined][]
    )
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
      .map(([label, url]) => ({ label, url }));

    return {
      levels,
      destinations: withFallbackMedia(
        data.destinations.map((row) =>
          toDestination(
            row,
            photosByDest[row.id],
            linksByDest[row.id],
            eventsByDest[row.id],
            postsByDest[row.id],
          ),
        ),
      ),
      links: links.length > 0 ? links : FALLBACK.links,
      contact: s["contact"] ?? OFFICIAL.contact,
    };
  }, [data]);

  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}

export function useHub() {
  return useContext(HubContext);
}
