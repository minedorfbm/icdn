import { expect, test, type Locator, type Page } from "./fixtures";

async function catalogue(page: Page) {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "adj-discovery-v1",
      JSON.stringify({ order: ["citron", "tingara", "swipe-third"], currentId: "citron" }),
    ),
  );
  await page.route("**/_serverFn/**", async (route) => {
    const response = await route.fetch();
    if (!response.headers()["server-timing"]?.includes("catalogue;")) {
      await route.fulfill({ response });
      return;
    }
    const data = await response.json();
    data.destinations = data.destinations.filter(
      (destination: { id: string; level_id: string; cluster: string }) =>
        destination.level_id !== "heaven" ||
        destination.cluster !== "DINING" ||
        ["citron", "tingara"].includes(destination.id),
    );
    data.destinations.push({
      ...data.destinations[0],
      id: "swipe-third",
      name: "Third place",
      display_order: 999,
    });
    await route.fulfill({ response, json: data });
  });
}

async function gesture(
  stage: Locator,
  dx: number,
  dy = 0,
  release: "up" | "cancel" | "hold" = "up",
  elapsed = 250,
) {
  await stage.evaluate(
    async (el, args) => {
      const time = performance.now();
      const bounds = el.getBoundingClientRect();
      const x = bounds.left + bounds.width / 2,
        y = bounds.top + Math.min(100, bounds.height / 2);
      const send = (type: string, px: number, py: number, dt: number) => {
        const event = new PointerEvent(type, {
          bubbles: true,
          pointerId: 1,
          pointerType: "touch",
          isPrimary: true,
          button: 0,
          clientX: px,
          clientY: py,
        });
        Object.defineProperty(event, "timeStamp", { value: time + dt });
        el.dispatchEvent(event);
      };
      send("pointerdown", x, y, 0);
      send("pointermove", x + args.dx, y + args.dy, 150);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (args.release !== "hold")
        send(
          args.release === "cancel" ? "pointercancel" : "pointerup",
          x + args.dx,
          y + args.dy,
          args.elapsed,
        );
    },
    { dx, dy, release, elapsed },
  );
}

async function release(stage: Locator, cancelled = false) {
  await stage.evaluate(
    (el, cancel) =>
      el.dispatchEvent(
        new PointerEvent(cancel ? "pointercancel" : "pointerup", {
          bubbles: true,
          pointerId: 1,
          pointerType: "touch",
          isPrimary: true,
          button: 0,
        }),
      ),
    cancelled,
  );
}

