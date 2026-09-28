import type { z } from "zod";
import type {
  linkRow,
  eventRow,
  photoRow,
  postRow,
  videoRow,
  destinationRow,
} from "@/lib/hub-schema";
import {
  currentLinkTranslations,
  type DestinationLinkTranslationRow,
  type LinkTranslations,
} from "@/lib/localized-links";
import heavenImg from "@/assets/heaven.webp";
import skyImg from "@/assets/sky.webp";
import earthImg from "@/assets/earth.webp";
import seaImg from "@/assets/sea.webp";
import dFrenchDining from "@/assets/d-french-dining.webp";
import dCitron from "@/assets/d-citron.webp";
import dBar from "@/assets/d-bar.webp";
import dWine from "@/assets/d-wine.webp";
import dSpa from "@/assets/d-spa.webp";
import dPool from "@/assets/d-pool.webp";
import dBeach from "@/assets/d-beach.webp";
import dVilla from "@/assets/d-villa.webp";
import dGym from "@/assets/d-gym.webp";
import dGallery from "@/assets/d-gallery.webp";
import dNailStudio from "@/assets/d-nail-studio.webp";
import dBensleyGallery from "@/assets/d-bensley-gallery.webp";
import dTram from "@/assets/d-tram.webp";
import dRetail from "@/assets/d-retail.webp";
import offerEnchanted from "@/assets/offer-enchanted.webp";
import offerBensley from "@/assets/offer-bensley.webp";
import offerWedding from "@/assets/offer-wedding.webp";
import ihgRewards from "@/assets/ihg-rewards.webp";
import gDiningDetail from "@/assets/g-dining-detail.webp";
import gBarDetail from "@/assets/g-bar-detail.webp";
import gArchitectureDetail from "@/assets/g-architecture-detail.webp";
import gTerraceDetail from "@/assets/g-terrace-detail.webp";
import type { DestinationEvent } from "@/data/events";

export type { DestinationEvent };

/** Public catalogue shapes and image resolution. Editorial content lives in Supabase. */

export type Level = "heaven" | "sky" | "earth" | "sea";

export type DestinationType =
  | "restaurant"
  | "bar"
  | "spa"
  | "experience"
  | "pool"
  | "fitness"
  | "kids"
  | "retail"
  | "gallery"
  | "accommodation"
  | "service"
  | "beach"
  | "recreation";

export interface Destination {
  id: string;
  name: string;
  level: Level;
  cluster?: string;
  type: DestinationType;
  short_description: string;
  image: string;
  /** Marked as one of the resort's official Instagram photo spots. */
  instagram_spot?: boolean;
  photos?: DestinationPhoto[];
  /** Featured Instagram posts rendered as real embeds inside the detail sheet. */
  posts?: DestinationPost[];
  /** Curated YouTube videos shown only when published for this destination. */
  videos?: DestinationVideo[];
  /** Flexible link list from the database (menus, brochures, price lists…). */
  links?: DestinationLink[];
  /** Recurring events from the database. */
  events?: DestinationEvent[];
  display_order: number;
  active: boolean;
}

/** One action link attached to a destination. */
export interface DestinationLink {
  translations?: LinkTranslations;
  kind: string;
  label?: string;
  url: string;
}

/** Row shape returned by the `destination_links` table. */
export type DestinationLinkRow = z.infer<typeof linkRow>;

/** Row shape returned by the `destination_events` table. */
export type DestinationEventRow = z.infer<typeof eventRow>;

/** One curated gallery photo shown inside a destination detail sheet. */
export interface DestinationPhoto {
  image: string;
  caption?: string;
  post_url?: string;
}

/** Row shape returned by the `destination_photos` table. */
export type DestinationPhotoRow = z.infer<typeof photoRow>;

/** One featured Instagram post shown inside a destination detail sheet. */
export interface DestinationPost {
  post_url: string;
  account?: string;
  caption?: string;
  image?: string;
  posted_at?: string;
}

