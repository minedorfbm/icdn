import { expect, test } from "./fixtures";
import { HERO_CLOUD_SOURCE, HERO_PORTRAIT_MEDIA } from "../src/lib/hero-media";

for (const viewport of [
  { width: 390, height: 680 },
  { width: 834, height: 1194 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]) {
  test(`hero branding and contextual tools at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const language = page.locator(".hub-tools button");
    const search = page.locator(".hub-search-tool button");
    const contact = page.locator(".hub-contact-tool button");
    await expect(page.locator("#heaven")).toBeAttached();
    if (viewport.width >= 768 && viewport.width > viewport.height) {
      const desktop = viewport.width >= 1200;
      const brand = page.locator(desktop ? ".hero-brand" : ".hero-desktop-brand");
      await expect(brand).toBeVisible();
      await expect(page.locator(desktop ? ".hero-desktop-brand" : ".hero-brand")).toBeHidden();
      const brandBounds = (await brand.boundingBox())!;
      if (desktop) {
        expect(brandBounds.width).toBeGreaterThan(viewport.width * 0.33);
        expect(brandBounds.y).toBeGreaterThanOrEqual(0);
        expect(brandBounds.y + brandBounds.height).toBeLessThan(
          (await page.locator(".hero-invitation").boundingBox())!.y,
        );
        await expect
          .poll(() =>
            page.locator(".hero-cloud-main").evaluate((el) => getComputedStyle(el).opacity),
          )
          .toBe("0.78");
      } else {
        expect(brandBounds.width).toBeLessThanOrEqual(360);
      }
      await expect(search).toBeVisible();
      await expect(contact).toBeVisible();
      expect((await language.boundingBox())!.y).toBeLessThan(30);
      expect((await page.locator(".hero-film-button").boundingBox())!.width).toBe(80);
      const titleSize = await page
        .locator(".hero-invitation-title")
        .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
      expect(titleSize).toBeGreaterThanOrEqual(40);
      expect(titleSize).toBeLessThanOrEqual(44);
      await expect(page.locator(".hero-invitation-caption")).toHaveCSS("font-size", "12px");
      return;
    }
    await expect(search).toBeHidden();
    await expect(contact).toBeHidden();
    await expect(language).toBeVisible();
    const layout = await page.evaluate(() => {
      const bounds = (selector: string) => {
        const r = document.querySelector(selector)!.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width };
      };
      return {
        brand: bounds(".hero-brand"),
        sky: bounds(".hero-sky"),
        invitation: bounds(".hero-invitation"),
        language: bounds(".hub-tools button"),
        key: bounds(".hero-film-button"),
      };
    });
    expect(layout.brand.width).toBeGreaterThan(Math.min(viewport.width * 0.55, 450));
    expect(layout.brand.width).toBeLessThanOrEqual(viewport.width * 0.74);
    expect(layout.brand.top).toBeGreaterThanOrEqual(0);
    expect(layout.brand.bottom).toBeLessThan(layout.invitation.top);
    expect(layout.invitation.left).toBeGreaterThanOrEqual(layout.sky.left - 1);
    expect(layout.invitation.right).toBeLessThanOrEqual(layout.sky.right + 1);
    expect(layout.language.bottom).toBeLessThanOrEqual(viewport.height);
    expect(layout.language.top).toBeGreaterThan(viewport.height - 90);
    expect(layout.key.width).toBe(64);
    await language.click();
    await expect(page.getByRole("button", { name: /日本語/ })).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.locator(".hero-invitation").click();
    await expect(search).toBeVisible();
    await expect(contact).toBeVisible();
    expect((await language.boundingBox())!.y).toBeLessThan(30);
    await search.click();
    await expect(page.getByRole("searchbox")).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.locator(".hub-hero").evaluate((hero) => hero.scrollIntoView({ block: "start" }));
    await expect(search).toBeHidden();
    await expect(contact).toBeHidden();
    await expect(language).toBeVisible();
  });
}

test("portrait atmosphere starts before the render-blocking stylesheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const cloudRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === HERO_CLOUD_SOURCE) cloudRequests.push(request.url());
  });
  let releaseStyles!: () => void;
  const stylesReady = new Promise<void>((resolve) => {
    releaseStyles = resolve;
  });
  await page.route("**/assets/styles-*.css", async (route) => {
    await stylesReady;
    await route.continue();
  });
  const navigation = page.goto("/", { waitUntil: "domcontentloaded" });
  try {
    await expect.poll(() => cloudRequests.length).toBe(1);
  } finally {
    releaseStyles();
  }
  await navigation;
  await expect(page.locator(`link[rel="preload"][href="${HERO_CLOUD_SOURCE}"]`)).toHaveAttribute(
    "media",
    HERO_PORTRAIT_MEDIA,
  );
  await expect(page.locator(".hero-brand")).toBeVisible();
  expect(cloudRequests).toHaveLength(1);
});

test("desktop reuses the cloud while landscape tablets and direct cards do not download it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const cloudRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === HERO_CLOUD_SOURCE) cloudRequests.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator(".hero-brand")).toBeVisible();
  await expect.poll(() => cloudRequests.length).toBe(1);
  cloudRequests.length = 0;
  await page.goto("/citron");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".editorial-hero")).toBeVisible();
  expect(cloudRequests).toHaveLength(0);
  expect(await page.locator(`link[rel="preload"][href="${HERO_CLOUD_SOURCE}"]`).count()).toBe(0);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/");
  await expect(page.locator(".hero-desktop-brand")).toBeVisible();
  expect(cloudRequests).toHaveLength(0);
});
