import { expect, test } from "./fixtures";

test("opening and reopening a card reuse the loaded catalogue and media", async ({ page }) => {
  await page.goto("/");
  const card = page.locator("#heaven").getByRole("button", { name: "Citron", exact: true });
  await expect(card).toBeVisible();
  const calls: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/_serverFn/")) calls.push(request.url());
  });
  await card.click();
  await expect(page.locator(".editorial-title")).toHaveText("Citron");
  await expect(page.locator(".editorial-loading")).toHaveCount(0);
  // Only the media endpoint is needed; the settings and catalogue are already present.
  expect(calls).toHaveLength(1);
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await card.click();
  await expect(page.locator(".editorial-title")).toHaveText("Citron");
  await expect(page.locator(".editorial-loading")).toHaveCount(0);
  expect(calls).toHaveLength(1);
});

test("slow card media do not delay the card title or Back navigation", async ({ page }) => {
  await page.goto("/");
  const card = page.locator("#heaven").getByRole("button", { name: "Citron", exact: true });
  await expect(card).toBeVisible();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_serverFn/**", async (route) => {
    await gate;
    await route.continue();
  });
  await card.click();
  try {
    await expect(page.locator(".editorial-title")).toHaveText("Citron", { timeout: 2000 });
    await expect(page.locator(".editorial-loading")).toBeVisible();
    await page.getByRole("button", { name: "BACK", exact: true }).click();
    await expect(page).toHaveURL("/");
    await expect(page.locator(".editorial-detail")).toHaveCount(0);
  } finally {
    release();
  }
});

test("an expired catalogue shows navigation feedback and completes when the network returns", async ({
  page,
}) => {
  const start = new Date("2026-10-24T12:00:00Z");
  await page.clock.setFixedTime(start);
  await page.goto("/");
  const card = page.locator("#heaven").getByRole("button", { name: "Citron", exact: true });
  await expect(card).toBeVisible();
  await page.clock.setFixedTime(new Date(start.getTime() + 31_000));
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_serverFn/**", async (route) => {
    await gate;
    await route.continue();
  });
  await card.click();
  try {
    await expect(page.getByRole("status")).toHaveText("Loading…");
  } finally {
    release();
  }
  await expect(page.locator(".editorial-title")).toHaveText("Citron");
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("a direct card is usable while its full catalogue is held, then enriches without remounting", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const catalogueCalls: string[] = [];
  await page.route("**/_serverFn/**", async (route) => {
    // Read the actual diagnostic header, then delay only delivery of the full catalogue.
    const response = await route.fetch();
    if ((response.headers()["server-timing"] ?? "").includes("catalogue;")) {
      catalogueCalls.push(route.request().url());
      await gate;
    }
    await route.fulfill({ response });
  });
  await page.goto("/citron");
  try {
    await expect(page.locator(".editorial-title")).toHaveText("Citron");
    await expect.poll(() => catalogueCalls.length).toBe(1);
    const scroll = page.locator("[data-destination-scroll]");
    await scroll.evaluate((node) => {
      node.scrollTop = 180;
    });
    const before = await scroll.evaluate((node) => node.scrollTop);
    // Search must not pretend that the single focused card is the whole resort.
    await page.getByRole("button", { name: "Search", exact: true }).click();
    const search = page.getByRole("dialog", { name: "Search", exact: true });
    await expect(search.getByText("Loading…", { exact: true }).last()).toBeVisible();
    await expect(search.locator(".hub-search-result")).toHaveCount(0);
    await search.getByRole("button", { name: "Close", exact: true }).click();
    release();
    await expect(page.locator(".destination-relations output")).toHaveCount(0);
    await expect.poll(() => scroll.evaluate((node) => node.scrollTop)).toBe(before);
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(search.locator(".hub-search-result").first()).toBeVisible();
  } finally {
    release();
  }
});

test("Back works before a direct card's full catalogue arrives", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_serverFn/**", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/citron");
  try {
    await expect(page.locator(".editorial-title")).toHaveText("Citron");
    await page.getByRole("button", { name: "BACK", exact: true }).click();
    await expect(page).toHaveURL("/");
    await expect(page.locator(".editorial-detail")).toHaveCount(0);
    await expect(page.locator(".hub-hero")).toBeVisible();
  } finally {
    release();
  }
});

test("an early map request survives leaving the focused card while the catalogue loads", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_serverFn/**", async (route) => {
    const response = await route.fetch();
    if ((response.headers()["server-timing"] ?? "").includes("catalogue;")) await gate;
    await route.fulfill({ response });
  });
  await page.goto("/citron");
  try {
    await page.locator(".editorial-map").click();
    const map = page.getByRole("dialog", { name: "Resort map", exact: true });
    await expect(map).toBeVisible();
    await expect(map.getByText("Loading…", { exact: true })).toBeVisible();
    release();
    await expect(map.locator(".hub-atlas")).toBeVisible();
  } finally {
    release();
  }
});

test("a failed background catalogue keeps the direct card and retries the complete search", async ({
  page,
}) => {
  let failed = false;
  await page.route("**/_serverFn/**", async (route) => {
    const response = await route.fetch();
    if (!failed && (response.headers()["server-timing"] ?? "").includes("catalogue;")) {
      failed = true;
      await route.fulfill({ status: 503, body: "Test catalogue unavailable" });
    } else await route.fulfill({ response });
  });
  await page.goto("/citron");
  await expect(page.locator(".editorial-title")).toHaveText("Citron");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await search.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(search.locator(".hub-search-result").first()).toBeVisible();
  await search.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.locator(".editorial-title")).toHaveText("Citron");
});