/** Row shape returned by the `destination_posts` table. */
export type DestinationPostRow = z.infer<typeof postRow>;

export interface DestinationVideo {
  video_id: string;
  format: "video" | "short";
  title: string;
  title_translations: Record<string, string>;
}

export type DestinationVideoRow = z.infer<typeof videoRow>;

/** Accept only video IDs from known YouTube URL formats before building an embed URL. */
export function youtubeVideoId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    let id: string | null = null;
    if (host === "youtu.be") {
      id = url.pathname.slice(1);
    } else if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else {
        const match = url.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)\/?$/);
        id = match?.[1] ?? null;
      }
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function groupVideos(rows: DestinationVideoRow[]): Record<string, DestinationVideo[]> {
  const out: Record<string, DestinationVideo[]> = {};
  for (const row of [...rows].sort((a, b) => a.display_order - b.display_order)) {
    const video_id = youtubeVideoId(row.video_url);
    if (!video_id) continue;
    (out[row.destination_id] ??= []).push({
      video_id,
      format: new URL(row.video_url).pathname.startsWith("/shorts/") ? "short" : "video",
      title: row.title,
      title_translations: row.title_translations ?? {},
    });
  }
  return out;
}

/** Groups Instagram post rows by destination, in display order. */
export function groupPosts(rows: DestinationPostRow[]): Record<string, DestinationPost[]> {
  const out: Record<string, DestinationPost[]> = {};
  for (const row of [...rows].sort((a, b) => a.display_order - b.display_order)) {
    if (!row.post_url) continue;
    const image = row.image_url ? resolveImage(row.image_url) : "";
    (out[row.destination_id] ??= []).push({
      post_url: row.post_url,
      ...(row.account ? { account: row.account } : {}),
      ...(row.caption ? { caption: row.caption } : {}),
      ...(image ? { image } : {}),
      ...(row.posted_at ? { posted_at: row.posted_at } : {}),
    });
  }
  return out;
}

/** Essential public channels also used outside the footer. */
export const OFFICIAL = {
  youtube: "https://www.youtube.com/@ICDanang",
  contact: "tel:+842363938888",
} as const;

/** The four fixed navigation stations and their default artwork. */
export const LEVELS: {
  id: Level;
  title: string;
  line: string;
  image: string;
  clusters?: string[];
}[] = [
  {
    id: "heaven",
    title: "HEAVEN",
    line: "Above the bay.",
    image: heavenImg,
    clusters: ["DINING", "WELLNESS", "EXPERIENCES"],
  },
  {
    id: "sky",
    title: "SKY",
    line: "Where the horizon opens.",
    image: skyImg,
    clusters: ["DINING", "WELLNESS", "EXPERIENCES"],
  },
  {
    id: "earth",
    title: "EARTH",
    line: "Where the resort comes alive.",
    image: earthImg,
    clusters: ["DINING", "WELLNESS", "EXPERIENCES"],
  },
  {
    id: "sea",
    title: "SEA",
    line: "Where everything slows down.",
    image: seaImg,
    clusters: ["DINING", "WELLNESS", "EXPERIENCES"],
  },
];

/** Default photography per content type. */
const TYPE_IMAGE: Record<DestinationType, string> = {
  restaurant: dFrenchDining,
  bar: dBar,
  spa: dSpa,
  experience: dGallery,
  pool: dPool,
  fitness: dGym,
  kids: dBeach,
  retail: dRetail,
  gallery: dGallery,
  accommodation: dVilla,
  service: dVilla,
  beach: dBeach,
  recreation: dBeach,
};

