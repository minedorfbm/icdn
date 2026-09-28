import { expect, test } from "@playwright/test";

// Minimal two-page PDF generated locally, with real offsets and no external download.
function menuPdf() {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 420] /Contents 5 0 R >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 420] /Contents 5 0 R >>",
    "<< /Length 0 >>\nstream\n\nendstream",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((n) => `${String(n).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

test("direct card, two-page PDF, zoom and return preserve navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/resort-pdf?*", (route) =>
    route.fulfill({ contentType: "application/pdf", body: menuPdf() }),
  );
  await page.goto("/citron");
  const card = page.getByRole("dialog", { name: "Citron", exact: true });
  await expect(card).toBeVisible();
  await card.getByRole("link", { name: "Test menu", exact: true }).click();
  const viewer = page.getByRole("dialog", { name: /Test menu/ });
  await expect(viewer.locator("[data-pdf-page]")).toHaveCount(2);
  const firstPage = viewer.locator('[data-pdf-page="1"]');
  const width = await firstPage.evaluate((el) => el.getBoundingClientRect().width);
  await viewer.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect
    .poll(() => firstPage.evaluate((el) => el.getBoundingClientRect().width))
    .toBeGreaterThan(width * 1.5);
  await viewer.getByRole("button", { name: "Close", exact: true }).click();
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(page).toHaveURL("/");
  expect(errors).toEqual([]);
});

test("language and search remain usable when browser storage is denied", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Denied", "SecurityError");
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator(".hub-tools button").last().click();
  await page.getByRole("button", { name: /日本語/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await page.locator(".hub-tools button").first().click();
  await page.getByRole("searchbox").fill("Citron");
  await page.locator(".hub-search-results button").filter({ hasText: "Citron" }).click();
  await expect(page).toHaveURL("/citron");
  await expect(page.getByRole("dialog", { name: "Citron", exact: true })).toContainText(
    "海を望むレストラン。",
  );
  expect(errors).toEqual([]);
});

test("the card deck advances and returns after horizontal pointer gestures", async ({ page }) => {
  await page.goto("/");
  const stage = page.locator("#heaven .touch-pan-y").first();
  await stage.scrollIntoViewIfNeeded();
  const active = stage.locator('article[aria-hidden="false"]');
  await expect(active).toContainText("Citron");
  // Exercise the production pointer handlers in mobile WebKit; real-device inertia remains a manual check.
  const swipe = async (start: number, end: number) => {
    await stage.dispatchEvent("pointerdown", {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      button: 0,
      clientX: start,
      clientY: 200,
    });
    await stage.dispatchEvent("pointermove", {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: end,
      clientY: 200,
    });
    await stage.dispatchEvent("pointerup", {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: end,
      clientY: 200,
    });
  };
  await swipe(300, 50);
  await expect(active).toContainText("TINGARA");
  await swipe(50, 300);
  await expect(active).toContainText("Citron");
});
