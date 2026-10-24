import { expect, test } from "./fixtures";

test("a cold direct card renders through the single catalogue snapshot", async ({
  page,
  request,
}) => {
  const response = await page.goto("/citron");
  const timing = response!.headers()["server-timing"];
  expect(timing).toMatch(/catalogue;dur=\d+(?:\.\d+)?;desc="(?:rpc|cache)"/);
  expect(timing).toMatch(/settings;dur=\d+(?:\.\d+)?;desc="(?:database|cache)"/);
  await expect(page.getByRole("dialog", { name: "Citron", exact: true })).toBeVisible();
  await expect(page.locator(".editorial-title")).toHaveText("Citron");
  const { reads } = await (await request.get("http://127.0.0.1:54329/control")).json();
  expect(
    reads.some((path: string) => path.startsWith("/rest/v1/rpc/published_hub_catalogue_v1")),
  ).toBe(true);
  expect(
    reads.filter((path: string) =>
      /^\/rest\/v1\/(levels|destination_translations|map_places)\?/.test(path),
    ),
  ).toEqual([]);
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(page.locator("#heaven")).toBeVisible();
  const warm = await page.goto("/tingara");
  expect(warm!.headers()["server-timing"]).toMatch(/catalogue;dur=\d+(?:\.\d+)?;desc="cache"/);
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
