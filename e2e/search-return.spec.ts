import { expect, test } from "./fixtures";

test("Back and browser history restore the query, category, result order and scroll", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.locator(".hub-search-tool button").click();
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await search.getByRole("searchbox").fill("dining");
  const dining = search
    .getByRole("navigation")
    .getByRole("button", { name: "DINING", exact: true });
  await dining.click();
  const names = await search.locator(".hub-search-name").allTextContents();
  expect(names.length).toBeGreaterThan(4);
  const result = search.locator(".hub-search-result").last();
  const selectedName = await result.locator(".hub-search-name").innerText();
  await result.scrollIntoViewIfNeeded();
  const scrollTop = await search.locator(".hub-search-results").evaluate((el) => el.scrollTop);
  expect(scrollTop).toBeGreaterThan(100);
  await result.click();
  await expect(search).toHaveCount(0);
  await expect(page.locator(".editorial-title")).toHaveText(selectedName);
  const resultUrl = page.url();
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(search.getByRole("searchbox")).toHaveValue("dining");
  await expect(dining).toHaveAttribute("aria-pressed", "true");
  await expect(search.locator(".hub-search-name")).toHaveText(names);
  await expect(result).toBeFocused();
  await expect
    .poll(() => search.locator(".hub-search-results").evaluate((el) => el.scrollTop))
    .toBeCloseTo(scrollTop, 0);
  await page.screenshot({ path: testInfo.outputPath("restored-search.png") });
  await page.goForward();
  await expect(page).toHaveURL(resultUrl);
  await expect(search).toHaveCount(0);
  await expect(page.locator(".editorial-title")).toHaveText(selectedName);
  await page.goBack();
  await expect(search.getByRole("searchbox")).toHaveValue("dining");
  await expect(dining).toHaveAttribute("aria-pressed", "true");
  // Dismissing restored results leaves the home usable and clears their return context.
  await search.getByRole("button", { name: "Close", exact: true }).click();
  await page.locator("#heaven").getByRole("button", { name: "Citron", exact: true }).click();
  await expect(page.locator(".editorial-title")).toHaveText("Citron");
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("search from a direct card survives a related-card trail and closes back to its source", async ({
  page,
}) => {
  await page.goto("/citron");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await search.getByRole("searchbox").fill("La Maison");
  await search.getByRole("button", { name: /^La Maison 1888/ }).click();
  await expect(page.locator(".editorial-title")).toHaveText("La Maison 1888");
  await expect(page.locator("[data-previous-destination]")).toHaveCount(0);
  await page
    .locator(".destination-related")
    .getByRole("button", { name: "Wine Cellar", exact: true })
    .click();
  await expect(page.locator(".editorial-title")).toHaveText("Wine Cellar");
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(page).toHaveURL("/citron");
  await expect(search.getByRole("searchbox")).toHaveValue("La Maison");
  await search.getByRole("button", { name: "Close", exact: true }).click();
  await expect(search).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "Citron", exact: true })).toBeVisible();
});

test("a second search has its own results without losing the first search", async ({ page }) => {
  await page.goto("/");
  await page.locator(".hub-search-tool button").click();
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await search.getByRole("searchbox").fill("Citron");
  await search.getByRole("button", { name: /^Citron/ }).click();
  const card = page.getByRole("dialog", { name: "Citron", exact: true });
  await card.getByRole("button", { name: "Search", exact: true }).click();
  await search.getByRole("searchbox").fill("japanese");
  await search.getByRole("button", { name: /TINGARA/ }).click();
  await expect(page.locator(".editorial-title")).toHaveText("TINGARA");
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(search.getByRole("searchbox")).toHaveValue("japanese");
  await search.getByRole("button", { name: "Close", exact: true }).click();
  await card.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(search.getByRole("searchbox")).toHaveValue("Citron");
});

test("viewing a search result on the resort map keeps the map accessible", async ({ page }) => {
  await page.goto("/");
  await page.locator(".hub-search-tool button").click();
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await search.getByRole("searchbox").fill("Citron");
  await search.getByRole("button", { name: /^Citron/ }).click();
  await page.getByRole("button", { name: /View on map/i }).click();
  const map = page.getByRole("dialog", { name: "Resort map", exact: true });
  await expect(map).toBeVisible();
  await expect(search).toHaveCount(0);
  await expect(map.locator(".atlas-preview")).toContainText("Citron");
  await map
    .locator(".atlas-header")
    .getByRole("button", { name: "Close map", exact: true })
    .click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("results remain visible while the destination screen loads", async ({ page }) => {
  let release!: () => void;
  let started!: () => void;
  const loading = new Promise<void>((resolve) => {
    started = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\/assets\/_hub\.[_$]destinationId[^/]*\.js/, async (route) => {
    started();
    await gate;
    await route.continue();
  });
  await page.goto("/");
  await page.locator(".hub-search-tool button").click();
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await search.getByRole("searchbox").fill("Citron");
  await search.getByRole("button", { name: /^Citron/ }).click();
  try {
    await loading;
    await expect(search).toBeVisible();
    // Cross the router pending-screen threshold while the route remains blocked.
    await page.waitForTimeout(1200);
    await expect(search).toBeVisible();
    await expect(search.getByRole("searchbox")).toHaveValue("Citron");
  } finally {
    release();
  }
  await expect(page.getByRole("dialog", { name: "Citron", exact: true })).toBeVisible();
  await expect(search).toHaveCount(0);
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(search.getByRole("searchbox")).toHaveValue("Citron");
});

test("a refreshed card restores saved search scroll after the complete catalogue arrives", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".hub-search-tool button").click();
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await search.getByRole("searchbox").fill("dining");
  const result = search.locator(".hub-search-result").last();
  await result.scrollIntoViewIfNeeded();
  const names = await search.locator(".hub-search-name").allTextContents();
  const scrollTop = await search.locator(".hub-search-results").evaluate((node) => node.scrollTop);
  expect(scrollTop).toBeGreaterThan(100);
  await result.click();
  await expect(search).toHaveCount(0);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_serverFn/**", async (route) => {
    const response = await route.fetch();
    if ((response.headers()["server-timing"] ?? "").includes("catalogue;")) await gate;
    await route.fulfill({ response });
  });
  await page.reload();
  try {
    await page.getByRole("button", { name: "BACK", exact: true }).click();
    await expect(search.getByRole("searchbox")).toHaveValue("dining");
    await expect(search.locator(".hub-search-result")).toHaveCount(0);
    release();
    await expect(search.locator(".hub-search-name")).toHaveText(names);
    await expect
      .poll(() => search.locator(".hub-search-results").evaluate((node) => node.scrollTop))
      .toBeCloseTo(scrollTop, 0);
  } finally {
    release();
  }
});
