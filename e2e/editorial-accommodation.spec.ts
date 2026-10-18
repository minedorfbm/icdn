import { test, expect } from "./fixtures";

test("Nam Tram excludes accommodation while Surprise, search and map retain it", async ({
  page,
}) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "adj-discovery-v1",
      JSON.stringify({ order: ["rooms", "club-panoramic-room-oceanview"], currentId: "rooms" }),
    ),
  );
  await page.goto("/");
  await expect(page.locator('#heaven [data-destination-id="citron"]')).toBeAttached();
  await expect(page.locator('section.level [data-destination-id="rooms"]')).toHaveCount(0);
  await expect(
    page.locator('section.level [data-destination-id="club-panoramic-room-oceanview"]'),
  ).toHaveCount(0);
  await page.locator("#heaven").getByRole("button", { name: "ALL PLACES", exact: true }).click();
  const index = page.getByRole("dialog", { name: "ALL PLACES", exact: true });
  await expect(index.getByRole("button", { name: /Room Oceanview/ })).toHaveCount(0);
  await index.getByRole("button", { name: "Close", exact: true }).click();
  await page.locator(".discovery-surprise").click();
  const surprise = page.getByRole("dialog", { name: "Surprise me", exact: true });
  await expect(surprise.locator('[data-destination-id="rooms"]')).toBeVisible();
  await surprise.getByRole("button", { name: "Search", exact: true }).click();
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await search.getByRole("searchbox").fill("Resort Classic");
  await search.getByRole("button", { name: /Resort Classic Room Oceanview/ }).click();
  await expect(page).toHaveURL("/rooms");
  await page.getByRole("button", { name: "View on map", exact: true }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Resort map" })
      .getByRole("heading", { name: "Rooms & Suites", exact: true }),
  ).toBeVisible();
});
