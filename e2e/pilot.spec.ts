import { expect, test, type Locator } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://www.instagram.com/embed.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.instgrm = { Embeds: { process() {
      document.querySelectorAll('.instagram-media').forEach(post => {
        const frame = document.createElement('iframe');
        frame.title = 'Instagram test post';
        frame.style.cssText = 'display:block;width:100%;border:0;height:320px';
        frame.srcdoc = '<p>Instagram post</p>';
        post.replaceWith(frame);
      });
    } } };`,
    }),
  );
});

for (const [id, level, color] of [
  ["pilot-citron", "heaven", "rgb(250, 248, 241)"],
  ["la-maison-1888", "sky", "oklch(0.235 0.065 244)"],
  ["long-bar", "earth", "rgb(25, 78, 71)"],
  ["mi-sol-spa", "sea", "rgb(200, 230, 239)"],
] as const) {
  test(`${level} card keeps its palette, compact collection and floating tools at mobile widths`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/${id}`);
    const card = page.locator(`.editorial-detail[data-level="${level}"]`);
    await expect(card).toBeVisible();
    await expect(card).toHaveCSS("background-color", color);
    await expect(
      card.getByRole("link", { name: "Reserve your experience", exact: true }),
    ).toHaveCount(1);
    await expect(card.locator(".editorial-links > a")).toHaveCount(4);
    await expect(card.getByRole("region", { name: "OPENING HOURS", exact: true })).toContainText(
      "10:00 – 22:00",
    );
    await expect(card).not.toContainText("Local time");
    await expect(card.locator(".editorial-meta svg")).toHaveCount(1);
    await expect(card.locator(".editorial-title + .editorial-description")).toHaveCount(1);
    await expect(card.locator(".editorial-description")).toHaveCSS("font-size", "16px");
    await expect(card.locator(".instagram-post[data-fit-to-screen]")).toHaveCount(2);
    const scroller = card.locator("[data-destination-scroll]");
    for (const size of [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
    ]) {
      await page.setViewportSize(size);
      await scroller.evaluate((el) => el.scrollTo(0, 0));
      await expect
        .poll(() => scroller.evaluate((el) => el.scrollWidth - el.clientWidth))
        .toBeLessThanOrEqual(1);
      const search = card.getByRole("button", { name: "Search", exact: true });
      const phone = card.getByRole("button", { name: "Contact", exact: true });
      const before = await search.boundingBox();
      await scroller.evaluate((el) => el.scrollTo(0, el.scrollHeight));
      await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
      expect(Math.abs((await search.boundingBox())!.y - before!.y)).toBeLessThan(1);
      const phoneBox = (await phone.boundingBox())!;
      expect(phoneBox.y + phoneBox.height).toBeLessThanOrEqual(size.height);
      expect(phoneBox.y).toBeGreaterThan(0);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await scroller.evaluate((el) => el.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath(`${level}-hero.png`) });
    await card.locator(".editorial-links").scrollIntoViewIfNeeded();
    const links = card.locator(".editorial-links > a");
    const boxes = await Promise.all([0, 1, 2, 3].map((i) => links.nth(i).boundingBox()));
    expect(boxes[0]!.y).toBe(boxes[1]!.y);
    expect(boxes[2]!.y).toBe(boxes[3]!.y);
    expect(boxes[2]!.y).toBeGreaterThan(boxes[0]!.y);
    await page.screenshot({ path: testInfo.outputPath(`${level}-collection.png`) });
    await card.getByRole("button", { name: "Contact", exact: true }).click();
    const contact = page.getByRole("dialog", { name: "Contact", exact: true });
    await expect(contact.getByRole("link", { name: "WhatsApp", exact: true })).toBeVisible();
    await contact.getByRole("button", { name: "Close", exact: true }).click();
    await card.getByRole("button", { name: "Search", exact: true }).click();
    await expect(
      page.getByRole("dialog", { name: "Search", exact: true }).getByRole("searchbox"),
    ).toBeVisible();
  });
}

test("events retain their schedule, unfold on demand and precede both media sections", async ({
  page,
}) => {
  await page.goto("/pilot-citron");
  const card = page.locator(".editorial-detail");
  const event = card.locator("details");
  await expect(event.locator("summary")).toContainText("12:30 – 15:30");
  await expect(event.locator(".editorial-event-content")).toBeHidden();
  await event.locator("summary").click();
  await expect(event.locator(".editorial-event-content")).toBeVisible();
  await expect(card.getByRole("region", { name: "IN MOTION", exact: true })).toHaveCount(1);
  await expect(card.getByRole("region", { name: "FROM OUR WORLD", exact: true })).toHaveCount(1);
  await expect(card.locator("iframe[src*='youtube']")).toHaveCount(0);
  const track = card.locator("[data-instagram-track]");
  await track.scrollIntoViewIfNeeded();
  await expect(card.locator('iframe[title="Instagram test post"]').first()).toBeVisible();
  const frame = (await card.locator('iframe[title="Instagram test post"]').first().boundingBox())!;
  await expect
    .poll(async () => Math.ceil((await track.boundingBox())!.height))
    .toBe(Math.ceil(frame.height));
  const dots = (await card.locator("[data-instagram-pagination]").boundingBox())!;
  const post = (await track.boundingBox())!;
  expect(dots.y - post.y - post.height).toBeLessThanOrEqual(10);
});

