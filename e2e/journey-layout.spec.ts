import { test, expect } from "./fixtures";

const levels = ["heaven", "sky", "earth", "sea"];

test("chapters fit a small phone and retain perspective cards beside the Nam Tram rail", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  for (const level of levels) {
    const chapter = page.locator(`#${level}`);
    await chapter.evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
    await expect
      .poll(() => chapter.evaluate((el) => Math.abs(el.getBoundingClientRect().top)))
      .toBeLessThan(2);
    await expect(chapter.locator(".perspective-card").first()).toBeVisible();
    await expect
      .poll(() =>
        chapter.evaluate((el) => {
          const stage = el.querySelector(".card-stack-stage")!.getBoundingClientRect();
          const nav = el.querySelector(".journey-collections")!.getBoundingClientRect();
          return stage.top - nav.bottom;
        }),
      )
      .toBeLessThanOrEqual(12);
    const layout = await chapter.evaluate((el) => {
      const rect = (selector: string) => el.querySelector(selector)!.getBoundingClientRect();
      const heading = rect(".journey-header");
      const nav = rect(".journey-collections");
      const stage = rect(".card-stack-stage");
      const card = rect(".perspective-card");
      const title = rect(".journey-level-trigger");
      const line = rect(".journey-line");
      return {
        top: heading.top,
        bottom: card.bottom,
        height: innerHeight,
        gap: stage.top - nav.bottom,
        overlap: title.right - line.left,
        lineRight: line.right,
        headerRight: heading.right,
      };
    });
    expect(layout.top).toBeGreaterThan(60);
    expect(layout.bottom).toBeLessThanOrEqual(layout.height - 20);
    expect(layout.gap).toBeLessThanOrEqual(12);
    expect(layout.overlap).toBeLessThan(0);
    expect(layout.lineRight).toBeLessThanOrEqual(layout.headerRight);
  }
  await page.screenshot({ path: testInfo.outputPath("sea-small-phone.png") });
  await expect(page.locator(".journey-transition")).toHaveCount(3);
});

test("level titles open All places and selecting a different collection keeps the whole chapter in view", async ({
  page,
}) => {
  await page.goto("/");
  const chapter = page.locator("#heaven");
  await chapter.getByRole("button", { name: "HEAVEN · ALL PLACES", exact: true }).click();
  const index = page.getByRole("dialog", { name: "ALL PLACES", exact: true });
  await index.getByRole("button", { name: /Nature Discovery/ }).click();
  await expect(index).not.toBeVisible();
  await expect(chapter).toHaveAttribute("data-cluster", "EXPERIENCES");
  await expect(chapter.locator('[data-destination-id="nature-experiences"]')).toBeVisible();
  await expect
    .poll(() => chapter.evaluate((el) => Math.abs(el.getBoundingClientRect().top)))
    .toBeLessThan(2);
});

test("translated chapter headings stay on a single line without colliding on small screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  for (const lang of ["en", "vi", "ru", "zh", "ko", "ja"]) {
    await page.addInitScript((lang) => localStorage.setItem("adj-lang", lang), lang);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    for (const level of levels) {
      const heading = page.locator(`#${level} .journey-header`);
      const fits = await heading.evaluate((el) => {
        const title = el.querySelector("button")!.getBoundingClientRect();
        const line = el.querySelector("p")!;
        const box = line.getBoundingClientRect();
        return (
          title.right < box.left &&
          box.right <= el.getBoundingClientRect().right &&
          box.height < Number.parseFloat(getComputedStyle(line).lineHeight) * 1.5
        );
      });
      expect(fits, `${lang} / ${level}`).toBe(true);
    }
  }
});

test("reduced motion leaves scrolling free and expanded cards do not inherit chapter snapping", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect
    .poll(() => page.locator("html").evaluate((el) => getComputedStyle(el).scrollSnapType))
    .toBe("none");
  await page
    .locator('#heaven [data-destination-id="citron"]')
    .getByRole("button", { name: "Citron", exact: true })
    .click();
  await expect(page).toHaveURL("/citron");
  await expect(page.locator("html")).not.toHaveAttribute("data-journey-snap", "true");
});

test.describe("native scroll settling", () => {
  // A desktop pointer is needed to send real wheel input in WebKit.
  test.use({ isMobile: false, hasTouch: false, viewport: { width: 390, height: 844 } });
  test("a level settles into place and scrolling can continue to the next level", async ({
    page,
  }, testInfo) => {
    await page.goto("/");
    const heaven = page.locator("#heaven");
    await heaven.evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
    const title = heaven.locator(".journey-level-trigger");
    await title.hover();
    await page.mouse.wheel(0, 90);
    await expect
      .poll(() => heaven.evaluate((el) => Math.abs(el.getBoundingClientRect().top)))
      .toBeLessThan(2);
    await page.mouse.wheel(0, await page.evaluate(() => innerHeight + 100));
    await expect
      .poll(() => page.locator("#sky").evaluate((el) => Math.abs(el.getBoundingClientRect().top)))
      .toBeLessThan(2);
    await page.screenshot({ path: testInfo.outputPath("sky-phone.png") });
    await page.setViewportSize({ width: 1440, height: 900 });
    await heaven.evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
    await page.screenshot({ path: testInfo.outputPath("heaven-desktop.png") });
  });
});
