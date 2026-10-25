import { expect, test } from "bun:test";
import { createCspNonce, cspNonce } from "../src/lib/csp-nonce";
import { renderErrorPage } from "../src/lib/error-page";
import { withSecurityHeaders } from "../src/lib/security-headers";

test("each document authorizes its own recovery script and cannot be shared from an HTML cache", () => {
  const first = createCspNonce();
  const second = createCspNonce();
  expect(first).not.toBe(second);
  expect(atob(first)).toHaveLength(16);
  const response = withSecurityHeaders(
    new Response(renderErrorPage("ja", first), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public" },
    }),
    new Request("https://icdn.artdigitaljourney.com/"),
    first,
  );
  const policy = response.headers.get("content-security-policy")!;
  expect(policy).toContain(`'nonce-${first}'`);
  expect(policy).not.toContain(`'nonce-${second}'`);
  expect(policy.split(";").find((part) => part.trim().startsWith("script-src "))).not.toContain(
    "'unsafe-inline'",
  );
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
  expect(renderErrorPage("ja", first)).toContain(`<script nonce="${first}">`);
});

test.each([undefined, null, 17, "", 'bad" onload="alert(1)', "a".repeat(24)])(
  "a malformed context nonce cannot inject HTML or broaden the script policy: %j",
  (value) => {
    expect(cspNonce(value)).toBeUndefined();
    const nonce = typeof value === "string" ? value : undefined;
    expect(renderErrorPage("en", nonce)).not.toContain("nonce=");
    const policy = withSecurityHeaders(new Response("ok"), undefined, nonce).headers.get(
      "content-security-policy",
    )!;
    expect(policy).not.toContain("'nonce-");
    expect(policy).not.toContain("'unsafe-eval'");
  },
);
