import { expect, test, type Locator } from "@playwright/test";

// Check geometry before clicking: click() would scroll a misplaced control into view.
async function expectPersistentTools(dialog: Locator, scroller: Locator) {
  const buttons = [
    dialog.getByRole("button", { name: "Search", exact: true }),
    dialog.getByRole("button", { name: "Contact", exact: true }),
  ];
  await expect(dialog).toBeVisible();
  const before = await Promise.all(buttons.map((button) => button.boundingBox()));
  expect(before.every(Boolean)).toBe(true);
  await scroller.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
  for (const [index, button] of buttons.entries()) {
    await expect
      .poll(async () => {
        const box = await button.boundingBox();
        return box ? Math.abs(box.y - before[index]!.y) : Infinity;
      })
      .toBeLessThan(1);
    const insideViewport = await button.evaluate((el) => {
      const box = el.getBoundingClientRect();
      return box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth;
    });
    expect(insideViewport).toBe(true);
  }
}

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

test("the hero displays before a slow catalogue and media waits for an opened card", async ({
  page,
  request,
}) => {
  await request.post("http://127.0.0.1:54329/control", {
    data: { delay: 3500, failCatalogue: true },
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const start = Date.now();
  await page.goto("/", { waitUntil: "commit" });
  await expect(page.locator(".threshold-img")).toBeVisible();
  console.log(`Hero visible after ${Date.now() - start}ms with catalogue delayed by 3500ms`);
  await expect(page.locator("#heaven")).toHaveCount(0);
  await expect(page.locator('#discover[aria-busy="true"]')).toBeVisible();
  await page.getByRole("button", { name: "Language", exact: true }).click();
  await page.getByRole("button", { name: /日本語/ }).click();
  await expect(page.getByRole("button", { name: "再試行", exact: true })).toBeVisible({
    timeout: 15000,
  });
  await request.post("http://127.0.0.1:54329/control", { data: { delay: 0 } });
  await page.getByRole("button", { name: "再試行", exact: true }).click();
  await expect(page.locator("#heaven")).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  const before = await (await request.get("http://127.0.0.1:54329/control")).json();
  expect(
    before.reads.filter((read: string) =>
      /destination_(photos|posts|videos|opening_hours)/.test(read),
    ),
  ).toEqual([]);
  // Offscreen card and backdrop images do not compete with the hero.
  await expect(page.locator("#sea img[src]")).toHaveCount(0);
  await page.locator("#heaven").getByRole("button", { name: "Citron", exact: true }).click();
  const card = page.getByRole("dialog", { name: "Citron", exact: true });
  await expect(card).toBeVisible();
  await expect(card.getByRole("button", { name: /Test video/ })).toBeVisible();
  const after = await (await request.get("http://127.0.0.1:54329/control")).json();
  for (const table of [
    "destination_photos",
    "destination_posts",
    "destination_videos",
    "destination_opening_hours",
  ]) {
    expect(
      after.reads.some(
        (read: string) => read.includes(table) && read.includes("destination_id=eq.citron"),
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
  await request.post("http://127.0.0.1:54329/control", { data: { delay: 0 } });
});

test("a failed card media request can be retried without losing the card", async ({
  page,
  request,
}) => {
  await request.post("http://127.0.0.1:54329/control", { data: { failMediaOnce: true } });
  await page.goto("/tingara");
  const card = page.getByRole("dialog", { name: "TINGARA", exact: true });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(card.getByRole("status")).toHaveCount(0);
  await expect(card).toBeVisible();
});

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

test("a direct card is visible before JavaScript starts and does not render the homepage", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto("http://127.0.0.1:4173/citron");
    const card = page.getByRole("dialog", { name: "Citron", exact: true });
    await expect(card).toBeVisible();
    await expect(card).toContainText("A restaurant overlooking the sea.");
    await expect(page.locator(".threshold-img, #heaven, .hub-tools")).toHaveCount(0);
    await expect(page.locator('link[rel="preload"][as="image"]')).toHaveCount(1);
  } finally {
    await context.close();
  }
});

test("refreshing an internally opened card does not restore the homepage behind it", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#heaven").getByRole("button", { name: "Citron", exact: true }).click();
  await expect(page).toHaveURL("/citron");
  await expect(page.locator(".threshold-img")).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole("dialog", { name: "Citron", exact: true })).toBeVisible();
  await expect(page.locator(".threshold-img, #heaven, .hub-tools")).toHaveCount(0);
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.locator(".threshold-img")).toBeVisible();
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
  await page.locator(".hub-search-tool button").first().click();
  await page.getByRole("searchbox").fill("Citron");
  await page.locator(".hub-search-results button").filter({ hasText: "Citron" }).click();
  await expect(page).toHaveURL("/citron");
  await expect(page.getByRole("dialog", { name: "Citron", exact: true })).toContainText(
    "海を望むレストラン。",
  );
  expect(errors).toEqual([]);
});

