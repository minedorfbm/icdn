import { expect, test } from "./fixtures";
import { BENSLEY_TOUR_SOURCE } from "../src/features/resort-map/tour-copy";

const readerTitle = "Official design tour";

test("official tour loads on demand and preserves reading, map camera and place selection", async ({
  page,
}) => {
  let loads = 0;
  await page.route(BENSLEY_TOUR_SOURCE, (route) => {
    loads++;
    return route.fulfill({
      contentType: "text/html",
      body: '<h1>Official tour fixture</h1><a href="#citron">Citron chapter</a><div style="height:2000px"></div><h2 id="citron">Citron details</h2>',
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: /Explore the resort map/ }).click();
  const map = page.getByRole("dialog", { name: "Resort map", exact: true });
  const launch = map.getByRole("button", { name: "Bensley Tour", exact: true });
  await expect(map.locator("iframe")).toHaveCount(0);
  await map.getByRole("button", { name: "Citron · HEAVEN", exact: true }).press("Enter");
  const preview = map.locator(".atlas-preview");
  await expect(preview.locator("h3")).toHaveText("Citron");
  const camera = (await map.locator(".map-scene").getAttribute("transform"))!
    .match(/-?\d+(?:\.\d+)?/g)!
    .map(Number);
  await launch.click();
  const reader = map.locator(".atlas-tour-reader");
  const frame = page.frameLocator(`iframe[title="${readerTitle}"]`);
  const back = reader.getByRole("button", { name: "Back to map", exact: true });
  await expect(back).toBeFocused();
  await expect(frame.getByRole("heading", { name: "Official tour fixture" })).toBeVisible();
  await frame.getByRole("link", { name: "Citron chapter" }).click();
  await expect(frame.getByRole("heading", { name: "Citron details" })).toBeInViewport();
  await back.click();
  await expect(reader).toBeHidden();
  await expect(launch).toBeFocused();
  const returnedCamera = (await map.locator(".map-scene").getAttribute("transform"))!
    .match(/-?\d+(?:\.\d+)?/g)!
    .map(Number);
  expect(returnedCamera).toHaveLength(3);
  // WebKit can round the SVG translation during layout; preserve position within 0.005px
  // and require the zoom itself to remain exactly unchanged.
  expect(returnedCamera[0]).toBeCloseTo(camera[0]!, 2);
  expect(returnedCamera[1]).toBeCloseTo(camera[1]!, 2);
  expect(returnedCamera[2]).toBe(camera[2]);
  await expect(preview.locator("h3")).toHaveText("Citron");
  await preview.getByRole("button", { name: "Discover this place", exact: true }).click();
  await expect(page).toHaveURL("/citron");
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await launch.click();
  await expect(frame.getByRole("heading", { name: "Citron details" })).toBeInViewport();
  expect(loads).toBe(1);
  await expect(reader.getByRole("link")).toHaveAttribute("href", BENSLEY_TOUR_SOURCE);
  await back.click();
  await map.getByRole("button", { name: "Close map", exact: true }).click();
  await expect(page.locator(`iframe[title="${readerTitle}"]`)).toHaveCount(0);
});

test("unavailable official content always leaves the map return and external link usable", async ({
  page,
}) => {
  await page.route(BENSLEY_TOUR_SOURCE, (route) => route.abort());
  await page.goto("/");
  await page.getByRole("button", { name: /Explore the resort map/ }).click();
  const map = page.getByRole("dialog", { name: "Resort map", exact: true });
  await map.getByRole("button", { name: "Bensley Tour", exact: true }).click();
  const reader = map.locator(".atlas-tour-reader");
  await expect(reader.getByRole("link")).toHaveAttribute("target", "_blank");
  await expect(reader.getByRole("link")).toHaveAttribute("href", BENSLEY_TOUR_SOURCE);
  await reader.getByRole("button", { name: "Back to map", exact: true }).click();
  await expect(map.getByRole("button", { name: "Explore", exact: true })).toBeVisible();
});
