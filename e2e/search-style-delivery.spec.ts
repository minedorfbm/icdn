import { expect, test } from "./fixtures";

for (const route of ["/", "/citron", "/map"]) {
  test(`closed search does not add its panel CSS to the initial ${route} page`, async ({
    page,
  }) => {
    const styles: string[] = [];
    page.on("request", (request) => {
      if (/\/assets\/search-[^/]+\.css$/.test(new URL(request.url()).pathname))
        styles.push(request.url());
    });
    const response = await page.goto(route);
    expect(await response!.text()).not.toContain("data-hub-search-style");
    await expect(page.locator("head link[data-hub-search-style]")).toHaveCount(0);
    expect(styles).toHaveLength(0);
    if (route === "/") {
      await expect(page.locator(".hub-tools")).toHaveCSS("position", "fixed");
      await expect(page.locator(".hub-tools .brand-control")).toHaveCSS("width", "44px");
    }
  });
}

test("direct search delivers its styles before the client-mounted portal", async ({ page }) => {
  await page.route(/\/assets\/.*\.js(?:\?.*)?$/, (route) => route.abort());
  const response = await page.goto("/search");
  const html = await response!.text();
  expect(html.slice(0, html.indexOf("</head>"))).toContain("data-hub-search-style");
  await expect(page.locator("head link[data-hub-search-style]")).toHaveCount(1);
  // The dialog portal mounts on the client; its CSS must already be ready.
  const style = page.locator("head link[data-hub-search-style]");
  await expect.poll(() => style.evaluate((link: HTMLLinkElement) => !!link.sheet)).toBe(true);
  const rules = await style.evaluate((link: HTMLLinkElement) =>
    Array.from(link.sheet!.cssRules, (rule) => rule.cssText).join("\n"),
  );
  expect(rules).toContain(".hub-search-input input");
});

test("opening search loads its panel CSS once and a card return retains styles and query", async ({
  page,
}) => {
  const styles: string[] = [];
  page.on("request", (request) => {
    if (/\/assets\/search-[^/]+\.css$/.test(new URL(request.url()).pathname))
      styles.push(request.url());
  });
  await page.goto("/citron");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await expect(search.getByRole("searchbox")).toHaveCSS("height", "50px");
  await expect.poll(() => styles.length).toBe(1);
  await search.getByRole("searchbox").fill("japanese");
  await search.getByRole("button", { name: /TINGARA/ }).click();
  await expect(page).toHaveURL("/tingara");
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(page).toHaveURL("/search");
  await expect(search.getByRole("searchbox")).toHaveValue("japanese");
  await expect(search.getByRole("searchbox")).toHaveCSS("height", "50px");
  expect(styles).toHaveLength(1);
});