test("related cards navigate using catalogue data and continue opens the next destination", async ({
  page,
}) => {
  await page.goto("/la-maison-1888");
  await page
    .locator(".destination-related")
    .getByRole("button", { name: "Wine Cellar", exact: true })
    .click();
  await expect(page).toHaveURL("/wine-cellar");
  await expect(page.getByRole("dialog", { name: "Wine Cellar", exact: true })).toBeVisible();
  await page
    .locator(".destination-related")
    .getByRole("button", { name: "La Maison 1888", exact: true })
    .click();
  await expect(page).toHaveURL("/la-maison-1888");
  await expect(page.locator(".editorial-title")).toHaveText("La Maison 1888");
  await page.locator("[data-next-destination]").click();
  await expect(page).toHaveURL("/wine-cellar");
});

test("new shared labels and source-matched editorial headings translate together", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".hub-tools button").last().click();
  await page.getByRole("button", { name: /日本語/ }).click();
  await page.goto("/mi-sol-spa");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator(".editorial-section-heading")).toContainText(["特別なひとときを。"]);
  await expect(page.locator(".destination-journey")).not.toContainText("CONTINUE THE JOURNEY");
  await page.locator("[data-next-destination]").click();
  await expect(page.locator("[data-previous-destination]")).toContainText("前に見たスポット");
});

test("all added relationships display once and open in both directions", async ({ page }) => {
  for (const [source, sourceName, target, targetName] of [
    ["la-maison-1888", "La Maison 1888", "buffalo-bar", "Buffalo Bar"],
    ["long-bar", "L_O_N_G Bar", "long-pool", "L_O_N_G Pool"],
    ["mi-sol-spa", "Mi Sol Spa & Wellness", "spa-lagoon-villas", "One-Bedroom Spa Lagoon Villa"],
  ]) {
    await page.goto(`/${source}`);
    const related = page.locator(".destination-related");
    await expect(related.getByRole("button", { name: targetName, exact: true })).toHaveCount(1);
    await related.getByRole("button", { name: targetName, exact: true }).click();
    await expect(page).toHaveURL(`/${target}`);
    await expect(related.getByRole("button", { name: sourceName, exact: true })).toHaveCount(1);
    await related.getByRole("button", { name: sourceName, exact: true }).click();
    await expect(page).toHaveURL(`/${source}`);
  }
});

async function swipe(
  target: Locator,
  from: [number, number],
  to: [number, number],
  cancel = false,
) {
  return target.evaluate(
    (node, input) => {
      // WebKit exposes Touch without a public constructor. Supply the event's touch lists.
      const touch = (point: [number, number]) => ({
        identifier: 1,
        target: node,
        clientX: point[0],
        clientY: point[1],
      });
      const dispatch = (type: string, point: [number, number], ended = false) => {
        const changed = touch(point);
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperties(event, {
          touches: { value: ended ? [] : [changed] },
          targetTouches: { value: ended ? [] : [changed] },
          changedTouches: { value: [changed] },
        });
        // Observe the card handler before the dialog's document-level scroll lock.
        const scroller = node.closest("[data-destination-scroll]")!;
        let prevented = false;
        const observe = () => {
          prevented = event.defaultPrevented;
        };
        scroller.addEventListener(type, observe);
        node.dispatchEvent(event);
        scroller.removeEventListener(type, observe);
        return prevented;
      };
      dispatch("touchstart", input.from);
      const prevented = dispatch("touchmove", input.to);
      dispatch(input.cancel ? "touchcancel" : "touchend", input.to, true);
      return prevented;
    },
    { from, to, cancel },
  );
}

test("horizontal swipes navigate forward and back across current and legacy catalogue rows", async ({
  page,
}) => {
  await page.goto("/la-maison-1888");
  const hero = page.locator(".editorial-hero img");
  await expect(hero).toBeVisible();
  expect(await swipe(hero, [290, 280], [80, 283])).toBe(true);
  await expect(page).toHaveURL("/wine-cellar");
  const nextHero = page.locator("[data-destination-scroll] img").first();
  await expect(nextHero).toBeVisible();
  await swipe(nextHero, [80, 280], [290, 283]);
  await expect(page).toHaveURL("/la-maison-1888");
  await expect(page.locator("[data-destination-scroll]")).toHaveJSProperty("scrollTop", 0);
});