async function envelope(stage: Locator) {
  return stage.evaluate((el) => {
    const card = el.querySelector<HTMLElement>('.perspective-card[data-card-offset="0"]')!;
    return {
      stageHeight: el.clientHeight,
      stageWidth: el.clientWidth,
      cardHeight: card.offsetHeight,
      cardWidth: card.offsetWidth,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
}

async function pose(stage: Locator) {
  return stage.evaluate((el) => {
    const card = el.querySelector<HTMLElement>('.perspective-card[data-card-offset="0"]')!;
    const matrix = new DOMMatrix(getComputedStyle(card).transform);
    const photo = card.querySelector<HTMLImageElement>("img")!;
    return {
      x: matrix.m41,
      tilt: (Math.atan2(matrix.m12, matrix.m22) * 180) / Math.PI,
      top: card.getBoundingClientRect().top - el.getBoundingClientRect().top,
      bottom: card.getBoundingClientRect().bottom - el.getBoundingClientRect().top,
      photoX: parseFloat(getComputedStyle(photo).translate),
      source: photo.currentSrc,
    };
  });
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 360, height: 740 },
  { width: 390, height: 844 },
])
  for (const layout of ["journey", "surprise"]) {
    test(`suspended ${layout} keeps its mobile envelope and gestures at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await catalogue(page);
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(layout === "journey" ? "/" : "/surprise-me");
      const stage = page.locator(
        layout === "journey" ? "#heaven .card-stack-stage" : ".discovery-stack .card-stack-stage",
      );
      await stage.scrollIntoViewIfNeeded();
      const active = stage.locator('article[aria-hidden="false"]');
      await expect(active).toContainText("Citron");
      await expect
        .poll(() =>
          active
            .locator("img")
            .evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0),
        )
        .toBe(true);
      const before = await envelope(stage),
        start = await pose(stage);
      await gesture(stage, -100, 0, "hold");
      const during = await pose(stage);
      expect(during.x - start.x).toBeCloseTo(-100, 0);
      expect(during.tilt).toBeLessThan(0);
      expect(Math.abs(during.tilt)).toBeLessThanOrEqual(6.01);
      expect(during.top).toBeGreaterThanOrEqual(-0.6);
      expect(during.bottom).toBeLessThanOrEqual(before.stageHeight + 0.6);
      expect(Math.abs(during.photoX)).toBeGreaterThan(0);
      expect(during.source).toBe(start.source);
      expect(await envelope(stage)).toEqual(before);
      await release(stage);
      await expect(active).toContainText("TINGARA");
      // Start again before the native settle is over; no extra card or wrong direction.
      await gesture(stage, -120);
      await expect(active).toContainText("Third place");
      await gesture(stage, 120);
      await expect(active).toContainText("TINGARA");
      await gesture(stage, 120);
      await expect(active).toContainText("Citron");
      await expect.poll(async () => Math.abs((await pose(stage)).tilt)).toBeLessThan(0.05);
      expect(await envelope(stage)).toEqual(before);
      await gesture(stage, -18, 0, "up", 500);
      await expect(active).toContainText("Citron");
      await gesture(stage, -100, 0, "cancel");
      await expect(active).toContainText("Citron");
      await gesture(stage, 3, -130);
      await expect(active).toContainText("Citron");
      await expect(stage).toHaveCSS("touch-action", "pan-y");
      await expect.poll(async () => Math.abs((await pose(stage)).tilt)).toBeLessThan(0.05);
      if (layout === "journey") {
        const counter = page.locator("#heaven .card-stack-pagination");
        await expect(counter).toContainText("01");
        await expect
          .poll(() =>
            counter
              .locator("[data-card-progress]")
              .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m11),
          )
          .toBeCloseTo(1 / 3, 3);
      }
      // A synthesized post-drag click is blocked; a fresh keyboard activation still opens.
      const open = active.getByRole("button", { name: "Citron", exact: true });
      await open.dispatchEvent("click", { detail: 1 });
      await expect(page.getByRole("dialog", { name: "Citron", exact: true })).toHaveCount(0);
      await open.press("Enter");
      await expect(page.getByRole("dialog", { name: "Citron", exact: true })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

test("reduced motion leaves the card still during drag and changes the selected card without settling", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await catalogue(page);
  await page.goto("/");
  const stage = page.locator("#heaven .card-stack-stage");
  await stage.scrollIntoViewIfNeeded();
  const before = await pose(stage);
  await gesture(stage, -100, 0, "hold");
  const during = await pose(stage);
  expect(during.x).toBeCloseTo(before.x, 2);
  expect(during.tilt).toBe(0);
  expect(during.photoX).toBe(0);
  await release(stage);
  await expect(stage.locator('article[aria-hidden="false"]')).toContainText("TINGARA");
  await expect(stage.locator('[data-card-offset="0"]')).toHaveCSS("transition-duration", "0s");
});

for (const layout of ["journey", "surprise"]) {
  test(`desktop ${layout} plays a visible suspended transition from its click controls`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await catalogue(page);
    await page.goto(layout === "journey" ? "/" : "/surprise-me");
    const stage = page.locator(
      layout === "journey" ? "#heaven .card-stack-stage" : ".discovery-stack .card-stack-stage",
    );
    await stage.scrollIntoViewIfNeeded();
    const active = stage.locator('article[aria-hidden="false"]');
    await expect(active).toContainText("Citron");
    const before = await envelope(stage);
    // A real mouse click in the exposed preview, outside the front card.
    const clickPreview = async (id: string) => {
      const front = await active.boundingBox();
      const next = await stage.locator(`[data-destination-id="${id}"]`).boundingBox();
      expect(front).not.toBeNull();
      expect(next).not.toBeNull();
      const x = next!.x + next!.width - 8;
      expect(x).toBeGreaterThan(front!.x + front!.width);
      await page.mouse.click(x, next!.y + next!.height / 2);
    };
    if (layout === "journey")
      await page.locator("#heaven .chapter-deck-controls button").last().click();
    else await clickPreview("tingara");
    await expect(active).toContainText("TINGARA");
    await expect(stage).toHaveAttribute("data-card-navigation", "true");
    const timeline = await stage.evaluate((el) => {
      const animations = el.getAnimations({ subtree: true });
      for (const animation of animations) {
        animation.pause();
        animation.currentTime = 325;
      }
      const card = el.querySelector<HTMLElement>('[data-destination-id="citron"]')!;
      const matrix = new DOMMatrix(getComputedStyle(card).transform);
      return {
        tilt: Math.abs((Math.atan2(matrix.m12, matrix.m22) * 180) / Math.PI),
        durations: animations.map((a) => a.effect?.getTiming().duration),
      };
    });
    expect(timeline.tilt).toBeGreaterThan(1);
    expect(timeline.durations).toContain(650);
    expect(await envelope(stage)).toEqual(before);
    await stage.evaluate((el) => {
      for (const animation of el.getAnimations({ subtree: true })) animation.finish();
    });
    await expect(stage).not.toHaveAttribute("data-card-navigation");
    await clickPreview("swipe-third");
    await expect(active).toContainText("Third place");
    if (layout === "journey") {
      await page.locator("#heaven .chapter-deck-controls button").first().click();
      await expect(active).toContainText("TINGARA");
      await page.locator("#heaven .chapter-deck-controls button").first().click();
      await expect(active).toContainText("Citron");
    }
    await expect(stage).not.toHaveAttribute("data-card-navigation", "true", { timeout: 2000 });
    expect(await envelope(stage)).toEqual(before);
    if (layout === "surprise") {
      await gesture(stage, 240);
      await expect(active).toContainText("TINGARA");
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    if (layout === "journey")
      await page.locator("#heaven .chapter-deck-controls button").last().click();
    else await clickPreview("swipe-third");
    await expect(stage).not.toHaveAttribute("data-card-navigation", "true");
  });
}

test("native vertical touch scroll cancels the card gesture without navigating", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Native touch injection is available through Chromium CDP; WebKit covers pointer cancellation and pan-y.",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const stage = page.locator("#heaven .card-stack-stage");
  await stage.scrollIntoViewIfNeeded();
  // Exercise native overflow scrolling inside a card with longer content.
  await stage.locator('article[aria-hidden="false"] .overflow-y-auto').evaluate((el) => {
    const spacer = document.createElement("div");
    spacer.style.minHeight = "1000px";
    spacer.setAttribute("aria-hidden", "true");
    el.append(spacer);
  });
  await page.evaluate(() => {
    window.addEventListener(
      "pointercancel",
      () => (document.documentElement.dataset["touchCancelled"] = "true"),
      { once: true },
    );
  });
  const snapshot = () =>
    page.evaluate(
      () =>
        scrollY +
        [...document.querySelectorAll<HTMLElement>("#heaven .overflow-y-auto")].reduce(
          (total, el) => total + el.scrollTop,
          0,
        ),
    );
  const before = await snapshot();
  const box = (await stage.boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + Math.min(box.height - 30, 300);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i = 1; i <= 8; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + i / 2, y: y - i * 18 }],
    });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator("html")).toHaveAttribute("data-touch-cancelled", "true");
  await expect.poll(snapshot).toBeGreaterThan(before + 5);
  await expect(stage.locator('article[aria-hidden="false"]')).toContainText("Citron");
});