test("the compact map uses the home search and locates a matching place", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Explore the resort map/ }).click();
  const map = page.getByRole("dialog", { name: "Resort map" });
  await expect(map).toBeVisible();
  await expect(map.locator(".atlas-header")).toContainText("Resort map");
  await expect(map.locator(".atlas-header")).not.toContainText("INTERCONTINENTAL DANANG");
  await expect
    .poll(() => map.locator(".atlas-header").evaluate((el) => el.getBoundingClientRect().height))
    .toBeLessThan(80);

  await map.locator(".atlas-header").getByRole("button", { name: "Contact", exact: true }).click();
  const contact = page.getByRole("dialog", { name: "Contact", exact: true });
  await expect(contact.getByRole("link", { name: "Zalo", exact: true })).toHaveAttribute(
    "href",
    "https://zalo.me/842363938888",
  );
  await contact.getByRole("button", { name: "Close", exact: true }).click();
  await map.locator(".atlas-header").getByRole("button", { name: "Search", exact: true }).click();
  const search = page.getByRole("dialog", { name: "Search" });
  await expect(search.getByRole("heading", { name: "Find your next discovery" })).toBeVisible();
  await search.getByRole("searchbox").fill("Enchanted Holiday");
  await expect(search.getByRole("button", { name: /Enchanted Holiday Escape/ })).toHaveCount(0);
  await search.getByRole("searchbox").fill("Nature Discovery");
  await expect(search.getByRole("button", { name: /Nature Discovery/ })).toHaveCount(0);
  await search.getByRole("searchbox").fill("Citron");
  await search.getByRole("button", { name: /Citron/ }).click();
  await expect(search).toHaveCount(0);
  await expect(map.locator(".atlas-preview")).toContainText("Citron");
});

test("search and concierge remain usable on direct cards and inside the PDF browser", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/resort-pdf?*", (route) =>
    route.fulfill({ contentType: "application/pdf", body: menuPdf() }),
  );
  await page.goto("/citron");
  const card = page.getByRole("dialog", { name: "Citron", exact: true });
  await expectPersistentTools(card, card.locator("[data-destination-scroll]"));
  await card.getByRole("button", { name: "Contact", exact: true }).click();
  const contact = page.getByRole("dialog", { name: "Contact", exact: true });
  await expect(contact.getByRole("link", { name: "WhatsApp", exact: true })).toHaveAttribute(
    "href",
    "https://wa.me/842363938888",
  );
  await contact.getByRole("button", { name: "Close", exact: true }).click();
  await card.getByRole("button", { name: "Search", exact: true }).click();
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await expect(search.getByRole("searchbox")).toBeVisible();
  await search.getByRole("button", { name: "Contact", exact: true }).click();
  await expect(contact.getByRole("link", { name: "Phone call", exact: true })).toHaveAttribute(
    "href",
    "tel:+842363938888",
  );
  await contact.getByRole("button", { name: "Close", exact: true }).click();
  await search.getByRole("button", { name: "Close", exact: true }).click();
  await card.getByRole("link", { name: "Test menu", exact: true }).click();
  const viewer = page.getByRole("dialog", { name: /Test menu/ });
  await viewer.getByRole("button", { name: "Contact", exact: true }).click();
  await expect(contact.getByRole("link", { name: "Zalo", exact: true })).toBeVisible();
  await contact.getByRole("button", { name: "Close", exact: true }).click();
  await viewer.getByRole("button", { name: "Search", exact: true }).click();
  await search.getByRole("searchbox").fill("TINGARA");
  await search.getByRole("button", { name: /TINGARA/ }).click();
  await expect(viewer).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "TINGARA", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("Surprise me keeps search and concierge visible while its deck scrolls", async ({ page }) => {
  await page.goto("/");
  await page.locator(".discovery-surprise").click();
  const surprise = page.getByRole("dialog", { name: "Surprise me", exact: true });
  // A short screen exercises the overflow layout independently of card content length.
  await page.setViewportSize({ width: 390, height: 600 });
  await expectPersistentTools(surprise, surprise.locator("[data-surprise-scroll]"));
  await surprise.getByRole("button", { name: "Contact", exact: true }).click();
  const contact = page.getByRole("dialog", { name: "Contact", exact: true });
  await expect(contact.getByRole("link", { name: "WhatsApp", exact: true })).toBeVisible();
  await contact.getByRole("button", { name: "Close", exact: true }).click();
  await surprise.getByRole("button", { name: "Search", exact: true }).click();
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await search.getByRole("searchbox").fill("TINGARA");
  await search.getByRole("button", { name: /TINGARA/ }).click();
  await expect(surprise).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "TINGARA", exact: true })).toBeVisible();
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

test("expanded cards show localized hours and service days below the description", async ({
  page,
}) => {
  await page.goto("/tingara");
  const card = page.getByRole("dialog", { name: "TINGARA", exact: true });
  const hours = card.getByRole("region", { name: "OPENING HOURS", exact: true });
  await expect(hours).toContainText("17:30 – 22:00");
  await expect(hours).toContainText("Tue–Sun");
  await expect(hours).toContainText("Last order 21:45");
  const description = card.getByText("A restaurant overlooking the sea.", { exact: true });
  expect((await hours.boundingBox())!.y).toBeGreaterThan((await description.boundingBox())!.y);
});
