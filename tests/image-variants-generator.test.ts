import { afterEach, expect, test } from "bun:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { generateImageVariants } from "../scripts/generate-image-variants";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "image-variants-test-"));
  directories.push(root);
  await fs.mkdir(path.join(root, "public/resort-map"), { recursive: true });
  await fs.mkdir(path.join(root, "src/data"), { recursive: true });
  await fs.writeFile(
    path.join(root, "wrangler.json"),
    JSON.stringify({
      vars: {
        SUPABASE_URL: "https://catalogue.example",
        SUPABASE_PUBLISHABLE_KEY: "public-test-key",
      },
    }),
  );
  const photo = await sharp({
    create: { width: 1800, height: 1200, channels: 3, background: "#123456" },
  })
    .png()
    .toBuffer();
  await fs.writeFile(path.join(root, "public/resort-map/official.webp"), photo);
  await fs.writeFile(path.join(root, "public/michelin-key.webp"), photo);
  return { root, photo };
}
const prefix = "https://catalogue.example/storage/v1/object/public/hub-images/";
test("generator publishes deterministic uncropped derivatives only for approved catalogue sources", async () => {
  const { root, photo } = await fixture();
  const originals = ["z", "a", "b", "c", "d"].map((id) => prefix + id + ".png");
  const downloaded: string[] = [];
  const request = async (url: string) => {
    if (url.includes("/rest/v1/"))
      return Response.json(
        [
          ...originals.map((image_key) => ({ image_key, detail_image_key: image_key })),
          { image_key: originals[0] },
          { image_key: null },
          { image_key: "https://other.example/photo.png" },
        ],
        { headers: { "content-range": "0-7/8" } },
      );
    downloaded.push(url);
    return new Response(photo, { headers: { "content-type": "image/png" } });
  };
  const summary = await generateImageVariants(root, request);
  expect(summary.sources).toBe(5);
  expect(downloaded).toHaveLength(5);
  expect(summary.originalTotal).toBe(photo.length * 5);
  expect(summary.optimizedTotal).toBeGreaterThan(0);
  const manifestFile = path.join(root, "src/data/image-variants.json");
  const before = await fs.readFile(manifestFile, "utf8");
  const manifest = JSON.parse(before);
  expect(Object.keys(manifest)).toEqual(Object.keys(manifest).sort((a, b) => a.localeCompare(b)));
  for (const source of originals) {
    expect(manifest[source].variants.map((item: { width: number }) => item.width)).toEqual([
      320, 960, 1280, 1600,
    ]);
    const avif = manifest[source].avif;
    expect(avif.width).toBe(1800);
    const avifBytes = await fs.readFile(path.join(root, "public", avif.src));
    expect((await sharp(avifBytes).metadata()).width).toBe(1800);
    expect(avifBytes).toHaveLength(avif.bytes);
    for (const variant of manifest[source].variants) {
      const bytes = await fs.readFile(path.join(root, "public", variant.src));
      const metadata = await sharp(bytes).metadata();
      expect(bytes).toHaveLength(variant.bytes);
      expect(metadata.width).toBe(variant.width);
      expect(metadata.height).toBe(Math.round((variant.width * 2) / 3));
    }
  }
  expect(await fs.readFile(path.join(root, "public/resort-map/official.webp"))).toEqual(photo);
  await generateImageVariants(root, request);
  expect(await fs.readFile(manifestFile, "utf8")).toBe(before);
});

test("generator rejects unavailable or truncated catalogues without publishing a manifest", async () => {
  const { root } = await fixture();
  for (const response of [
    new Response("offline", { status: 503 }),
    Response.json(null),
    Response.json([], { headers: { "content-range": "0-0/2" } }),
  ]) {
    await expect(generateImageVariants(root, () => Promise.resolve(response))).rejects.toThrow();
  }
  expect(await fs.exists(path.join(root, "src/data/image-variants.json"))).toBe(false);
});

test("generator rejects invalid image responses and does not enlarge a tiny source", async () => {
  const { root } = await fixture();
  const rows = () => Response.json([{ image_key: prefix + "tiny" }]);
  for (const image of [
    new Response("missing", { status: 404 }),
    new Response("not an image", { headers: { "content-type": "text/html" } }),
  ]) {
    await expect(
      generateImageVariants(root, (url) =>
        Promise.resolve(url.includes("/rest/") ? rows() : image),
      ),
    ).rejects.toThrow("Image unavailable");
  }
  const tiny = await sharp({ create: { width: 20, height: 20, channels: 3, background: "white" } })
    .png()
    .toBuffer();
  await generateImageVariants(root, (url) =>
    Promise.resolve(
      url.includes("/rest/")
        ? rows()
        : new Response(tiny, { headers: { "content-type": "image/png" } }),
    ),
  );
  const manifest = JSON.parse(
    await fs.readFile(path.join(root, "src/data/image-variants.json"), "utf8"),
  );
  expect(manifest[prefix + "tiny"]).toBeUndefined();
});
