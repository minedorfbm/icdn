// Frame/worker restrictions are enforced. Script and connection restrictions
// remain report-only until live provider checks are conclusive. SSR needs inline scripts.
const FRAME_POLICY =
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://www.instagram.com https://danang.intercontinental.com https://www.danang.intercontinental.com https://tablecheck.com https://www.tablecheck.com";
const WORKER_POLICY = "worker-src 'self' blob:";
const SCRIPT_POLICY =
  "script-src 'self' 'unsafe-inline' https://www.instagram.com https://www.youtube.com";
const CONNECT_POLICY = "connect-src 'self' https://www.instagram.com";
const ENFORCED_RESOURCES = `${FRAME_POLICY}; ${WORKER_POLICY}; script-src-attr 'none'`;
const RESOURCE_POLICY = [
  "default-src 'self'",
  SCRIPT_POLICY,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  CONNECT_POLICY,
  FRAME_POLICY,
  WORKER_POLICY,
  "media-src 'self' blob: https:",
].join("; ");

const SECURITY_HEADERS = {
  "content-security-policy": `frame-ancestors 'self'; base-uri 'self'; object-src 'none'; ${ENFORCED_RESOURCES}`,
  "content-security-policy-report-only": RESOURCE_POLICY,
  "x-frame-options": "SAMEORIGIN",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
} as const;

/** Add safe baseline headers to dynamic Worker responses without changing their body. */
export function withSecurityHeaders(response: Response, request?: Request): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
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
      `frame-ancestors 'self' https://artdigitaljourney.com; base-uri 'self'; object-src 'none'; ${ENFORCED_RESOURCES}`,
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
