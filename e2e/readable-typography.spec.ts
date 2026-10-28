import { expect, test } from "./fixtures";

for (const viewport of [
  { width: 320, height: 640 },
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]) {
  test(`small interface text stays readable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("#heaven")).toBeAttached();
    for (const selector of [
      ".hub-tools span",
      ".hero-invitation-caption",
      ".discovery-heading p",
      "#heaven .destination-panel-meta",
      "#heaven .destination-panel-actions a",
      ".sea-footer p",
    ]) {
      const size = await page
        .locator(selector)
        .first()
        .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
      expect(size, selector).toBeGreaterThanOrEqual(12);
    }
    await expect
      .poll(() =>
        page
          .locator(".discovery-choice-note")
          .first()
          .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize)),
      )
      .toBeCloseTo(14.4, 1);
    const summary = await page
      .locator("#heaven .destination-panel-summary")
      .first()
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    expect(summary).toBeGreaterThanOrEqual(18);
    await page.getByRole("button", { name: /Explore the resort map/ }).click();
    const map = page.getByRole("dialog", { name: "Resort map", exact: true });
    await expect(map).toBeVisible();
    await expect(map.locator(".atlas-dock button")).toHaveCount(4);
    const labels = await map.locator(".atlas-dock button").evaluateAll((buttons) =>
      buttons.map((button) => ({
        size: Number.parseFloat(getComputedStyle(button).fontSize),
        clipped: button.scrollWidth > button.clientWidth + 1,
      })),
    );
    expect(labels.length).toBe(4);
    expect(labels.every((label) => label.size >= 13 && !label.clipped)).toBe(true);
    await map
      .locator(".atlas-header")
      .getByRole("button", { name: "Close map", exact: true })
      .click();
    await page.goto("/citron");
    const description = page.locator(".editorial-description");
    await expect(description).toBeVisible();
    expect(
      await description.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThan(19);
    await expect(page.getByRole("button", { name: "BACK", exact: true })).toBeVisible();
  });
}
