const RESORT_HOSTS = new Set(["danang.intercontinental.com", "www.danang.intercontinental.com"]);
const BOOKING_HOSTS = new Set(["tablecheck.com", "www.tablecheck.com"]);
const RESORT_BOOKING =
  /^\/(?:[a-z]{2}\/)?intercontinental-danang-(?:la-maison|tingara)\/reserve(?:\/|$)/;

/** Only the resort website and its identified restaurant booking pages open inside the hub. */
export function embeddedResortUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return undefined;
    if (RESORT_HOSTS.has(url.hostname)) return url.href;
    if (BOOKING_HOSTS.has(url.hostname) && RESORT_BOOKING.test(url.pathname)) return url.href;
  } catch {
    // Invalid and unsupported destinations retain ordinary link handling.
  }
  return undefined;
}

/** Published resort PDFs use the browser's document viewer, which cannot run in a sandbox. */
export function isResortPdf(value: string): boolean {
  const allowed = embeddedResortUrl(value);
  if (!allowed) return false;
  const url = new URL(allowed);
  return (
    RESORT_HOSTS.has(url.hostname) &&
    url.pathname.startsWith("/wp-content/uploads/") &&
    url.pathname.toLowerCase().endsWith(".pdf")
  );
}
