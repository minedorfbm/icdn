import { imageDeliveryUrl } from "../src/lib/image-delivery";
import images from "../src/data/image-variants.json" with { type: "json" };
import { expect, test } from "./fixtures";

const image = Object.values(images).find((item) =>
  item.aliases.includes("/resort-map/canopy.webp"),
)!;
const overview = imageDeliveryUrl(image.variants.find((item) => item.width === 1600)!.src);
const detail = imageDeliveryUrl(image.src);

test("overview is first; close zoom upgrades without blanking the map or downloading HD twice", async ({
  page,
}) => {
  let requests = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    (url) => url.pathname === detail,
    async (route) => {
      requests++;
      await gate;
      await route.fulfill({
        path: new URL("../public/intercontinental-touch-icon.png", import.meta.url).pathname,
        contentType: "image/png",
      });
    },
  );
  try {
    await page.goto("/map");
    const texture = page.locator(".canopy-texture");
    await expect(texture).toHaveAttribute("href", overview);
    await expect(page.locator(".hotspot-v2").first()).toBeVisible();
    expect(requests).toBe(0);
    for (let i = 0; i < 4; i++)
      await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    await expect.poll(() => requests).toBe(1);
    await expect(texture).toHaveAttribute("href", overview);
    await expect(page.locator(".resort-art")).toHaveAttribute("data-background-ready", "true");
    release();
    await expect(texture).toHaveAttribute("href", detail);
    await page.getByRole("button", { name: "View entire resort", exact: true }).click();
    for (let i = 0; i < 4; i++)
      await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    await expect(texture).toHaveAttribute("href", detail);
    expect(requests).toBe(1);
  } finally {
    release();
  }
});

test("an unavailable HD upgrade retains the overview and place selection", async ({ page }) => {
  await page.route(
    (url) => url.pathname === detail,
    (route) => route.abort(),
  );
  await page.goto("/map");
  await expect(page.locator(".hotspot-v2").first()).toBeVisible();
  const failed = page.waitForEvent(
    "requestfailed",
    (request) => new URL(request.url()).pathname === detail,
  );
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await failed;
  await expect(page.locator(".canopy-texture")).toHaveAttribute("href", overview);
  await page.getByRole("button", { name: "View entire resort", exact: true }).click();
  await page.locator('.hotspot-v2[aria-label="Citron · HEAVEN"]').click();
  await expect(page.locator(".atlas-preview")).toContainText("Citron");
});
