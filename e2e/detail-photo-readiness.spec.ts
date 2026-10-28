import { expect, test, type Page } from "./fixtures";
import images from "../src/data/image-variants.json" with { type: "json" };
import { imageDeliveryUrl } from "../src/lib/image-delivery";

const photos = {
  citron: Object.values(images).find((image) =>
    image.aliases.some((alias) => alias.includes("citron-detail-3b0c495a2769")),
  )!,
  tingara: Object.values(images).find((image) =>
    image.aliases.some((alias) => alias.includes("tingara-home-0fce7209b7")),
  )!,
};
const photoPaths = (photo: (typeof photos)["citron"]) =>
  new Set(
    [...photo.variants, ...photo.avifVariants, photo.avif].map(
      (candidate) => new URL(imageDeliveryUrl(candidate.src), "http://localhost").pathname,
    ),
  );
const paths = { citron: photoPaths(photos.citron), tingara: photoPaths(photos.tingara) };

type PhotoCatalogue = {
  levels: { id: string; image_key: string }[];
  destinations: { id: string; image_key: string; detail_image_key: string }[];
};

async function prepareCatalogue(page: Page, catalogue: PhotoCatalogue, holdCover = false) {
  let releaseCover!: () => void;
  const gate = new Promise<void>((resolve) => {
    releaseCover = resolve;
  });
  for (const destination of catalogue.destinations) {
    destination.image_key = `/detail-prep/cover-${destination.id}.png`;
    destination.detail_image_key =
      destination.id === "citron" || destination.id === "tingara"
        ? photos[destination.id as keyof typeof photos].src
        : `/detail-prep/detail-${destination.id}.png`;
  }
  for (const level of catalogue.levels) level.image_key = `/detail-prep/background-${level.id}.png`;
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
  await page.route("**/detail-prep/**", async (route) => {
    if (holdCover && route.request().url().endsWith("cover-citron.png")) await gate;
    await route.fulfill({
      path: "public/intercontinental-touch-icon.png",
      contentType: "image/png",
    });
  });
  const requests: { id: keyof typeof photos; url: string }[] = [];
  await page.route(
    (url) => paths.citron.has(url.pathname) || paths.tingara.has(url.pathname),
    async (route) => {
      const path = new URL(route.request().url()).pathname;
      requests.push({
        id: paths.citron.has(path) ? "citron" : "tingara",
        url: route.request().url(),
      });
      await route.fulfill({
        path: "public/intercontinental-touch-icon.png",
        contentType: "image/png",
      });
    },
  );
  return { requests, releaseCover };
}

test("a visible card waits for its cover, prepares the exact detail picture and reuses it on click", async ({
  page,
  request,
}) => {
  const catalogue = await (
    await request.get("http://127.0.0.1:54329/rest/v1/rpc/published_hub_catalogue_v1")
  ).json();
  const { requests, releaseCover } = await prepareCatalogue(page, catalogue, true);
  await page.goto("/");
  await page.locator("#heaven .card-stack-stage").scrollIntoViewIfNeeded();
  try {
    await page.waitForTimeout(1100);
    expect(requests).toHaveLength(0);
    releaseCover();
    await expect.poll(() => requests.filter((item) => item.id === "citron").length).toBe(1);
    expect(requests.filter((item) => item.id === "tingara")).toHaveLength(0);
    // Route head metadata may add an equivalent hint later. Verify the original
    // preparation is promoted; the request count below proves byte reuse.
    const preload = page
      .locator(`link[rel="preload"][imagesrcset*="${imageDeliveryUrl(photos.citron.avif.src)}"]`)
      .first();
    await expect(preload).toHaveAttribute("fetchpriority", "low");
    await page.locator("#heaven").getByRole("button", { name: "Citron", exact: true }).click();
    await expect(page.locator(".editorial-title")).toHaveText("Citron");
    const hero = page.locator(".editorial-hero img");
    await expect
      .poll(() => hero.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
    expect(await hero.evaluate((image: HTMLImageElement) => image.currentSrc)).toBe(
      requests[0]!.url,
    );
    await expect(preload).toHaveAttribute("fetchpriority", "high");
    expect(requests).toHaveLength(1);
  } finally {
    releaseCover();
  }
});

for (const connection of [
  { saveData: true, effectiveType: "4g" },
  { saveData: false, effectiveType: "2g" },
]) {
  test(`background preparation respects ${JSON.stringify(connection)} while opening stays usable`, async ({
    page,
    request,
  }) => {
    await page.addInitScript(
      (value) => Object.defineProperty(navigator, "connection", { configurable: true, value }),
      connection,
    );
    const catalogue = await (
      await request.get("http://127.0.0.1:54329/rest/v1/rpc/published_hub_catalogue_v1")
    ).json();
    const { requests } = await prepareCatalogue(page, catalogue);
    await page.goto("/");
    await page.locator("#heaven .card-stack-stage").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1100);
    expect(requests).toHaveLength(0);
    await page.locator("#heaven").getByRole("button", { name: "Citron", exact: true }).click();
    await expect(page.locator(".editorial-title")).toHaveText("Citron");
    await expect.poll(() => requests.length).toBe(1);
    await expect(page.locator(".editorial-hero img")).toHaveJSProperty("complete", true);
  });
}

test("a short scroll past a card does not prepare its detail picture", async ({
  page,
  request,
}) => {
  const catalogue = await (
    await request.get("http://127.0.0.1:54329/rest/v1/rpc/published_hub_catalogue_v1")
  ).json();
  const { requests } = await prepareCatalogue(page, catalogue);
  await page.goto("/");
  await page.locator("#heaven .card-stack-stage").scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  await page.locator(".hub-hero").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  expect(requests).toHaveLength(0);
});

test("only the front card is prepared, then a newly selected front card can prepare", async ({
  page,
  request,
}) => {
  const catalogue = await (
    await request.get("http://127.0.0.1:54329/rest/v1/rpc/published_hub_catalogue_v1")
  ).json();
  const { requests } = await prepareCatalogue(page, catalogue);
  await page.goto("/");
  await page.locator("#heaven .card-stack-stage").scrollIntoViewIfNeeded();
  await expect.poll(() => requests.filter((item) => item.id === "citron").length).toBe(1);
  expect(requests.filter((item) => item.id === "tingara")).toHaveLength(0);
  await page.locator("#heaven .chapter-deck-controls button").last().dispatchEvent("click");
  await expect.poll(() => requests.filter((item) => item.id === "tingara").length).toBe(1);
  expect(requests).toHaveLength(2);
});
