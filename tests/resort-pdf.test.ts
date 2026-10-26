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
    new Response("not a PDF", { headers: { "content-type": "application/pdf-spoof" } }),
    Response.redirect("https://example.com/menu.pdf"),
  ]) {
    expect(
      (await serveResortPdf(proxy(source), (async () => upstream) as typeof fetch)).status,
    ).toBe(502);
  }
});

test("PDF content type accepts case-insensitive MIME with valid parameters", async () => {
  const result = await serveResortPdf(
    proxy(source),
    (async () =>
      new Response("%PDF-1.4", {
        headers: { "content-type": "Application/PDF; charset=binary" },
      })) as typeof fetch,
  );
  expect(result.status).toBe(200);
  expect(await result.text()).toBe("%PDF-1.4");
});

test("known-length PDFs expose range capability without buffering the whole document", async () => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const upstream = new Response(
    new ReadableStream({
      async pull(controller) {
        await pending;
        controller.enqueue(new TextEncoder().encode("%PDF-1.4"));
        controller.close();
      },
    }),
    {
      headers: {
        "content-type": "application/pdf",
        "content-length": "8",
        "accept-ranges": "bytes",
      },
    },
  );
  const result = await serveResortPdf(proxy(source), (async () => upstream) as typeof fetch);
  expect(result.headers.get("content-length")).toBe("8");
  expect(result.headers.get("accept-ranges")).toBe("bytes");
  release();
  expect(await result.text()).toBe("%PDF-1.4");
});

test("one bounded range is forwarded, validated and returned as partial content", async () => {
  const request = new Request(proxy(source), {
    headers: { range: "bytes=10-13", cookie: "private=1", authorization: "Bearer private" },
  });
  const result = await serveResortPdf(request, (async (_input, init) => {
    expect(new Headers(init?.headers).get("range")).toBe("bytes=10-13");
    expect(new Headers(init?.headers).get("cookie")).toBeNull();
    expect(new Headers(init?.headers).get("authorization")).toBeNull();
    return new Response("test", {
      status: 206,
      headers: {
        "content-type": "application/pdf",
        "content-range": "bytes 10-13/100",
        "content-length": "4",
      },
    });
  }) as typeof fetch);
  expect(result.status).toBe(206);
  expect(result.headers.get("content-range")).toBe("bytes 10-13/100");
  expect(result.headers.get("content-length")).toBe("4");
  expect(result.headers.get("accept-ranges")).toBe("bytes");
  expect(await result.text()).toBe("test");
});

test("the final range can be shorter when it reaches the document's end", async () => {
  const result = await serveResortPdf(
    new Request(proxy(source), { headers: { range: "bytes=6-20" } }),
    (async () =>
      new Response(".4", {
        status: 206,
        headers: { "content-type": "application/pdf", "content-range": "bytes 6-7/8" },
      })) as typeof fetch,
  );
  expect(result.status).toBe(206);
  expect(result.headers.get("content-length")).toBe("2");
  expect(await result.text()).toBe(".4");
});

test("multipart, open, reversed and excessive ranges never reach the origin", async () => {
  const forbidden = [
    "",
    "bytes=0-",
    "bytes=-20",
    "bytes=10-1",
    "bytes=0-1,4-5",
    "bytes=0-33554432",
    "bytes=33554432-33554433",
    "bytes=9007199254740992-9007199254740993",
  ];
  for (const range of forbidden) {
    const result = await serveResortPdf(new Request(proxy(source), { headers: { range } }), (() => {
      throw new Error("Unexpected fetch");
    }) as typeof fetch);
    expect(result.status).toBe(416);
  }
});

test("invalid range responses cannot masquerade as complete or unlimited PDFs", async () => {
  for (const headers of [
    {},
    { "content-range": "bytes 1-4/100" },
    { "content-range": "bytes 0-4/100" },
    { "content-range": "bytes 0-3/33554433" },
    { "content-range": "bytes 0-3/*" },
    { "content-range": "bytes 0-3/100", "content-length": "5" },
    { "content-range": "bytes 0-3/100", "content-length": "4e0" },
    { "content-range": "bytes 0-3/100", "content-encoding": "gzip" },
  ]) {
    let cancelled = false;
    const upstream = new Response(
      new ReadableStream({
        cancel() {
          cancelled = true;
        },
      }),
      { status: 206, headers: { ...headers, "content-type": "application/pdf" } },
    );
    const result = await serveResortPdf(
      new Request(proxy(source), { headers: { range: "bytes=0-3" } }),
      (async () => upstream) as typeof fetch,
    );
    expect(result.status).toBe(502);
    expect(cancelled).toBe(true);
  }
  const unsolicited = await serveResortPdf(
    proxy(source),
    (async () =>
      new Response("test", {
        status: 206,
        headers: { "content-type": "application/pdf", "content-range": "bytes 0-3/4" },
      })) as typeof fetch,
  );
  expect(unsolicited.status).toBe(502);
});

test("a server that ignores ranges safely falls back to a complete bounded PDF", async () => {
  const result = await serveResortPdf(
    new Request(proxy(source), { headers: { range: "bytes=0-3" } }),
    (async () =>
      new Response("%PDF-1.4", {
        headers: { "content-type": "application/pdf", "content-length": "8" },
      })) as typeof fetch,
  );
  expect(result.status).toBe(200);
  expect(result.headers.get("content-range")).toBeNull();
  expect(await result.text()).toBe("%PDF-1.4");
});

test("truncated and overlong partial bodies fail even when their headers look valid", async () => {
  for (const body of ["abc", "abcde"]) {
    const result = await serveResortPdf(
      new Request(proxy(source), { headers: { range: "bytes=0-3" } }),
      (async () =>
        new Response(body, {
          status: 206,
          headers: { "content-type": "application/pdf", "content-range": "bytes 0-3/100" },
        })) as typeof fetch,
    );
    await expect(result.text()).rejects.toThrow();
  }
});
