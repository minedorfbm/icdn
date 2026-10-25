import { expect, test } from "./fixtures";

test("a clicked card starts its unseen detail photo while fresh card data are still pending", async ({
  page,
  request,
}) => {
  const hero = "/intercontinental-touch-icon.png?card-detail-only=citron";
  const catalogue = await (
    await request.get("http://127.0.0.1:54329/rest/v1/rpc/published_hub_catalogue_v1")
  ).json();
  const cardSnapshot = await (
    await request.get(
      "http://127.0.0.1:54329/rest/v1/rpc/published_hub_destination_card_v1?requested_destination_id=citron",
    )
  ).json();
  for (const destination of catalogue.destinations)
    destination.detail_image_key = `/intercontinental-touch-icon.png?card-detail-only=${destination.id}`;
  cardSnapshot.destination.detail_image_key = hero;
  let block = false;
  let published = true;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_serverFn/**", async (route) => {
    if (block) await gate;
    const response = await route.fetch();
    const timing = response.headers()["server-timing"] ?? "";
    if (timing.includes("catalogue;") || timing.includes("card;")) {
      const result = timing.includes("catalogue;") ? catalogue : cardSnapshot;
      // Ordinary server-function JSON, as used by the hours publication regression.
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          result: timing.includes("card;") && !published ? null : result,
          context: {},
        }),
      });
    } else await route.fulfill({ response });
  });
  const start = new Date("2026-10-25T12:00:00Z");
  await page.clock.setFixedTime(start);
  await page.goto("/");
  const card = page.locator("#heaven").getByRole("button", { name: "Citron", exact: true });
  await expect(card).toBeVisible();
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("card-detail-only=")) requests.push(request.url());
  });
  await page.clock.setFixedTime(new Date(start.getTime() + 31_000));
  block = true;
  await card.click();
  try {
    await expect(page.getByRole("status")).toHaveText("Loading…");
    await expect.poll(() => requests.length, { timeout: 1500 }).toBe(1);
    await expect(page.locator(".editorial-detail")).toHaveCount(0);
  } finally {
    release();
  }
  await expect(page.locator(".editorial-title")).toHaveText("Citron");
  await expect(page.locator(".editorial-hero img")).toHaveJSProperty("complete", true);
  expect(
    await page
      .locator(".editorial-hero img")
      .evaluate((image: HTMLImageElement) => image.currentSrc),
  ).toContain(hero);
  expect(requests).toHaveLength(1);
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(card).toBeVisible();
  const updatedHero = hero + "&updated=1";
  cardSnapshot.destination.detail_image_key = updatedHero;
  await page.clock.setFixedTime(new Date(start.getTime() + 62_000));
  await card.click();
  await expect(page.locator(".editorial-title")).toHaveText("Citron");
  await expect
    .poll(() =>
      page.locator(".editorial-hero img").evaluate((image: HTMLImageElement) => image.currentSrc),
    )
    .toContain(updatedHero);
  expect(requests).toHaveLength(2);
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(card).toBeVisible();
  published = false;
  await page.clock.setFixedTime(new Date(start.getTime() + 93_000));
  await card.click();
  // Warming a known image must not make a removed card survive fresh publication checks.
  await expect(page.getByRole("heading", { name: "404", exact: true })).toBeVisible();
  await expect(page.locator(".editorial-detail")).toHaveCount(0);
});
