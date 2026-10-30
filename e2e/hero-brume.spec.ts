import { expect, test } from "./fixtures";

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]) {
  test(`Brume stays readable, plays its entry once and pauses out of view at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    const hero = page.locator(".hub-hero");
    await expect(hero).toHaveAttribute("data-hero-motion", "running");
    await expect(page.locator(".hero-title-first")).toHaveCSS("opacity", "1");
    await expect(page.locator(".hero-title-second")).toHaveCSS("opacity", "1");
    await expect(page.locator(".threshold-img")).toHaveCSS("transform", "none");
    expect(
      await hero.evaluate(
        (el) =>
          el.getAnimations({ subtree: true }).filter((a) => a.id.startsWith("hero-brume")).length,
      ),
    ).toBeGreaterThan(10);
    await hero.evaluate((el) => {
      for (const animation of el.getAnimations({ subtree: true })) {
        if (animation.id === "hero-brume-entry") animation.finish();
      }
    });
    await expect(page.locator(".hero-title-first")).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, 0, 0)",
    );
    // Seek a native loop to a visible point: confirms opacity interpolation on both engines.
    const cloudOpacity = await hero.evaluate((el) => {
      const cloud = el.querySelector<HTMLElement>(".hero-cloud-main")!;
      const opacity = cloud.getAnimations().find((a) => a.id === "hero-brume-loop-cloud")!;
      opacity.currentTime = 7800;
      return {
        actual: Number(getComputedStyle(cloud).opacity),
        base: Number(getComputedStyle(el).getPropertyValue("--hero-cloud-opacity")),
      };
    });
    expect(cloudOpacity.actual).toBeGreaterThan(cloudOpacity.base + 0.025);
    await expect(page.locator("#heaven")).toBeAttached();
    await page
      .locator("#discover")
      .evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
    await expect(hero).toHaveAttribute("data-hero-motion", "paused");
    await hero.evaluate((el) =>
      Promise.all(
        el
          .getAnimations({ subtree: true })
          .filter((a) => a.id.includes("loop"))
          .map((a) => a.ready),
      ),
    );
    const paused = await hero.evaluate((el) =>
      el
        .getAnimations({ subtree: true })
        .filter((a) => a.id.includes("loop"))
        .map((a) => ({ state: a.playState, time: Number(a.currentTime) })),
    );
    expect(paused.every((a) => a.state === "paused")).toBe(true);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    expect(
      await hero.evaluate((el) =>
        el
          .getAnimations({ subtree: true })
          .filter((a) => a.id.includes("loop"))
          .map((a) => Number(a.currentTime)),
      ),
    ).toEqual(paused.map((a) => a.time));
    await hero.evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
    await expect(hero).toHaveAttribute("data-hero-motion", "running");
    expect(
      await hero.evaluate((el) =>
        el
          .getAnimations({ subtree: true })
          .filter((a) => a.id === "hero-brume-entry")
          .every((a) => a.playState === "finished"),
      ),
    ).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(hero).toHaveAttribute("data-hero-motion", "static");
    expect(
      await hero.evaluate(
        (el) =>
          el.getAnimations({ subtree: true }).filter((a) => a.id.startsWith("hero-brume")).length,
      ),
    ).toBe(0);
    await expect(page.locator(".hero-cloud-front")).toBeHidden();
    await expect(page.locator(".hero-invitation")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("reduced motion starts static and enabling motion later never replays the entrance", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const hero = page.locator(".hub-hero");
  await expect(hero).toHaveAttribute("data-hero-motion", "static");
  expect(
    await hero.evaluate(
      (el) =>
        el.getAnimations({ subtree: true }).filter((a) => a.id.startsWith("hero-brume")).length,
    ),
  ).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(hero).toHaveAttribute("data-hero-motion", "running");
  expect(
    await hero.evaluate((el) =>
      el.getAnimations({ subtree: true }).some((a) => a.id === "hero-brume-entry"),
    ),
  ).toBe(false);
});

test("unavailable animation API leaves the homepage usable and visible", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(Element.prototype, "animate", { value: undefined }),
  );
  await page.goto("/");
  await expect(page.locator("#heaven")).toBeAttached();
  await expect(page.locator(".hero-invitation")).toBeVisible();
  await expect(page.locator(".hero-title-first")).toHaveCSS("opacity", "1");
  expect(await page.locator(".hub-hero").getAttribute("data-hero-motion")).toBeNull();
});

test("server HTML keeps the title and still photograph visible without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.route("**/media/**", (route) =>
      route.fulfill({ path: "public/intercontinental-touch-icon.png", contentType: "image/png" }),
    );
    await page.goto("http://127.0.0.1:4173/");
    await expect(page.locator(".hero-title-first")).toBeVisible();
    await expect(page.locator(".hero-title-second")).toHaveCSS("opacity", "1");
    await expect(page.locator(".threshold-img")).toHaveCSS("transform", "none");
    await expect(page.locator(".hero-cloud-front")).toHaveCSS("opacity", "0");
  } finally {
    await context.close();
  }
});
