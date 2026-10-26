import manifest from "@/data/image-variants.json";

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
const images: Record<string, ImageVariants> = manifest;
const aliases = new Map<string, ImageVariants>();
for (const [source, image] of Object.entries(images)) {
  aliases.set(source, image);
  for (const alias of image.aliases ?? []) aliases.set(alias, image);
}

/** Exact reviewed aliases only: cached catalogues and current URLs use the same photo. */
export function imageVariants(source: string): ImageVariants | undefined {
  return aliases.get(source);
}

/** The native-size WebP in Storage is also the fallback, never the WordPress original. */
export function imageSource(source: string): string {
  return imageVariants(source)?.src ?? source;
}
