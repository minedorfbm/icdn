import { expect, test } from "./fixtures";

test("Bensley stories preserve explicit discoveries, card returns and saved progress", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Explore the resort map/ }).click();
  const map = page.getByRole("dialog", { name: "Resort map", exact: true });
  const preview = map.locator(".atlas-preview");
  await map.getByRole("button", { name: "Bensley Tour", exact: true }).click();
  await expect(preview).toContainText("Self-guided discovery");
  await preview.getByRole("button", { name: "Start at Reception", exact: true }).click();
  await expect(preview.locator("h3")).toHaveText("Reception Lobby");
  await preview.locator(".atlas-tour-next").click();
  await expect(preview.locator("h3")).toHaveText("Citron");
  await expect(preview.locator(".atlas-tour-count")).toContainText("0 /");
  await preview.getByText("What to look for", { exact: true }).click();
  await expect(preview).toContainText("inverted Non La pods");
  await preview.getByRole("button", { name: "Mark as discovered", exact: true }).click();
  await expect(preview.locator(".atlas-tour-count")).toContainText("1 /");
  await preview.getByText("Venue information", { exact: true }).click();
  await preview.getByRole("button", { name: "Citron", exact: true }).click();
  await expect(page).toHaveURL("/citron");
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(preview.locator("h3")).toHaveText("Citron");
  await expect(preview.getByRole("button", { name: "Discovered", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await preview.getByRole("button", { name: "Tour overview", exact: true }).click();
  await preview.getByText("All stops", { exact: true }).click();
  await preview.getByRole("button", { name: /La Maison 1888/ }).click();
  await expect(preview.locator(".atlas-preview-meta")).toContainText("EARTH");
  await expect(preview.locator(".atlas-tour-count")).toContainText("1 /");
  await expect(map.locator(".hotspot-v2.is-visited")).toHaveCount(1);
  await map.getByRole("button", { name: "Close map", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: /Explore the resort map/ }).click();
  await map.getByRole("button", { name: "Bensley Tour", exact: true }).click();
  await preview.getByRole("button", { name: "Resume the tour", exact: true }).click();
  await expect(preview.locator("h3")).toHaveText("La Maison 1888");
  await expect(preview.locator(".atlas-tour-count")).toContainText("1 /");
  await preview.getByRole("button", { name: "Tour overview", exact: true }).click();
  await preview.getByText("All stops", { exact: true }).click();
  await preview.getByRole("button", { name: /Mi Sol Lagoon/ }).click();
  await expect(preview).toContainText("the final stop");
  await expect(preview.locator(".atlas-tour-next")).toHaveCount(0);
});

test("tour remains usable when local storage is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem;
    const set = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === "icdn.bensley-tour.v1") throw new DOMException("Blocked", "SecurityError");
      return get.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === "icdn.bensley-tour.v1") throw new DOMException("Blocked", "SecurityError");
      return set.call(this, key, value);
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: /Explore the resort map/ }).click();
  const map = page.getByRole("dialog", { name: "Resort map", exact: true });
  await map.getByRole("button", { name: "Bensley Tour", exact: true }).click();
  await map.getByRole("button", { name: "Start at Reception", exact: true }).click();
  await map.getByRole("button", { name: "Mark as discovered", exact: true }).click();
  await expect(map.locator(".atlas-tour-count")).toContainText("1 /");
  await map.getByRole("button", { name: "Discovered", exact: true }).click();
  await expect(map.locator(".atlas-tour-count")).toContainText("0 /");
});
