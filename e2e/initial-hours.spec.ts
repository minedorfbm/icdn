import { expect, test } from "./fixtures";

function gate() {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { pending, release: () => release() };
}

test("SSR hours appear before media and a newer empty publication stays empty through retry", async ({
  page,
}) => {
  const first = gate(),
    retry = gate();
  let requests = 0;
  await page.route("**/_serverFn/**", async (route) => {
    const response = await route.fetch();
    if (!(response.headers()["server-timing"] ?? "").includes("media;")) {
      await route.fulfill({ response });
      return;
    }
    const index = requests++;
    await (index === 0 ? first.pending : retry.pending);
    // A valid ordinary JSON server-function response models a newer empty publication.
    // The first response has an unrelated unavailable gallery to exercise manual retry.
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          photos: index === 0 ? null : [],
          posts: [],
          videos: [],
          hours: [],
          notices: [],
          collection: [],
        },
        context: {},
      }),
    });
  });
  try {
    const document = await page.goto("/citron");
    expect(await document!.text()).toContain("06:30");
    await expect(page.locator(".opening-hours")).toHaveCount(1);
    await expect(page.locator(".opening-hours")).toContainText("06:30");
    await expect.poll(() => requests).toBe(1);
    first.release();
    await expect(page.locator(".opening-hours")).toHaveCount(0);
    await page.locator(".editorial-loading button").click();
    await expect.poll(() => requests).toBe(2);
    await expect(page.locator(".editorial-loading")).toHaveAttribute("aria-busy", "true");
    await expect(page.locator(".opening-hours")).toHaveCount(0);
    retry.release();
    await expect(page.locator(".editorial-loading")).toHaveCount(0);
    await expect(page.locator(".opening-hours")).toHaveCount(0);
  } finally {
    first.release();
    retry.release();
  }
});

test("the background catalogue has lower network priority than the visible card media", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Network priority inspection uses Chromium's protocol; WebKit still runs the readiness and hours scenarios.",
  );
  const session = await page.context().newCDPSession(page);
  const priorities = new Map<string, string>();
  await session.send("Network.enable");
  session.on("Network.requestWillBeSent", ({ request }) =>
    priorities.set(request.url, request.initialPriority),
  );
  const catalogue = page.waitForResponse((response) =>
    (response.headers()["server-timing"] ?? "").includes("catalogue;"),
  );
  const media = page.waitForResponse((response) =>
    (response.headers()["server-timing"] ?? "").includes("media;"),
  );
  await page.goto("/citron");
  const [catalogueResponse, mediaResponse] = await Promise.all([catalogue, media]);
  const order = ["VeryLow", "Low", "Medium", "High", "VeryHigh"];
  const cataloguePriority = order.indexOf(priorities.get(catalogueResponse.url()) ?? "");
  const mediaPriority = order.indexOf(priorities.get(mediaResponse.url()) ?? "");
  expect(cataloguePriority).toBeGreaterThanOrEqual(0);
  expect(cataloguePriority).toBeLessThan(mediaPriority);
  await expect(page.locator(".opening-hours")).toContainText("06:30");
  await expect(page.locator(".editorial-title")).toHaveText("Citron");
  await session.detach();
});
