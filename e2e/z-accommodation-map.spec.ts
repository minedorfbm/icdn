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
  const card = page.getByRole("dialog", { name: "Club Panoramic Room Oceanview", exact: true });
  await expect(card).toBeVisible();
  await expect(map).toHaveCount(0);
  await card.getByRole("button", { name: "View on map", exact: true }).click();
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

for (const viewport of [
  { width: 834, height: 1194 },
  { width: 1440, height: 1000 },
]) {
  test(`map cards remain accessible and Back restores the selection at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/rooms");
    await page.getByRole("button", { name: "View on map", exact: true }).click();
    const map = page.getByRole("dialog", { name: "Resort map", exact: true });
    const preview = map.locator(".atlas-preview");
    await expect(preview.getByRole("heading", { name: "Rooms & Suites" })).toBeVisible();
    const camera = await map.locator(".map-scene").getAttribute("transform");

    for (const name of ["Club Panoramic Room Oceanview", "Resort Classic Room Oceanview"]) {
      await preview.getByRole("button", { name, exact: true }).click();
      const card = page.getByRole("dialog", { name, exact: true });
      await expect(card).toBeVisible();
      await expect(map).toHaveCount(0);
      const locate = card.getByRole("button", { name: "View on map", exact: true });
      // Keyboard navigation must reach the foreground card, never the retained map.
      await locate.focus();
      await expect(locate).toBeFocused();
      if (name === "Club Panoramic Room Oceanview")
        await page.screenshot({ path: testInfo.outputPath("map-card-accessible.png") });
      await card.getByRole("button", { name: "BACK", exact: true }).click();
      await expect(map).toBeVisible();
      await expect(preview.getByRole("heading", { name: "Rooms & Suites" })).toBeVisible();
      await expect(map.locator(".map-scene")).toHaveAttribute("transform", camera!);
    }
    await map.getByRole("button", { name: "Zoom in", exact: true }).click();
    await expect(map.locator(".map-scene")).not.toHaveAttribute("transform", camera!);
  });
}
