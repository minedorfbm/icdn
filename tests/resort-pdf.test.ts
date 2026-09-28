import { expect, test } from "bun:test";
import { serveResortPdf } from "../src/lib/resort-pdf.server";

const source = "https://www.danang.intercontinental.com/wp-content/uploads/2026/07/menu.pdf";
const proxy = (value: string) =>
  new Request(`https://icdn.artdigitaljourney.com/api/resort-pdf?url=${encodeURIComponent(value)}`);

test("PDF proxy rejects external hosts and other resort paths before fetching", async () => {
  const forbidden = [
    "https://www.danang.intercontinental.com.evil.example/wp-content/uploads/menu.pdf",
    "http://www.danang.intercontinental.com/wp-content/uploads/menu.pdf",
    "https://www.danang.intercontinental.com/private/menu.pdf",
  ];
  const unexpectedFetch = (() => {
    throw new Error("Unexpected network request");
  }) as typeof fetch;
  for (const value of forbidden) {
    const response = await serveResortPdf(proxy(value), unexpectedFetch);
    expect(response.status).toBe(400);
  }
});

test("PDF proxy streams a valid document without following off-site redirects", async () => {
  const fetched: string[] = [];
  const fakeFetch = ((input: URL, options: RequestInit) => {
    fetched.push(input.href);
    expect(options.redirect).toBe("manual");
    return Promise.resolve(
      new Response("%PDF-1.4", { headers: { "content-type": "application/pdf" } }),
    );
  }) as typeof fetch;
  const response = await serveResortPdf(proxy(`${source}?tracking=1`), fakeFetch);
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("application/pdf");
  expect(await response.text()).toBe("%PDF-1.4");
  expect(fetched).toEqual([source]);
});

test("oversized PDFs are rejected before streaming, even with a valid MIME type", async () => {
  let cancelled = false;
  const response = new Response(
    new ReadableStream({
      cancel() {
        cancelled = true;
      },
    }),
    {
      headers: { "content-type": "application/pdf", "content-length": String(33 * 1024 * 1024) },
    },
  );
  const result = await serveResortPdf(proxy(source), (async () => response) as typeof fetch);
  expect(result.status).toBe(413);
  expect(cancelled).toBe(true);
});

test("chunked PDFs cannot bypass the byte limit", async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      controller.enqueue(new Uint8Array(1024 * 1024));
    },
    cancel() {
      cancelled = true;
    },
  });
  const result = await serveResortPdf(
    proxy(source),
    (async () =>
      new Response(body, { headers: { "content-type": "application/pdf" } })) as typeof fetch,
  );
  await expect(result.arrayBuffer()).rejects.toThrow("PDF exceeds");
  expect(cancelled).toBe(true);
});

test("leaving the viewer aborts the upstream request and releases the response stream", async () => {
  const controller = new AbortController();
  let cancelled = false;
  let fetchSignal: AbortSignal | null | undefined;
  const result = await serveResortPdf(
    new Request(proxy(source), { signal: controller.signal }),
    (async (_input, init) => {
      fetchSignal = init?.signal;
      return new Response(
        new ReadableStream({
          cancel() {
            cancelled = true;
          },
        }),
        { headers: { "content-type": "application/pdf" } },
      );
    }) as typeof fetch,
  );
  controller.abort();
  await expect(result.arrayBuffer()).rejects.toThrow();
  expect(fetchSignal?.aborted).toBe(true);
  expect(cancelled).toBe(true);
});

test("HTML and redirects are rejected instead of being proxied as documents", async () => {
  for (const upstream of [
    new Response("<html>oops</html>", { headers: { "content-type": "text/html" } }),
    Response.redirect("https://example.com/menu.pdf"),
  ]) {
    expect(
      (await serveResortPdf(proxy(source), (async () => upstream) as typeof fetch)).status,
    ).toBe(502);
  }
});
