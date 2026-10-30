import { expect, test, type Page } from "./fixtures";

const effects =
  /(?:bee-eater|drongo|sunbird|branch-left|branch-right|liana-|fern-|leaf-green|leaf-gold|leaf-small|corner-waves).*\.webp/;
async function position(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}
async function stations(page: Page) {
  return page.locator(".level-chapter").evaluateAll((elements) =>
    elements.map((el) => ({
      id: el.id,
      top:
        el.getBoundingClientRect().top +
        scrollY -
        parseFloat(getComputedStyle(el).scrollMarginTop || "0"),
      height: (el as HTMLElement).offsetHeight,
      cardHeight: el.querySelector<HTMLElement>(".perspective-card")!.offsetHeight,
    })),
  );
}

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`atmospheres dissolve without gaps, reverse with scroll and finish at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width >= 768 ? 1000 : 844 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const requests: string[] = [],
      errors: string[] = [];
    page.on("request", (request) => {
      if (effects.test(request.url())) requests.push(request.url());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(page.locator('.journey-worlds[data-atmosphere="true"]')).toHaveCount(1);
    await expect(page.locator(".chapter-gradient")).toHaveCount(0);
    expect(requests).toEqual([]);
    const before = await stations(page),
      viewport = await page.evaluate(() => innerHeight);
    for (let index = 1; index < before.length; index++) {
      const station = before[index]!,
        y = station.top - viewport * 0.42;
      await position(page, y);
      const group = page.locator(`[data-atmosphere-effect="${station.id}"]`);
      await expect(group).toHaveCSS("visibility", "visible");
      const world = page.locator(`[data-atmosphere-level="${station.id}"]`);
      const blend = await world.evaluate((el) => Number(getComputedStyle(el).opacity));
      expect(blend).toBeGreaterThan(0);
      expect(blend).toBeLessThan(1);
      const pose = await group
        .locator("img")
        .evaluateAll((imgs) => imgs.map((img) => img.getAttribute("style")));
      await position(page, y + 60);
      await position(page, y);
      expect(
        await group
          .locator("img")
          .evaluateAll((imgs) => imgs.map((img) => img.getAttribute("style"))),
      ).toEqual(pose);
      await position(page, station.top);
      await expect(world).toHaveCSS("opacity", "1");
      await expect(group).toHaveCSS("visibility", "hidden", { timeout: 2500 });
      await expect(page.locator(".journey-atmosphere")).toHaveAttribute(
        "data-atmosphere-moving",
        "false",
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
    const after = await stations(page);
    expect(after.map(({ height, cardHeight }) => ({ height, cardHeight }))).toEqual(
      before.map(({ height, cardHeight }) => ({ height, cardHeight })),
    );
    expect(
      await page
        .locator(".level-chapter")
        .evaluateAll((es) =>
          es
            .slice(0, -1)
            .every(
              (el, i) =>
                Math.abs(
                  el.getBoundingClientRect().bottom - es[i + 1]!.getBoundingClientRect().top,
                ) < 1,
            ),
        ),
    ).toBe(true);
    expect(errors).toEqual([]);
    // A fully completed effect has no continuing JS style writes.
    const mutations = await page.locator(".journey-atmosphere").evaluate(
      (el) =>
        new Promise<number>((resolve) => {
          let count = 0;
          const observer = new MutationObserver((records) => (count += records.length));
          observer.observe(el, { attributes: true, subtree: true });
          setTimeout(() => {
            observer.disconnect();
            resolve(count);
          }, 250);
        }),
    );
    expect(mutations).toBe(0);
    const bounded = await page.locator(".journey-worlds").evaluate((el) => {
      const style = getComputedStyle(el),
        box = el.getBoundingClientRect();
      const footer = document.querySelector(".sea-footer")!.getBoundingClientRect();
      return {
        clipped:
          style.clipPath !== "none" || style.overflow === "clip" || style.contain.includes("paint"),
        gap: Math.abs(footer.top - box.bottom),
      };
    });
    expect(bounded.clipped).toBe(true);
    expect(bounded.gap).toBeLessThan(1);
  });
}

test("Heaven illuminates once, native scrolling stays free and hidden tabs stop the effects", async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator('.journey-worlds[data-atmosphere="true"]')).toHaveCount(1);
  const tops = await stations(page);
  await position(page, tops[0]!.top);
  const heaven = page.locator('[data-atmosphere-effect="heaven"]');
  await expect(heaven).toHaveCSS("visibility", "visible");
  await expect
    .poll(() =>
      heaven.locator(".atmosphere-halo").evaluate((el) => Number(getComputedStyle(el).opacity)),
    )
    .toBeGreaterThan(0.05);
  await expect(heaven).toHaveCSS("visibility", "hidden", { timeout: 2500 });
  await position(page, tops[0]!.top + 10);
  await position(page, tops[0]!.top);
  await expect(heaven).toHaveCSS("visibility", "hidden");
  if (browserName === "chromium") {
    await page.mouse.wheel(0, 260);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(tops[0]!.top + 150);
  }
  await position(page, tops[1]!.top - 100);
  await position(page, tops[1]!.top);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".journey-atmosphere")).toHaveAttribute(
    "data-atmosphere-moving",
    "false",
  );
  for (const group of await page.locator("[data-atmosphere-effect]").all())
    await expect(group).toHaveCSS("visibility", "hidden");
  await page.evaluate(() => {
    delete (document as unknown as { hidden?: boolean }).hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
});

test("reduced motion preserves static palette/photos and never requests effect assets", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requests: string[] = [];
  page.on("request", (request) => {
    if (effects.test(request.url())) requests.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator("#heaven")).toHaveCount(1);
  await expect(page.locator(".journey-atmosphere")).toHaveCSS("display", "none");
  await expect(page.locator("[data-atmosphere-level]")).toHaveCount(0);
  for (const station of await stations(page)) {
    await position(page, station.top);
    await expect(page.locator(`#${station.id} .journey-backdrop`)).toHaveCount(1);
    const background = await page
      .locator(`#${station.id}`)
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(background).not.toBe("rgba(0, 0, 0, 0)");
  }
  expect(requests).toEqual([]);
});

test("resizing recomputes the scene position and motion can be disabled during a passage", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator('.journey-worlds[data-atmosphere-ready="true"]')).toHaveCount(1);
  for (const width of [390, 768, 1440, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    const tops = await stations(page);
    await position(page, tops[1]!.top - 900 * 0.42);
    const opacity = await page
      .locator('[data-atmosphere-level="sky"]')
      .evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(opacity).toBeGreaterThan(0.1);
    expect(opacity).toBeLessThan(0.9);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-atmosphere-level]")).toHaveCount(0);
  await expect(page.locator(".journey-atmosphere")).toHaveCSS("display", "none");
  await expect(page.locator("#sky header")).toHaveCSS("opacity", "1");
});
