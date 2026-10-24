import { expect, test } from "./fixtures";

test("a cold direct card renders through the single catalogue snapshot", async ({
  page,
  request,
}) => {
  await page.goto("/citron");
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
});
