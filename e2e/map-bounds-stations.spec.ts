import { expect, test } from "@playwright/test";

test("overview cannot drift out of the resort; station signs fit their text and icons", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Explore the resort map/ }).click();
  const map = page.getByRole("dialog", { name: "Resort map" });
  const svg = map.locator("svg.resort-art");
  const scene = svg.locator(".map-scene");
  await expect(svg.locator(".station-plaque")).toHaveCount(4);
  for (const sign of await svg.locator(".station-plaque").all()) {
    await expect(sign.locator("svg")).toBeVisible();
    const text = await sign.locator("text").boundingBox();
    const box = await sign.locator("rect").boundingBox();
    expect(text!.x + text!.width).toBeLessThan(box!.x + box!.width);
    expect(text!.y).toBeGreaterThan(box!.y);
    expect(text!.y + text!.height).toBeLessThan(box!.y + box!.height);
  }
  await svg.focus();
  const start = await scene.getAttribute("transform");
  for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]) {
    for (let i = 0; i < 25; i++) await svg.press(key);
    await expect(scene).toHaveAttribute("transform", start!);
  }
  await page.screenshot({
    path: "/Users/mac/Documents/Codex/2026-09-21/j/outputs/map-constrained-overview.png",
  });
  for (let i = 0; i < 9; i++)
    await map.getByRole("button", { name: "Zoom in", exact: true }).click();
  await svg.focus();
  for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]) {
    for (let i = 0; i < 180; i++) await svg.press(key);
    const boundary = (await scene.getAttribute("transform"))!
      .match(/-?\d+(?:\.\d+)?/g)!
      .map(Number);
    await svg.press(key);
    const next = (await scene.getAttribute("transform"))!.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    next.forEach((value, index) => expect(value).toBeCloseTo(boundary[index]!, 2));
  }
  await svg.press("Home");
  await expect(scene).toHaveAttribute("transform", start!);
});

for (const viewport of [
  { width: 320, height: 640 },
  { width: 844, height: 390 },
]) {
  test(`place focus stays visible on ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/rooms");
    await page.getByRole("button", { name: "View on map", exact: true }).click();
    const map = page.getByRole("dialog", { name: "Resort map" });
    await expect(map.locator(".atlas-preview")).toBeVisible();
    const pin = await map.locator(".hotspot-v2.is-selected .hotspot-medallion").boundingBox();
    const panel = await map.locator(".atlas-preview").boundingBox();
    expect(pin!.x).toBeGreaterThan(0);
    expect(pin!.y).toBeGreaterThan(48);
    expect(pin!.x + pin!.width).toBeLessThan(viewport.width);
    expect(pin!.y + pin!.height < panel!.y || pin!.x + pin!.width < panel!.x).toBe(true);
  });
}
