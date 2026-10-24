import { expect, test } from "./fixtures";

test("PDF code waits for intent, prepares without downloading the menu, and failure preserves return", async ({
  page,
}) => {
  const chunks: string[] = [];
  let documents = 0;
  page.on("request", (request) => {
    if (/\/assets\/(?:PdfMenu-|pdf-)/.test(request.url())) chunks.push(request.url());
  });
  await page.route("**/api/resort-pdf?*", (route) => {
    documents++;
    return route.fulfill({ status: 503, body: "offline" });
  });
  await page.goto("/citron");
  const card = page.getByRole("dialog", { name: "Citron", exact: true });
  const menu = card.getByRole("link", { name: "Test menu", exact: true });
  await expect(menu).toBeVisible();
  expect(chunks).toHaveLength(0);
  await menu.focus();
  await expect.poll(() => chunks.length).toBeGreaterThan(0);
  expect(documents).toBe(0);
  await menu.click();
  const viewer = page.getByRole("dialog", { name: /Test menu/ });
  await expect(viewer.getByRole("link", { name: "Open in browser", exact: true })).toBeVisible();
  await expect(
    viewer.getByText("This document could not be displayed. Open it in the browser instead.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(documents).toBe(1);
  await viewer.getByRole("button", { name: "Close", exact: true }).click();
  await expect(card).toBeVisible();
});
