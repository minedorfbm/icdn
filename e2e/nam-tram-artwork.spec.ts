import images from "../src/data/image-variants.json" with { type: "json" };
import { expect, test } from "./fixtures";

test("Nam Tram uses the angled cabin on the rail and the full front view in its selector", async ({
  page,
}, testInfo) => {
  const source = (file: string) =>
    Object.values(images).find((image) => image.aliases.includes(`src/assets/${file}`))!.src;
  for (const file of ["nam-tram-rail.webp", "nam-tram-selector.webp"]) {
    await page.route(source(file), (route) =>
      route.fulfill({
        path: new URL(`../src/assets/${file}`, import.meta.url).pathname,
        contentType: "image/webp",
      }),
    );
  }
  await page.goto("/");
  await page.locator("section#heaven").scrollIntoViewIfNeeded();
  const rail = page.locator(".nam-tram-rail");
  await expect(rail).toBeVisible();
  const cabin = rail.locator("img");
  await expect(cabin).toHaveAttribute("src", source("nam-tram-rail.webp"));
  await expect
    .poll(() => cabin.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBe(240);
  const railSource = await cabin.getAttribute("src");
  await rail.getByRole("button").click();
  const panel = page.locator(".nam-tram-panel");
  const artwork = panel.locator(".nam-tram-art img");
  await expect(artwork).toHaveAttribute("src", source("nam-tram-selector.webp"));
  await expect
    .poll(() => artwork.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBe(900);
  expect(await artwork.getAttribute("src")).not.toBe(railSource);
  for (const size of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    await expect(panel).toBeVisible();
    await expect(panel.locator(".nam-tram-stations button")).toHaveCount(4);
    expect(await panel.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    const box = await artwork.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(size.width);
  }
  await page.screenshot({ path: testInfo.outputPath("nam-tram-selector.png") });
  await panel.getByRole("button", { name: "SEA", exact: true }).click();
  await expect(panel).toBeHidden();
  await expect(rail).toHaveAttribute("data-level", "sea");
  await expect(cabin).toHaveAttribute("src", railSource!);
});
