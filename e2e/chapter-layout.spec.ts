import { test, expect } from "./fixtures";

test("all four card frames use cards 15% shorter below the scrolling level heading", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".chapter-frame")).toHaveCount(4);
  for (const level of ["heaven", "sky", "earth", "sea"]) {
    const chapter = page.locator(`#${level}`);
    const frame = chapter.locator(".chapter-frame");
    await frame.evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
    await expect
      .poll(() => frame.evaluate((el) => Math.abs(el.getBoundingClientRect().top - 64)))
      .toBeLessThan(2);
    await expect
      .poll(() =>
        chapter.evaluate(
          (el) =>
            el.querySelector(".card-stack-stage")!.getBoundingClientRect().top -
            el.querySelector(".chapter-categories")!.getBoundingClientRect().bottom,
        ),
      )
      .toBeLessThanOrEqual(10);
    const geometry = await chapter.evaluate((el) => {
      const rect = (selector: string) => el.querySelector(selector)!.getBoundingClientRect();
      const frame = rect(".chapter-frame");
      const categories = rect(".chapter-categories");
      const cards = rect(".card-stack-stage");
      const heading = rect("header");
      return {
        frameHeight: frame.height,
        navTop: categories.top,
        gap: cards.top - categories.bottom,
        headingBottom: heading.bottom,
        cardHeight: cards.height,
        cardWidth: el.querySelector<HTMLElement>(".perspective-card")!.offsetWidth,
      };
    });
    expect(geometry.frameHeight + geometry.navTop).toBeCloseTo(844 - (844 - 184) * 0.15, 0);
    expect(geometry.navTop).toBeGreaterThanOrEqual(60);
    expect(geometry.headingBottom).toBeLessThan(geometry.navTop);
    expect(geometry.navTop - geometry.headingBottom).toBeCloseTo(16, 0);
    expect(geometry.gap).toBeGreaterThanOrEqual(0);
    expect(geometry.gap).toBeLessThanOrEqual(10);
    expect(geometry.cardHeight).toBeCloseTo((844 - 184) * 0.85, 0);
    expect(geometry.cardWidth).toBeGreaterThan(285);
    await expect(chapter.getByRole("button", { name: "ALL PLACES", exact: true })).toHaveCount(0);
    await expect(chapter.locator(".card-stack-pagination")).toContainText("01");
  }
  await expect(page.locator(".chapter-gradient")).toHaveCount(3);
  expect(
    await page.locator(".chapter-gradient").evaluateAll((elements) =>
      elements.every((el) => {
        const gradient = getComputedStyle(el, "::before");
        const next = el.nextElementSibling!;
        const previous = el.previousElementSibling!;
        const title = next.querySelector<HTMLElement>("h2")!;
        const counter = previous.querySelector(".card-stack-pagination")!;
        return (
          el.getBoundingClientRect().height === 0 &&
          gradient.backgroundImage.includes("linear-gradient") &&
          gradient.height === "180px" &&
          next.getBoundingClientRect().top === previous.getBoundingClientRect().bottom &&
          title.getBoundingClientRect().top - counter.getBoundingClientRect().bottom < 80
        );
      }),
    ),
  ).toBe(true);
});

test("the level title opens All Places and selection aligns categories with the card", async ({
  page,
}) => {
  await page.goto("/");
  const chapter = page.locator("#heaven");
  await chapter.getByRole("button", { name: "HEAVEN · ALL PLACES", exact: true }).click();
  const index = page.getByRole("dialog", { name: "ALL PLACES", exact: true });
  await expect(index).toBeVisible();
  await index.getByRole("button", { name: /Citron/ }).click();
  await expect(index).not.toBeVisible();
  const frame = chapter.locator(".chapter-frame");
  await expect
    .poll(() => frame.evaluate((el) => Math.abs(el.getBoundingClientRect().top - 64)))
    .toBeLessThan(2);
  const y = await page.evaluate(() => window.scrollY);
  await chapter.getByRole("button", { name: "EXPERIENCES", exact: true }).click();
  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(y, 0);
  await expect(chapter).toHaveAttribute("data-cluster", "EXPERIENCES");
});

test("docking aligns the card frame, allows departure and respects reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  const frame = page.locator("#sky .chapter-frame");
  const top = await frame.evaluate((el) => el.getBoundingClientRect().top + window.scrollY - 64);
  const gesture = async (start: number, end: number) => {
    await page.evaluate(
      ({ start, end }) => {
        window.scrollTo({ top: start, behavior: "instant" });
        window.dispatchEvent(new Event("touchstart"));
        window.scrollTo({ top: end, behavior: "instant" });
        window.dispatchEvent(new Event("touchend"));
      },
      { start, end },
    );
  };
  await gesture(top - 200, top - 35);
  await expect
    .poll(() => page.evaluate((target) => Math.abs(window.scrollY - target), top))
    .toBeLessThan(2);
  await gesture(top, top + 40);
  await page.waitForTimeout(350);
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - top - 40)).toBeLessThan(2);
  await gesture(top - 800, top - 30);
  await page.waitForTimeout(350);
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - top + 30)).toBeLessThan(2);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gesture(top - 200, top - 35);
  await page.waitForTimeout(350);
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - top + 35)).toBeLessThan(2);
});
