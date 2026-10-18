import { expect, test } from "./fixtures";

test("overview cannot drift out of the resort and keeps station names hidden", async ({
  page,
}, testInfo) => {
  // This stress test sends hundreds of key presses to reach every pan boundary.
  test.setTimeout(60_000);
  await page.goto("/");
  await page.getByRole("button", { name: /Explore the resort map/ }).click();
  const map = page.getByRole("dialog", { name: "Resort map" });
  const svg = map.locator("svg.resort-art");
  const scene = svg.locator(".map-scene");
  await expect(svg.locator(".station-plaque")).toHaveCount(0);
  await expect(svg.locator(".tram-station-target")).toHaveCount(4);
  await svg.focus();
  const start = await scene.getAttribute("transform");
  for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]) {
    for (let i = 0; i < 25; i++) await svg.press(key);
    await expect(scene).toHaveAttribute("transform", start!);
  }
  await page.screenshot({
    path: testInfo.outputPath("map-constrained-overview.png"),
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

test("Nam Tram names appear on tap or close zoom and dismiss without opening a place", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Explore the resort map/ }).click();
  const map = page.getByRole("dialog", { name: "Resort map" });
  const svg = map.locator("svg.resort-art");
  const signs = svg.locator(".station-plaque");
  const tapStation = async (level: string) => {
    const station = map
      .locator(".tram-station-targets")
      .getByRole("button", { name: `Nam Tram · ${level}`, exact: true });
    const hit = await station.boundingBox();
    // Tap the actual position: at overview scale adjacent touch areas overlap.
    await page.touchscreen.tap(hit!.x + hit!.width / 2, hit!.y + hit!.height / 2);
  };
  await expect(signs).toHaveCount(0);
  for (const level of ["HEAVEN", "SKY", "EARTH", "SEA"]) {
    const station = map
      .locator(".tram-station-targets")
      .getByRole("button", { name: `Nam Tram · ${level}`, exact: true });
    await tapStation(level);
    await expect(station).toHaveAttribute("aria-pressed", "true");
    await expect(signs).toHaveCount(1);
    await expect(signs).toContainText(level);
    await expect(signs.locator("svg")).toBeVisible();
    const text = await signs.locator("text").boundingBox();
    const box = await signs.locator("rect").boundingBox();
    expect(text!.x + text!.width).toBeLessThan(box!.x + box!.width);
    expect(text!.y).toBeGreaterThan(box!.y);
    expect(text!.y + text!.height).toBeLessThan(box!.y + box!.height);
    await expect(map.locator(".atlas-preview")).toHaveCount(0);
    await tapStation(level);
    await expect(signs).toHaveCount(0);
  }
  const heaven = map
    .locator(".tram-station-targets")
    .getByRole("button", { name: "Nam Tram · HEAVEN", exact: true });
  await heaven.focus();
  await heaven.press("Enter");
  await expect(signs).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath("station-selected.png") });
  await heaven.press("Space");
  await expect(signs).toHaveCount(0);
  await expect(map).toBeVisible();
  await tapStation("HEAVEN");
  await svg.tap({ position: { x: 30, y: 30 } });
  await expect(signs).toHaveCount(0);

  // Dragging a stop pans the map; it must not select the stop at pointer release.
  const hit = await heaven.boundingBox();
  await page.mouse.move(hit!.x + hit!.width / 2, hit!.y + hit!.height / 2);
  await page.mouse.down();
  await page.mouse.move(hit!.x + hit!.width / 2 + 65, hit!.y + hit!.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(signs).toHaveCount(0);

  for (let i = 0; i < 17; i++)
    await map.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(signs).not.toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("stations-close-zoom.png") });
  await svg.focus();
  await svg.press("Home");
  await expect(signs).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("stations-overview.png") });
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
