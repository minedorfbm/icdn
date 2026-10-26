import { imageDeliveryUrl } from "../src/lib/image-delivery";
import { expect, test } from "./fixtures";
import images from "../src/data/image-variants.json" with { type: "json" };

const portrait = Object.values(images).find(
  (image) => image.width === 768 && image.height === 1152 && "avif" in image,
)!;
const landscape = Object.values(images).find((image) =>
  image.aliases.some((alias) => alias.includes("citron-detail-3b0c495a2769")),
)!;

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]) {
  test(`home cards load cover-sized photos without duplicate format transfers at ${viewport.width}px`, async ({
    page,
    request,
  }) => {
    await page.setViewportSize(viewport);
    const catalogue = await (
      await request.get("http://127.0.0.1:54329/rest/v1/rpc/published_hub_catalogue_v1")
    ).json();
    for (const destination of catalogue.destinations) {
      if (destination.id === "citron") destination.image_key = portrait.src;
      if (destination.id === "tingara") destination.image_key = landscape.src;
    }
    await page.route("**/_serverFn/**", async (route) => {
      const response = await route.fetch();
      if (response.headers()["server-timing"]?.includes("catalogue;"))
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(catalogue),
        });
      else await route.fulfill({ response });
    });
    const calls: string[] = [];
    page.on("request", (request) => calls.push(request.url()));
    await page.goto("/");
    await expect(page.locator("#heaven")).toHaveCount(1);
    await expect(page.locator("#sea img[src]")).toHaveCount(0);
    const chapter = page.locator("#heaven");
    await chapter.scrollIntoViewIfNeeded();
    for (const [id, photo] of [
      ["citron", portrait],
      ["tingara", landscape],
    ] as const) {
      const image = chapter.locator(`[data-destination-id="${id}"] .destination-panel img`);
      await expect
        .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth))
        .toBeGreaterThan(0);
      const geometry = await image.evaluate((el: HTMLImageElement) => ({
        width: el.clientWidth,
        height: el.clientHeight,
        sizes: el.sizes,
        source: el.currentSrc,
      }));
      expect(Number.parseInt(geometry.sizes)).toBeGreaterThanOrEqual(
        Math.max(geometry.width, (geometry.height * photo.width) / photo.height),
      );
      const candidates = "avif" in photo ? [...photo.avifVariants, photo.avif] : photo.variants;
      expect(
        candidates.some(
          (candidate) =>
            new URL(imageDeliveryUrl(candidate.src), page.url()).href === geometry.source,
        ),
      ).toBe(true);
      const allCandidates = new Set(
        [...photo.variants, ...("avif" in photo ? [...photo.avifVariants, photo.avif] : [])].map(
          (candidate) => new URL(imageDeliveryUrl(candidate.src), page.url()).href,
        ),
      );
      // The discovery chooser intentionally downloads its separate 320px thumbnail.
      const thumbnail = new URL(imageDeliveryUrl(photo.variants[0]!.src), page.url()).href;
      expect(calls.filter((url) => allCandidates.has(url) && url !== thumbnail)).toEqual([
        geometry.source,
      ]);
    }
    // A resized viewport must update image hints, even after the initial cards mounted.
    const image = chapter.locator('[data-destination-id="citron"] .destination-panel img');
    const before = await image.getAttribute("sizes");
    await page.setViewportSize({ width: 834, height: 1194 });
    await expect(image).not.toHaveAttribute("sizes", before!);
    await expect
      .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
    await expect(page.locator("html")).not.toHaveAttribute("data-scroll-locked", "true");
  });
}
