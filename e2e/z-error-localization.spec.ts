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

test("a failed page retries in the chosen language without clearing its fallback early", async ({
  page,
}) => {
  const copy = UI.ja;
  await page.addInitScript(() => localStorage.setItem("adj-lang", "ja"));
  await page.goto("/");
  await expect(page.locator("#heaven")).toHaveCount(1);
  let phase = "fail";
  let releaseRequest!: () => void;
  const pending = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });
  await page.route("**/_serverFn/**", async (route) => {
    if (phase === "success") return route.continue();
    if (phase === "pending") await pending;
    return route.abort();
  });
  await page.locator("#heaven").getByRole("button", { name: "Citron", exact: true }).click();
  const title = page.getByRole("heading", { name: copy.error_page_title, exact: true });
  const retry = page.getByRole("button", { name: copy.retry, exact: true });
  await expect(title).toBeVisible();
  const unhandled: string[] = [];
  page.on("pageerror", (error) => unhandled.push(error.message));
  // A loader error is handled by the router, so separately inject a rejection
  // at its existing browser API to exercise a failed invalidation itself.
  await page.evaluate(() => {
    const router = window.__TSR_ROUTER__!;
    const invalidate = router.invalidate;
    router.invalidate = async () => {
      router.invalidate = invalidate;
      throw new Error("Test invalidation rejected");
    };
  });
  await retry.click();
  await expect(retry).toBeEnabled();
  await expect(title).toBeVisible();
  phase = "pending";
  await retry.click();
  try {
    const loading = page.getByRole("button", { name: copy.page_loading, exact: true });
    await expect(loading).toBeDisabled();
    await expect(loading).toHaveAttribute("aria-busy", "true");
    await expect(title).toBeVisible();
    await expect(page.getByRole("link", { name: copy.go_home, exact: true })).toHaveAttribute(
      "href",
      "/",
    );
  } finally {
    releaseRequest();
  }
  await expect(retry).toBeEnabled();
  await expect(title).toBeVisible();
  phase = "success";
  await retry.click();
  await expect(page.getByRole("dialog", { name: "Citron", exact: true })).toBeVisible();
  await expect(title).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  expect(unhandled).toEqual([]);
});
