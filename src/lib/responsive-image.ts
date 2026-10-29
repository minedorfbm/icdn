import { imageSource, imageVariants } from "./image-source";

/** An exact source match is required; a new CMS URL keeps its original image. */
export function thumbnail(source: string): string {
  return imageVariants(source)?.variants[0]?.src ?? imageSource(source);
}

/** Prefer the existing AVIF at exactly the same width as the WebP thumbnail. */
export function thumbnailAvif(source: string): string | undefined {
  const image = imageVariants(source);
  const width = image?.variants[0]?.width;
  if (!width) return undefined;
  return (
    image?.avifVariants?.find((candidate) => candidate.width === width)?.src ??
    (image?.avif?.width === width ? image.avif.src : undefined)
  );
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

/** The browser applies its own device pixel ratio to this CSS-pixel width.
 * Cover can require a wider source than the visible frame (landscape in portrait). */
export function coverImageSizes(source: string, box: { width: number; height: number }) {
  const image = imageVariants(source);
  const aspect = image ? image.width / image.height : 1;
  return `${Math.ceil(Math.max(box.width, box.height * aspect) * 1.03)}px`;
}

export function responsiveAvif(source: string, sizes: string) {
  const image = imageVariants(source);
  return image?.avif
    ? {
        src: image.avif.src,
        srcSet: [...(image.avifVariants ?? []), image.avif]
          .map((item) => `${item.src} ${item.width}w`)
          .join(", "),
        sizes,
      }
    : undefined;
}

export function picturePreload(source: string, sizes: string) {
  const avif = responsiveAvif(source, sizes);
  const image = avif ?? responsiveImage(source, sizes);
  return preloadAttributes(image, Boolean(avif));
}

function preloadAttributes(image: { src: string; srcSet?: string; sizes?: string }, avif: boolean) {
  return {
    href: image.src,
    imageSrcSet: image.srcSet,
    imageSizes: image.sizes,
    type: avif ? "image/avif" : undefined,
  };
}

export function thumbnailImage(source: string, sizes: string) {
  const image = imageVariants(source);
  return image?.variants.length
    ? {
        src: thumbnail(source),
        srcSet: image.variants.map((item) => `${item.src} ${item.width}w`).join(", "),
        sizes,
      }
    : { src: imageSource(source) };
}

/** Keep the preload and picture aligned with the hero frame and its optional crop scale. */
export function homeHeroSizes(source: string, scale = 1) {
  const image = imageVariants(source);
  const aspect = image ? Number((image.width / image.height).toFixed(4)) : 1;
  const cover = `max(100vw, calc(max(100svh, 540px) * ${aspect}))`;
  return scale === 1 ? cover : `calc(${cover} * ${scale})`;
}

export function framedImageSizes(
  source: string,
  width: string,
  height: string,
  fit: "cover" | "contain",
) {
  const image = imageVariants(source);
  if (!image) return width;
  const aspect = Number((image.width / image.height).toFixed(4));
  return `${fit === "cover" ? "max" : "min"}(${width}, calc(${height} * ${aspect}))`;
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
  return responsiveAvif(source, detailHeroImage(source).sizes ?? "100vw");
}
export function detailHeroPreload(source: string) {
  const avif = detailHeroAvif(source);
  const image = avif ?? detailHeroImage(source);
  return preloadAttributes(image, Boolean(avif));
}
