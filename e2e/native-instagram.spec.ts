import { expect, test } from "./fixtures";

test("hosted posts show their images without Instagram and preserve independent carousels", async ({
  page,
}) => {
  let scripts = 0;
  await page.route("https://www.instagram.com/**", (route) => {
    scripts++;
    return route.abort();
  });
  await page.goto("/enchanted-holiday");
  const posts = page.locator("[data-native-instagram]");
  await expect(posts).toHaveCount(3);
  const first = posts.first();
  await first.scrollIntoViewIfNeeded();
  await expect(first.locator("img")).toHaveCount(3);
  await expect(first.locator("iframe, blockquote")).toHaveCount(0);
  await expect(first.locator("img").first()).toHaveJSProperty("naturalWidth", 1200);
  const secondPhoto = first.getByRole("button").nth(1);
  await secondPhoto.click();
  await expect(secondPhoto).toHaveAttribute("aria-current", "true");
  await expect(first.getByRole("link")).toHaveAttribute("href", /DGwwT3cCPE5/);
  await page
    .locator("[data-instagram-pagination]")
    .getByRole("button", { name: "2 / 3", exact: true })
    .click();
  await expect(posts.nth(1).getByRole("link")).toBeVisible();
  await expect(
    page.locator("[data-instagram-pagination]").getByRole("button", { name: "2 / 3", exact: true }),
  ).toHaveAttribute("aria-current", "true");
  await expect(posts.nth(1).locator("img")).toHaveCount(2);
  expect(scripts).toBe(0);
  await posts.nth(1).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `test-results/native-instagram-${test.info().project.name}.png` });
});
