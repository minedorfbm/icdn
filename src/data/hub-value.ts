import {
  DESTINATIONS,
  FALLBACK_PHOTOS,
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
import { EVENTS_BY_DESTINATION } from "@/data/events";
import type { HubData } from "@/lib/hub.functions";

export interface HubLevel {
  id: Level;
  title: string;
  line: string;
  image: string;
  clusters?: string[];
}

export interface HubValue {
  heroImage: string;
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

export const FALLBACK: HubValue = {
  heroImage: LEVELS[0]!.image,
  levels: LEVELS,
  destinations: withFallbackMedia(DESTINATIONS),
  links: FALLBACK_LINKS.map(([label, url]) => ({ label, url })),
  contact: OFFICIAL.contact,
};

/** Use the same CMS image for the hero and its preload. */
export function resolveHeroImage(data?: HubData): string {
  const reference = data?.settings?.["hero_image"];
  const heaven = data?.levels?.find((level) => level.id === "heaven");
  return (
    resolveImage(reference ?? "") || resolveImage(heaven?.image_key ?? "") || FALLBACK.heroImage
  );
}

export function createHubValue(data?: HubData): HubValue {
  if (!data?.levels || data.destinations === null) return FALLBACK;

  const levels: HubLevel[] = data.levels.map((l) => ({
    id: l.id as Level,
    title: l.title,
    line: l.line,
    image: resolveImage(l.image_key ?? "") || LEVELS.find((x) => x.id === l.id)?.image || "",
    ...(l.clusters.length > 0 ? { clusters: l.clusters } : {}),
  }));

  const photosByDest = groupPhotos(data.photos ?? []);
  const linksByDest = groupLinks(data.links ?? []);
  const eventsByDest = groupEvents(data.events ?? []);
  const postsByDest = groupPosts(data.posts ?? []);
  const videosByDest = groupVideos(data.videos ?? []);
  const s = data.settings ?? {};
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
    heroImage: resolveHeroImage(data),
    levels,
    destinations: data.destinations.map((row) => {
      const dest = toDestination(
        row,
        photosByDest[row.id] ?? [],
        data.links === null ? undefined : (linksByDest[row.id] ?? []),
        eventsByDest[row.id] ?? [],
        postsByDest[row.id] ?? [],
        videosByDest[row.id] ?? [],
      );
      if (data.photos !== null && data.events !== null && data.posts !== null) return dest;
      const fallback = withFallbackMedia([toDestination(row)])[0]!;
      return {
        ...dest,
        photos: data.photos === null ? (fallback.photos ?? []) : (dest.photos ?? []),
        events: data.events === null ? (fallback.events ?? []) : (dest.events ?? []),
        posts: data.posts === null ? (fallback.posts ?? []) : (dest.posts ?? []),
      };
    }),
    links: data.settings === null ? FALLBACK.links : links,
    contact: s["contact"] ?? OFFICIAL.contact,
  };
}
