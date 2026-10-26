import { expect, test } from "./fixtures";
import images from "../src/data/image-variants.json" with { type: "json" };
const knownPhoto =
  "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/citron-detail-3b0c495a2769.webp";
const photo = Object.values(images).find((image) => image.aliases.includes(knownPhoto))! as {
  src: string;
  variants: { src: string }[];
  avifVariants: { src: string }[];
  avif: { src: string };
};
const photoPaths = new Set([
  new URL(knownPhoto).pathname,
  ...photo.variants.map((v) => new URL(v.src).pathname),
  ...photo.avifVariants.map((v) => new URL(v.src).pathname),
  new URL(photo.avif.src).pathname,
]);
for (const scenario of [
  { label: "new CMS photo", hero: "/intercontinental-touch-icon.png?card-detail-only=citron" },
  { label: "responsive photo", hero: knownPhoto },
  { label: "tablet responsive photo", hero: knownPhoto, viewport: { width: 834, height: 1194 } },
  { label: "desktop responsive photo", hero: knownPhoto, viewport: { width: 1440, height: 900 } },
]) {
  test(`selected ${scenario.label} starts while fresh card data are pending`, async ({
    page,
    request,
  }) => {
    if (scenario.viewport) await page.setViewportSize(scenario.viewport);
    const hero = scenario.hero;
    // Keep fallback reads inside the fixture, including a browser without AVIF support.
    if (scenario.hero === knownPhoto)
      await page.route(knownPhoto, (route) =>
        route.fulfill({
          path: new URL("../public/intercontinental-touch-icon.png", import.meta.url).pathname,
          contentType: "image/png",
        }),
      );
    const catalogue = await (
      await request.get("http://127.0.0.1:54329/rest/v1/rpc/published_hub_catalogue_v1")
    ).json();
    const cardSnapshot = await (
      await request.get(
        "http://127.0.0.1:54329/rest/v1/rpc/published_hub_destination_card_v1?requested_destination_id=citron",
      )
    ).json();
    for (const destination of catalogue.destinations)
      destination.detail_image_key =
        destination.id === "citron"
          ? hero
          : `/intercontinental-touch-icon.png?card-detail-only=${destination.id}`;
    cardSnapshot.destination.detail_image_key = hero;
    let block = false;
    let published = true;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/_serverFn/**", async (route) => {
      if (block) await gate;
      const response = await route.fetch();
      const timing = response.headers()["server-timing"] ?? "";
      if (timing.includes("catalogue;") || timing.includes("card;")) {
        const result = timing.includes("catalogue;") ? catalogue : cardSnapshot;
        // Catalogue transport is plain JSON; the focused card uses server-function JSON.
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            timing.includes("catalogue;")
              ? result
              : {
                  result: timing.includes("card;") && !published ? null : result,
                  context: {},
                },
          ),
        });
      } else await route.fulfill({ response });
    });
    const start = new Date("2026-10-25T12:00:00Z");
    await page.clock.setFixedTime(start);
    await page.goto("/");
    const card = page.locator("#heaven").getByRole("button", { name: "Citron", exact: true });
    await expect(card).toBeVisible();
    const requests: string[] = [];
    page.on("request", (request) => {
      if (
        request.url().includes("card-detail-only=") ||
        (photoPaths.has(new URL(request.url()).pathname) &&
          // Visible desktop/tablet picker thumbnails are intentional, not hero transfers.
          new URL(request.url()).pathname !== new URL(photo.variants[0]!.src).pathname)
      )
        requests.push(request.url());
    });
    await page.clock.setFixedTime(new Date(start.getTime() + 31_000));
    block = true;
    await card.click();
    try {
      await expect(page.getByRole("status")).toHaveText("Loading…");
      await expect.poll(() => requests.length, { timeout: 1500 }).toBe(1);
      await expect(page.locator(".editorial-detail")).toHaveCount(0);
    } finally {
      release();
    }
    await expect(page.locator(".editorial-title")).toHaveText("Citron");
    await expect(page.locator(".editorial-hero img")).toHaveJSProperty("complete", true);
    expect(
      await page
        .locator(".editorial-hero img")
        .evaluate((image: HTMLImageElement) => image.currentSrc),
    ).toBe(requests[0]);
    await expect
      .poll(() =>
        page
          .locator(".editorial-hero img")
          .evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBeGreaterThan(0);
    const selectedSource = await page
      .locator(".editorial-hero img")
      .evaluate((image: HTMLImageElement) => image.currentSrc);
    expect(requests.filter((url) => url === selectedSource)).toHaveLength(1);
    expect(requests).toHaveLength(1);
    if (scenario.viewport) {
      await page.getByRole("button", { name: "Photo 2", exact: true }).click();
      await expect
        .poll(() =>
          page
            .locator(".editorial-hero img")
            .evaluate((image: HTMLImageElement) => image.currentSrc),
        )
        .toBe(
          Object.values(images).find((image) =>
            image.aliases.includes("/intercontinental-touch-icon.png"),
          )!.src,
        );
      expect(requests).toHaveLength(1);
      await page.getByRole("button", { name: "Photo 1", exact: true }).click();
      await expect
        .poll(() =>
          page
            .locator(".editorial-hero img")
            .evaluate((image: HTMLImageElement) => image.currentSrc),
        )
        .toBe(selectedSource);
      expect(requests.filter((url) => url !== selectedSource)).toEqual([]);
      expect(requests.length).toBeLessThanOrEqual(2);
    }
    const initialRequests = requests.length;
    await page.getByRole("button", { name: "BACK", exact: true }).click();
    await expect(card).toBeVisible();
    const updatedHero = "/intercontinental-touch-icon.png?card-detail-only=citron&updated=1";
    cardSnapshot.destination.detail_image_key = updatedHero;
    await page.clock.setFixedTime(new Date(start.getTime() + 62_000));
    await card.click();
    await expect(page.locator(".editorial-title")).toHaveText("Citron");
    await expect
      .poll(() =>
        page.locator(".editorial-hero img").evaluate((image: HTMLImageElement) => image.currentSrc),
      )
      .toContain(updatedHero);
    const updatedSource = await page
      .locator(".editorial-hero img")
      .evaluate((image: HTMLImageElement) => image.currentSrc);
    const updatedRequests = requests.slice(initialRequests);
    expect(updatedRequests.filter((url) => url === updatedSource)).toHaveLength(1);
    expect(updatedRequests).toHaveLength(1);
    await page.getByRole("button", { name: "BACK", exact: true }).click();
    await expect(card).toBeVisible();
    published = false;
    await page.clock.setFixedTime(new Date(start.getTime() + 93_000));
    await card.click();
    // Warming a known image must not make a removed card survive fresh publication checks.
    await expect(page.getByRole("heading", { name: "404", exact: true })).toBeVisible();
    await expect(page.locator(".editorial-detail")).toHaveCount(0);
  });
}

test.describe("native responsive image on a direct route", () => {
  test.use({ javaScriptEnabled: false });
  test("known AVIF keeps its original fallback available without hydration", async ({ page }) => {
    await page.route(knownPhoto, (route) =>
      route.fulfill({
        path: new URL("../public/intercontinental-touch-icon.png", import.meta.url).pathname,
        contentType: "image/png",
      }),
    );
    await page.goto("/design-digital-tour");
    const image = page.locator(".editorial-hero img");
    await expect(image).toHaveAttribute("src", photo.src);
    await expect(image).toHaveAttribute("srcset", new RegExp("/hub-images/adj-"));
    await expect(image).not.toHaveAttribute("loading", "lazy");
    await expect
      .poll(() =>
        image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0),
      )
      .toBe(true);
    expect(await image.evaluate((node: HTMLImageElement) => node.currentSrc)).toMatch(/\.avif$/);
    await expect(page.locator(".editorial-title")).toHaveText("Bill Bensley Digital Design Tour");
  });
});
