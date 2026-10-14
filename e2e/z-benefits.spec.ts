import { test, expect } from "@playwright/test";

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
