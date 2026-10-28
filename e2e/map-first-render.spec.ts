import { expect, test } from "./fixtures";

for (const width of [390, 834, 1440]) {
  test(`direct map is styled from its HTML before client modules at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    // The server-rendered background should not wait for the interactive bundle's CSS.
    await page.route(/\/assets\/.*\.js(?:\?.*)?$/, (route) => route.abort());
    const response = await page.goto("/map");
    const html = await response!.text();
    const head = html.slice(0, html.indexOf("</head>"));
    expect(head).toContain('data-hub-map-style=""');
    const style = page.locator("head link[data-hub-map-style]");
    await expect(style).toHaveCount(1);
    const artwork = page.locator(".resort-art");
    await expect(artwork).toBeVisible();
    const bounds = await artwork.boundingBox();
    const header = await page.locator(".atlas-header").boundingBox();
    expect(bounds!.width).toBeCloseTo(width, 0);
    expect(bounds!.height).toBeCloseTo(900 - header!.height, 0);
    await expect(artwork).toHaveCSS("touch-action", "none");
    await expect(page.locator(".canopy-texture")).toHaveCSS("opacity", "0.78");
    await expect(page.locator(".atlas-map-view")).toHaveCSS("position", "relative");
  });
}

test("map CSS waits on home, loads once on map entry and survives a card return", async ({
  page,
}) => {
  const css: string[] = [];
  page.on("request", (request) => {
    if (/\/map-styles-[^/]+\.css$/.test(new URL(request.url()).pathname)) css.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Explore the resort map/ })).toBeVisible();
  await expect(page.locator("head link[data-hub-map-style]")).toHaveCount(0);
  expect(css).toHaveLength(0);
  await page.getByRole("button", { name: /Explore the resort map/ }).click();
  await expect(page).toHaveURL("/map");
  await expect(page.locator("head link[data-hub-map-style]")).toHaveCount(1);
  await expect.poll(() => css.length).toBe(1);
  await page.locator('.hotspot-v2[aria-label="Citron · HEAVEN"]').click();
  await page.getByRole("button", { name: "Discover this place", exact: true }).click();
  await expect(page).toHaveURL("/citron");
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(page).toHaveURL("/map");
  await expect(page.locator(".atlas-map-view")).toHaveCSS("position", "relative");
  await expect(page.locator(".resort-art")).toHaveCSS("touch-action", "none");
  expect(css).toHaveLength(1);
});
