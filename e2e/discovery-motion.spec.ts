import { expect, test, type Page } from "./fixtures";

async function threePreviews(page: Page) {
  await page.route("**/_serverFn/**", async (route) => {
    const response = await route.fetch();
    if (!response.headers()["server-timing"]?.includes("catalogue;")) {
      await route.fulfill({ response });
      return;
    }
    const catalogue = await response.json();
    for (const level of ["sky", "earth"]) {
      catalogue.destinations.push({
        ...catalogue.destinations[0],
        id: `discovery-preview-${level}`,
        level_id: level,
      });
    }
    await route.fulfill({ response, json: catalogue });
  });
}

async function finishEntry(page: Page, selector: string) {
  const node = page.locator(selector);
  await node.evaluate((el) => {
    for (const node of [el, ...el.querySelectorAll("img")]) {
      for (const animation of node.getAnimations()) {
        if (animation instanceof CSSAnimation && animation.animationName.startsWith("discovery-"))
          animation.finish();
      }
    }
  });
  await expect(node).toHaveAttribute("data-discovery-entry", "done");
}

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`Discovery keeps live readable cards and a single entrance at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await threePreviews(page);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(page.locator(".discovery-choice")).toHaveCount(3);
    await page
      .locator("#discover")
      .evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
    await expect(page.locator(".discovery-heading")).toHaveAttribute(
      "data-discovery-entry",
      "enter",
    );
    await expect(page.locator('[data-discovery-entry="enter"]')).toHaveCount(4);
    // Freeze the autonomous sequence so geometry checks do not race its natural completion.
    await page.locator(".discovery-paths").evaluate(async (el) => {
      const animations = [el, ...el.querySelectorAll("*")].flatMap((node) => node.getAnimations());
      const entries = animations.filter(
        (a) => a instanceof CSSAnimation && a.animationName.startsWith("discovery-"),
      );
      for (const animation of entries) animation.pause();
      await Promise.all(entries.map((animation) => animation.ready));
    });
    await finishEntry(page, ".discovery-heading");
    for (const kind of ["journey", "map", "surprise"]) {
      const card = page.locator(`.discovery-${kind}`);
      await card.scrollIntoViewIfNeeded();
      await expect(card).toHaveAttribute("data-discovery-entry", "enter");
      // The card fade may already have finished when WebKit scrolls a stable target.
      // Inspect the visual's own timeline instead of requiring overlapping animations.
      await expect
        .poll(() =>
          card
            .locator("img")
            .first()
            .evaluate(
              (el) =>
                el
                  .getAnimations()
                  .filter(
                    (a) => a instanceof CSSAnimation && a.animationName.startsWith("discovery-"),
                  ).length,
            ),
        )
        .toBeGreaterThan(0);
      await finishEntry(page, `.discovery-${kind}`);
      await expect(card).toHaveCSS("opacity", "1");
      await expect(card).toHaveCSS("transform", "none");
      const geometry = await card.evaluate((el) => {
        const box = el.getBoundingClientRect();
        const copy = el.querySelector(".discovery-choice-text")!.getBoundingClientRect();
        return {
          width: box.width,
          height: box.height,
          copyInside:
            copy.left >= box.left &&
            copy.right <= box.right &&
            copy.top >= box.top &&
            copy.bottom <= box.bottom,
          overflow: getComputedStyle(el).overflow,
          font: parseFloat(getComputedStyle(el.querySelector(".discovery-choice-note")!).fontSize),
        };
      });
      expect(geometry.copyInside).toBe(true);
      expect(geometry.overflow).toBe("hidden");
      expect(geometry.font).toBeGreaterThanOrEqual(14);
    }
    await page.locator(".hub-hero").evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
    await page.locator("#discover").evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
    await expect(page.locator('[data-discovery-entry="enter"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const cards = await page
      .locator(".discovery-choice")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
    expect(cards[0]).toBeLessThan(cards[1]!);
    expect(cards[1]).toBeLessThan(cards[2]!);
    expect(errors).toEqual([]);
  });
}

test("approaching Discovery starts every card; scrolling never controls the timeline", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 500 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await threePreviews(page);
  await page.goto("/");
  await expect(page.locator(".discovery-choice")).toHaveCount(3);
  await expect(page.locator('[data-discovery-entry="enter"]')).toHaveCount(0);
  await page.locator(".discovery-paths").evaluate((el) =>
    window.scrollTo({
      top: el.getBoundingClientRect().top + scrollY - innerHeight + 30,
      behavior: "instant",
    }),
  );
  await expect(page.locator('[data-discovery-entry="enter"]')).toHaveCount(4);
  // Even cards still below the screen start as part of the same sequence.
  const last = page.locator(".discovery-surprise");
  expect(await last.evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThan(500);
  await expect(last).toHaveCSS("animation-play-state", "running");
  const first = page.locator(".discovery-journey");
  await page
    .locator(".hub-hero")
    .evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
  await expect(first).toHaveCSS("animation-play-state", "running");
  const motion = page.locator(".discovery-tram img");
  await motion.evaluate((el) =>
    Promise.all(el.getAnimations().map((animation) => animation.ready)),
  );
  const time = await motion.evaluate((el) => Number(el.getAnimations()[0]!.currentTime));
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  expect(await motion.evaluate((el) => Number(el.getAnimations()[0]!.currentTime))).toBeGreaterThan(
    time,
  );
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(first).toHaveCSS("animation-play-state", "paused");
  await page.evaluate(() => {
    delete (document as unknown as Record<string, unknown>)["hidden"];
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(first).toHaveCSS("animation-play-state", "running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('[data-discovery-entry="enter"]')).toHaveCount(0);
  await expect(first).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveAttribute("data-discovery-entry", "done");
});

test("reduced motion is static from the start and the map action works by touch", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const map = page.locator(".discovery-map");
  await map.scrollIntoViewIfNeeded();
  await expect(map).toHaveAttribute("data-discovery-entry", "done");
  await expect(map).toHaveCSS("animation-name", "none");
  await map.tap();
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.getByRole("dialog", { name: "Resort map", exact: true })).toBeVisible();
});

test("keyboard focus completes the entrance and Enter keeps Surprise navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const surprise = page.locator(".discovery-surprise");
  await surprise.scrollIntoViewIfNeeded();
  await surprise.focus();
  await expect(surprise).toHaveAttribute("data-discovery-entry", "done");
  await expect(surprise).toBeFocused();
  await expect(surprise).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/surprise-me$/);
  await expect(page.getByRole("dialog", { name: "Surprise me", exact: true })).toBeVisible();
});

test("clicking during arrival keeps journey navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const first = page.locator(".discovery-journey");
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveAttribute("data-discovery-entry", "enter");
  await first.click({ force: true });
  await expect
    .poll(() => page.locator("#heaven").evaluate((el) => Math.abs(el.getBoundingClientRect().top)))
    .toBeLessThan(200);
});

test("disabled CSS animations leave the section visible and usable", async ({ page }) => {
  await page.goto("/");
  await page.addStyleTag({
    content: ".discovery-paths, .discovery-paths * { animation: none !important; }",
  });
  const card = page.locator(".discovery-surprise");
  await expect(card).toBeVisible();
  await expect(card).toHaveCSS("opacity", "1");
  await expect(card).toHaveCSS("animation-name", "none");
  await card.click();
  await expect(page).toHaveURL(/\/surprise-me$/);
});
