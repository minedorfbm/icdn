import { expect, test, type Page } from "./fixtures";

async function catalogueWithDistinctPhotos(
  page: Page,
  catalogue: {
    levels: { id: string; image_key: string }[];
    destinations: Record<string, unknown>[];
  },
) {
  const seed = catalogue.destinations[0];
  catalogue.destinations = [];
  for (const level of catalogue.levels) {
    level.image_key = `/priority-images/${level.id}-background.png`;
    // Discovery uses a separate thumbnail, so it cannot warm the tested card photos.
    catalogue.destinations.push({
      ...seed,
      id: `preview-${level.id}`,
      level_id: level.id,
      type: "accommodation",
      image_key: "/intercontinental-touch-icon.png",
    });
    for (let index = 0; index < 6; index++) {
      catalogue.destinations.push({
        ...seed,
        id: `${level.id}-${index}`,
        name: `${level.id} ${index}`,
        level_id: level.id,
        cluster: "DINING",
        display_order: index,
        image_key: `/priority-images/${level.id}-${index}.png`,
      });
    }
    catalogue.destinations.push({
      ...seed,
      id: `${level.id}-wellness`,
      name: `${level.id} wellness`,
      level_id: level.id,
      cluster: "WELLNESS",
      image_key: `/priority-images/${level.id}-wellness.png`,
    });
  }
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
}

for (const width of [390, 1440]) {
  test(`visible photos precede hidden cards and unselected categories at ${width}px`, async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const catalogue = await (
      await request.get("http://127.0.0.1:54329/rest/v1/rpc/published_hub_catalogue_v1")
    ).json();
    await catalogueWithDistinctPhotos(page, catalogue);
    const calls: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/priority-images/**", async (route) => {
      const name = new URL(route.request().url()).pathname.split("/").at(-1)!;
      calls.push(name);
      if (name === "heaven-0.png") await gate;
      await route.fulfill({
        path: "public/intercontinental-touch-icon.png",
        contentType: "image/png",
      });
    });
    await page.goto("/");
    await expect(page.locator("#heaven")).toHaveCount(1);
    expect(calls).toEqual([]);
    await page.getByRole("button", { name: "The journey From Heaven to Sea", exact: true }).click();
    try {
      await expect.poll(() => calls.includes("heaven-0.png")).toBe(true);
      // Neighbours still become available when the active photo stalls.
      await expect.poll(() => calls.includes("heaven-2.png")).toBe(true);
      expect(calls.indexOf("heaven-0.png")).toBeLessThan(calls.indexOf("heaven-1.png"));
      expect(calls).not.toContain("heaven-3.png");
      expect(calls).not.toContain("heaven-wellness.png");
      expect(calls.filter((name) => /^(earth|sea)-/.test(name))).toEqual([]);
      await expect(page.locator("#heaven .journey-backdrop")).toHaveAttribute(
        "fetchpriority",
        "low",
      );
      await expect(page.locator('[data-destination-id="heaven-1"] img')).toHaveAttribute(
        "fetchpriority",
        "low",
      );
    } finally {
      release();
    }
    const next = page.locator("#heaven").getByRole("button", { name: /CONTINUE THE JOURNEY/ });
    // Desktop controls are visually hidden on mobile; tap the visible next card instead.
    if (width > 1000) await next.click();
    else {
      const stage = page.locator("#heaven .card-stack-stage");
      for (const [event, x] of [
        ["pointerdown", 300],
        ["pointermove", 50],
        ["pointerup", 50],
      ] as const)
        await stage.dispatchEvent(event, {
          pointerId: 1,
          pointerType: "touch",
          isPrimary: true,
          button: 0,
          clientX: x,
          clientY: 200,
        });
    }
    await expect(page.locator('#heaven article[aria-hidden="false"]')).toContainText("heaven 1");
    await expect.poll(() => calls.includes("heaven-3.png")).toBe(true);
    expect(calls).not.toContain("heaven-4.png");
    await page.locator("#heaven").getByRole("button", { name: "WELLNESS", exact: true }).click();
    await expect.poll(() => calls.includes("heaven-wellness.png")).toBe(true);
    await expect(page.locator('[data-destination-id="heaven-wellness"] img')).toHaveAttribute(
      "fetchpriority",
      "high",
    );
  });

  test(`a direct SEA jump does not warm the crossed levels at ${width}px`, async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const catalogue = await (
      await request.get("http://127.0.0.1:54329/rest/v1/rpc/published_hub_catalogue_v1")
    ).json();
    await catalogueWithDistinctPhotos(page, catalogue);
    const calls: string[] = [];
    await page.route("**/priority-images/**", async (route) => {
      calls.push(new URL(route.request().url()).pathname.split("/").at(-1)!);
      await route.fulfill({
        path: "public/intercontinental-touch-icon.png",
        contentType: "image/png",
      });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "The journey From Heaven to Sea", exact: true }).click();
    const rail = page.getByRole("button", { name: /Nam Tram — resort levels · HEAVEN/ });
    await expect(rail).toBeVisible();
    await expect.poll(() => calls.includes("heaven-2.png")).toBe(true);
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
    await rail.click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "SEA", exact: true })
      .click({ trial: true });
    const beforeJump = new Set(calls);
    await page.getByRole("dialog").getByRole("button", { name: "SEA", exact: true }).click();
    await expect.poll(() => calls.includes("sea-0.png")).toBe(true);
    await expect
      .poll(() => page.locator("#sea").evaluate((el) => Math.abs(el.getBoundingClientRect().top)))
      .toBeLessThan(150);
    expect(calls.filter((name) => /^(sky|earth)-/.test(name) && !beforeJump.has(name))).toEqual([]);
    // Ordinary scrolling becomes eligible again once the jump finishes.
    await page.locator("#earth").scrollIntoViewIfNeeded();
    await expect.poll(() => calls.includes("earth-0.png")).toBe(true);
  });
}
