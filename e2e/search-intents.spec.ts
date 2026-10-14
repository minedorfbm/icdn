import { expect, test } from "@playwright/test";

test("natural cuisine queries work from a direct card and preserve navigation", async ({
  page,
}) => {
  await page.goto("/citron");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await search.getByRole("searchbox").fill("je voudrais un restaurant japonais");
  await expect(search.locator(".hub-search-result")).toHaveCount(1);
  await search.getByRole("button", { name: /TINGARA/ }).click();
  await expect(page).toHaveURL("/tingara");
});

test("mood buttons, combined requirements and category filters work on mobile", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".hub-search-tool button").click();
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await search
    .getByRole("region", { name: "Follow your mood" })
    .getByRole("button", { name: "Romantic", exact: true })
    .click();
  await expect(search.getByRole("searchbox")).toHaveValue("Romantic");
  await expect(search.getByRole("button", { name: /TINGARA/ })).toBeVisible();
  await search.getByRole("searchbox").fill("restaurant romantique quand il pleut");
  await expect(search.getByRole("button", { name: /TINGARA/ })).toBeVisible();
  await expect(search.getByRole("button", { name: /^Citron/ })).toHaveCount(0);
  await search
    .getByRole("navigation")
    .getByRole("button", { name: "WELLNESS", exact: true })
    .click();
  await expect(search.locator(".hub-search-result")).toHaveCount(0);
});

test("map intent search still excludes marketing offers and destination stories", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Explore the resort map/ }).click();
  await page
    .getByRole("dialog", { name: "Resort map" })
    .getByRole("button", { name: "Search", exact: true })
    .click();
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await search.getByRole("searchbox").fill("family");
  await expect(search.getByRole("button", { name: /Enchanted Holiday Escape/ })).toHaveCount(0);
  await search.getByRole("searchbox").fill("nature");
  await expect(search.getByRole("button", { name: /Nature Discovery/ })).toHaveCount(0);
  await search.getByRole("searchbox").fill("restaurant japonais");
  await expect(search.getByRole("button", { name: /TINGARA/ })).toBeVisible();
});

test("accommodation category works in global search and map search", async ({ page }) => {
  await page.goto("/");
  await page.locator(".hub-search-tool button").click();
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  const category = search
    .getByRole("navigation")
    .getByRole("button", { name: "ACCOMMODATION", exact: true });
  await category.click();
  await expect(search.getByRole("button", { name: /Resort Classic/ }).first()).toBeVisible();
  await expect(search.getByRole("button", { name: /^Citron/ })).toHaveCount(0);
  await expect(search.locator(".hub-search-categories button")).toHaveCount(4);
  await search.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: /Explore the resort map/ }).click();
  const map = page.getByRole("dialog", { name: "Resort map" });
  await map.getByRole("button", { name: "Search", exact: true }).click();
  await category.click();
  await search
    .getByRole("button", { name: /Resort Classic/ })
    .first()
    .click();
  await expect(map.locator(".atlas-preview")).toBeVisible();
  await expect(map.locator(".atlas-preview")).toContainText("Rooms & Suites");
});
