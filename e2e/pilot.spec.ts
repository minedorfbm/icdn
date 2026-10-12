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
  ["la-maison-1888", "sky", "rgb(23, 57, 75)"],
  ["long-bar", "earth", "rgb(25, 78, 71)"],
  ["mi-sol-spa", "sea", "rgb(200, 230, 239)"],
] as const) {
  test(`${level} pilot keeps its palette, compact collection and floating tools at mobile widths`, async ({
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
    await expect(card.locator(".editorial-description")).toHaveCSS(
      "font-size",
      id === "la-maison-1888" ? "16px" : "19px",
    );
    await expect(card.locator(".instagram-post[data-fit-to-screen]")).toHaveCount(
      id === "la-maison-1888" ? 2 : 0,
    );
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
  await page.locator(".editorial-continue button").click();
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
  await expect(page.locator(".editorial-continue")).not.toContainText("CONTINUE THE JOURNEY");
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

test("horizontal swipes navigate forward and back across editorial and classic cards", async ({
  page,
}) => {
  await page.goto("/la-maison-1888");
  const hero = page.locator(".editorial-hero img");
  await expect(hero).toBeVisible();
  expect(await swipe(hero, [290, 280], [80, 283])).toBe(true);
  await expect(page).toHaveURL("/wine-cellar");
  const classicHero = page.locator("[data-destination-scroll] img").first();
  await expect(classicHero).toBeVisible();
  await swipe(classicHero, [80, 280], [290, 283]);
  await expect(page).toHaveURL("/la-maison-1888");
  await expect(page.locator("[data-destination-scroll]")).toHaveJSProperty("scrollTop", 0);
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
