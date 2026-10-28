import { expect, test } from "./fixtures";

for (const viewport of [
  { width: 390, height: 680 },
  { width: 834, height: 1194 },
  { width: 1440, height: 900 },
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
      await expect(page.locator(".hero-brand")).toBeHidden();
      await expect(page.locator(".hero-desktop-brand")).toBeVisible();
      await expect(search).toBeVisible();
      await expect(contact).toBeVisible();
      expect((await language.boundingBox())!.y).toBeLessThan(30);
      expect((await page.locator(".hero-desktop-brand").boundingBox())!.width).toBeLessThanOrEqual(
        360,
      );
      expect((await page.locator(".hero-film-button").boundingBox())!.width).toBe(80);
      await expect(page.locator(".hero-invitation-title")).toHaveCSS("font-size", "44px");
      await expect(page.locator(".hero-invitation-caption")).toHaveCSS("font-size", "10px");
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
    expect(layout.brand.width).toBeGreaterThan(Math.min(viewport.width * 0.7, 600));
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
