import managedImages from "../src/data/image-variants.json" with { type: "json" };
import { expect, test, type Locator, type Page } from "./fixtures";

// Instagram is external; focused tests below replace this route with a deterministic script.
test.beforeEach(async ({ page }) => {
  await page.route("https://www.instagram.com/embed.js", (route) => route.abort());
});

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
  const initialReads = await (await request.get("http://127.0.0.1:54329/control")).json();
  const calls: URL[] = [];
  let unavailable = true;
  // Fail the browser request even when another test has warmed the server cache.
  await page.route("**/_serverFn/**", async (route) => {
    calls.push(new URL(route.request().url()));
    if (unavailable) {
      await new Promise((resolve) => setTimeout(resolve, 3500));
      return route.fulfill({ status: 503, contentType: "text/plain", body: "Test offline" });
    }
    return route.continue();
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const start = Date.now();
  await page.goto("/", { waitUntil: "commit" });
  await expect(page.locator(".threshold-img")).toBeVisible();
  console.log(`Hero visible after ${Date.now() - start}ms with catalogue delayed by 3500ms`);
  await expect(page.locator("#heaven")).toHaveCount(0);
  await expect(page.locator('#discover[aria-busy="true"]')).toBeVisible();
  await page.getByRole("button", { name: "Language · EN", exact: true }).click();
  await page.getByRole("button", { name: /日本語/ }).click();
  await expect(page.getByRole("button", { name: "再試行", exact: true })).toBeVisible({
    timeout: 15000,
  });
  unavailable = false;
  await page.getByRole("button", { name: "再試行", exact: true }).click();
  await expect(page.locator("#heaven")).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  const before = await (await request.get("http://127.0.0.1:54329/control")).json();
  expect(
    before.reads
      .slice(initialReads.reads.length)
      .filter((read: string) => /destination_(photos|posts|videos|opening_hours)/.test(read)),
  ).toEqual([]);
  expect(calls.every((url) => !url.searchParams.has("payload"))).toBe(true);
  // Offscreen card and backdrop images do not compete with the hero.
  await expect(page.locator("#sea img[src]")).toHaveCount(0);
  await page.locator("#heaven").getByRole("button", { name: "Citron", exact: true }).click();
  const card = page.getByRole("dialog", { name: "Citron", exact: true });
  await expect(card).toBeVisible();
  await expect(card.getByRole("heading", { name: "Test video", exact: true })).toBeVisible();
  // A cached media response still requires an opened card's explicit request.
  expect(calls.filter((url) => url.searchParams.get("payload")?.includes("citron"))).toHaveLength(
    1,
  );
  expect(errors).toEqual([]);
});

test("the hero selects the matching photo and preload in portrait and landscape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const hero = page.locator(".threshold-img");
  for (const [width, height, file] of [
    [390, 844, "intercontinental-touch-icon.png"],
    [1440, 900, "intercontinental-favicon.png"],
    [834, 1194, "intercontinental-touch-icon.png"],
    [1194, 834, "intercontinental-favicon.png"],
  ] as const) {
    await page.setViewportSize({ width, height });
    await expect
      .poll(() => hero.evaluate((image: HTMLImageElement) => image.currentSrc))
      .toBe(Object.values(managedImages).find((image) => image.aliases.includes(`/${file}`))!.src);
    const activePreloads = await page
      .locator('link[rel="preload"][as="image"][media]')
      .evaluateAll((links) =>
        links
          .filter((link) => matchMedia(link.getAttribute("media") || "all").matches)
          .map((link) => link.getAttribute("href")),
      );
    expect(activePreloads).toEqual([
      Object.values(managedImages).find((image) => image.aliases.includes(`/${file}`))!.src,
    ]);
  }
});

