import { imageSource, imageVariants } from "./image-source";

/** An exact source match is required; a new CMS URL keeps its original image. */
export function thumbnail(source: string): string {
  return imageVariants(source)?.variants[0]?.src ?? imageSource(source);
}

/** No crop or focal-position changes. Native HD remains the largest candidate. */
export function responsiveImage(source: string, sizes: string) {
  source = imageSource(source);
  const image = imageVariants(source);
  if (!image) return { src: source };
  const candidates = image.variants.filter(
    (variant) => variant.width >= 640 && variant.width < image.width,
  );
  return {
    src: source,
    srcSet: [
      ...candidates.map((variant) => `${variant.src} ${variant.width}w`),
      `${source} ${image.width}w`,
    ].join(", "),
    sizes,
  };
}

/** Expanded photos keep their full native resolution with a lighter encoded file.
 * Unknown CMS references retain their original fallback. */
export function detailHeroImage(source: string) {
  source = imageSource(source);
  const image = imageVariants(source);
  if (!image) return { src: source };
  const aspect = Number((image.width / image.height).toFixed(4));
  // Account for object-fit: cover: a narrow viewport can still need a wider source
  // when its hero is tall. Keep these dimensions aligned with editorial-detail.css.
  const sizes = `(min-width: 1200px) max(min(calc((100vw - 124px) * 0.4595), 532px), ${560 * aspect}px), (min-width: 768px) max(calc(100vw - 80px), calc(clamp(300px, 36vw, 420px) * ${aspect})), max(min(100vw, 740px), calc(clamp(350px, 58svh, 630px) * ${aspect}))`;
  const candidates = image.variants.filter(
    (variant) => variant.width >= 960 || variant.width === image.width,
  );
  return {
    src: source,
    srcSet: [
      ...candidates.map((variant) => `${variant.src} ${variant.width}w`),
      ...(candidates.some((variant) => variant.width === image.width)
        ? []
        : [`${source} ${image.width}w`]),
    ].join(", "),
    sizes,
  };
}

/** Sized AVIF candidates retain native resolution and the unchanged WebP/original fallback. */
export function detailHeroAvif(source: string) {
  const image = imageVariants(source);
  const avif = image?.avif;
  return avif
    ? {
        src: avif.src,
        srcSet: [...(image.avifVariants ?? []), avif]
          .map((item) => `${item.src} ${item.width}w`)
          .join(", "),
        sizes: detailHeroImage(source).sizes,
      }
    : undefined;
}
export function detailHeroPreload(source: string) {
  const avif = detailHeroAvif(source);
  const image = avif ?? detailHeroImage(source);
  return {
    href: image.src,
    imageSrcSet: image.srcSet,
    imageSizes: image.sizes,
    type: avif ? "image/avif" : undefined,
  };
}
