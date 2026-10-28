import { imageDeliveryUrl } from "../src/lib/image-delivery";
import images from "../src/data/image-variants.json" with { type: "json" };
import { expect, test } from "./fixtures";

const backgroundUrl = imageDeliveryUrl(
  Object.values(images)
    .find((image) => image.aliases.includes("/resort-map/canopy.webp"))!
    .variants.find((image) => image.width === 1600)!.src,
);

for (const [path, name] of [
  ["/search", "Search"],
  ["/surprise-me", "Surprise me"],
  ["/map", "Resort map"],
] as const) {
  test(`${path} opens directly and survives refresh without loading the home hero`, async ({
    page,
  }) => {
    await page.goto(path!);
    await expect(page.getByRole("dialog", { name, exact: true })).toBeVisible();
    await expect(page.locator(".hub-hero")).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("dialog", { name, exact: true })).toBeVisible();
    await expect(page).toHaveURL(path!);
  });
}

test("Surprise me gets its own history entry and restores the selected card", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Surprise me Find your/ }).click();
  await expect(page).toHaveURL("/surprise-me");
  const surprise = page.getByRole("dialog", { name: "Surprise me", exact: true });
  const name = await surprise
    .locator('.destination-panel:not([aria-hidden="true"]) h3')
    .innerText();
  await surprise.getByRole("button", { name, exact: true }).click();
  await expect(page.locator(".editorial-title")).toHaveText(name);
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(page).toHaveURL("/surprise-me");
  await expect(surprise.locator('.destination-panel:not([aria-hidden="true"]) h3')).toHaveText(
    name,
  );
  await surprise.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page).toHaveURL("/");
});

test("direct map requests its background before the catalogue and waits before revealing pins", async ({
  page,
}) => {
  const source = new URL(backgroundUrl, "http://127.0.0.1:4173");
  let releaseImage!: () => void;
  let releaseCatalogue!: () => void;
  const imageGate = new Promise<void>((resolve) => {
    releaseImage = resolve;
  });
  const catalogueGate = new Promise<void>((resolve) => {
    releaseCatalogue = resolve;
  });
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.route(
    (url) => url.pathname === source.pathname,
    async (route) => {
      await imageGate;
      await route.fulfill({
        path: new URL("../public/intercontinental-touch-icon.png", import.meta.url).pathname,
        contentType: "image/png",
      });
    },
  );
  let catalogueUrl = "";
  await page.route("**/_serverFn/**", async (route) => {
    const response = await route.fetch();
    if (response.headers()["server-timing"]?.includes("catalogue;")) {
      catalogueUrl = route.request().url();
      await catalogueGate;
    }
    await route.fulfill({ response });
  });
  await page.goto("/map", { waitUntil: "domcontentloaded" });
  const map = page.getByRole("dialog", { name: "Resort map", exact: true });
  try {
    await expect(map.locator(".canopy-texture")).toBeAttached();
    await expect(map.locator(".resort-art")).toHaveAttribute("data-background-ready", "false");
    await expect.poll(() => catalogueUrl).not.toBe("");
    expect(requests.findIndex((url) => new URL(url).pathname === source.pathname)).toBeLessThan(
      requests.indexOf(catalogueUrl),
    );
    expect(requests.some((url) => /\/HubJourney-.*\.js/.test(url))).toBe(false);
    releaseImage();
    await expect(map.locator(".resort-art")).toHaveAttribute("data-background-ready", "true");
    await expect(map.locator(".atlas-catalogue-pending")).toBeVisible();
    releaseCatalogue();
    await expect(map.locator(".atlas-catalogue-pending")).toHaveCount(0);
    await expect(map.locator(".hotspot-v2").first()).toBeVisible();
  } finally {
    releaseImage();
    releaseCatalogue();
  }
});

test("a failed map texture keeps the vector map usable", async ({ page }) => {
  const source = new URL(backgroundUrl, "http://127.0.0.1:4173");
  await page.route(
    (url) => url.pathname === source.pathname,
    (route) => route.abort(),
  );
  await page.goto("/map");
  await expect(page.locator(".resort-art")).toHaveAttribute("data-background-ready", "true");
  await expect(page.locator(".hotspot-v2").first()).toBeVisible();
});

test("map search has its own path and returns to the selected place", async ({ page }) => {
  await page.goto("/map");
  const map = page.getByRole("dialog", { name: "Resort map", exact: true });
  await map.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL("/search");
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await search.getByRole("searchbox").fill("Citron");
  await search.getByRole("button", { name: /^Citron/ }).click();
  await expect(page).toHaveURL("/map");
  await expect(map.locator(".atlas-preview")).toContainText("Citron");
});

test("a direct tour deep link survives refresh and closes to the map", async ({ page }) => {
  await page.goto("/map?mode=tour");
  const tour = page.getByRole("button", { name: "Back to map", exact: true });
  await expect(tour).toBeVisible();
  await page.reload();
  await expect(tour).toBeVisible();
  await tour.click();
  await expect(page.locator(".atlas-dock")).toBeVisible();
});
