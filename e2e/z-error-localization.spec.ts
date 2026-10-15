import { expect, test } from "./fixtures";
import { readFileSync } from "node:fs";
const UI = JSON.parse(
  readFileSync(new URL("../src/i18n/dictionary.ui.json", import.meta.url), "utf8"),
) as Record<string, Record<string, string>>;
const LANGUAGES = ["en", "vi", "ru", "zh", "ko", "ja"].map((code) => ({ code }));

for (const { code } of LANGUAGES) {
  test(`an unknown card restores the ${code} language outside the hub provider`, async ({
    page,
  }) => {
    await page.addInitScript((locale) => localStorage.setItem("adj-lang", locale), code);
    for (const path of ["/unknown-card-translation-test", "/unknown/nested/page"]) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { name: UI[code].not_found_title, exact: true }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: UI[code].go_home, exact: true })).toHaveAttribute(
        "href",
        "/",
      );
      await expect(page.locator("html")).toHaveAttribute("lang", code);
      expect(await page.locator("body").evaluate((el) => el.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}
