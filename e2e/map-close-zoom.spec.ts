import { test, expect } from "./fixtures";

test("card map entry focuses the venue above its panel and supports closer zoom", async ({
  page,
}, testInfo) => {
  await page.goto("/citron");
  await page.getByRole("button", { name: "View on map", exact: true }).click();
  const map = page.getByRole("dialog", { name: "Resort map" });
  const scene = map.locator(".map-scene");
  const scale = async () =>
    Number((await scene.getAttribute("transform"))?.match(/scale\(([^)]+)\)/)?.[1]);
  await expect.poll(scale).toBeGreaterThan(4.2);
  await expect(map.locator(".hotspot-v2.is-selected .hotspot-name")).toContainText("Citron");
  const sheet = map.locator(".atlas-preview");
  const grip = sheet.locator(".atlas-sheet-handle");
  await expect(sheet).toHaveAttribute("data-expanded", "false");
  await grip.click();
  await expect(sheet).toHaveAttribute("data-expanded", "true");
  const handle = await grip.boundingBox();
  await page.mouse.move(handle!.x + handle!.width / 2, handle!.y + handle!.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle!.x + handle!.width / 2, handle!.y + handle!.height / 2 + 80, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(sheet).toHaveAttribute("data-expanded", "false");
  await page.screenshot({
    path: testInfo.outputPath("map-mobile-improvements.png"),
  });
  const pin = map.getByRole("button", { name: /^Citron ·/ });
  const bounds = await pin.boundingBox();
  const panel = await map.locator(".atlas-preview").boundingBox();
  expect(bounds).not.toBeNull();
  expect(panel).not.toBeNull();
  expect(bounds!.y).toBeGreaterThan(60);
  expect(bounds!.y + bounds!.height).toBeLessThan(panel!.y);
  for (let i = 0; i < 12; i++)
    await map.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect.poll(scale).toBe(8);
  await map.getByRole("button", { name: "Zoom out", exact: true }).click();
  await expect.poll(scale).toBeLessThan(8);
});
