import { cspNonce } from "./csp-nonce";

// Only first-party/framework scripts bearing this response's nonce may run inline.
// Approved external providers remain allowed; inline handlers and eval stay blocked.
const FRAME_POLICY =
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://www.instagram.com https://danang.intercontinental.com https://www.danang.intercontinental.com https://tablecheck.com https://www.tablecheck.com";
const WORKER_POLICY = "worker-src 'self' blob:";
const CONNECT_POLICY =
  "connect-src 'self' https://www.instagram.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://www.google.com";
const RESOURCE_POLICY = [
  "default-src 'self'",
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  CONNECT_POLICY,
  FRAME_POLICY,
  WORKER_POLICY,
  "media-src 'self' blob: https:",
].join("; ");

const SECURITY_HEADERS = {
  "x-frame-options": "SAMEORIGIN",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
} as const;

/** Add safe baseline headers to dynamic Worker responses without changing their body. */
export function withSecurityHeaders(
  response: Response,
  request?: Request,
  nonce?: string,
): Response {
  const headers = new Headers(response.headers);
  const scriptNonce = cspNonce(nonce);
  const authorization = scriptNonce ? ` 'nonce-${scriptNonce}'` : "";
  const scripts = `script-src 'self'${authorization} https://www.instagram.com https://www.youtube.com https://www.googletagmanager.com`;
  const resources = `${RESOURCE_POLICY}; ${scripts}`;
  // Supersede the observation header if an upstream response still carries it.
  headers.delete("content-security-policy-report-only");
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  headers.set(
    "content-security-policy",
    `frame-ancestors 'self'; base-uri 'self'; object-src 'none'; ${resources}`,
  );
  // Nonces belong to this document, not to a shared HTML cache entry.
  if (headers.get("content-type")?.includes("text/html")) headers.set("cache-control", "no-store");
  // Only the two public demo pages may be framed by the ADJ marketing website.
  // All other responses keep SAMEORIGIN, including APIs and error pages.
  const url = request ? new URL(request.url) : undefined;
  if (
    url?.hostname === "icdn.artdigitaljourney.com" &&
    ["/", "/la-maison-1888", "/la-maison-1888/"].includes(url.pathname) &&
    ["GET", "HEAD"].includes(request!.method) &&
    response.status >= 200 &&
    response.status < 300 &&
    response.headers.get("content-type")?.includes("text/html")
  ) {
    headers.set(
      "content-security-policy",
      `frame-ancestors 'self' https://artdigitaljourney.com; base-uri 'self'; object-src 'none'; ${resources}`,
    );
    // CSP supplies the exact parent allowlist; SAMEORIGIN would conflict with it.
    headers.delete("x-frame-options");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
