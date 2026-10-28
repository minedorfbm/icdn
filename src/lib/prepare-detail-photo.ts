import { preload } from "react-dom";
import { detailHeroPreload } from "./responsive-image";

/** Warm exactly the responsive picture that the expanded card will use. */
export function prepareDetailPhoto(source: string, priority: "low" | "high" = "high") {
  const { href, ...image } = detailHeroPreload(source);
  preload(href, { ...image, as: "image", fetchPriority: priority });
  if (priority !== "high" || typeof document === "undefined") return;
  // React deduplicates preload calls. Promote an earlier background preparation
  // when the visitor actually opens the card instead of leaving its hint low.
  for (const link of document.querySelectorAll<HTMLLinkElement>(
    'link[rel="preload"][as="image"]',
  )) {
    // Responsive React preloads can omit href and use only these two hints.
    const matches = image.imageSrcSet
      ? link.getAttribute("imagesrcset") === image.imageSrcSet &&
        link.getAttribute("imagesizes") === image.imageSizes
      : link.getAttribute("href") === href;
    if (matches) link.setAttribute("fetchpriority", "high");
  }
}