test("previous discovery follows visited relationships and is absent on the first card", async ({
  page,
}) => {
  await page.goto("/la-maison-1888");
  await expect(page.locator(".editorial-hero img")).toBeVisible();
  await expect(page.locator("[data-previous-destination]")).toHaveCount(0);
  await swipe(page.locator(".editorial-hero img"), [80, 280], [290, 283]);
  await expect(page).toHaveURL("/la-maison-1888");

  // Selecting the current place from search must not create a visit to itself.
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await search.getByRole("searchbox").fill("La Maison");
  await search.locator(".hub-search-results button").filter({ hasText: "La Maison 1888" }).click();
  await expect(search).toHaveCount(0);
  await expect(page.locator("[data-previous-destination]")).toHaveCount(0);

  await page
    .locator(".destination-related")
    .getByRole("button", { name: "Buffalo Bar", exact: true })
    .click();
  await expect(page).toHaveURL("/buffalo-bar");
  await expect(page.locator("[data-previous-destination]")).toContainText("La Maison 1888");
  await page
    .locator(".destination-related")
    .getByRole("button", { name: "La Maison 1888", exact: true })
    .click();
  await expect(page).toHaveURL("/la-maison-1888");
  await expect(page.locator("[data-previous-destination]")).toContainText("Buffalo Bar");

  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator(".destination-journey").scrollIntoViewIfNeeded();
    const buttons = await page.locator(".destination-journey button").all();
    const [previous, next] = await Promise.all(buttons.map((button) => button.boundingBox()));
    expect(previous!.x).toBeGreaterThanOrEqual(0);
    expect(previous!.x + previous!.width).toBeLessThan(next!.x);
    expect(next!.x + next!.width).toBeLessThanOrEqual(width);
    await expect
      .poll(() =>
        page.locator("[data-destination-scroll]").evaluate((el) => el.scrollWidth - el.clientWidth),
      )
      .toBeLessThanOrEqual(1);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-destination-scroll]").evaluate((el) => el.scrollTo(0, 0));
  await swipe(page.locator(".editorial-hero img"), [80, 280], [290, 283]);
  await expect(page).toHaveURL("/buffalo-bar");
  await page.locator("[data-previous-destination]").click();
  await expect(page).toHaveURL("/la-maison-1888");
  await expect(page.locator("[data-previous-destination]")).toHaveCount(0);

  // Starting from a direct URL must never use browser Back to leave the hub.
  await page.locator("[data-next-destination]").click();
  await expect(page).toHaveURL("/wine-cellar");
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.locator(".threshold-img")).toBeVisible();
});

test("top Back skips the card trail and restores the home's selected card and scroll", async ({
  page,
}) => {
  await page.goto("/");
  const stage = page.locator("#heaven .touch-pan-y").first();
  await stage.scrollIntoViewIfNeeded();
  for (const [type, x] of [
    ["pointerdown", 300],
    ["pointermove", 50],
    ["pointerup", 50],
  ] as const) {
    await stage.dispatchEvent(type, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      button: 0,
      clientX: x,
      clientY: 200,
    });
  }
  const active = stage.locator('article[aria-hidden="false"]');
  await expect(active).toContainText("TINGARA");
  const openCard = active.getByRole("button", { name: "TINGARA", exact: true });
  await openCard.scrollIntoViewIfNeeded();
  const homeScroll = await page.evaluate(() => window.scrollY);
  expect(homeScroll).toBeGreaterThan(100);
  await openCard.press("Enter");
  await expect(page).toHaveURL("/tingara");
  await expect(page.locator("[data-previous-destination]")).toHaveCount(0);
  await page.locator("[data-next-destination]").click();
  await expect(page).not.toHaveURL("/tingara");
  const secondUrl = page.url();
  await page.locator("[data-next-destination]").click();
  await expect(page).not.toHaveURL(secondUrl);
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(active).toContainText("TINGARA");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(homeScroll, 0);
  // Starting another journey has no stale previous-card control.
  await openCard.press("Enter");
  await expect(page).toHaveURL("/tingara");
  await expect(page.locator("[data-previous-destination]")).toHaveCount(0);
});

test("vertical gestures, screen edges, controls, Instagram and cancelled swipes keep the current card", async ({
  page,
}) => {
  await page.goto("/mi-sol-spa");
  const hero = page.locator(".editorial-hero img");
  await expect(hero).toBeVisible();
  expect(await swipe(hero, [200, 400], [205, 170])).toBe(false);
  expect(await swipe(hero, [5, 280], [290, 283])).toBe(false);
  expect(await swipe(hero, [290, 280], [240, 281])).toBe(true);
  await swipe(hero, [290, 280], [80, 283], true);
  expect(await swipe(page.locator(".editorial-primary"), [290, 280], [80, 283])).toBe(false);
  const track = page.locator("[data-instagram-track]");
  await expect(track).toBeAttached();
  expect(await swipe(track, [290, 280], [80, 283])).toBe(false);
  await expect(page).toHaveURL("/mi-sol-spa");
});
