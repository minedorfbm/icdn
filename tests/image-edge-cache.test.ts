import { expect, mock, spyOn, test } from "bun:test";
import manifest from "../src/data/image-variants-runtime.json";
import { serveImage } from "../src/lib/image-edge-cache";
import { imageBucket, imageDeliveryUrl } from "../src/lib/image-delivery";
import { imageSource, imageVariants } from "../src/lib/image-source";

const name = Object.keys(manifest)[0]!;
const url = "https://icdn.artdigitaljourney.com/media/" + name;
const bytes = new Uint8Array([0, 1, 127, 255]);
function origin() {
  return new Response(bytes, {
    headers: {
      "content-type": "image/webp",
      "content-length": "4",
      "set-cookie": "private=secret",
      "access-control-allow-origin": "*",
    },
  });
}
function memoryCache() {
  const entries = new Map<string, Response>();
  return {
    match: mock(async (request: Request) => entries.get(request.url)?.clone()),
    put: mock(async (request: Request, response: Response) => {
      entries.set(request.url, response);
    }),
  };
}

test("a miss streams the same bytes, the next visit needs no Supabase read", async () => {
  const cache = memoryCache();
  const fetchImage = mock(async () => origin());
  const dependencies = { cache: cache as unknown as Cache, fetchImage: fetchImage as typeof fetch };
  const request = new Request(url, {
    headers: { cookie: "session=secret", authorization: "Bearer secret", range: "bytes=0-1" },
  });
  const miss = await serveImage(request, dependencies);
  expect(new Uint8Array(await miss.arrayBuffer())).toEqual(bytes);
  expect(miss.headers.get("x-image-cache")).toBe("MISS");
  expect(miss.headers.get("cache-control")).toContain("immutable");
  expect(miss.headers.has("set-cookie")).toBe(false);
  expect(miss.headers.has("access-control-allow-origin")).toBe(false);
  expect(fetchImage.mock.calls[0]?.[0]).toBe(imageBucket + name);
  expect(fetchImage.mock.calls[0]?.[1]).toMatchObject({ method: "GET", redirect: "manual" });
  expect(fetchImage.mock.calls[0]?.[1]).not.toHaveProperty("headers");
  const hit = await serveImage(new Request(url), dependencies);
  expect(hit.headers.get("x-image-cache")).toBe("HIT");
  expect(new Uint8Array(await hit.arrayBuffer())).toEqual(bytes);
  expect(fetchImage).toHaveBeenCalledTimes(1);
  const head = await serveImage(new Request(url, { method: "HEAD" }), dependencies);
  expect(await head.text()).toBe("");
  expect(head.headers.get("content-length")).toBe("4");
  const conditional = await serveImage(
    new Request(url, { headers: { "if-none-match": `W/"${name}"` } }),
    dependencies,
  );
  expect(conditional.status).toBe(304);
  expect(await conditional.text()).toBe("");
  expect(conditional.headers.has("content-length")).toBe(false);
  expect(fetchImage).toHaveBeenCalledTimes(1);
});

test.each([
  ["/media/https://other.example/image.webp", "GET", 404],
  ["/media/adj-000000000000000000000000-native.webp", "GET", 404],
  ["/media/" + name + "?url=https://other.example", "GET", 404],
  ["/media/%2F" + name, "GET", 404],
  ["/media/" + name.replace("webp", "svg"), "GET", 404],
  ["/media/" + name, "POST", 405],
])("unapproved image route %s %s never contacts the origin", async (path, method, status) => {
  const fetchImage = mock(async () => origin());
  const response = await serveImage(
    new Request("https://hub.example" + path, { method: String(method) }),
    { fetchImage: fetchImage as typeof fetch },
  );
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(fetchImage).not.toHaveBeenCalled();
});

test.each([404, 500, 302, 206])("upstream status %s is not cached", async (status) => {
  const cache = memoryCache();
  const response = await serveImage(new Request(url), {
    cache: cache as unknown as Cache,
    fetchImage: (async () => new Response(null, { status })) as typeof fetch,
  });
  expect(response.status).toBe(status === 404 ? 404 : 502);
  expect(cache.put).not.toHaveBeenCalled();
  expect(response.headers.get("cache-control")).toBe("no-store");
});

test("HTML instead of an image and network errors cannot become permanent cache entries", async () => {
  for (const fetchImage of [
    async () => new Response("html", { headers: { "content-type": "text/html" } }),
    async () => {
      throw new Error("offline");
    },
  ]) {
    const cache = memoryCache();
    expect(
      (
        await serveImage(new Request(url), {
          cache: cache as unknown as Cache,
          fetchImage: fetchImage as typeof fetch,
        })
      ).status,
    ).toBe(502);
    expect(cache.put).not.toHaveBeenCalled();
  }
});

test("background cache writes do not delay the streamed response", async () => {
  let finish!: () => void;
  const saving = new Promise<void>((resolve) => {
    finish = resolve;
  });
  let pending: Promise<unknown> | undefined;
  const request = Object.assign(new Request(url), {
    waitUntil: (promise: Promise<unknown>) => {
      pending = promise;
    },
  });
  const response = await serveImage(request, {
    cache: { match: async () => undefined, put: async () => saving } as unknown as Cache,
    fetchImage: (async () => origin()) as typeof fetch,
  });
  expect(response.status).toBe(200);
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  expect(pending).toBeDefined();
  finish();
  await pending;
});

test("delivery URLs retain all responsive candidates and leave unmanaged CMS URLs alone", () => {
  for (const file of Object.keys(manifest)) {
    const source = imageBucket + file;
    expect(imageVariants(imageSource(source))).toEqual(imageVariants(source));
    expect(imageSource(source)).toBe(
      file.startsWith("adj-") && !file.endsWith(".svg") ? "/media/" + file : source,
    );
  }
  expect(imageDeliveryUrl(imageBucket + "unversioned.webp")).toBe(imageBucket + "unversioned.webp");
  expect(imageSource("https://example.com/new.webp")).toBe("https://example.com/new.webp");
});

test.each(["image/avif", "image/png"])("raster variants preserve %s", async (type) => {
  const extension = type.split("/")[1];
  const names = Object.entries(manifest).flatMap(([file, photo]) => [
    file,
    ...photo.variants.map((pair) => String(pair[0])),
    ...("avif" in photo ? photo.avif.map((pair) => String(pair[0])) : []),
  ]);
  const file = names.find((value) => value.endsWith("." + extension))!;
  const response = await serveImage(new Request("https://hub.example/media/" + file), {
    fetchImage: (async () =>
      new Response(bytes, { headers: { "content-type": type } })) as typeof fetch,
  });
  expect(response.headers.get("content-type")).toBe(type);
  expect(response.headers.get("x-image-cache")).toBe("BYPASS");
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
});

test("a cache outage still serves the public photo and a different ETag returns its body", async () => {
  const warning = spyOn(console, "warn").mockImplementation(() => {});
  try {
    const response = await serveImage(
      new Request(url, { headers: { "if-none-match": '"older-photo"' } }),
      {
        cache: {
          match: async () => {
            throw new Error("read unavailable");
          },
          put: async () => {
            throw new Error("write unavailable");
          },
        } as unknown as Cache,
        fetchImage: (async () => origin()) as typeof fetch,
      },
    );
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    expect(warning).toHaveBeenCalledTimes(2);
  } finally {
    warning.mockRestore();
  }
});
