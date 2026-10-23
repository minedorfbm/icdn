import { expect, test } from "./fixtures";

const formats = [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1194, height: 834 },
  { width: 1024, height: 768 },
  { width: 834, height: 1194 },
  { width: 768, height: 1024 },
];

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("https://www.instagram.com/embed.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.instgrm = { Embeds: { process() {
        document.querySelectorAll('.instagram-media').forEach(post => {
          const frame = document.createElement('iframe');
          frame.title = 'Instagram test post';
          frame.style.cssText = 'display:block;width:100%;border:0;height:500px';
          frame.srcdoc = '<p>Instagram post</p>';
          post.replaceWith(frame);
        });
      } } };`,
    }),
  );
});

test("desktop uses facing columns and both tablet orientations use the portrait composition", async ({
  page,
}, testInfo) => {
  await page.goto("/pilot-citron");
  const card = page.locator(".editorial-detail");
  const scroller = card.locator("[data-destination-scroll]");
  await expect(card.locator(".opening-hours")).toBeVisible();
  for (const format of formats) {
    await page.setViewportSize(format);
    await scroller.evaluate((node) => node.scrollTo(0, 0));
    const photo = (await card.locator(".editorial-hero").boundingBox())!;
    const intro = (await card.locator(".editorial-intro").boundingBox())!;
    const collection = (await card.locator(".editorial-collection").boundingBox())!;
    expect(photo.y).toBeGreaterThanOrEqual(88);
    if (format.width >= 1200) {
      expect(photo.x + photo.width).toBeLessThan(intro.x);
      expect(intro.y).toBeLessThan(photo.y + photo.height);
      expect(collection.y).toBeGreaterThanOrEqual(
        Math.max(photo.y + photo.height, intro.y + intro.height),
      );
    } else {
      expect(intro.y).toBeGreaterThan(photo.y + photo.height);
      expect(intro.x).toBe(photo.x);
      expect(intro.width).toBe(photo.width);
    }
    await expect(card.locator(".editorial-description")).toHaveCSS("font-size", "18px");
    await expect(card.getByRole("button", { name: "BACK", exact: true })).toBeVisible();
    await expect
      .poll(() => scroller.evaluate((node) => node.scrollWidth - node.clientWidth))
      .toBeLessThanOrEqual(1);
    const search = card.getByRole("button", { name: "Search", exact: true });
    const before = (await search.boundingBox())!;
    await scroller.evaluate((node) => node.scrollTo(0, node.scrollHeight));
    expect((await search.boundingBox())!.y).toBe(before.y);
    const back = (await card.getByRole("button", { name: "BACK", exact: true }).boundingBox())!;
    expect(back.y).toBeGreaterThanOrEqual(0);
    expect(back.y + back.height).toBeLessThan(88);
    await scroller.evaluate((node) => node.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath(`detail-${format.width}.png`) });
  }
});

test("the large photo picker switches images without changing the approved mobile hero", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/reception");
  const hero = page.locator(".editorial-hero img");
  await expect(hero).toBeVisible();
  const initialSource = await hero.getAttribute("src");
  const firstPhoto = await hero.evaluate((image: HTMLImageElement) => image.currentSrc);
  await page.getByRole("button", { name: "Photo 2", exact: true }).click();
  await expect(page.getByRole("button", { name: "Photo 2", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect
    .poll(() => hero.evaluate((image: HTMLImageElement) => image.currentSrc))
    .not.toBe(firstPhoto);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".editorial-photo-picker")).toBeHidden();
  await expect
    .poll(() => hero.evaluate((image: HTMLImageElement) => image.currentSrc))
    .toContain(initialSource!);
  await expect(page.locator(".editorial-description")).toHaveCSS("font-size", "16px");
  await expect(page.getByRole("button", { name: "BACK", exact: true })).toBeVisible();
});

test("video and Instagram share a row without distorting videos or covering the post controls", async ({
  page,
}) => {
  for (const id of ["pilot-citron", "pilot-sky"]) {
    await page.goto(`/${id}`);
    for (const format of [formats[0]!, formats[5]!]) {
      await page.setViewportSize(format);
      const media = page.locator(".editorial-media-row");
      await media.scrollIntoViewIfNeeded();
      const motion = page.getByRole("region", { name: "IN MOTION", exact: true });
      const instagram = page.getByRole("region", { name: "FROM OUR WORLD", exact: true });
      const videoBox = (await motion.boundingBox())!;
      const instaBox = (await instagram.boundingBox())!;
      expect(instaBox.x).toBeGreaterThan(videoBox.x + videoBox.width);
      expect(instaBox.y).toBe(videoBox.y);
      const player = motion.locator("[data-youtube-player]");
      const playerBox = (await player.boundingBox())!;
      expect(playerBox.width / playerBox.height).toBeCloseTo(
        id === "pilot-sky" ? 9 / 16 : 16 / 9,
        2,
      );
      await expect(player.locator("iframe")).toHaveAttribute("src", /autoplay=0&playsinline=1/);
      await expect(instagram.locator('iframe[title="Instagram test post"]').first()).toBeVisible();
      const track = instagram.locator("[data-instagram-track]");
      const pagination = instagram.locator("[data-instagram-pagination]");
      const trackBox = (await track.boundingBox())!;
      const dotsBox = (await pagination.boundingBox())!;
      expect(dotsBox.y).toBeGreaterThanOrEqual(trackBox.y + trackBox.height);
      expect(dotsBox.x + dotsBox.width).toBeLessThanOrEqual(format.width);
      await expect
        .poll(() =>
          page
            .locator("[data-destination-scroll]")
            .evaluate((node) => node.scrollWidth - node.clientWidth),
        )
        .toBeLessThanOrEqual(1);
    }
  }
});
