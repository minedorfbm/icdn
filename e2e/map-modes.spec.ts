import { expect, test } from "./fixtures";

test("map modes, level filters and official plan remain usable without losing the map", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Explore the resort map/ }).click();
  const map = page.getByRole("dialog", { name: "Resort map" });
  const options = map.getByRole("button", { name: "Map options", exact: true });
  await options.click();
  const panel = map.getByRole("region", { name: "Map options", exact: true });
  await panel.getByRole("button", { name: "Official plan", exact: true }).click();
  await expect(panel.getByRole("button", { name: "Illustrated map", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await panel.getByRole("button", { name: "Illustrated map", exact: true }).click();
  await panel.getByRole("button", { name: "HEAVEN", exact: true }).click();
  await expect(panel).toHaveCount(0);
  await options.click();
  await expect(panel.getByRole("button", { name: "HEAVEN", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await panel.getByRole("button", { name: "All places", exact: true }).click();
  await map.getByRole("button", { name: "Walk", exact: true }).click();
  await expect(map.locator(".atlas-context")).toBeVisible();
  await map.getByRole("button", { name: "Photo spots", exact: true }).click();
  await map
    .locator(".atlas-photo-index")
    .getByRole("button", { name: "Photo spots C", exact: true })
    .click();
  await expect(map.locator(".atlas-preview")).toContainText("Citron");
  await map.getByRole("button", { name: "Bensley Tour", exact: true }).click();
  const preview = map.locator(".atlas-preview");
  await expect(preview.locator(".atlas-tour-controls button").first()).toBeDisabled();
  const firstTitle = await preview.locator("h3").textContent();
  await preview.locator(".atlas-tour-controls button").last().click();
  await expect(preview.locator("h3")).not.toHaveText(firstTitle!);
  await preview.locator(".atlas-tour-controls button").first().click();
  await expect(preview.locator("h3")).toHaveText(firstTitle!);
  await map.getByRole("button", { name: "Explore", exact: true }).click();
  await expect(preview).toHaveCount(0);
  await expect(map.locator(".atlas-collections")).toBeVisible();
});
