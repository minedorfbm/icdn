import { test, expect } from "@playwright/test";

test("Benefits announces loading and failure, then recovers without leaving the card", async ({
  page,
}) => {
  let attempts = 0;
  let releaseRequest!: () => void;
  const pending = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });
  await page.route("**/_serverFn/**", async (route) => {
    if (!route.request().url().includes("standard")) return route.continue();
    attempts += 1;
    if (attempts === 1) {
      await pending;
      return route.abort();
    }
    return route.continue();
  });
  await page.goto("/rooms");
  const trigger = page.getByRole("button", { name: "Benefits", exact: true });
  await trigger.click();
  const modal = page.getByRole("dialog", {
    name: "Resort Classic Room Oceanview · Benefits",
    exact: true,
  });
  try {
    await expect(modal.locator('.benefits-body[aria-busy="true"]')).toBeVisible();
    await expect(modal.getByRole("status")).toHaveText("Loading…");
  } finally {
    releaseRequest();
  }
  await expect(modal.locator('.benefits-body[aria-busy="false"]')).toBeVisible();
  await expect(modal.getByRole("status")).not.toHaveText("Loading…");
  const retry = modal.getByRole("button", { name: "Try again", exact: true });
  await expect(retry).toBeVisible();
  // The action is independent from the live status message.
  await expect(modal.getByRole("status").getByRole("button")).toHaveCount(0);
  await retry.click();
  await expect(modal.getByRole("listitem")).toHaveCount(9);
  await expect(modal.getByRole("status")).toHaveCount(0);
  expect(attempts).toBe(2);
  await expect(page).toHaveURL("/rooms");
  await modal.getByRole("button", { name: "Close", exact: true }).click();
  await expect(trigger).toBeFocused();
});

test("Benefits opens inside the card, fits the phone and restores the collection", async ({
  page,
}) => {
  await page.goto("/rooms");
  const trigger = page.getByRole("button", { name: "Benefits", exact: true });
  await trigger.click();
  const modal = page.getByRole("dialog", {
    name: "Resort Classic Room Oceanview · Benefits",
    exact: true,
  });
  await expect(modal).toBeVisible();
  await expect(modal.getByRole("listitem")).toHaveCount(9);
  await expect(modal).toContainText("Children under 6 eat free");
  expect(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect(page).toHaveURL("/rooms");
  await modal.getByRole("button", { name: "Close", exact: true }).click();
  await expect(modal).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(modal.getByRole("listitem")).toHaveCount(9);
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
});
