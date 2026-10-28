import { expect, test } from "bun:test";
import { isDestinationPath, isHubScreen } from "../src/lib/hub-screen";
import { mapBackgroundSource, mapRequest } from "../src/features/resort-map/map-background";
import { imageSource, imageVariants } from "../src/lib/image-source";

test("map entry uses the Sharp overview while close zoom retains the native HD source", () => {
  const image = imageVariants("/resort-map/canopy.webp")!;
  expect(mapBackgroundSource()).toBe(image.variants.find((variant) => variant.width === 1600)!.src);
  expect(mapBackgroundSource(true)).toBe(imageSource("/resort-map/canopy.webp"));
  expect(mapBackgroundSource()).not.toBe(mapBackgroundSource(true));
});

test("feature paths do not request a destination snapshot or create a previous-card trail", () => {
  for (const path of ["/map", "/search", "/surprise-me"]) {
    expect(isHubScreen(path)).toBe(true);
    expect(isDestinationPath(path)).toBe(false);
  }
  expect(isDestinationPath("/")).toBe(false);
  for (const path of ["/citron", "/mi-sol-spa", "/moulin-rouge"]) {
    expect(isHubScreen(path)).toBe(false);
    expect(isDestinationPath(path)).toBe(true);
  }
});

test("map deep links accept only known modes and safe place identifiers", () => {
  expect(mapRequest({ mode: "tour" })).toEqual({ mode: "tour" });
  expect(mapRequest({ mode: "tour", from: "design-digital-tour" })).toEqual({
    mode: "tour",
    from: "design-digital-tour",
  });
  expect(mapRequest({ from: "https://example.com/" })).toEqual({});
  expect(mapRequest({ mode: "photos", placeId: "citron" })).toEqual({
    mode: "photos",
    placeId: "citron",
  });
  expect(mapRequest({ mode: "walk", place: "long-pool" })).toEqual({
    mode: "walk",
    placeId: "long-pool",
  });
  for (const placeId of ["../citron", "<script>", "x".repeat(121), ["citron"], null])
    expect(mapRequest({ mode: "unknown", placeId })).toEqual({});
});
