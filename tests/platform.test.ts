import { describe, expect, test } from "bun:test";
import { withSecurityHeaders } from "../src/lib/security-headers";

describe("Worker response security", () => {
  test("adds baseline headers and preserves the response", async () => {
    const response = withSecurityHeaders(
      new Response("ok", { status: 201, headers: { "cache-control": "public" } }),
    );
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'self'");
    expect(response.headers.get("content-security-policy-report-only")).toContain(
      "worker-src 'self' blob:",
    );
    const policy = response.headers.get("content-security-policy")!;
    expect(policy).toContain("frame-src https://www.youtube-nocookie.com");
    expect(policy).toContain("https://www.instagram.com");
    expect(policy).toContain("https://www.tablecheck.com");
    expect(policy).toContain("worker-src 'self' blob:");
    expect(policy).toContain("script-src-attr 'none'");
    expect(response.status).toBe(201);
    expect(await response.text()).toBe("ok");
    expect(response.headers.get("cache-control")).toBe("public");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("strict-transport-security")).toContain("max-age=31536000");
  });
  test.each(["/", "/la-maison-1888", "/la-maison-1888/?lang=fr"])(
    "allows only the ADJ origin to frame public demo HTML at %s",
    (path) => {
      const response = withSecurityHeaders(
        new Response("demo", { headers: { "content-type": "text/html; charset=utf-8" } }),
        new Request(`https://icdn.artdigitaljourney.com${path}`),
      );
      expect(response.headers.get("content-security-policy")).toContain(
        "frame-ancestors 'self' https://artdigitaljourney.com; base-uri 'self'; object-src 'none'",
      );
      expect(response.headers.has("x-frame-options")).toBe(false);
      expect(response.headers.get("permissions-policy")).toContain("camera=()");
      expect(response.headers.get("content-security-policy-report-only")).toContain(
        "default-src 'self'",
      );
    },
  );

  test.each([
    { url: "https://icdn.artdigitaljourney.com/api/resort-pdf", status: 200, type: "text/html" },
    { url: "https://icdn.artdigitaljourney.com/admin", status: 200, type: "text/html" },
    {
      url: "https://icdn.artdigitaljourney.com/la-maison-1888-extra",
      status: 200,
      type: "text/html",
    },
    { url: "https://other.example/", status: 200, type: "text/html" },
    { url: "https://icdn.artdigitaljourney.com/", status: 500, type: "text/html" },
    { url: "https://icdn.artdigitaljourney.com/", status: 200, type: "application/json" },
    { url: "https://icdn.artdigitaljourney.com/", status: 200, type: "text/html", method: "POST" },
  ])("keeps other responses same-origin: %j", ({ url, status, type, method }) => {
    const response = withSecurityHeaders(
      new Response("protected", { status, headers: { "content-type": type } }),
      new Request(url, { method: method ?? "GET" }),
    );
    expect(response.headers.get("content-security-policy")).toContain(
      "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
    );
    expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
  });
});