test("a failed card media request can be retried without losing the card", async ({ page }) => {
  let mediaCalls = 0;
  await page.route("**/_serverFn/**", (route) => {
    const payload = new URL(route.request().url()).searchParams.get("payload");
    if (!payload?.includes("tingara")) return route.continue();
    mediaCalls++;
    return mediaCalls === 1
      ? route.fulfill({ status: 503, contentType: "text/plain", body: "Test media offline" })
      : route.continue();
  });
  await page.goto("/tingara");
  const card = page.getByRole("dialog", { name: "TINGARA", exact: true });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(card.getByRole("status")).toHaveCount(0);
  await expect(card).toBeVisible();
  expect(mediaCalls).toBe(2);
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

test("a broken PDF offers its original link and reopening can recover", async ({ page }) => {
  let fail = true;
  await page.route("**/api/resort-pdf?*", (route) =>
    route.fulfill(
      fail
        ? { status: 503, body: "Temporarily unavailable" }
        : { contentType: "application/pdf", body: menuPdf() },
    ),
  );
  await page.goto("/citron");
  const card = page.getByRole("dialog", { name: "Citron", exact: true });
  await card.getByRole("link", { name: "Test menu", exact: true }).click();
  const viewer = page.getByRole("dialog", { name: /Test menu/ });
  await expect(viewer).toContainText("This document could not be displayed");
  await expect(viewer.getByRole("button", { name: "Zoom in", exact: true })).toHaveCount(0);
  await expect(viewer.locator('a[href$="/test-menu.pdf"]')).toBeVisible();
  await viewer.getByRole("button", { name: "Close", exact: true }).click();
  fail = false;
  await card.getByRole("link", { name: "Test menu", exact: true }).click();
  await expect(viewer.locator("[data-pdf-page]")).toHaveCount(2);
});

test("PDF pinch zoom commits around the gesture and cancellation preserves the reading scale", async ({
  page,
}) => {
  await page.route("**/api/resort-pdf?*", (route) =>
    route.fulfill({ contentType: "application/pdf", body: menuPdf() }),
  );
  await page.goto("/citron");
  await page.getByRole("link", { name: "Test menu", exact: true }).click();
  const viewer = page.getByRole("dialog", { name: /Test menu/ });
  const first = viewer.locator('[data-pdf-page="1"]');
  await expect(first.locator("canvas")).toBeVisible();
  const initialWidth = await first.evaluate((el) => el.getBoundingClientRect().width);
  const pinch = async (cancel: boolean) =>
    first.evaluate((node, cancelled) => {
      const target = node.parentElement!.parentElement!;
      const box = node.getBoundingClientRect();
      const dispatch = (type: string, distance: number) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        const touches =
          type === "touchend" || type === "touchcancel"
            ? []
            : [
                { clientX: box.left + 80, clientY: box.top + 100 },
                { clientX: box.left + 80 + distance, clientY: box.top + 100 },
              ];
        Object.defineProperty(event, "touches", { value: touches });
        target.dispatchEvent(event);
      };
      dispatch("touchstart", 60);
      dispatch("touchmove", 120);
      dispatch(cancelled ? "touchcancel" : "touchend", 120);
    }, cancel);
  await pinch(true);
  expect(await first.evaluate((el) => el.getBoundingClientRect().width)).toBeCloseTo(
    initialWidth,
    1,
  );
  await pinch(false);
  await expect(viewer.getByRole("button", { name: "Zoom out", exact: true })).toBeVisible();
  await expect
    .poll(() => first.evaluate((el) => el.getBoundingClientRect().width))
    .toBeGreaterThan(initialWidth * 1.8);
  await viewer.getByRole("button", { name: "Zoom out", exact: true }).click();
  await expect
    .poll(() => first.evaluate((el) => el.getBoundingClientRect().width))
    .toBeCloseTo(initialWidth, 1);
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

test("Surprise me fits the viewport without counters or overlapping contact controls", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".discovery-surprise").click();
  const surprise = page.getByRole("dialog", { name: "Surprise me", exact: true });
  await expect(surprise.locator("nav")).toHaveCount(0);
  await expect(surprise.locator('[aria-live="polite"]')).toHaveCount(0);
  for (const size of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(size);
    await expect
      .poll(() => surprise.evaluate((el) => el.scrollHeight - el.clientHeight))
      .toBeLessThanOrEqual(1);
    const card = await surprise.locator(".perspective-card").first().boundingBox();
    const phone = await surprise
      .getByRole("button", { name: "Contact", exact: true })
      .boundingBox();
    expect(card!.y + card!.height).toBeLessThan(phone!.y);
    expect(phone!.y + phone!.height).toBeLessThanOrEqual(size.height);
    const heading = await surprise.locator(".surprise-heading").boundingBox();
    const tools = await surprise.locator(".surprise-tools").boundingBox();
    expect(heading!.y).toBeLessThan(tools!.y + tools!.height);
  }
  const stage = surprise.locator(".discovery-stack > .touch-pan-y");
  const active = stage.locator('article[aria-hidden="false"]');
  const firstName = await active.innerText();
  for (const [event, x] of [
    ["pointerdown", 280],
    ["pointermove", 40],
    ["pointerup", 40],
  ] as const) {
    await stage.dispatchEvent(event, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      button: 0,
      clientX: x,
      clientY: 250,
    });
  }
  await expect.poll(() => active.innerText()).not.toBe(firstName);
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

test("card surfaces open with touch and keyboard while their menu links stay independent", async ({
  page,
}) => {
  await page.route("**/api/resort-pdf?*", (route) =>
    route.fulfill({ contentType: "application/pdf", body: menuPdf() }),
  );
  await page.goto("/");
  const active = page.locator('#heaven article[aria-hidden="false"]');
  const opener = active.getByRole("button", { name: "Citron", exact: true });
  const card = page.getByRole("dialog", { name: "Citron", exact: true });
  await active.scrollIntoViewIfNeeded();
  // Tap the image above the title: the native title button covers the whole card surface.
  await active.tap({ position: { x: 100, y: 100 } });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(opener).toBeFocused();
  for (const key of ["Enter", "Space"]) {
    await opener.press(key);
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "BACK", exact: true }).click();
    await expect(opener).toBeFocused();
  }
  await active.getByRole("link", { name: "Test menu", exact: true }).click();
  await expect(page.getByRole("dialog", { name: /Test menu/ })).toBeVisible();
  await expect(card).toHaveCount(0);
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
  // The click emitted after a drag must not open the newly active card.
  await active.getByRole("button", { name: "Citron", exact: true }).dispatchEvent("click", {
    detail: 1,
  });
  await expect(page.getByRole("dialog", { name: "Citron", exact: true })).toHaveCount(0);
  // Keyboard activation remains available immediately after a swipe.
  await active.getByRole("button", { name: "Citron", exact: true }).press("Enter");
  await expect(page.getByRole("dialog", { name: "Citron", exact: true })).toBeVisible();
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

test("notice translations show only current copy and fall back together when either source changes", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("adj-lang", "ja"));
  await page.goto("/nature-experiences");
  const card = page.getByRole("dialog", { name: "Nature Discovery", exact: true });
  await expect(card.getByRole("heading", { name: "お知らせ current", exact: true })).toBeVisible();
  await expect(card.getByText("最新情報 current", { exact: true })).toBeVisible();
  for (const id of ["changed-title", "changed-body", "untranslated"]) {
    await expect(card.getByRole("heading", { name: `Update ${id}`, exact: true })).toBeVisible();
    await expect(card.getByText(`Current information ${id}`, { exact: true })).toBeVisible();
    await expect(card.getByText(`お知らせ ${id}`, { exact: true })).toHaveCount(0);
    await expect(card.getByText(`最新情報 ${id}`, { exact: true })).toHaveCount(0);
  }
});

