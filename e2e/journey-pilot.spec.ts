import { test, expect } from "./fixtures";

// Real layout checks, including a short viewport representing visible browser bars.
test("pilot keeps tall cards and readable type when browser space changes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const chapter = page.locator("#heaven");
  await chapter.evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
  const card = chapter.locator('[data-destination-id="citron"]');
  await expect(card).toBeVisible();
  const dimensions = () =>
    card.evaluate((el) => ({ width: el.clientWidth, height: el.clientHeight }));
  const initial = await dimensions();
  expect(initial.width).toBeGreaterThan(285);
  expect(initial.height / initial.width).toBeCloseTo(2, 1);
  const styles = await chapter.evaluate((el) => {
    const size = (selector: string) =>
      parseFloat(getComputedStyle(el.querySelector(selector)!).fontSize);
    return {
      description: size(".pilot-description"),
      title: size("article h3"),
      copy: size("article h3 + p"),
      categories: size("nav button > span"),
    };
  });
  expect(styles.description).toBeGreaterThanOrEqual(14);
  expect(styles.title).toBeGreaterThanOrEqual(28);
  expect(styles.copy).toBeGreaterThanOrEqual(16);
  expect(styles.categories).toBeGreaterThanOrEqual(14);
  await page.setViewportSize({ width: 390, height: 665 });
  expect(await dimensions()).toEqual(initial);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await dimensions()).toEqual(initial);
  await expect(page.locator("#earth")).not.toHaveAttribute("data-arrival-pilot");
});

test("title opens the index and category selection does not move the chapter", async ({ page }) => {
  await page.goto("/");
  const chapter = page.locator("#heaven");
  await chapter.evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
  await chapter.getByRole("button", { name: "HEAVEN · ALL PLACES", exact: true }).click();
  const index = page.getByRole("dialog", { name: "ALL PLACES", exact: true });
  await expect(index).toBeVisible();
  await index.getByRole("button", { name: /Citron/ }).click();
  await expect(index).not.toBeVisible();
  await expect
    .poll(() => chapter.evaluate((el) => Math.abs(el.getBoundingClientRect().top)))
    .toBeLessThan(2);
  const y = await page.evaluate(() => window.scrollY);
  await chapter.getByRole("button", { name: "EXPERIENCES", exact: true }).click();
  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(y, 0);
  await expect(chapter).toHaveAttribute("data-cluster", "EXPERIENCES");
});

test("gentle arrival assists forward; departures and reduced motion stay native", async ({
  page,
}) => {
  await page.goto("/");
  const top = await page
    .locator("#sky")
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
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
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(top, 0);
  await gesture(top, top + 40);
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(top + 40, 0);
  await gesture(top - 800, top - 30);
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(top - 30, 0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gesture(top - 200, top - 35);
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(top - 35, 0);
});
