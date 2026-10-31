import { expect, test, type Page } from "./fixtures";

const effects =
  /(?:bee-eater|drongo|sunbird|branch-left|branch-right|liana-|fern-|leaf-green|leaf-gold|leaf-small|sea-wave).*\.(?:webp|svg)/;
async function position(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}
async function stations(page: Page) {
  // Font completion above the journey can move its arrival coordinates. Let
  // ResizeObserver and the shared motion clock consume that layout first.
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
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
    const layers = await page.locator(".journey-worlds").evaluate((el) => {
      const foreground = el.querySelector<HTMLElement>(".journey-atmosphere-foreground")!;
      return {
        background: Number(getComputedStyle(el.querySelector(".journey-atmosphere")!).zIndex),
        content: Number(getComputedStyle(el.querySelector(".level-chapter")!).zIndex),
        foreground: Number(getComputedStyle(foreground).zIndex),
        pointerEvents: getComputedStyle(foreground).pointerEvents,
      };
    });
    expect(layers.foreground).toBeGreaterThan(layers.content);
    expect(layers.background).toBeLessThan(layers.content);
    expect(layers.pointerEvents).toBe("none");
    expect(requests).toEqual([]);
    const before = await stations(page),
      viewport = await page.evaluate(() => innerHeight);
    for (let index = 1; index < before.length; index++) {
      const station = before[index]!,
        y = station.top - viewport * 0.42;
      await position(page, y);
      const group = page.locator(`[data-atmosphere-effect="${station.id}"]`);
      await expect(group).toHaveCSS("visibility", "visible");
      if (station.id === "sea")
        await expect(group.locator("img").first()).toHaveAttribute("src", /sea-wave.*\.svg/);
      const world = page.locator(`[data-atmosphere-level="${station.id}"]`);
      const blend = await world.evaluate((el) => Number(getComputedStyle(el).opacity));
      expect(blend).toBeGreaterThan(0);
      expect(blend).toBeLessThan(1);
      if (station.id === "earth")
        await expect(page.locator(".journey-atmosphere")).toHaveAttribute(
          "data-atmosphere-moving",
          "false",
        );
      const directionStart =
        station.id === "sea"
          ? await group
              .locator("img")
              .evaluateAll((es) => es.map((el) => new DOMMatrixReadOnly(el.style.transform).m41))
          : [];
      const pose = await group
        .locator("img")
        .evaluateAll((imgs) => imgs.map((img) => img.getAttribute("style")));
      await position(page, y + 60);
      if (station.id === "sea") {
        const next = await group
          .locator("img")
          .evaluateAll((es) => es.map((el) => new DOMMatrixReadOnly(el.style.transform).m41));
        next.forEach((x, i) => expect(x).toBeLessThan(directionStart[i]!));
      }
      await position(page, y);
      if (station.id === "earth")
        await expect(page.locator(".journey-atmosphere")).toHaveAttribute(
          "data-atmosphere-moving",
          "false",
        );
      expect(
        await group
          .locator("img")
          .evaluateAll((imgs) => imgs.map((img) => img.getAttribute("style"))),
      ).toEqual(pose);
      await position(page, station.top);
      await expect(world).toHaveCSS("opacity", "1");
      if (station.id === "sea") {
        const waves = group.locator("img");
        await expect(waves).toHaveCount(4);
        const card = await page
          .locator('#sea .perspective-card[data-card-offset="0"]')
          .boundingBox();
        const counter = await page.locator("#earth .card-stack-pagination").boundingBox();
        const subtitle = await page.locator("#sea header p").boundingBox();
        const start = await waves.evaluateAll((es) =>
          es.map((el) => ({
            x: el.getBoundingClientRect().x,
            y: el.getBoundingClientRect().y,
            width: el.getBoundingClientRect().width,
            bottom: el.getBoundingClientRect().bottom,
          })),
        );
        expect(new Set(start.map((wave) => wave.y)).size).toBe(4);
        for (const wave of start) {
          expect(wave.width).toBeLessThan(card!.width * 0.6);
          expect(wave.y).toBeGreaterThanOrEqual(counter!.y - 1);
          expect(wave.bottom).toBeLessThanOrEqual(subtitle!.y + subtitle!.height + 1);
        }
      }
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
    const mutations = await page.locator(".journey-worlds").evaluate(
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

test("Heaven completes each visit, native scrolling stays free and hidden tabs stop the effects", async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator('.journey-worlds[data-atmosphere="true"]')).toHaveCount(1);
  const tops = await stations(page);
  const heaven = page.locator('[data-atmosphere-effect="heaven"]');
  await position(page, tops[0]!.top - 844 - 64 - 10);
  await expect(heaven).toHaveCSS("visibility", "hidden");
  await position(page, tops[0]!.top - 844 - 25);
  await expect
    .poll(() =>
      heaven
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await expect(heaven).toHaveCSS("visibility", "visible");
  expect(await heaven.evaluate((el) => el.getBoundingClientRect().top)).toBeLessThan(844);
  expect(
    await heaven
      .locator("img")
      .first()
      .evaluate((el) => Number(getComputedStyle(el).opacity)),
  ).toBeGreaterThan(0);
  await position(page, tops[0]!.top - 844 * 0.2);
  const approaching = await heaven
    .locator("img")
    .evaluateAll((es) => es.map((e) => e.getAttribute("style")));
  await position(page, tops[0]!.top - 844 * 0.5);
  expect(
    await heaven.locator("img").evaluateAll((es) => es.map((e) => e.getAttribute("style"))),
  ).not.toEqual(approaching);
  await position(page, tops[0]!.top - 844 * 0.2);
  expect(
    await heaven.locator("img").evaluateAll((es) => es.map((e) => e.getAttribute("style"))),
  ).toEqual(approaching);
  await expect(page.locator(".journey-atmosphere")).toHaveAttribute(
    "data-atmosphere-moving",
    "false",
  );
  await position(page, tops[0]!.top);
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

for (const width of [390, 1440]) {
  test(`Heaven keeps both cloud bodies and warm light in the visible section at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator('.journey-worlds[data-atmosphere="true"]')).toHaveCount(1);
    const tops = await stations(page);
    await position(page, tops[0]!.top - 900 * 0.5);
    const group = page.locator('[data-atmosphere-effect="heaven"]');
    await expect(group).toHaveCSS("visibility", "visible");
    const visibleClouds = await group.locator("img").evaluateAll((es) => {
      const section = document.querySelector("#heaven")!.getBoundingClientRect();
      return es.map((el) => {
        const box = el.getBoundingClientRect();
        return Math.max(0, Math.min(innerHeight, box.bottom) - Math.max(section.top, box.top));
      });
    });
    expect(visibleClouds.every((height) => height > 70)).toBe(true);
    for (const light of [".atmosphere-halo", ".atmosphere-rays"]) {
      await expect(group.locator(light)).toHaveCSS("mix-blend-mode", "normal");
      expect(
        await group.locator(light).evaluate((el) => Number(getComputedStyle(el).opacity)),
      ).toBeGreaterThan(0.1);
    }
  });
}

test("a direct cold Heaven arrival waits for loaded clouds even after scroll stops", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  let release!: () => void;
  const pending = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/hero-cloud-ivory-*.webp", async (route) => {
    await pending;
    await route.fulfill({
      path: "public/hero-cloud-ivory-a26e472d.webp",
      contentType: "image/webp",
    });
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator('.journey-worlds[data-atmosphere="true"]')).toHaveCount(1);
    const tops = await stations(page);
    const heaven = page.locator('[data-atmosphere-effect="heaven"]');
    await position(page, tops[0]!.top - 844 * 0.2);
    await expect(heaven).toHaveCSS("visibility", "hidden");
    await position(page, tops[0]!.top);
    await expect(heaven).toHaveCSS("visibility", "hidden");
    await page.waitForTimeout(150);
    release();
    // No further scroll: the actual image load wakes the shared scheduler once.
    await expect(heaven).toHaveCSS("visibility", "visible");
    await expect
      .poll(() =>
        heaven.locator(".atmosphere-halo").evaluate((el) => Number(getComputedStyle(el).opacity)),
      )
      .toBeGreaterThan(0.05);
    await expect(heaven).toHaveCSS("visibility", "hidden", { timeout: 3000 });
  } finally {
    release();
  }
});

test("cold clouds join the current Heaven scroll phase without waiting for alignment", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  let release!: () => void;
  const pending = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/hero-cloud-ivory-*.webp", async (route) => {
    await pending;
    await route.fulfill({
      path: "public/hero-cloud-ivory-a26e472d.webp",
      contentType: "image/webp",
    });
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator('.journey-worlds[data-atmosphere="true"]')).toHaveCount(1);
    const tops = await stations(page),
      viewport = await page.evaluate(() => innerHeight);
    const heaven = page.locator('[data-atmosphere-effect="heaven"]');
    await position(page, tops[0]!.top - viewport * 0.8);
    await expect(heaven).toHaveCSS("visibility", "hidden");
    release();
    await expect(heaven).toHaveCSS("visibility", "visible");
    await expect(page.locator(".journey-atmosphere")).toHaveAttribute(
      "data-atmosphere-moving",
      "false",
    );
    const pose = await heaven
      .locator("img")
      .evaluateAll((es) => es.map((e) => e.getAttribute("style")));
    await page.waitForTimeout(250);
    expect(
      await heaven.locator("img").evaluateAll((es) => es.map((e) => e.getAttribute("style"))),
    ).toEqual(pose);
    await position(page, tops[0]!.top);
    await expect(heaven).toHaveCSS("visibility", "hidden", { timeout: 1500 });
  } finally {
    release();
  }
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
  await expect(page.locator(".journey-atmosphere-foreground")).toHaveCSS("display", "none");
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

test("new decorative transfers wait behind pending front photos and wake without another scroll", async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const catalogue = await (
    await request.get("http://127.0.0.1:54329/rest/v1/rpc/published_hub_catalogue_v1")
  ).json();
  for (const destination of catalogue.destinations)
    destination.image_key = `/atmosphere-priority/cover-${destination.id}.png`;
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
  let release!: () => void;
  const pending = new Promise<void>((resolve) => (release = resolve));
  let heldPhotos = 0;
  await page.route("**/atmosphere-priority/**", async (route) => {
    heldPhotos++;
    await pending;
    await route.fulfill({
      path: "public/intercontinental-touch-icon.png",
      contentType: "image/png",
    });
  });
  const requests: string[] = [];
  page.on("request", (request) => {
    if (effects.test(request.url())) requests.push(request.url());
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator('.journey-worlds[data-atmosphere="true"]')).toHaveCount(1);
    const tops = await stations(page),
      viewport = await page.evaluate(() => innerHeight);
    await position(page, tops[1]!.top - viewport * 0.42);
    await expect.poll(() => heldPhotos).toBeGreaterThan(0);
    await expect
      .poll(() =>
        page
          .locator('#sky .perspective-card[data-card-offset="0"] img')
          .first()
          .evaluate(
            (image) =>
              Boolean(image.getAttribute("src") || image.getAttribute("srcset")) &&
              !(image as HTMLImageElement).complete,
          ),
      )
      .toBe(true);
    await page.waitForTimeout(200);
    expect(requests).toEqual([]);
    release();
    await expect.poll(() => requests.some((url) => url.includes("bee-eater"))).toBe(true);
  } finally {
    release();
  }
});

for (const connection of [
  { saveData: true, effectiveType: "4g" },
  { saveData: false, effectiveType: "2g" },
]) {
  test(`constrained network ${JSON.stringify(connection)} keeps the journey usable without new decoration downloads`, async ({
    page,
  }) => {
    await page.addInitScript(
      (value) => Object.defineProperty(navigator, "connection", { configurable: true, value }),
      connection,
    );
    const requests: string[] = [];
    page.on("request", (request) => {
      if (effects.test(request.url())) requests.push(request.url());
    });
    await page.goto("/");
    const tops = await stations(page);
    for (const station of tops) {
      await position(page, station.top);
      await expect(page.locator(`[data-atmosphere-effect="${station.id}"]`)).toHaveCSS(
        "visibility",
        "hidden",
      );
    }
    expect(requests).toEqual([]);
    await expect(page.locator('#sea .perspective-card[data-card-offset="0"]')).toBeVisible();
  });
}

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

test("Earth absorbs wheel steps, settles without an idle loop and cancels after fast navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator('.journey-worlds[data-atmosphere="true"]')).toHaveCount(1);
  const tops = await stations(page),
    earth = tops[2]!,
    sea = tops[3]!;
  await position(page, earth.top - 500);
  const plant = page.locator('.atmosphere-plant[data-part="3"]');
  const initial = await plant.getAttribute("style");
  await position(page, earth.top - 300);
  const following = await plant.getAttribute("style");
  expect(following).not.toBe(initial);
  await expect(page.locator(".journey-atmosphere")).toHaveAttribute(
    "data-atmosphere-moving",
    "false",
  );
  const settled = await plant.getAttribute("style");
  await page.waitForTimeout(150);
  expect(await plant.getAttribute("style")).toBe(settled);
  await expect(page.locator(".journey-atmosphere")).toHaveAttribute(
    "data-atmosphere-moving",
    "false",
  );
  await position(page, earth.top - 450);
  await page.waitForTimeout(100);
  expect(await plant.getAttribute("style")).not.toBe(settled);
  await position(page, sea.top);
  await expect(page.locator('[data-atmosphere-effect="earth"]')).toHaveCSS("visibility", "hidden");
});

for (const width of [390, 1440]) {
  test(
    "Heaven replays on upward scrolling and repeated Nam Tram arrivals at " + width + "px",
    async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto("/");
      await expect(page.locator('.journey-worlds[data-atmosphere="true"]')).toHaveCount(1);
      const tops = await stations(page),
        top = tops[0]!.top;
      const heaven = page.locator('[data-atmosphere-effect="heaven"]');
      await position(page, top);
      await expect(heaven).toHaveCSS("visibility", "visible");
      await expect(heaven).toHaveCSS("visibility", "hidden", { timeout: 3000 });
      await position(page, tops[1]!.top);
      const returnToHeaven = async () => {
        await heaven.evaluate((el) => {
          const probe = { maximum: 0, completed: false };
          (window as Window & { __heavenProbe?: typeof probe }).__heavenProbe = probe;
          const observer = new MutationObserver(() => {
            const visible = getComputedStyle(el).visibility === "visible";
            if (visible) {
              probe.maximum = Math.max(
                probe.maximum,
                ...Array.from(el.querySelectorAll("img"), (img) =>
                  Number(getComputedStyle(img).opacity),
                ),
              );
            } else if (probe.maximum > 0.05) {
              probe.completed = true;
              observer.disconnect();
            }
          });
          observer.observe(el, { attributes: true, subtree: true, attributeFilter: ["style"] });
        });
        await page.locator(".nam-tram-rail button").click();
        await page.getByRole("dialog").getByRole("button", { name: "HEAVEN", exact: true }).click();
        await expect
          .poll(() =>
            page
              .locator("#heaven")
              .evaluate((el) =>
                Math.abs(
                  el.getBoundingClientRect().top -
                    parseFloat(getComputedStyle(el).scrollMarginTop || "0"),
                ),
              ),
          )
          .toBeLessThan(2);
        await expect
          .poll(
            () =>
              page.evaluate(
                () =>
                  (window as Window & { __heavenProbe?: { completed: boolean } }).__heavenProbe
                    ?.completed,
              ),
            { timeout: 6000 },
          )
          .toBe(true);
        await expect(heaven).toHaveCSS("visibility", "hidden");
      };
      await returnToHeaven();
      // The same station is already centred: no scroll event is required for replay.
      await returnToHeaven();
      await page.waitForTimeout(200);
      await expect(heaven).toHaveCSS("visibility", "hidden");
      await position(page, top + 400);
      await position(page, top + 180);
      await expect(heaven).toHaveCSS("visibility", "visible");
      await position(page, top);
      await expect(heaven).toHaveCSS("visibility", "hidden", { timeout: 2000 });
      await position(page, top - 250);
      await expect(heaven).toHaveCSS("visibility", "visible");
    },
  );
}

for (const width of [390, 1440]) {
  test(
    "Heaven is hidden on departure to Sky and reappears only on return at " + width + "px",
    async ({ page }) => {
      const height = 900;
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto("/");
      await expect(page.locator('.journey-worlds[data-atmosphere="true"]')).toHaveCount(1);
      const tops = await stations(page),
        top = tops[0]!.top;
      const heaven = page.locator('[data-atmosphere-effect="heaven"]');
      const sky = page.locator('[data-atmosphere-effect="sky"]');
      await position(page, top - height * 0.4);
      await expect(heaven).toHaveCSS("visibility", "visible");
      await position(page, top);
      await expect(heaven).toHaveCSS("visibility", "visible");
      // Depart before the time-driven arrival has finished.
      await position(page, top + 40);
      await expect(heaven).toHaveCSS("visibility", "hidden");
      await page.waitForTimeout(100);
      await expect(heaven).toHaveCSS("visibility", "hidden");
      await position(page, tops[1]!.top - height * 0.5);
      await expect(sky).toHaveCSS("visibility", "visible");
      await expect(heaven).toHaveCSS("visibility", "hidden");
      await position(page, tops[1]!.top);
      await expect(heaven).toHaveCSS("visibility", "hidden");
      // Scrolling upward announces HEAVEN, but reversing toward SKY cancels it.
      await position(page, top + 180);
      await expect(heaven).toHaveCSS("visibility", "visible");
      await position(page, top + 240);
      await expect(heaven).toHaveCSS("visibility", "hidden");
      await position(page, top + 80);
      await expect(heaven).toHaveCSS("visibility", "visible");
      await position(page, top);
      await expect(heaven).toHaveCSS("visibility", "hidden", { timeout: 3000 });
    },
  );
}

test("mobile Earth keeps its path and smoothing through height-only refreshes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator('.journey-worlds[data-atmosphere="true"]')).toHaveCount(1);
  const tops = await stations(page);
  await position(page, tops[2]!.top - 320);
  const plane = page.locator(".journey-atmosphere");
  const plant = page.locator('.atmosphere-plant[data-part="3"]');
  await expect(plane).toHaveAttribute("data-atmosphere-moving", "false");
  const step = await plant.evaluate(async (el) => {
    const y = () => new DOMMatrixReadOnly(el.style.transform).m42;
    const before = y();
    scrollTo({ top: scrollY + 80, behavior: "instant" });
    dispatchEvent(new Event("resize"));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return { before, first: y() };
  });
  await expect(plane).toHaveAttribute("data-atmosphere-moving", "false");
  const settled = await plant.evaluate((el) => new DOMMatrixReadOnly(el.style.transform).m42);
  const total = Math.abs(settled - step.before);
  expect(total).toBeGreaterThan(20);
  expect(Math.abs(step.first - step.before)).toBeLessThan(total * 0.98);
  expect(Math.abs(step.first - settled)).toBeGreaterThan(0.1);
  const pose = await plant.getAttribute("style");
  // Simulate Safari's innerHeight notification while the CSS large viewport stays fixed.
  for (const height of [740, 790, 844]) {
    await page.evaluate((value) => {
      Object.defineProperty(window, "innerHeight", { configurable: true, value });
      dispatchEvent(new Event("resize"));
    }, height);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await expect(plant).toHaveAttribute("style", pose!);
    await expect(plane).toHaveAttribute("data-atmosphere-moving", "false");
  }
  await page.evaluate(() => {
    delete (window as unknown as { innerHeight?: number }).innerHeight;
    dispatchEvent(new Event("resize"));
  });
});