test("the card deck ignores stray pointers, coalesces moves and recovers from cancellation", async ({
  page,
}) => {
  await page.goto("/");
  const stage = page.locator("#heaven .touch-pan-y").first();
  await stage.scrollIntoViewIfNeeded();
  const active = stage.locator('article[aria-hidden="false"]');
  await expect(active).toContainText("Citron");
  const front = stage.locator('[data-destination-id="citron"]');
  const restingTransform = await front.evaluate((el) => el.style.transform);
  const pointer = { pointerId: 1, pointerType: "touch", isPrimary: true, button: 0, clientY: 200 };
  // Hover/release events without a matching start must not create a gesture.
  await stage.dispatchEvent("pointermove", { ...pointer, clientX: 50 });
  await stage.dispatchEvent("pointerup", { ...pointer, clientX: 50 });
  await expect(active).toContainText("Citron");
  await stage.dispatchEvent("pointerdown", { ...pointer, clientX: 300 });
  // A second finger cannot move or end the primary finger's gesture.
  await stage.dispatchEvent("pointermove", {
    ...pointer,
    pointerId: 2,
    isPrimary: false,
    clientX: 50,
  });
  await stage.dispatchEvent("pointerup", {
    ...pointer,
    pointerId: 2,
    isPrimary: false,
    clientX: 50,
  });
  expect(await front.evaluate((el) => el.style.transform)).toBe(restingTransform);
  // Both moves arrive in one frame; render the latest position and retain the active card until release.
  await stage.evaluate((el, init) => {
    el.dispatchEvent(new PointerEvent("pointermove", { ...init, bubbles: true, clientX: 220 }));
    el.dispatchEvent(new PointerEvent("pointermove", { ...init, bubbles: true, clientX: 50 }));
  }, pointer);
  await expect.poll(() => front.evaluate((el) => el.style.transform)).not.toBe(restingTransform);
  await expect(active).toContainText("Citron");
  await stage.dispatchEvent("pointercancel", { ...pointer, clientX: 50 });
  await expect.poll(() => front.evaluate((el) => el.style.transform)).toBe(restingTransform);
  await expect(active).toContainText("Citron");
  await stage.dispatchEvent("pointerdown", { ...pointer, clientX: 300 });
  await stage.dispatchEvent("pointermove", { ...pointer, clientX: 50 });
  await stage.dispatchEvent("pointerup", {
    ...pointer,
    pointerId: 2,
    isPrimary: false,
    clientX: 50,
  });
  await expect(active).toContainText("Citron");
  await stage.dispatchEvent("pointerup", { ...pointer, clientX: 50 });
  await expect(active).toContainText("TINGARA");
  await stage.dispatchEvent("pointerup", { ...pointer, clientX: 50 });
  await expect(active).toContainText("TINGARA");
});

