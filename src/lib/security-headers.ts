// Enforce non-executable boundaries now; trial resource restrictions without breaking embeds.
const RESOURCE_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.instagram.com https://www.youtube.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://www.instagram.com",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://www.instagram.com https://danang.intercontinental.com https://www.danang.intercontinental.com https://tablecheck.com https://www.tablecheck.com",
  "worker-src 'self' blob:",
  "media-src 'self' blob: https:",
].join("; ");

const SECURITY_HEADERS = {
  "content-security-policy": "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
  "content-security-policy-report-only": RESOURCE_POLICY,
  "x-frame-options": "SAMEORIGIN",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
} as const;

/** Add safe baseline headers to dynamic Worker responses without changing their body. */
export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