/** Asset registry — maps a CMS `image_key` to the bundled photography. */
export const ASSET_BY_KEY: Record<string, string> = {
  "offer-enchanted": offerEnchanted,
  "offer-bensley": offerBensley,
  "offer-wedding": offerWedding,
  "ihg-rewards": ihgRewards,
  heaven: heavenImg,
  sky: skyImg,
  earth: earthImg,
  sea: seaImg,
  "d-french-dining": dFrenchDining,
  "d-citron": dCitron,
  "d-bar": dBar,
  "d-wine": dWine,
  "d-spa": dSpa,
  "d-pool": dPool,
  "d-beach": dBeach,
  "d-villa": dVilla,
  "d-gym": dGym,
  "d-gallery": dGallery,
  "d-bensley-gallery": dBensleyGallery,
  "d-tram": dTram,
  "d-retail": dRetail,
  "g-dining-detail": gDiningDetail,
  "g-bar-detail": gBarDetail,
  "g-architecture-detail": gArchitectureDetail,
  "g-terrace-detail": gTerraceDetail,
  "d-nail-studio": dNailStudio,
};

/** Resolves a stored photo reference: either an absolute URL or an asset key. */
export function resolveImage(ref: string): string {
  if (/^(https?:)?\/\//.test(ref) || ref.startsWith("/")) return ref;
  return ASSET_BY_KEY[ref] ?? "";
}

/** Groups photo rows by destination, ready to attach to a destination. */
export function groupPhotos(rows: DestinationPhotoRow[]): Record<string, DestinationPhoto[]> {
  const out: Record<string, DestinationPhoto[]> = {};
  for (const row of [...rows].sort((a, b) => a.display_order - b.display_order)) {
    const image = resolveImage(row.image_url);
    if (!image) continue;
    (out[row.destination_id] ??= []).push({
      image,
      ...(row.caption ? { caption: row.caption } : {}),
      ...(row.post_url ? { post_url: row.post_url } : {}),
    });
  }
  return out;
}

/** Row shape returned by the database (see the `destinations` table). */
export type DestinationRow = z.infer<typeof destinationRow>;

/** Groups link rows by destination, in display order. */
export function groupLinks(
  rows: DestinationLinkRow[],
  translations: DestinationLinkTranslationRow[] = [],
): Record<string, DestinationLink[]> {
  const out: Record<string, DestinationLink[]> = {};
  for (const row of [...rows].sort((a, b) => a.display_order - b.display_order)) {
    if (!row.url) continue;
    (out[row.destination_id] ??= []).push({
      kind: row.kind,
      url: row.url,
      translations: currentLinkTranslations(
        translations.filter((item) => item.link_id === row.id),
        row.url,
      ),
      ...(row.label ? { label: row.label } : {}),
    });
  }
  return out;
}

/** Groups event rows by destination, in display order. */
export function groupEvents(rows: DestinationEventRow[]): Record<string, DestinationEvent[]> {
  const out: Record<string, DestinationEvent[]> = {};
  for (const row of [...rows].sort((a, b) => a.display_order - b.display_order)) {
    (out[row.destination_id] ??= []).push({
      ...(row.id ? { id: row.id } : {}),
      title: row.title,
      schedule: row.schedule ?? [],
      description: row.description,
      ...(row.url ? { url: row.url } : {}),
    });
  }
  return out;
}

/** Converts a database row into the shape the components already consume. */
export function toDestination(
  row: DestinationRow,
  photos?: DestinationPhoto[],
  links?: DestinationLink[],
  events?: DestinationEvent[],
  posts?: DestinationPost[],
  videos?: DestinationVideo[],
): Destination {
  const type = row.type;
  return {
    id: row.id,
    name: row.name,
    level: row.level_id,
    ...(row.cluster ? { cluster: row.cluster } : {}),
    type,
    short_description: row.short_description,
    image: resolveImage(row.image_key ?? "") || TYPE_IMAGE[type],
    ...(row.instagram_spot ? { instagram_spot: true } : {}),
    ...(photos !== undefined ? { photos } : {}),
    ...(posts !== undefined ? { posts } : {}),
    ...(videos !== undefined ? { videos } : {}),
    ...(links !== undefined ? { links } : {}),
    ...(events !== undefined ? { events } : {}),
    display_order: row.display_order,
    active: row.active,
  };
}
