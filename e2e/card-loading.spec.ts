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
