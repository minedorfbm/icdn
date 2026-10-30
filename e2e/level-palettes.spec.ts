import { test, expect } from "./fixtures";

test("home chapters share the expanded-card foreground and background palettes", async ({
  page,
}, testInfo) => {
  for (const [level, id] of [
    ["heaven", "pilot-citron"],
    ["sky", "pilot-sky"],
    ["earth", "la-maison-1888"],
    ["sea", "mi-sol-spa"],
  ]) {
    await page.goto("/");
    const chapter = page.locator(`#${level}`);
    await chapter.scrollIntoViewIfNeeded();
    const colors = await chapter.evaluate((el) => {
      const css = getComputedStyle(el);
      // During atmospheric enhancement the existing palette is painted in the shared plane.
      const world = document.querySelector(`[data-atmosphere-level="${el.id}"]`);
      const background = world ? getComputedStyle(world).backgroundColor : css.backgroundColor;
      return { background, foreground: css.color };
    });
    await chapter.screenshot({ path: testInfo.outputPath(`${level}-home.png`) });
    await page.goto(`/${id}`);
    const card = page.locator(".editorial-detail");
    await expect(card).toBeVisible();
    await expect
      .poll(() =>
        card.evaluate((el) => {
          const css = getComputedStyle(el);
          return { background: css.backgroundColor, foreground: css.color };
        }),
      )
      .toEqual(colors);
  }
});