const instagramTestScript = (delay: number) => `
window.instgrm = { Embeds: { process() {
  document.querySelectorAll('.instagram-media').forEach((post) => {
    if (post.dataset.testProcessing) return;
    post.dataset.testProcessing = 'true';
    setTimeout(() => {
      if (!post.isConnected) return;
      const frame = document.createElement('iframe');
      frame.title = 'Instagram test post';
      frame.srcdoc = '<p>Official Instagram post</p>';
      post.replaceWith(frame);
    }, ${delay});
  });
} } };
`;

test("a slow Instagram embed still appears after the former fallback deadline", async ({
  page,
  request,
}) => {
  await request.post("http://127.0.0.1:54329/control", { data: {} });
  try {
    await page.route("https://www.instagram.com/embed.js", (route) =>
      route.fulfill({ contentType: "application/javascript", body: instagramTestScript(3300) }),
    );
    await page.goto("/citron");
    const card = page.getByRole("dialog", { name: "Citron", exact: true });
    await expect(card.locator(".instagram-media")).toHaveCount(1);
    await card
      .locator("[data-destination-scroll]")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
    const frame = card.locator('iframe[title="Instagram test post"]');
    await expect(frame).toBeVisible({ timeout: 10000 });
    await expect(card.getByRole("button", { name: "Try again", exact: true })).toHaveCount(0);
  } finally {
    await request.post("http://127.0.0.1:54329/control", { data: {} });
  }
});

