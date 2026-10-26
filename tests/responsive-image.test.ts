import { expect, test } from "bun:test";
import { imageSource } from "../src/lib/image-source";
import {
  thumbnail,
  responsiveImage,
  detailHeroImage,
  detailHeroAvif,
  detailHeroPreload,
  coverImageSizes,
  responsiveAvif,
  picturePreload,
  homeHeroSizes,
  thumbnailImage,
  framedImageSizes,
} from "../src/lib/responsive-image";
import images from "../src/data/image-variants.json";
import runtime from "../src/data/image-variants-runtime.json";
import { compactImageManifest } from "../scripts/compact-image-manifest";

test("the browser manifest exactly matches the reviewed image inventory without audit metadata", () => {
  expect(runtime).toEqual(compactImageManifest(images));
  expect(JSON.stringify(runtime).length).toBeLessThan(JSON.stringify(images).length * 0.6);
  expect(() =>
    compactImageManifest({ "https://other.example/photo": Object.values(images)[0]! }),
  ).toThrow("public bucket");
});

test("cards request cover resolution, retaining landscape sharpness without overfetching portraits", () => {
  for (const [source, image] of Object.entries(images)) {
    const box = { width: 300, height: 540 };
    const sizes = coverImageSizes(source, box);
    const cssWidth = Number.parseInt(sizes);
    expect(cssWidth).toBeGreaterThanOrEqual(box.width);
    expect(cssWidth).toBeGreaterThanOrEqual((box.height * image.width) / image.height);
    expect(cssWidth).toBeLessThanOrEqual(
      Math.max(box.width, (box.height * image.width) / image.height) * 1.03 + 1,
    );
    expect(homeHeroSizes(source)).toContain("100svh");
    const avif = responsiveAvif(source, sizes);
    const preload = picturePreload(source, sizes);
    expect(preload.imageSrcSet).toBe(avif?.srcSet ?? responsiveImage(source, sizes).srcSet);
    expect(preload.imageSizes).toBe(sizes);
    expect(preload.type).toBe(avif ? "image/avif" : undefined);
    if (avif) expect(avif.sizes).toBe(sizes);
  }
  expect(responsiveAvif("/new-photo", "300px")).toBeUndefined();
  expect(picturePreload("/new-photo", "300px").href).toBe("/new-photo");
  expect(coverImageSizes("/new-photo", { width: 300, height: 540 })).toBe("557px");
  expect(homeHeroSizes("/new-photo")).toContain("* 1)");
});

test("small badges offer retina candidates and preserve unknown CMS fallbacks", () => {
  const image = thumbnailImage("/michelin-key.webp", "80px");
  expect(image.sizes).toBe("80px");
  expect(image.srcSet).toContain("320w");
  expect(thumbnailImage("/new-badge.png", "80px")).toEqual({ src: "/new-badge.png" });
});

test("cropped strips preserve cover detail while fullscreen galleries fit within the viewport", () => {
  const source = Object.keys(images)[0]!;
  expect(framedImageSizes(source, "260px", "347px", "cover")).toStartWith("max(260px,");
  expect(framedImageSizes(source, "100vw", "78svh", "contain")).toStartWith("min(100vw,");
  expect(framedImageSizes("/new-photo", "100vw", "78svh", "contain")).toBe("100vw");
});

test("new CMS photographs keep their original URL until derivatives are published", () => {
  const source = "https://example.com/new-photo.webp";
  expect(thumbnail(source)).toBe(source);
  expect(responsiveImage(source, "75vw")).toEqual({ src: source });
});

const bucket = "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/";
test("every generated source stays in Storage, including aliases and native fallback", () => {
  for (const [source, image] of Object.entries(images)) {
    expect(source).toStartWith(bucket);
    for (const variant of image.variants) {
      expect(variant.src).toStartWith(bucket);
      expect(variant.bytes).toBeGreaterThan(0);
    }
    expect(thumbnail(source)).toBe(image.variants[0]?.src ?? source);
    for (const alias of image.aliases) {
      expect(imageSource(alias)).toBe(source);
      expect(responsiveImage(alias, "900px")).toEqual(responsiveImage(source, "900px"));
      expect(detailHeroPreload(alias)).toEqual(detailHeroPreload(source));
    }
    if (image.variants.length) {
      const card = responsiveImage(source, "900px");
      expect(card.srcSet).toContain(`${source} ${image.width}w`);
      expect(card.sizes).toBe("900px");
      expect(card.srcSet).not.toContain("320w");
    }
  }
});

test("expanded heroes preserve native dimensions and cover geometry without duplicate candidates", () => {
  for (const [source, image] of Object.entries(images)) {
    const hero = detailHeroImage(source);
    expect(hero.src).toBe(source);
    expect(hero.sizes).toContain("58svh");
    expect(hero.sizes).toContain("min-width: 1200px");
    const candidates = hero.srcSet!.split(", ");
    expect(new Set(candidates.map((item) => item.split(" ").at(-1))).size).toBe(candidates.length);
    expect(candidates.at(-1)).toEndWith(`${image.width}w`);
    const native = image.variants.find((variant) => variant.width === image.width);
    expect(candidates.at(-1)).toBe(`${native?.src ?? source} ${image.width}w`);
  }
  expect(detailHeroImage("https://example.com/new-photo.webp")).toEqual({
    src: "https://example.com/new-photo.webp",
  });
});

test("AVIF preloads agree with the native source and retain a fallback for new CMS images", () => {
  for (const [source, image] of Object.entries(images)) {
    const preload = detailHeroPreload(source);
    const avif = detailHeroAvif(source);
    if ("avif" in image) {
      expect(avif?.src).toBe(image.avif.src);
      expect(avif?.srcSet?.split(", ").at(-1)).toBe(`${image.avif.src} ${image.width}w`);
      if ("avifVariants" in image)
        for (const variant of image.avifVariants) {
          expect(avif?.srcSet).toContain(`${variant.src} ${variant.width}w`);
          expect(variant.src).toStartWith(bucket);
        }
      expect(preload.imageSrcSet).toBe(avif?.srcSet);
      expect(preload.imageSizes).toBe(avif?.sizes);
      expect(image.avif.src).toStartWith(bucket);
      expect(preload.href).toBe(image.avif.src);
      expect(preload.type).toBe("image/avif");
    } else {
      expect(avif).toBeUndefined();
      expect(preload.href).toBe(source);
      expect(preload.type).toBeUndefined();
    }
  }
  const unknown = "https://example.com/new-detail.webp";
  expect(detailHeroAvif(unknown)).toBeUndefined();
  expect(detailHeroPreload(unknown).href).toBe(unknown);
});
