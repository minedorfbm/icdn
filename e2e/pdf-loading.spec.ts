import { expect, test } from "./fixtures";

// Valid, non-linearized PDF: the first page is near the start and the second near
// the end. An unused stream separates them, so useful pages need only a few ranges.
function largeMenuPdf() {
  const drawing = "0.7 0.6 0.4 rg 20 20 260 380 re f";
  const padding = "x".repeat(3 * 1024 * 1024);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 420] /Contents 5 0 R >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 420] /Contents 7 0 R >>",
    `<< /Length ${drawing.length} >>\nstream\n${drawing}\nendstream`,
    `<< /Length ${padding.length} >>\nstream\n${padding}\nendstream`,
    `<< /Length ${drawing.length} >>\nstream\n${drawing}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 8\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

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

test("large PDFs render and zoom using bounded ranges without a complete download", async ({
  page,
}) => {
  const pdf = largeMenuPdf();
  const ranges: string[] = [];
  let transferred = 0;
  await page.route("**/api/resort-pdf?*", async (route) => {
    const range = route.request().headers()["range"];
    const headers = {
      "content-type": "application/pdf",
      "accept-ranges": "bytes",
      "content-length": String(pdf.length),
    };
    if (!range) {
      // Headers advertise the document, but no complete body is available. The
      // reader must choose ranges before attempting to consume the full stream.
      await route.fulfill({ status: 200, headers, body: Buffer.alloc(0) });
      return;
    }
    const match = /^bytes=(\d+)-(\d+)$/.exec(range)!;
    const start = Number(match[1]);
    const end = Math.min(Number(match[2]), pdf.length - 1);
    const body = pdf.subarray(start, end + 1);
    ranges.push(range);
    transferred += body.length;
    await route.fulfill({
      status: 206,
      headers: {
        ...headers,
        "content-length": String(body.length),
        "content-range": `bytes ${start}-${end}/${pdf.length}`,
      },
      body,
    });
  });
  await page.goto("/citron");
  await expect(page.getByRole("button", { name: /CONTINUE THE JOURNEY/ })).toBeVisible();
  await page.getByRole("link", { name: "Test menu", exact: true }).click();
  const viewer = page.getByRole("dialog", { name: /Test menu/ });
  const first = viewer.locator('[data-pdf-page="1"] canvas');
  await expect(first).toBeVisible();
  await expect
    .poll(() => first.evaluate((canvas: HTMLCanvasElement) => canvas.width))
    .toBeGreaterThan(0);
  const second = viewer.locator('[data-pdf-page="2"]');
  await second.scrollIntoViewIfNeeded();
  await expect(second.locator("canvas")).toBeVisible();
  await viewer.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(viewer.getByRole("button", { name: "Zoom out", exact: true })).toBeVisible();
  expect(ranges.length).toBeGreaterThan(0);
  expect(transferred).toBeLessThan(pdf.length / 2);
  await viewer.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Citron", exact: true })).toBeVisible();
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 1000 },
]) {
  test(`PDF loading stays in one place through module and document stages at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    let releaseModule!: () => void;
    let releaseDocument!: () => void;
    const moduleGate = new Promise<void>((resolve) => {
      releaseModule = resolve;
    });
    const documentGate = new Promise<void>((resolve) => {
      releaseDocument = resolve;
    });
    let moduleRequested = false;
    let documentRequested = false;
    await page.route("**/assets/PdfMenu-*.js", async (route) => {
      moduleRequested = true;
      await moduleGate;
      await route.continue();
    });
    await page.route("**/api/resort-pdf?*", async (route) => {
      documentRequested = true;
      await documentGate;
      await route.fulfill({ contentType: "application/pdf", body: largeMenuPdf() });
    });
    try {
      await page.goto("/citron");
      const menu = page.getByRole("link", { name: "Test menu", exact: true });
      await menu.focus();
      await expect.poll(() => moduleRequested).toBe(true);
      await menu.click();
      const viewer = page.getByRole("dialog", { name: /Test menu/ });
      const status = viewer.getByRole("status");
      await expect(status).toHaveCount(1);
      await expect(status).toHaveText("Loading…");
      const text = status.locator("p");
      const before = await text.boundingBox();
      const content = await status.boundingBox();
      expect(Math.abs(before!.x + before!.width / 2 - viewport.width / 2)).toBeLessThan(2);
      expect(
        Math.abs(before!.y + before!.height / 2 - content!.y - content!.height / 2),
      ).toBeLessThan(2);
      releaseModule();
      await expect.poll(() => documentRequested).toBe(true);
      await expect(status).toHaveCount(1);
      const after = await text.boundingBox();
      expect(after).toEqual(before);
      await page.screenshot({ path: testInfo.outputPath("stable-pdf-loading.png") });
      releaseDocument();
      await expect(viewer.locator('[data-pdf-page="1"] canvas')).toBeVisible();
      await expect(status).toHaveCount(0);
      await viewer.getByRole("button", { name: "Close", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Citron", exact: true })).toBeVisible();
    } finally {
      releaseModule();
      releaseDocument();
    }
  });

  test(`web pages use one centered loader and preserve return at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("https://www.danang.intercontinental.com/book/", async (route) => {
      await gate;
      await route.fulfill({ contentType: "text/html", body: "<h1>Official booking page</h1>" });
    });
    try {
      await page.goto("/pilot-citron");
      await expect(page.getByRole("button", { name: /CONTINUE THE JOURNEY/ })).toBeVisible();
      await page.getByRole("link", { name: "Reserve your experience", exact: true }).click();
      const viewer = page.getByRole("dialog", { name: /Reserve your experience/ });
      const status = viewer.getByRole("status");
      await expect(status).toHaveCount(1);
      await expect(status).toHaveText("Loading…");
      const bounds = await status.locator("p").boundingBox();
      expect(Math.abs(bounds!.x + bounds!.width / 2 - viewport.width / 2)).toBeLessThan(2);
      await page.screenshot({ path: testInfo.outputPath("stable-web-loading.png") });
      release();
      await expect(status).toHaveCount(0);
      await expect(
        viewer.frameLocator("iframe").getByRole("heading", { name: "Official booking page" }),
      ).toBeVisible();
      await viewer.getByRole("button", { name: "Close", exact: true }).click();
      await expect(
        page.getByRole("dialog", { name: "Heaven dining preview", exact: true }),
      ).toBeVisible();
    } finally {
      release();
    }
  });
}
