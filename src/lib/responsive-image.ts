import manifest from "@/data/image-variants.json";

type Variants = { width: number; variants: { src: string; width: number }[] };
const images: Record<string, Variants> = manifest;

/** An exact source match is required; a new CMS URL keeps its original image. */
export function thumbnail(source: string): string {
  return images[source]?.variants[0]?.src ?? source;
}

/** No crop or focal-position changes. Original HD remains the largest candidate. */
export function responsiveImage(source: string, sizes: string) {
  const image = images[source];
  if (!image) return { src: source };
  const candidates = image.variants.filter((variant) => variant.width >= 960);
  return {
    src: source,
    srcSet: [
      ...candidates.map((variant) => `${variant.src} ${variant.width}w`),
      `${source} ${image.width}w`,
    ].join(", "),
    sizes,
  };
}
