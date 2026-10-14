import { test, expect } from "@playwright/test";

test("card map entry focuses the venue above its panel and supports closer zoom", async ({
  page,
}) => {
  await page.goto("/citron");
  await page.getByRole("button", { name: "View on map", exact: true }).click();
  const map = page.getByRole("dialog", { name: "Resort map" });
  const scene = map.locator(".map-scene");
  const scale = async () =>
    Number((await scene.getAttribute("transform"))?.match(/scale\(([^)]+)\)/)?.[1]);
  await expect.poll(scale).toBeGreaterThan(4.2);
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
