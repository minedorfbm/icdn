import { imageDeliveryUrl } from "../src/lib/image-delivery";
import images from "../src/data/image-variants.json" with { type: "json" };
import { expect, test } from "./fixtures";

const photo = Object.values(images).find((image) =>
  image.aliases.some((alias) => alias.includes("citron-detail-3b0c495a2769")),
)!;
const heroPaths = new Set(
  [...photo.variants, ...photo.avifVariants, photo.avif]
    .filter((candidate) => candidate.width >= 640)
    .map((candidate) => new URL(imageDeliveryUrl(candidate.src), "http://localhost").pathname),
);

for (const releaseBy of ["photo", "search", "timeout"] as const) {
  test(`direct card prioritizes its hero until ${releaseBy}, without downloading the home journey`, async ({
    page,
  }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    let photoRequested = false;
    let catalogueReads = 0;
    const assets: string[] = [];
    page.on("request", (request) => assets.push(request.url()));
    await page.route(
      (url) => heroPaths.has(url.pathname),
      async (route) => {
        photoRequested = true;
        await gate;
        await route.fulfill({
          path: new URL("../public/intercontinental-touch-icon.png", import.meta.url).pathname,
          contentType: "image/png",
        });
      },
    );
    await page.route("**/_serverFn/**", async (route) => {
      const response = await route.fetch();
      if (response.headers()["server-timing"]?.includes("catalogue;")) catalogueReads++;
      await route.fulfill({ response });
    });
    await page.goto("/design-digital-tour", { waitUntil: "domcontentloaded" });
    try {
      await expect(page.locator(".editorial-title")).toHaveText("Bill Bensley Digital Design Tour");
      await expect.poll(() => photoRequested).toBe(true);
      // The hero is held while scripts hydrate. Background work must not race it.
      await page.waitForTimeout(600);
      expect(catalogueReads).toBe(0);
      expect(assets.filter((url) => /\/HubJourney-.*\.(js|css)/.test(url))).toEqual([]);
      if (releaseBy === "photo") release();
      if (releaseBy === "search")
        await page.getByRole("button", { name: "Search", exact: true }).click();
      await expect.poll(() => catalogueReads, { timeout: 4500 }).toBe(1);
      if (releaseBy === "search") {
        const search = page.getByRole("dialog", { name: "Search", exact: true });
        await expect(search.locator(".hub-search-result").first()).toBeVisible();
        await search.getByRole("button", { name: "Close", exact: true }).click();
      }
      // Enriching the focused card still does not import the home-only journey.
      expect(assets.filter((url) => /\/HubJourney-.*\.(js|css)/.test(url))).toEqual([]);
      await page.getByRole("button", { name: "BACK", exact: true }).click();
      await expect(page).toHaveURL("/");
      await expect(page.locator("#heaven")).toBeVisible();
      expect(assets.some((url) => /\/HubJourney-.*\.js/.test(url))).toBe(true);
    } finally {
      release();
    }
  });
}
