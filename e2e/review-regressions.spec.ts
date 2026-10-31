import { expect, test } from "./fixtures";
import { BENSLEY_TOUR_SOURCE } from "../src/features/resort-map/tour-copy";

test.beforeEach(async ({ page }) => {
  await page.route("https://www.instagram.com/embed.js", (route) => route.abort());
});

for (const fromSearch of [false, true]) {
  test(`previous discovery survives map and iframe history from ${fromSearch ? "search" : "a direct card"}`, async ({
    page,
  }) => {
    await page.route(BENSLEY_TOUR_SOURCE, (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<a href="#chapter">Tour chapter</a><h1 id="chapter">Chapter</h1>',
      }),
    );
    if (fromSearch) {
      await page.goto("/search");
      await page.getByRole("searchbox").fill("Wine");
      await page.getByRole("button", { name: /^Wine Cellar/ }).click();
      await expect(page).toHaveURL("/wine-cellar");
    } else await page.goto("/wine-cellar");
    await page
      .locator(".destination-related")
      .getByRole("button", { name: "La Maison 1888", exact: true })
      .click();
    await expect(page).toHaveURL("/la-maison-1888");
    // Native Back/Forward remains available before entering embedded map history.
    await page.locator("[data-previous-destination]").click();
    await expect(page).toHaveURL("/wine-cellar");
    await page.goForward();
    await expect(page).toHaveURL("/la-maison-1888");
    for (let round = 0; round < 2; round++) {
      await page.getByRole("button", { name: "View on map", exact: true }).click();
      await expect(page).toHaveURL(/\/map/);
      if (round === 0) {
        await page.getByRole("button", { name: "Bensley Tour", exact: true }).click();
        await page
          .frameLocator('iframe[title="Official design tour"]')
          .getByRole("link", { name: "Tour chapter", exact: true })
          .click();
        await page.getByRole("button", { name: "Back to map", exact: true }).click();
      }
      await page.getByRole("button", { name: "Close map", exact: true }).click();
      await expect(page).toHaveURL("/la-maison-1888");
    }
    await page.locator("[data-previous-destination]").click();
    await expect(page).toHaveURL("/wine-cellar");
    await expect(page.locator("[data-previous-destination]")).toHaveCount(0);
    await page
      .locator(".destination-related")
      .getByRole("button", { name: "La Maison 1888", exact: true })
      .click();
    await expect(page).toHaveURL("/la-maison-1888");
    await page.locator("[data-previous-destination]").click();
    await expect(page).toHaveURL("/wine-cellar");
    await page.getByRole("button", { name: "BACK", exact: true }).click();
    await expect(page).toHaveURL(fromSearch ? "/search" : "/");
    if (fromSearch) await expect(page.getByRole("searchbox")).toHaveValue("Wine");
  });
}

test("the server-rendered sharing image uses the public absolute URL", async ({
  page,
  request,
}) => {
  const response = await request.get("/citron");
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(html).toMatch(
    /property="og:image" content="https:\/\/icdn\.artdigitaljourney\.com\/media\//,
  );
  await page.goto("/citron");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /^https:\/\/icdn\.artdigitaljourney\.com\/media\//,
  );
});

function menuPdf() {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 420] /Contents 5 0 R >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 420] /Contents 5 0 R >>",
    "<< /Length 0 >>\nstream\n\nendstream",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

test("rotating a scrolled PDF preserves the page and reading position without prior zoom", async ({
  page,
}) => {
  await page.route("**/api/resort-pdf?*", (route) =>
    route.fulfill({ contentType: "application/pdf", body: menuPdf() }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/citron");
  await page.getByRole("link", { name: "Test menu", exact: true }).click();
  const viewer = page.getByRole("dialog", { name: /Test menu/ });
  const scroller = viewer.locator("div.overflow-auto[aria-label]");
  const second = viewer.locator('[data-pdf-page="2"]');
  await expect(second).toBeAttached();
  await second.evaluate(async (el) => {
    const container = el.closest<HTMLElement>("div.overflow-auto[aria-label]")!;
    await new Promise<void>((resolve) => {
      container.addEventListener(
        "scroll",
        () => requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        { once: true },
      );
      el.scrollIntoView({ block: "start" });
    });
  });
  await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
  const position = () =>
    scroller.evaluate((el) => {
      const y = el.getBoundingClientRect().top + el.clientHeight / 2;
      const page = [...el.querySelectorAll<HTMLElement>("[data-pdf-page]")].find(
        (item) => item.getBoundingClientRect().bottom > y,
      )!;
      const bounds = page.getBoundingClientRect();
      return { page: page.dataset.pdfPage, fraction: (y - bounds.top) / bounds.height };
    });
  await expect.poll(async () => (await position()).page).toBe("2");
  const before = await position();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect
    .poll(() => second.evaluate((el) => el.getBoundingClientRect().width))
    .toBeGreaterThan(500);
  await expect.poll(async () => (await position()).page).toBe("2");
  await expect
    .poll(async () => Math.abs((await position()).fraction - before.fraction))
    .toBeLessThan(0.04);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => (await position()).page).toBe("2");
});
