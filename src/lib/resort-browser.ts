import { httpsUrl } from "./external-url";

const RESORT_HOSTS = new Set(["danang.intercontinental.com", "www.danang.intercontinental.com"]);
const BOOKING_HOSTS = new Set(["tablecheck.com", "www.tablecheck.com"]);
const RESORT_BOOKING =
  /^\/(?:[a-z]{2}\/)?intercontinental-danang-(?:la-maison|tingara)\/reserve(?:\/|$)/;

/** IHG blocks third-party framing; keep Rewards navigation in this tab with native Back. */
export function resortLinkTarget(value: string): "_self" | "_blank" {
  const url = httpsUrl(value, ["www.ihg.com", "ihg.com"]);
  return url?.pathname.startsWith("/onerewards/") ? "_self" : "_blank";
}

/** Only the resort website and its identified restaurant booking pages open inside the hub. */
export function embeddedResortUrl(value: string): string | undefined {
  try {
    const url = httpsUrl(value, [...RESORT_HOSTS, ...BOOKING_HOSTS]);
    if (!url) return undefined;
    if (RESORT_HOSTS.has(url.hostname)) {
      // Official HTML pages redirect to www. PDF origins must remain unchanged:
      // the bounded PDF proxy deliberately refuses redirects.
      if (!url.pathname.toLowerCase().endsWith(".pdf"))
        url.hostname = "www.danang.intercontinental.com";
      return url.href;
    }
    if (BOOKING_HOSTS.has(url.hostname) && RESORT_BOOKING.test(url.pathname)) return url.href;
  } catch {
    // Invalid and unsupported destinations retain ordinary link handling.
  }
  return undefined;
}

/** Published resort PDFs are served through the restricted proxy and rendered with PDF.js. */
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
