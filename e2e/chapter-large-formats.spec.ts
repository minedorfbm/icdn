import { expect, test } from "./fixtures";

test("large formats keep the editorial heading, portrait cards and controls within the level", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 1194, height: 834 },
    { width: 1024, height: 768 },
    { width: 834, height: 1194 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    // Check each layout from a clean load. Resize/reversal behavior is covered
    // separately; chaining six resizes here races native scroll anchoring.
    await page.goto("/");
    const chapter = page.locator("#heaven");
    // The deck can mount after the resize frames when the catalogue/chunk is late.
    // Measure its settled layout, not the +10px group-enter animation offset.
    await chapter.locator(".chapter-stack").evaluate(async (deck) => {
      await Promise.allSettled(deck.getAnimations().map((animation) => animation.finished));
    });
    // Fonts and the final deck size must settle before the native scroll target is measured.
    await page.evaluate(() => document.fonts.ready);
    await expect(chapter).toHaveCSS("min-height", viewport.height + "px");
    await chapter.evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
    await expect
      .poll(() =>
        chapter.evaluate((el) =>
          Math.abs(
            el.getBoundingClientRect().top -
              parseFloat(getComputedStyle(el).scrollMarginTop || "0"),
          ),
        ),
      )
      .toBeLessThan(2);
    const geometry = await chapter.evaluate((el) => {
      const box = (selector: string) => el.querySelector(selector)!.getBoundingClientRect();
      const size = (selector: string) =>
        parseFloat(getComputedStyle(el.querySelector(selector)!).fontSize);
      return {
        titleLeft: box("h2").left,
        titleRight: box("h2 button").right,
        headingRight: box("header").right,
        headingBottom: box("header").bottom,
        frameLeft: box(".chapter-frame").left,
        frameTop: box(".chapter-frame").top,
        frameBottom: box(".chapter-frame").bottom,
        stageTop: box(".card-stack-stage").top,
        categoriesBottom: box(".chapter-categories").bottom,
        cardHeight: el.querySelector<HTMLElement>(".perspective-card")!.offsetHeight,
        cardWidth: el.querySelector<HTMLElement>(".perspective-card")!.offsetWidth,
        metaSize: size(".destination-panel-meta"),
        summarySize: size(".destination-panel-summary"),
        actionSize: size(".destination-panel-actions a"),
        pageWidth: document.documentElement.scrollWidth,
      };
    });
    expect(geometry.titleLeft).toBeGreaterThanOrEqual(24);
    expect(geometry.titleRight).toBeLessThanOrEqual(geometry.headingRight + 1);
    expect(geometry.frameBottom).toBeLessThanOrEqual(viewport.height - 12);
    expect(geometry.stageTop - geometry.categoriesBottom).toBeLessThanOrEqual(10);
    expect(geometry.cardHeight / geometry.cardWidth).toBeGreaterThan(1.65);
    expect(geometry.metaSize).toBeGreaterThanOrEqual(11);
    expect(geometry.summarySize).toBeGreaterThanOrEqual(17);
    expect(geometry.actionSize).toBeGreaterThanOrEqual(11);
    expect(geometry.pageWidth).toBe(viewport.width);
    if (viewport.width > viewport.height) {
      expect(geometry.headingRight).toBeLessThan(geometry.frameLeft);
    } else {
      expect(geometry.headingBottom).toBeLessThanOrEqual(geometry.frameTop);
    }
  }
});

test("large-format arrows, categories and the level index use the shared deck", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const chapter = page.locator("#heaven");
  await chapter.evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
  const arrows = chapter.locator(".chapter-deck-controls button");
  await expect(arrows.first()).toBeDisabled();
  await arrows.last().click();
  await expect(chapter.locator(".card-stack-pagination")).toContainText("02");
  await expect(chapter.getByRole("button", { name: "TINGARA", exact: true })).toBeVisible();
  await arrows.last().click();
  await expect(chapter.locator(".card-stack-pagination")).toContainText("03");
  await expect(arrows.last()).toBeDisabled();
  await arrows.first().click();
  await arrows.first().click();
  await expect(chapter.locator(".card-stack-pagination")).toContainText("01");
  await chapter.getByRole("button", { name: "EXPERIENCES", exact: true }).click();
  await expect(chapter).toHaveAttribute("data-cluster", "EXPERIENCES");
  await chapter.getByRole("button", { name: "HEAVEN · ALL PLACES", exact: true }).click();
  const index = page.getByRole("dialog", { name: "ALL PLACES", exact: true });
  await index.getByRole("button", { name: /Citron/ }).click();
  await expect(index).not.toBeVisible();
  await expect(chapter).toHaveAttribute("data-cluster", "DINING");
  await expect(chapter.getByRole("button", { name: "Citron", exact: true })).toBeVisible();
});
