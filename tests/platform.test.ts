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
    expect(response.status).toBe(201);
    expect(await response.text()).toBe("ok");
    expect(response.headers.get("cache-control")).toBe("public");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("strict-transport-security")).toContain("max-age=31536000");
  });
});
