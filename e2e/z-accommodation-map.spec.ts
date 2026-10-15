import { test, expect } from "./fixtures";

test("accommodation zones connect cards and map without claiming a precise building", async ({
  page,
}) => {
  await page.goto("/rooms");
  await page.getByRole("button", { name: "View on map", exact: true }).click();
  const map = page.getByRole("dialog", { name: "Resort map" });
  const preview = map.locator(".atlas-preview");
  await expect(preview.getByRole("heading", { name: "Rooms & Suites" })).toBeVisible();
  await expect(preview).toContainText("501-567 / 301-393 / 219-245");
  await expect(preview).toContainText("Room numbers");
  await expect(
    preview.getByRole("button", { name: "Resort Classic Room Oceanview", exact: true }),
  ).toBeVisible();
  const club = preview.getByRole("button", { name: "Club Panoramic Room Oceanview", exact: true });
  await club.scrollIntoViewIfNeeded();
  await club.click();
  await expect(page).toHaveURL("/club-panoramic-room-oceanview");
  await page.getByRole("button", { name: "View on map", exact: true }).click();
  await expect(preview.getByRole("heading", { name: "Rooms & Suites" })).toBeVisible();
  await preview.getByRole("button", { name: "Close place preview", exact: true }).click();
  const filter = map
    .locator(".atlas-collections")
    .getByRole("button", { name: "ACCOMMODATION", exact: true });
  await filter.scrollIntoViewIfNeeded();
  await filter.click();
  await expect(filter).toHaveAttribute("aria-pressed", "true");
  await expect(map.getByRole("button", { name: "Rooms & Suites · SKY", exact: false })).toHaveCount(
    0,
  );
  await expect(
    map.getByRole("button", { name: "Rooms & Suites · HEAVEN / SKY / EARTH", exact: true }),
  ).toBeVisible();
});
