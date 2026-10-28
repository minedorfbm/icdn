import { expect, test } from "./fixtures";

test("three enlarged categories remain centered and unbroken across formats", async ({
  page,
  request,
}) => {
  const catalogue = await (
    await request.get("http://127.0.0.1:54329/rest/v1/rpc/published_hub_catalogue_v1")
  ).json();
  catalogue.destinations.push({
    ...catalogue.destinations[0],
    id: "category-wellness-test",
    name: "Wellness layout test",
    cluster: "WELLNESS",
    type: "spa",
  });
  await page.route("**/_serverFn/**", async (route) => {
    const response = await route.fetch();
    if (response.headers()["server-timing"]?.includes("catalogue;"))
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(catalogue),
      });
    else await route.fulfill({ response });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const chapter = page.locator("#heaven");
  const row = chapter.locator(".chapter-category-row");
  await expect(row.locator("button")).toHaveCount(3);
  for (const viewport of [
    { width: 320, height: 640 },
    { width: 360, height: 740 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 834, height: 1194 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await chapter.evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
    await expect(row.locator("button > span:first-child")).toHaveText([
      "DINING",
      "WELLNESS",
      "EXPERIENCES",
    ]);
    // Viewport changes can paint one frame with the previous media-query sizes.
    await expect(async () => {
      const geometry = await row.evaluate((el) => ({
        width: el.clientWidth,
        right: el.getBoundingClientRect().right,
        scrollWidth: el.scrollWidth,
        clipped: el.scrollWidth > el.clientWidth + 1,
        labels: [...el.querySelectorAll<HTMLButtonElement>("button")].map((button) => {
          const label = button.querySelector("span")!;
          const b = button.getBoundingClientRect();
          const r = label.getBoundingClientRect();
          const style = getComputedStyle(label);
          return {
            width: r.width,
            height: r.height,
            line: Number.parseFloat(style.lineHeight),
            size: Number.parseFloat(style.fontSize),
            offset: Math.abs(r.left + r.width / 2 - b.left - b.width / 2),
          };
        }),
      }));
      expect(geometry.clipped, JSON.stringify({ viewport, geometry })).toBe(false);
      expect(geometry.right).toBeLessThanOrEqual(viewport.width);
      for (const label of geometry.labels) {
        expect(label.height).toBeLessThanOrEqual(label.line + 1);
        expect(label.size).toBeGreaterThanOrEqual(16.7);
        expect(label.offset).toBeLessThan(1);
      }
    }).toPass({ timeout: 5000 });
    await row.getByRole("button", { name: "WELLNESS", exact: true }).click();
    await expect(
      chapter.getByRole("button", { name: "Wellness layout test", exact: true }),
    ).toBeVisible();
    await row.getByRole("button", { name: "DINING", exact: true }).click();
  }
  // A wider serif fallback must fit without shrinking text or hiding a category.
  await page.addStyleTag({
    content: ".chapter-category-row button > span:first-child { font-family: Georgia, serif; }",
  });
  await page.setViewportSize({ width: 320, height: 640 });
  await expect(async () => {
    const fallbackBounds = await row.evaluate((el) => ({
      width: el.clientWidth,
      scrollWidth: el.scrollWidth,
    }));
    expect(fallbackBounds.scrollWidth, JSON.stringify(fallbackBounds)).toBeLessThanOrEqual(
      fallbackBounds.width + 1,
    );
  }).toPass({ timeout: 5000 });

  // Additional collections keep their scrollable navigation instead of compressing labels.
  catalogue.destinations.push({
    ...catalogue.destinations[0],
    id: "category-other-test",
    name: "Additional collection test",
    cluster: "OTHER",
    type: "experience",
  });
  await page.setViewportSize({ width: 320, height: 640 });
  await page.reload();
  const categories = chapter.locator(".chapter-categories");
  await expect(categories.getByRole("button")).toHaveCount(4);
  await expect(row).toHaveCount(0);
  await categories.getByRole("button", { name: "MORE", exact: true }).click();
  await expect(
    chapter.getByRole("button", { name: "Additional collection test", exact: true }),
  ).toBeVisible();
});
