import manifest from "../data/image-variants-runtime.json";
import {
  imageBucket,
  imageDeliveryPrefix,
  immutableImageName,
  officialLogoHashes,
} from "./image-delivery";

type ImageCache = Pick<Cache, "match" | "put">;
type ImageRequest = Request & { waitUntil?: (promise: Promise<unknown>) => void };
type Dependencies = { cache?: ImageCache; fetchImage?: typeof fetch };
const allowed = new Set<string>();
for (const [name, photo] of Object.entries(manifest)) {
  allowed.add(name);
  for (const pair of [...photo.variants, ...("avif" in photo ? photo.avif : [])])
    allowed.add(String(pair[0]));
}

function failure(status: number): Response {
  return new Response(null, {
    status,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

function deliver(response: Response, request: Request, state: string): Response {
  const headers = new Headers(response.headers);
  headers.set("x-image-cache", state);
  const tag = headers.get("etag");
  const matches = request.headers
    .get("if-none-match")
    ?.split(",")
    .some((value) => value.trim() === "*" || value.trim().replace(/^W\//, "") === tag);
  if (matches) {
    headers.delete("content-length");
    void response.body?.cancel();
    return new Response(null, { status: 304, headers });
  }
  if (request.method === "HEAD") void response.body?.cancel();
  return new Response(request.method === "HEAD" ? null : response.body, { headers });
}

/** Fixed public origin and exact manifest allowlist: this is not an arbitrary URL proxy.
 * Nitro's Cloudflare adapter attaches the execution context's waitUntil to Request. */
export async function serveImage(
  request: ImageRequest,
  dependencies: Dependencies = {},
): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== "GET" && request.method !== "HEAD") {
    const response = failure(405);
    response.headers.set("allow", "GET, HEAD");
    return response;
  }
  const name = url.pathname.slice(imageDeliveryPrefix.length);
  if (
    !url.pathname.startsWith(imageDeliveryPrefix) ||
    url.search ||
    (!immutableImageName.test(name) && !Object.hasOwn(officialLogoHashes, name)) ||
    !allowed.has(name)
  )
    return failure(404);

  const cache =
    dependencies.cache ??
    (typeof caches === "undefined"
      ? undefined
      : (caches as CacheStorage & { default?: ImageCache }).default);
  const key = new Request(url.href);
  const hit = await readCache(cache, key);
  if (hit) return deliver(hit, request, "HIT");
  const response = await readOrigin(name, dependencies.fetchImage ?? fetch);
  if (response.status !== 200) return response;
  if (cache) {
    const save = cache.put(key, response.clone()).catch(() => {
      console.warn("[image-cache] Cache write unavailable");
    });
    if (request.waitUntil) request.waitUntil(save);
    else await save;
  }
  return deliver(response, request, cache ? "MISS" : "BYPASS");
}

async function readCache(cache: ImageCache | undefined, key: Request) {
  try {
    return await cache?.match(key);
  } catch {
    console.warn("[image-cache] Cache read unavailable");
    return undefined;
  }
}

async function readOrigin(name: string, fetchImage: typeof fetch): Promise<Response> {
  let upstream: Response;
  try {
    // Never forward browser credentials, cookies, Range or caller-supplied headers.
    upstream = await fetchImage(imageBucket + name, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    return failure(502);
  }
  const isLogo = Object.hasOwn(officialLogoHashes, name);
  const contentType = isLogo ? "image/svg+xml" : "image/" + name.split(".").at(-1);
  if (
    upstream.status !== 200 ||
    upstream.headers.get("content-type")?.split(";")[0]?.trim() !== contentType
  ) {
    void upstream.body?.cancel();
    return failure(upstream.status === 404 ? 404 : 502);
  }
  const logo = isLogo ? await verifiedLogo(upstream, officialLogoHashes[name]!) : undefined;
  if (isLogo && !logo) return failure(502);
  const headers = new Headers({
    "content-type": contentType,
    "cache-control": "public, max-age=31536000, immutable",
    etag: `"${name}"`,
    "x-content-type-options": "nosniff",
    "content-security-policy": isLogo
      ? "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox"
      : "default-src 'none'; sandbox",
    "referrer-policy": "strict-origin-when-cross-origin",
  });
  const length = upstream.headers.get("content-length");
  if (length && /^\d+$/.test(length) && !upstream.headers.has("content-encoding"))
    headers.set("content-length", length);
  if (logo) headers.set("content-length", String(logo.byteLength));
  return new Response(logo ?? upstream.body, { headers });
}

/** Only the three inspected official logos may be SVG documents. Bound the read
 * and verify every byte before caching, even if a Storage object is overwritten. */
async function verifiedLogo(
  response: Response,
  expectedHash: string,
): Promise<Uint8Array<ArrayBuffer> | undefined> {
  const reader = response.body?.getReader();
  if (!reader) return undefined;
  const buffer = new Uint8Array(64 * 1024);
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (length + value.byteLength > buffer.byteLength) return undefined;
      buffer.set(value, length);
      length += value.byteLength;
    }
    const bytes = buffer.slice(0, length);
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    return hash === expectedHash ? bytes : undefined;
  } catch {
    return undefined;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
