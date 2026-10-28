const LINK_PROTOCOLS = new Set(["https:", "mailto:", "tel:"]);
const INSTAGRAM_HOSTS = ["instagram.com", "www.instagram.com"];

function parseUrl(value: string | undefined): URL | undefined {
  // URL() silently removes control characters and treats backslashes as slashes.
  // Reject these ambiguous forms before inspecting the actual destination.
  // eslint-disable-next-line no-control-regex -- This guard deliberately rejects URL control characters.
  if (!value?.length || value.trim() !== value || /[\u0000-\u001f\u007f\\]/.test(value))
    return undefined;
  try {
    const url = new URL(value);
    return url.username || url.password ? undefined : url;
  } catch {
    return undefined;
  }
}

/** Preserve the authored URL, including booking parameters and email subjects. */
export function safeExternalUrl(value: string | undefined): string | undefined {
  const url = parseUrl(value);
  return url && LINK_PROTOCOLS.has(url.protocol) ? value : undefined;
}

/** Exact hosts only for integrations; ordinary HTTPS links may use other hosts. */
export function httpsUrl(value: string | undefined, hosts?: readonly string[]): URL | undefined {
  const url = parseUrl(value);
  if (url?.protocol !== "https:") return undefined;
  if (hosts && (url.port || !hosts.includes(url.hostname))) return undefined;
  return url;
}

/** Profiles can be offered as links even though they cannot be embedded. */
export function instagramLink(value: string | undefined): string | undefined {
  return httpsUrl(value, INSTAGRAM_HOSTS) ? value : undefined;
}

export function instagramEmbedUrl(value: string): string | undefined {
  const url = httpsUrl(value, INSTAGRAM_HOSTS);
  if (!url) return undefined;
  if (/^\/(?:p|reel|reels|tv)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) return value;
  // Instagram also shares reels with the account in the path. The embed SDK
  // expects the same reel's canonical permalink without that account segment.
  const reel = /^\/[A-Za-z0-9._]+\/(reels?)\/([A-Za-z0-9_-]+)\/?$/.exec(url.pathname);
  if (!reel) return undefined;
  url.pathname = `/${reel[1]}/${reel[2]}/`;
  return url.href;
}
