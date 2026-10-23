import { test, expect } from "./fixtures";

test("level heading, controls, categories and full cards fit together on mobile", async ({
  page,
}) => {
  await page.goto("/");
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 360, height: 740 },
    { width: 320, height: 640 },
  ]) {
    await page.setViewportSize(viewport);
    for (const level of ["heaven", "sky", "earth", "sea"]) {
      const chapter = page.locator(`#${level}`);
      await chapter.evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
      await expect
        .poll(() => chapter.evaluate((el) => Math.abs(el.getBoundingClientRect().top)))
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
        const language = document.querySelector(".hub-tools button")!.getBoundingClientRect();
        const search = document.querySelector(".hub-search-tool button")!.getBoundingClientRect();
        const title = rect("h2 button");
        return {
          headingTop: rect("header").top,
          headingClip: getComputedStyle(el.querySelector("header")!).clipPath,
          titleRight: title.right,
          titleTop: title.top,
          titleBottom: title.bottom,
          frameBottom: rect(".chapter-frame").bottom,
          cardHeight: rect(".card-stack-stage").height,
          language: {
            top: language.top,
            bottom: language.bottom,
            left: language.left,
            width: language.width,
            height: language.height,
          },
          search: {
            top: search.top,
            left: search.left,
            width: search.width,
            height: search.height,
          },
        };
      });
      expect(geometry.headingTop).toBeGreaterThanOrEqual(11);
      expect(geometry.headingClip).toBe("none");
      expect(geometry.titleRight).toBeLessThanOrEqual(geometry.language.left - 4);
      expect(geometry.titleTop).toBeLessThan(geometry.language.bottom);
      expect(geometry.titleBottom).toBeGreaterThan(geometry.language.top);
      expect(geometry.language.width).toBe(44);
      expect(geometry.language.height).toBe(44);
      expect(geometry.search.width).toBe(44);
      expect(geometry.search.height).toBe(44);
      expect(geometry.search.left).toBe(geometry.language.left);
      expect(geometry.search.top - geometry.language.bottom).toBe(8);
      expect(geometry.frameBottom).toBeLessThanOrEqual(viewport.height);
      expect(geometry.cardHeight).toBeCloseTo(Math.max(360, viewport.height - 184) * 0.85, 0);
      await expect(chapter.getByRole("button", { name: "ALL PLACES", exact: true })).toHaveCount(0);
      await expect(chapter.locator(".card-stack-pagination")).toContainText("01");
    }
  }
  await expect(page.locator(".chapter-gradient")).toHaveCount(3);
  expect(
    await page.locator(".chapter-gradient").evaluateAll((elements) =>
      elements.every((el) => {
        const gradient = getComputedStyle(el);
        const next = el.nextElementSibling!;
        const previous = el.previousElementSibling!;
        const title = next.querySelector<HTMLElement>("h2")!;
        const bounds = el.getBoundingClientRect();
        return (
          bounds.height >= 112 &&
          bounds.height <= 180 &&
          gradient.backgroundImage.includes("linear-gradient") &&
          bounds.top === previous.getBoundingClientRect().bottom &&
          bounds.bottom === next.getBoundingClientRect().top &&
          bounds.bottom <= title.getBoundingClientRect().top &&
          gradient.overflow === "hidden" &&
          gradient.pointerEvents === "none"
        );
      }),
    ),
  ).toBe(true);
});

test("the level title opens All Places and selection preserves the full level", async ({
  page,
}) => {
  await page.goto("/");
  const chapter = page.locator("#heaven");
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

test("docking preserves the heading, allows departure and respects reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  const frame = page.locator("#sky");
  const top = await frame.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
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

test("Nam Tram jumps center a complete level without revealing adjacent titles", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "The journey From Heaven to Sea", exact: true }).click();
  const rail = page.locator(".nam-tram-rail");
  for (const level of ["earth", "heaven", "sea", "sky"]) {
    await rail.getByRole("button").click();
    const panel = page.locator(".nam-tram-panel");
    await panel.getByRole("button", { name: level.toUpperCase(), exact: true }).click();
    await expect(panel).toHaveCount(0);
    const chapter = page.locator(`#${level}`);
    await expect
      .poll(() => chapter.evaluate((el) => Math.abs(el.getBoundingClientRect().top)))
      .toBeLessThan(2);
    await expect(rail).toHaveAttribute("data-level", level);
    const bounds = await chapter.evaluate((el) => {
      const heading = el.querySelector("header")!.getBoundingClientRect();
      const counter = el.querySelector(".card-stack-pagination")!.getBoundingClientRect();
      const next = el.nextElementSibling?.nextElementSibling?.querySelector("h2");
      return {
        headingTop: heading.top,
        counterBottom: counter.bottom,
        center: (heading.top + counter.bottom) / 2,
        nextTop: next?.getBoundingClientRect().top ?? null,
        height: window.innerHeight,
      };
    });
    expect(bounds.headingTop).toBeGreaterThanOrEqual(12);
    expect(bounds.counterBottom).toBeLessThan(bounds.height);
    expect(Math.abs(bounds.center - bounds.height / 2)).toBeLessThan(14);
    if (bounds.nextTop !== null) expect(bounds.nextTop).toBeGreaterThanOrEqual(bounds.height);
  }
});

test("level headings fit beside controls with a wider fallback serif", async ({ page }) => {
  await page.goto("/");
  await page.addStyleTag({
    content: '.level-chapter h2 { font-family: "Times New Roman", serif; }',
  });
  for (const width of [390, 360, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const chapter = page.locator("#heaven");
    await chapter.evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
    const bounds = await chapter.evaluate((el) => ({
      title: el.querySelector("h2 button")!.getBoundingClientRect().right,
      control: document.querySelector(".hub-tools button")!.getBoundingClientRect().left,
    }));
    expect(bounds.title).toBeLessThanOrEqual(bounds.control - 4);
  }
});

test("atmospheric passages remain static with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const passages = page.locator(".chapter-gradient");
  await expect(passages).toHaveCount(3);
  for (const passage of await passages.all()) {
    await expect(passage).toHaveAttribute("aria-hidden", "true");
    expect(
      await passage.locator("span").evaluateAll((layers) =>
        layers.every((layer) => {
          const style = getComputedStyle(layer);
          return style.animationName === "none" && style.transform === "none";
        }),
      ),
    ).toBe(true);
  }
});
