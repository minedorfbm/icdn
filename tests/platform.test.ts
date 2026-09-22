import { describe, expect, test } from "bun:test";
import { withSecurityHeaders } from "../src/lib/security-headers";
import { createTimedCache } from "../src/lib/timed-cache";

describe("Worker response security", () => {
  test("adds baseline headers and preserves the response", async () => {
    const response = withSecurityHeaders(
      new Response("ok", { status: 201, headers: { "cache-control": "public" } }),
    );
    expect(response.status).toBe(201);
    expect(await response.text()).toBe("ok");
    expect(response.headers.get("cache-control")).toBe("public");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("strict-transport-security")).toContain("max-age=31536000");
  });
});

describe("hub cache", () => {
  test("deduplicates requests, expires, and retains the last complete value", async () => {
    const cache = createTimedCache<{ value: number; complete: boolean }>(100, (v) => v.complete);
    let reads = 0;
    const load = async () => ({ value: ++reads, complete: true });
    const [first, concurrent] = await Promise.all([cache(load, 0), cache(load, 0)]);
    expect(first).toEqual(concurrent);
    expect(reads).toBe(1);
    expect(await cache(load, 50)).toEqual(first);
    expect(await cache(async () => ({ value: 99, complete: false }), 101)).toEqual(first);
  });
});