test("Instagram can retry a failed script without reloading the card", async ({
  page,
  request,
}) => {
  await request.post("http://127.0.0.1:54329/control", { data: {} });
  let loads = 0;
  try {
    await page.route("https://www.instagram.com/embed.js", (route) => {
      loads += 1;
      return loads === 1
        ? route.abort()
        : route.fulfill({ contentType: "application/javascript", body: instagramTestScript(0) });
    });
    await page.goto("/citron");
    const card = page.getByRole("dialog", { name: "Citron", exact: true });
    await expect(card.locator(".instagram-media")).toHaveCount(1);
    await card
      .locator("[data-destination-scroll]")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await expect(card.getByRole("link", { name: "VIEW ON INSTAGRAM", exact: true })).toBeVisible();
    await card.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(card.locator('iframe[title="Instagram test post"]')).toBeVisible();
    expect(loads).toBe(2);
  } finally {
    await request.post("http://127.0.0.1:54329/control", { data: {} });
  }
});

test("Instagram retry replaces a stalled player without restarting neighbouring posts", async ({
  page,
}) => {
  let scripts = 0;
  await page.route("https://www.instagram.com/embed.js", (route) => {
    scripts++;
    return route.fulfill({
      contentType: "application/javascript",
      body: `const attempts = new Map();
      window.instgrm = { Embeds: { process() {
        document.querySelectorAll('blockquote.instagram-media').forEach((post) => {
          if (post.dataset.processed) return;
          post.dataset.processed = 'true';
          const url = post.dataset.instgrmPermalink;
          const count = (attempts.get(url) || 0) + 1;
          attempts.set(url, count);
          const first = url.includes('/SHORT/');
          const stalled = first && count === 1;
          const frame = document.createElement('iframe');
          frame.title = first ? 'Retryable post' : 'Neighbour post';
          frame.dataset.attempt = String(count);
          frame.style.cssText = 'display:block;width:100%;border:0;height:' + (stalled ? 0 : 500) + 'px';
          if (stalled) frame.style.position = 'absolute';
          frame.srcdoc = '<p>Official Instagram post</p>';
          post.before(frame);
          post.style.display = 'none';
        });
      } } };`,
    });
  });
  await page.goto("/la-maison-1888");
  const card = page.getByRole("dialog", { name: "La Maison 1888", exact: true });
  await card.locator("[data-instagram-track]").scrollIntoViewIfNeeded();
  const first = card.locator(".instagram-post").first();
  const retry = first.getByRole("button", { name: "Try again", exact: true });
  await expect(retry).toBeVisible({ timeout: 15000 });
  await expect(first.getByRole("link", { name: "VIEW ON INSTAGRAM", exact: true })).toBeVisible();
  const neighbour = card.locator('iframe[title="Neighbour post"]');
  await expect(neighbour).toHaveAttribute("data-attempt", "1");
  await retry.click();
  const recovered = first.locator('iframe[title="Retryable post"]');
  await expect(recovered).toHaveAttribute("data-attempt", "2");
  await expect(recovered).toBeVisible();
  await expect(retry).toHaveCount(0);
  await expect(first.locator("iframe")).toHaveCount(1);
  await expect(neighbour).toHaveAttribute("data-attempt", "1");
  expect(scripts).toBe(1);
});

async function openInstagramCarousel(page: Page, path: string, name: string) {
  let loads = 0;
  await page.route("https://www.instagram.com/embed.js", (route) => {
    loads += 1;
    return route.fulfill({
      contentType: "application/javascript",
      body: `
      window.embedPasses = 0;
      window.instgrm = { Embeds: { process() {
        window.embedPasses++;
        document.querySelectorAll('.instagram-media').forEach((post) => {
          const short = post.dataset.instgrmPermalink.includes('/SHORT/');
          const frame = document.createElement('iframe');
          frame.title = short ? 'Short post' : 'Tall post';
          frame.dataset.captioned = String(post.hasAttribute('data-instgrm-captioned'));
          frame.style.cssText = 'display:block;width:100%;border:0;height:' + (short ? 260 : 920) + 'px';
          frame.srcdoc = '<p>Official Instagram post</p>';
          post.replaceWith(frame);
        });
      } } };
    `,
    });
  });
  await page.goto(path);
  const card = page.getByRole("dialog", { name, exact: true });
  const track = card.locator("[data-instagram-track]");
  await expect(track).toBeVisible();
  await track.scrollIntoViewIfNeeded();
  await expect(card.locator('iframe[title="Short post"]')).toBeVisible();
  await expect(card.locator('iframe[title="Tall post"]')).toBeAttached();
  return { card, track, loadCount: () => loads };
}

