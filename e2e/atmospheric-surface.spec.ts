import { expect, test } from "./fixtures";

test("fluid surface renders on demand and responds to scrolling", async ({ page }) => {
  await page.goto("/");
  const available = await page.evaluate(() => {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl");
    const supported = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return supported;
  });
  test.skip(!available, "This runner uses the static vector fallback; tested separately.");
  const passage = page.locator('.chapter-gradient[data-atmosphere="heaven"]');
  await expect(passage).toHaveAttribute("data-renderer", "fallback");
  await passage.scrollIntoViewIfNeeded();
  await expect(passage).toHaveAttribute("data-renderer", "webgl");
  const surface = passage.locator("canvas");
  await expect(surface).toBeVisible();
  expect(await surface.evaluate((canvas: HTMLCanvasElement) => canvas.width)).toBeLessThanOrEqual(
    1280,
  );
  const before = await surface.screenshot();
  await page.evaluate(() => window.scrollBy(0, 60));
  await expect.poll(async () => (await surface.screenshot()).equals(before)).toBe(false);

  // Losing graphics must immediately reveal a usable, nonblank static scene.
  await surface.evaluate((canvas: HTMLCanvasElement) => {
    canvas.getContext("webgl")?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(passage).toHaveAttribute("data-renderer", "fallback");
  await expect(surface).toBeHidden();
  await expect(passage.locator("svg")).toBeVisible();
});

test("unavailable graphics never block the page or its level navigation", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...options) {
      if (String(kind).startsWith("webgl")) return null;
      return original.call(this, kind, ...options);
    } as typeof original;
  });
  await page.goto("/");
  const passage = page.locator('.chapter-gradient[data-atmosphere="sky"]');
  await passage.scrollIntoViewIfNeeded();
  await expect(passage).toHaveAttribute("data-renderer", "fallback");
  await expect(passage.locator("svg")).toBeVisible();
  await page.locator('#earth button[aria-haspopup="dialog"]').click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
