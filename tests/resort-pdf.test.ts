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
