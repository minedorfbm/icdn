import { test, expect } from "./fixtures";

test("map clicks avoid native outlines while keyboard markers remain visible", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/citron");
  const back = page.getByRole("button", { name: "BACK", exact: true });
  await expect(back).toHaveCSS("-webkit-tap-highlight-color", "rgba(0, 0, 0, 0)");
  await page.getByRole("button", { name: "View on map", exact: true }).click();
  const map = page.getByRole("dialog", { name: "Resort map" });
  const pin = map.getByRole("button", { name: /^Citron ·/ });
  await pin.click();
  await expect(pin).toHaveCSS("outline-style", "none");
  await expect(pin).toHaveCSS("-webkit-tap-highlight-color", "rgba(0, 0, 0, 0)");
  await pin.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(pin).toBeFocused();
  await expect(pin.locator(".hotspot-medallion")).toHaveCSS("stroke-width", "3px");
});

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

test("photo bubbles keep grouped cards available and align the category with the close control", async ({
  page,
}) => {
  await page.goto("/long-bar");
  await page.getByRole("button", { name: "View on map", exact: true }).click();
  const map = page.getByRole("dialog", { name: "Resort map", exact: true });
  const bubble = map.locator(".atlas-preview");
  await expect(bubble).toHaveAttribute("data-photo", "true");
  await expect(bubble.locator(".atlas-preview-background img")).toBeVisible();
  await expect(bubble.locator(".atlas-sheet-handle")).toContainText("BAR");
  await expect(bubble.getByRole("button", { name: "L_O_N_G Pool", exact: true })).toBeVisible();
  const header = await bubble.locator(".atlas-sheet-handle").boundingBox();
  const close = await bubble
    .getByRole("button", { name: "Close place preview", exact: true })
    .boundingBox();
  expect(Math.abs(header!.y + header!.height / 2 - close!.y - close!.height / 2)).toBeLessThan(2);
  const box = await bubble.boundingBox();
  const dock = await map.locator(".atlas-bottom").boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(12);
  expect(box!.y + box!.height).toBeLessThan(dock!.y);
  await bubble.getByRole("button", { name: "L_O_N_G Pool", exact: true }).click();
  await expect(page).toHaveURL("/long-pool");
});