async function resizeInstagramPost(card: Locator, title: string, height: number) {
  await card.locator(`iframe[title="${title}"]`).evaluate((el, nextHeight) => {
    (el as HTMLElement).style.height = `${nextHeight}px`;
  }, height);
}

async function expectInstagramPagination(card: Locator) {
  await expect
    .poll(() =>
      card.evaluate((el) => {
        const dots = el.querySelector("[data-instagram-pagination]")!.getBoundingClientRect();
        const track = el.querySelector("[data-instagram-track]")!.getBoundingClientRect();
        const gap = dots.top - track.bottom;
        return gap >= 0 && gap <= 10;
      }),
    )
    .toBe(true);
}

for (const [path, name] of [
  ["/la-maison-1888", "La Maison 1888"],
  ["/nature-experiences", "Nature Discovery"],
]) {
  test(`${name} shows a legible caption excerpt with tightly spaced posts and dots`, async ({
    page,
  }) => {
    const { card, track, loadCount } = await openInstagramCarousel(page, path, name);
    await expect(card.locator('iframe[title="Short post"]')).toHaveAttribute(
      "data-captioned",
      "true",
    );
    await expect(card.locator('iframe[title="Tall post"]')).toHaveAttribute(
      "data-captioned",
      "true",
    );
    const expectHeight = async (naturalHeight: number) => {
      const size = page.viewportSize()!;
      const postIndex = naturalHeight >= 920 ? 1 : 0;
      const post = card.locator(".instagram-post").nth(postIndex);
      const frame = post.locator("iframe");
      const viewport = post.locator(".instagram-post-viewport");
      const bounds = post.locator(".instagram-post-bounds");
      await expect
        .poll(async () => {
          const box = (await viewport.boundingBox())!;
          const limit = (await bounds.boundingBox())!;
          const media = (await frame.boundingBox())!;
          const fillsEnvelope =
            Math.abs(Math.max(box.width / limit.width, box.height / limit.height) - 1) < 0.01;
          const fitsEnvelope = box.width <= limit.width + 1 && box.height <= limit.height + 1;
          const naturalWidth = await frame.evaluate((el) => (el as HTMLElement).offsetWidth);
          const keepsAspectRatio =
            Math.abs(media.width / media.height - naturalWidth / naturalHeight) < 0.01;
          const followsPreview = Math.abs((await track.boundingBox())!.height - box.height) <= 1;
          return fillsEnvelope && fitsEnvelope && keepsAspectRatio && followsPreview;
        })
        .toBe(true);
      const box = (await viewport.boundingBox())!;
      const limit = (await bounds.boundingBox())!;
      expect(box.width).toBeGreaterThan(limit.width * 0.75);
      expect(box.width).toBeLessThanOrEqual(320);
      expect(box.height).toBeLessThanOrEqual(800);
      expect(box.height).toBeLessThanOrEqual(Math.max(160, size.height - 80) + 1);
      expect(Math.abs((await post.boundingBox())!.width - box.width)).toBeLessThan(1);
      if (naturalHeight >= 920) {
        await expect(viewport).toHaveAttribute("data-caption-preview", "true");
        expect((await frame.boundingBox())!.height).toBeGreaterThan(box.height);
      } else {
        await expect(viewport).not.toHaveAttribute("data-caption-preview");
      }
      // Read both rectangles in one frame while smooth scrolling is settling.
      await expect
        .poll(() =>
          card.locator(".instagram-post-viewport").evaluateAll(([first, second]) => {
            const left = first!.getBoundingClientRect();
            return second!.getBoundingClientRect().left - left.right;
          }),
        )
        .toBeCloseTo(16, 0);
      await expectInstagramPagination(card);
    };
    await expectHeight(260);
    // Focusing an embedded control can vertically scroll even an overflow-y:hidden
    // track. Keep the post header visible instead of retaining that hidden offset.
    await track.evaluate((el) => {
      el.scrollTop = 37;
    });
    await expect.poll(() => track.evaluate((el) => el.scrollTop)).toBe(0);
    await card.getByRole("button", { name: "2 / 2", exact: true }).click();
    await expectHeight(920);
    for (const size of [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(size);
      await card.getByRole("button", { name: "2 / 2", exact: true }).click();
      await expectHeight(920);
    }
    await card.getByRole("button", { name: "1 / 2", exact: true }).click();
    await expectHeight(260);
    // Simulate Instagram adjusting its iframe after a media resize message.
    await resizeInstagramPost(card, "Short post", 360);
    await expectHeight(360);
    await card.getByRole("button", { name: "2 / 2", exact: true }).click();
    await expectHeight(920);
    const beforeCaptionChange = await card.locator(".instagram-post-viewport").nth(1).boundingBox();
    // A longer native caption should be clipped, not shrink the photo or open a gap.
    await resizeInstagramPost(card, "Tall post", 1800);
    await expectHeight(1800);
    const afterCaptionChange = await card.locator(".instagram-post-viewport").nth(1).boundingBox();
    expect(afterCaptionChange!.width).toBeCloseTo(beforeCaptionChange!.width, 0);
    expect(afterCaptionChange!.height).toBeCloseTo(beforeCaptionChange!.height, 0);

    expect(loadCount()).toBe(1);
    expect(
      await page.evaluate(() => (window as Window & { embedPasses: number }).embedPasses),
    ).toBe(1);
  });
}

test("Instagram keeps its placeholder until the initial zero-height iframe is ready", async ({
  page,
}) => {
  await page.route("https://www.instagram.com/embed.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.instgrm = { Embeds: { process() {
      document.querySelectorAll('blockquote.instagram-media').forEach((post) => {
        if (post.dataset.testProcessing) return;
        post.dataset.testProcessing = 'true';
        const frame = document.createElement('iframe');
        frame.title = 'Initializing Instagram post';
        frame.style.cssText = 'height:0;position:absolute;display:block;width:100%;border:0';
        frame.srcdoc = '<p>Official Instagram post</p>';
        post.before(frame);
      });
    } } };`,
    }),
  );
  await page.goto("/citron");
  const card = page.getByRole("dialog", { name: "Citron", exact: true });
  await expect(card.locator(".instagram-media")).toHaveCount(1);
  await card.locator("[data-destination-scroll]").evaluate((el) => el.scrollTo(0, el.scrollHeight));
  const frame = card.locator('iframe[title="Initializing Instagram post"]');
  await expect(frame).toBeAttached();
  await expect(card.locator("[data-instagram-loading]")).toBeVisible();
  await expect(
    card.getByRole("link", { name: "https://www.instagram.com/p/TESTPOST/", exact: true }),
  ).toBeHidden();
  // A stuck zero-height player must fall back even though an iframe exists.
  await expect(card.getByRole("button", { name: "Try again", exact: true })).toBeVisible({
    timeout: 15000,
  });
  await expect(card.locator("[data-instagram-loading]")).toHaveCount(0);
  await frame.evaluate((el) => {
    (el as HTMLElement).style.height = "500px";
    (el as HTMLElement).style.position = "static";
  });
  await expect(frame).toBeVisible();
  await expect(card.getByRole("button", { name: "Try again", exact: true })).toHaveCount(0);
  await expect(card.locator("[data-instagram-loading]")).toHaveCount(0);
});
