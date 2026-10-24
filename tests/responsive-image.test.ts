import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { thumbnail, responsiveImage } from "../src/lib/responsive-image";
import images from "../src/data/image-variants.json";

test("new CMS photographs keep their original URL until derivatives are published", () => {
  const source = "https://example.com/new-photo.webp";
  expect(thumbnail(source)).toBe(source);
  expect(responsiveImage(source, "75vw")).toEqual({ src: source });
});

test("every generated reference is deployed, and HD remains available as a responsive candidate", () => {
  for (const [source, image] of Object.entries(images)) {
    for (const variant of image.variants) {
      expect(existsSync(new URL(`../public${variant.src}`, import.meta.url))).toBe(true);
      expect(variant.bytes).toBeGreaterThan(0);
    }
    expect(thumbnail(source)).toBe(image.variants[0]!.src);
    if (source.startsWith("https:")) {
      const card = responsiveImage(source, "900px");
      expect(card.srcSet).toContain(`${source} ${image.width}w`);
      expect(card.sizes).toBe("900px");
      expect(card.srcSet).not.toContain("320w");
    }
  }
});
