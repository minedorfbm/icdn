import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.route("https://www.instagram.com/embed.js", (route) => route.abort());
});

test("spot subcards show descriptions below images, open the right card and preserve return navigation", async ({
  page,
}) => {
  await page.goto("/instagram-spots");
  const guide = page.getByRole("dialog", { name: "Top 9 Instagram Spots", exact: true });
  const items = guide.locator(".destination-collection li");
  await expect(items).toHaveCount(3);
  const maison = items.last();
  await maison.scrollIntoViewIfNeeded();
  const button = maison.getByRole("button");
  const copy = maison.locator("p");
  expect((await copy.boundingBox())!.y).toBeGreaterThan(
    (await button.boundingBox())!.y + (await button.boundingBox())!.height,
  );
  await button.click();
  await expect(page.getByRole("dialog", { name: "La Maison 1888", exact: true })).toBeVisible();
  await page.goBack();
  await expect(guide).toBeVisible();
  await guide.getByRole("button", { name: "Reception Lobby", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Lobby", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/reception$/);
});

test("spot descriptions translate and the sixth Instagram post is reachable", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("adj-lang", "ja"));
  await page.goto("/instagram-spots");
  const guide = page.getByRole("dialog", { name: "Top 9 Instagram Spots", exact: true });
  await expect(guide.locator(".destination-collection")).toContainText("建築と料理の創作。");
  const pagination = guide.locator("[data-instagram-pagination]");
  await expect(pagination.getByRole("button")).toHaveCount(6);
  await pagination.getByRole("button", { name: "6 / 6", exact: true }).click();
  await expect(pagination.getByRole("button", { name: "6 / 6", exact: true })).toHaveAttribute(
    "aria-current",
    "true",
  );
  const last = guide.locator("[data-instagram-track] > div").last();
  await expect(
    last.getByRole("link", { name: "インスタグラムで見る", exact: true }),
  ).toHaveAttribute("href", "https://www.instagram.com/p/GUIDE5/");
  const box = await last.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
});
