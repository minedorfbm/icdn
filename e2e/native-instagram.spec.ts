import { imageDeliveryUrl } from "../src/lib/image-delivery";
import images from "../src/data/image-variants.json" with { type: "json" };
import { expect, test } from "./fixtures";

test("hosted posts show their images without Instagram and preserve independent carousels", async ({
  page,
}) => {
  let scripts = 0;
  await page.route("https://www.instagram.com/**", (route) => {
    scripts++;
    return route.abort();
  });
  for (const image of Object.values(images)) {
    const file = image.aliases.find((alias) => alias.startsWith("/instagram-posts/"));
    if (!file) continue;
    for (const candidate of image.variants)
      await page.route(imageDeliveryUrl(candidate.src), (route) =>
        route.fulfill({
          path: new URL(`../public${file}`, import.meta.url).pathname,
          contentType: "image/webp",
        }),
      );
  }
  await page.goto("/enchanted-holiday");
  const posts = page.locator("[data-native-instagram]");
  await expect(posts).toHaveCount(3);
  const first = posts.first();
  await first.scrollIntoViewIfNeeded();
  await expect(first.locator("img")).toHaveCount(3);
  await expect(first.locator("iframe, blockquote")).toHaveCount(0);
  const photo = first.locator("img").first();
  await expect
    .poll(() =>
      photo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true);
  const original = Object.values(images).find((image) =>
    image.aliases.includes("/instagram-posts/DGwwT3cCPE5-1.webp"),
  )!;
  await expect(photo).toHaveAttribute("src", imageDeliveryUrl(original.src));
  expect(await photo.getAttribute("srcset")).toContain(
    `${imageDeliveryUrl(original.src)} ${original.width}w`,
  );
  expect(original.width).toBe(1200);
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
