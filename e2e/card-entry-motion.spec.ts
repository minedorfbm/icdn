import { expect, test } from "./fixtures";

test.describe("fresh destination HTML", () => {
  test.use({ javaScriptEnabled: false });
  test("the title, photograph and hours are visible without scripts or an entry fade", async ({
    page,
  }) => {
    await page.goto("/citron", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".editorial-title")).toHaveText("Citron");
    await expect(page.locator(".opening-hours")).toContainText("06:30");
    const image = page.locator(".editorial-hero img");
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0),
      )
      .toBe(true);
    const style = await page.locator(".editorial-page").evaluate((node) => {
      const style = getComputedStyle(node);
      return { opacity: style.opacity, animation: style.animationName };
    });
    expect(style).toEqual({ opacity: "1", animation: "none" });
  });
});

test("a direct card stays still through hydration, while later navigation and Back retain entry motion", async ({
  page,
}) => {
  await page.goto("/citron");
  await expect(page.locator(".editorial-loading")).toHaveCount(0);
  await expect(page.locator(".editorial-page")).toHaveCSS("animation-name", "none");
  await page.locator("[data-next-destination]").click();
  await expect(page.locator(".editorial-title")).not.toHaveText("Citron");
  await expect(page.locator(".editorial-page")).toHaveCSS("animation-name", "detail-in");
  await page.goBack();
  await expect(page.locator(".editorial-title")).toHaveText("Citron");
  await expect(page.locator(".editorial-page")).toHaveCSS("animation-name", "detail-in");
});

test("clicking from the homepage keeps the approved entry animation, and refreshing is immediately visible", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydration|#418|#425/i.test(message.text()))
      errors.push(message.text());
  });
  await page.goto("/");
  await page.locator("#heaven").getByRole("button", { name: "Citron", exact: true }).click();
  await expect(page.locator(".editorial-title")).toHaveText("Citron");
  await expect(page.locator(".editorial-page")).toHaveCSS("animation-name", "detail-in");
  await page.reload();
  await expect(page.locator(".editorial-title")).toHaveText("Citron");
  await expect(page.locator(".editorial-page")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".editorial-loading")).toHaveCount(0);
  expect(errors).toEqual([]);
});
