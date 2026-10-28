import { expect, test, type Page } from "./fixtures";
import images from "../src/data/image-variants.json" with { type: "json" };
import { imageDeliveryUrl } from "../src/lib/image-delivery";

const photos = ["citron-home-hd", "tingara-home", "la-maison-1888-home-hd"].map((name) =>
  Object.values(images).find((image) => image.aliases.some((a) => a.includes(name)))!,
);
type Catalogue = {
  levels: { id: string }[];
  destinations: Record<string, unknown>[];
};

async function replacePreviews(page: Page, catalogue: Catalogue, sources: string[]) {
  const seed = catalogue.destinations[0];
  catalogue.destinations = catalogue.levels.slice(0, 3).map((level, index) => ({
    ...seed,
    id: `preview-${index}`,
    name: `Preview ${index}`,
    level_id: level.id,
    image_key: sources[index],
    detail_image_key: "/intercontinental-touch-icon.png",
  }));
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
}

for (const width of [390, 1440]) {
  test(`Discovery uses one same-width AVIF per mini-card and keeps its deck geometry at ${width}px`, async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const catalogue = await (
      await request.get("http://127.0.0.1:54329/rest/v1/rpc/published_hub_catalogue_v1")
    ).json();
    await replacePreviews(
      page,
      catalogue,
      photos.map((image) => image.src),
    );
    const calls: string[] = [];
    page.on("request", (request) => calls.push(new URL(request.url()).pathname));
    await page.goto("/");
    const deck = page.locator(".discovery-mini-deck");
    await deck.scrollIntoViewIfNeeded();
    for (let index = 0; index < photos.length; index++) {
      const photo = photos[index]!;
      const avif = photo.avifVariants.find((candidate) => candidate.width === 320)!;
      const image = deck.locator("img").nth(index);
      await expect
        .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth))
        .toBeGreaterThan(0);
      await expect
        .poll(() => image.evaluate((el: HTMLImageElement) => new URL(el.currentSrc).pathname))
        .toBe(imageDeliveryUrl(avif.src));
      expect(calls.filter((path) => path === imageDeliveryUrl(avif.src))).toHaveLength(1);
      expect(calls).not.toContain(imageDeliveryUrl(photo.variants[0]!.src));
      expect(avif.width).toBe(photo.variants[0]!.width);
      const geometry = await image.evaluate((el) => {
        const parent = el.closest(".discovery-mini-deck")!;
        const style = getComputedStyle(el);
        const frame = getComputedStyle(parent);
        return {
          widthRatio: parseFloat(style.width) / parseFloat(frame.width),
          heightRatio: parseFloat(style.height) / parseFloat(frame.height),
          transform: style.transform,
          zIndex: style.zIndex,
        };
      });
      expect(geometry.widthRatio).toBeCloseTo(0.65, 1);
      expect(geometry.heightRatio).toBeCloseTo(0.7, 1);
      expect(geometry.transform).not.toBe("none");
      expect(geometry.zIndex).toBe(String(3 - index));
    }
    await page.locator(".discovery-surprise").click();
    await expect(page).toHaveURL(/\/surprise-me$/);
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test(`Discovery preserves fresh CMS photos and known WebP-only artwork at ${width}px`, async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const catalogue = await (
      await request.get("http://127.0.0.1:54329/rest/v1/rpc/published_hub_catalogue_v1")
    ).json();
    const sources = ["/fresh-discovery.png", "/resort-map/official.webp", photos[0]!.src];
    await replacePreviews(page, catalogue, sources);
    await page.route("**/fresh-discovery.png", (route) =>
      route.fulfill({
        path: "public/intercontinental-touch-icon.png",
        contentType: "image/png",
      }),
    );
    await page.goto("/");
    const deck = page.locator(".discovery-mini-deck");
    await deck.scrollIntoViewIfNeeded();
    await expect(deck.locator("source")).toHaveCount(1);
    await expect(deck.locator("img").first()).toHaveAttribute("src", sources[0]!);
    for (const image of await deck.locator("img").all())
      await expect
        .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth))
        .toBeGreaterThan(0);
    await expect(deck.locator("img").nth(1)).toHaveAttribute("src", /320\.webp$/);
  });
}
