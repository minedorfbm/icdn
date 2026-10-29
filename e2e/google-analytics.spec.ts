import { expect, test } from "./fixtures";
import { GOOGLE_ANALYTICS_ID } from "../src/lib/google-analytics";

test("Google tag runs once after page load under the enforced CSP", async ({ page }) => {
  // Exercise the production-host guard using only local HTML/assets and a fake
  // Google response. Browser tests never send visits to the real GA property.
  await page.route("https://icdn.artdigitaljourney.com/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith("/media/")) return route.fallback();
    const response = await route.fetch({
      url: `http://127.0.0.1:4173${url.pathname}${url.search}`,
    });
    await route.fulfill({ response });
  });
  const calls: Array<{ url: string; state: string }> = [];
  await page.route("https://www.googletagmanager.com/gtag/js?**", async (route) => {
    calls.push({
      url: route.request().url(),
      state: await page.evaluate(() => document.readyState),
    });
    await route.fulfill({
      contentType: "application/javascript",
      body: "window.__adjAnalyticsScriptLoaded = true;",
    });
  });
  const response = await page.goto("https://icdn.artdigitaljourney.com/");
  await expect.poll(() => calls.length).toBe(1);
  expect(calls).toEqual([
    {
      url: `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`,
      state: "complete",
    },
  ]);
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(
          (window as unknown as { __adjAnalyticsScriptLoaded?: boolean })
            .__adjAnalyticsScriptLoaded,
        ),
      ),
    )
    .toBe(true);
  const commands = await page.evaluate(() =>
    (window as unknown as { dataLayer: IArguments[] }).dataLayer.map((args) => Array.from(args)),
  );
  expect(commands[1]).toEqual(["config", GOOGLE_ANALYTICS_ID]);
  const html = await response!.text();
  const bootstrap = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].find((match) =>
    match[2]!.includes("__adjGoogleTag"),
  );
  const nonce = /nonce="([^"]+)"/.exec(bootstrap?.[1] ?? "")?.[1];
  expect(nonce).toBeTruthy();
  expect(response!.headers()["content-security-policy"]).toContain(`'nonce-${nonce}'`);
  await page.locator(".hero-invitation").click();
  expect(calls).toHaveLength(1);
});

test("local and preview visits do not initialize production Analytics", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("googletagmanager.com")) requests.push(request.url());
  });
  await page.goto("/citron");
  await expect(page.locator(".editorial-hero")).toBeVisible();
  expect(requests).toHaveLength(0);
  expect(await page.evaluate(() => "dataLayer" in window)).toBe(false);
});
