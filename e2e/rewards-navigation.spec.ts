import { test, expect } from "./fixtures";

test("Rewards uses the current tab and native Back returns to the card", async ({
  page,
  context,
}) => {
  const rewardsUrl = "https://www.ihg.com/onerewards/content/us/en/home";
  await context.route(rewardsUrl, (route) =>
    route.fulfill({ contentType: "text/html", body: "<h1>Rewards destination</h1>" }),
  );
  await page.goto("/citron");
  const discover = page.getByRole("link", { name: "IHG One Rewards", exact: true });
  await expect(discover).toHaveAttribute("target", "_self");
  await discover.click();
  await expect(page).toHaveURL(rewardsUrl);
  expect(context.pages()).toHaveLength(1);
  await page.goBack();
  await expect(page).toHaveURL("/citron");
  await expect(discover).toBeVisible();
});
