import { expect, test } from "./fixtures";

test("a cold direct card renders through its focused snapshot", async ({ page, request }) => {
  const response = await page.goto("/citron");
  const timing = response!.headers()["server-timing"];
  expect(await response!.text()).toContain("06:30");
  expect(timing).not.toContain("catalogue;");
  expect(timing).toMatch(/card;dur=\d+(?:\.\d+)?;desc="(?:rpc|cache)"/);
  expect(timing).toMatch(/settings;dur=\d+(?:\.\d+)?;desc="(?:database|cache)"/);
  await expect(page.getByRole("dialog", { name: "Citron", exact: true })).toBeVisible();
  await expect(page.locator(".editorial-title")).toHaveText("Citron");
  const { reads } = await (await request.get("http://127.0.0.1:54329/control")).json();
  expect(
    reads.some((path: string) => path.startsWith("/rest/v1/rpc/published_hub_destination_card_v1")),
  ).toBe(true);
  expect(
    reads.filter((path: string) =>
      /^\/rest\/v1\/(levels|destination_translations|map_places)\?/.test(path),
    ),
  ).toEqual([]);
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(page.locator("#heaven")).toBeVisible();
  const beforeWarm = (await (await request.get("http://127.0.0.1:54329/control")).json()).reads
    .length;
  const warm = await page.goto("/tingara");
  expect(warm!.headers()["server-timing"]).toMatch(/card;dur=\d+(?:\.\d+)?;desc="catalogue-cache"/);
  const warmReads = (
    await (await request.get("http://127.0.0.1:54329/control")).json()
  ).reads.slice(beforeWarm);
  expect(warmReads.some((path: string) => path.includes("published_hub_destination_card_v1"))).toBe(
    false,
  );
});

test("the deferred homepage catalogue reports its own API timing", async ({ page }) => {
  const pending = page.waitForResponse((response) => response.url().includes("/_serverFn/"));
  const document = await page.goto("/");
  const catalogue = await pending;
  expect(document!.headers()["server-timing"]).toContain("settings;");
  expect(document!.headers()["server-timing"]).not.toContain("catalogue;");
  expect(catalogue.headers()["server-timing"]).toMatch(
    /catalogue;dur=\d+(?:\.\d+)?;desc="(?:rpc|cache)"/,
  );
  await expect(page.locator("#heaven")).toBeVisible();
});

test("an opened card reads its media snapshot without per-table requests", async ({
  page,
  request,
}) => {
  const pending = page.waitForResponse(
    (response) =>
      response.url().includes("/_serverFn/") &&
      (response.headers()["server-timing"] ?? "").includes("media;"),
  );
  await page.goto("/citron");
  const response = await pending;
  expect(response.headers()["server-timing"]).toMatch(
    /media;dur=\d+(?:\.\d+)?;desc="(?:rpc|cache)"/,
  );
  await expect(page.locator(".opening-hours")).toContainText("06:30");
  const { reads } = await (await request.get("http://127.0.0.1:54329/control")).json();
  expect(
    reads.some(
      (path: string) =>
        path.startsWith("/rest/v1/rpc/published_hub_destination_media_v1?") &&
        path.includes("requested_destination_id=citron"),
    ),
  ).toBe(true);
  expect(
    reads.filter((path: string) =>
      /^\/rest\/v1\/(destination_photos|destination_posts|destination_videos|destination_opening_hours|published_destination_notices|destination_collection_items)\?/.test(
        path,
      ),
    ),
  ).toEqual([]);
});
