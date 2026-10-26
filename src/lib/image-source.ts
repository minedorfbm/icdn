import manifest from "@/data/image-variants-runtime.json";
import { imageBucket as bucket, imageDeliveryUrl } from "./image-delivery";

type Candidate = { src: string; width: number; bytes?: number };
export type ImageVariants = {
  src?: string;
  original?: string;
  aliases?: string[];
  width: number;
  height: number;
  variants: Candidate[];
  avif?: Candidate;
  avifVariants?: Candidate[];
};
type CompactImage = {
  width: number;
  height: number;
  aliases: string[];
  variants: (string | number)[][];
  avif?: (string | number)[][];
};
const images: Record<string, CompactImage> = manifest;
const aliases = new Map<string, ImageVariants>();
const candidate = (pair: (string | number)[]): Candidate => ({
  src: imageDeliveryUrl(bucket + pair[0]),
  width: Number(pair[1]),
});
for (const [name, compact] of Object.entries(images)) {
  const source = bucket + name;
  const avifs = compact.avif?.map(candidate);
  const image: ImageVariants = {
    src: imageDeliveryUrl(source),
    width: compact.width,
    height: compact.height,
    variants: compact.variants.map(candidate),
    ...(avifs?.length ? { avif: avifs.at(-1)!, avifVariants: avifs.slice(0, -1) } : {}),
  };
  aliases.set(source, image);
  aliases.set(imageDeliveryUrl(source), image);
  for (const alias of compact.aliases)
    aliases.set(alias.startsWith("$") ? bucket + alias.slice(1) : alias, image);
}

/** Exact reviewed aliases only: cached catalogues and current URLs use the same photo. */
export function imageVariants(source: string): ImageVariants | undefined {
  return aliases.get(source);
}

/** The native-size WebP in Storage is also the fallback, never the WordPress original. */
export function imageSource(source: string): string {
  return imageVariants(source)?.src ?? source;
}
