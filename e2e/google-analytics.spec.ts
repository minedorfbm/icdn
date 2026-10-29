import { expect, test, type Page } from "./fixtures";
import { GOOGLE_ANALYTICS_ID } from "../src/lib/google-analytics";

// This spec serves the local instrumented build under a virtual production host.
// Include its real counters in coverage without collecting external provider code.
test.use({ coverageOrigins: ["http://127.0.0.1:4173", "https://icdn.artdigitaljourney.com"] });

async function productionPage(page: Page, catalogue?: () => Promise<void>) {
  await page.route("https://icdn.artdigitaljourney.com/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith("/media/")) return route.fallback();
    // Keep the local proxy's origin/referer coherent with the local request.
    // Production CSRF checks remain enforced; only this virtual-host test rewrites them.
    const headers = route.request().headers();
    for (const name of ["origin", "referer"]) {
      if (headers[name]?.startsWith("https://icdn.artdigitaljourney.com")) {
        headers[name] = headers[name].replace(
          "https://icdn.artdigitaljourney.com",
          "http://127.0.0.1:4173",
        );
      }
    }
    const response = await route.fetch({
      url: `http://127.0.0.1:4173${url.pathname}${url.search}`,
      headers,
    });
    if (catalogue && response.headers()["server-timing"]?.includes("catalogue;")) {
      const body = await response.json();
      for (const destination of body.destinations) {
        if (destination.id === "citron") {
          destination.image_key = "/analytics-wait/photo.png";
          destination.detail_image_key = "/analytics-wait/photo.png";
        }
      }
      await catalogue();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    } else await route.fulfill({ response });
  });
}

test("Google tag runs once after page load under the enforced CSP", async ({ page }) => {
  // Exercise the production-host guard using only local HTML/assets and a fake
  // Google response. Browser tests never send visits to the real GA property.
  await productionPage(page);
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
  await expect.poll(() => calls.length, { timeout: 8000 }).toBe(1);
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
  await expect(page.locator("#heaven")).toBeAttached();
  await expect(page.locator("#adj-google-analytics")).toHaveAttribute("fetchpriority", "low");
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

test("Analytics waits beyond page load for the catalogue and a newly opened card photo", async ({
  page,
}) => {
  let releaseCatalogue!: () => void;
  let releasePhoto!: () => void;
  const catalogueGate = new Promise<void>((resolve) => {
    releaseCatalogue = resolve;
  });
  const photoGate = new Promise<void>((resolve) => {
    releasePhoto = resolve;
  });
  let catalogueWaiting = false;
  let photoWaiting = false;
  await productionPage(page, async () => {
    catalogueWaiting = true;
    await catalogueGate;
  });
  await page.route("**/analytics-wait/photo.png", async (route) => {
    photoWaiting = true;
    await photoGate;
    await route.fulfill({
      path: "public/intercontinental-touch-icon.png",
      contentType: "image/png",
    });
  });
  const calls: string[] = [];
  await page.route("https://www.googletagmanager.com/gtag/js?**", async (route) => {
    calls.push(route.request().url());
    await route.fulfill({ contentType: "application/javascript", body: "/* fake Google tag */" });
  });
  try {
    await page.goto("https://icdn.artdigitaljourney.com/");
    await expect.poll(() => catalogueWaiting).toBe(true);
    // Exceed the old load/idle deadline while the catalogue remains pending.
    await page.waitForTimeout(2400);
    expect(calls).toHaveLength(0);
    releaseCatalogue();
    await page.locator("#heaven .card-stack-stage").scrollIntoViewIfNeeded();
    await expect.poll(() => photoWaiting).toBe(true);
    await page.locator("#heaven").getByRole("button", { name: "Citron", exact: true }).click();
    await expect(page.locator(".editorial-hero img")).toBeAttached();
    await page.waitForTimeout(2400);
    expect(calls).toHaveLength(0);
    releasePhoto();
    await expect(page.locator(".editorial-hero img")).toHaveJSProperty("complete", true);
    await expect.poll(() => calls.length, { timeout: 8000 }).toBe(1);
    expect(
      await page
        .locator(".editorial-hero img")
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    ).toBeGreaterThan(0);
  } finally {
    releaseCatalogue();
    releasePhoto();
  }
});
