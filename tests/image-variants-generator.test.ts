import { afterEach, expect, test } from "bun:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { prepareBucketImages } from "../scripts/prepare-bucket-images";

const dirs: string[] = [];
const prefix = "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/";
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "bucket-images-test-"));
  dirs.push(root);
  await fs.mkdir(path.join(root, "archive/objects"), { recursive: true });
  const rgba = await sharp({
    create: { width: 500, height: 1000, channels: 4, background: "#12345680" },
  })
    .png()
    .toBuffer();
  const rotated = await sharp({
    create: { width: 96, height: 48, channels: 3, background: "#abcdef" },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
  const sources = [
    { name: "portrait.png", bytes: rgba },
    { name: "alias.png", bytes: rgba },
    { name: "rotated.jpg", bytes: rotated },
  ];
  const objects = sources.map(({ name, bytes }) => ({
    name,
    file: hash(bytes),
    sha256: hash(bytes),
  }));
  for (const { bytes } of sources)
    await fs.writeFile(path.join(root, "archive/objects", hash(bytes)), bytes);
  await fs.writeFile(path.join(root, "archive/archive.json"), JSON.stringify({ objects }));
  await fs.writeFile(
    path.join(root, "input.json"),
    JSON.stringify(sources.map(({ name }) => ({ source: prefix + name, role: "Fiche agrandie" }))),
  );
  return { root, sources, objects };
}

test("staging deduplicates originals, preserves orientation, transparency and native HD", async () => {
  const { root, sources } = await fixture();
  const output = path.join(root, "staging");
  const summary = await prepareBucketImages(
    path.join(root, "input.json"),
    path.join(root, "archive"),
    output,
  );
  expect(summary.sources).toBe(3);
  expect(summary.uniqueImages).toBe(2);
  const manifest = JSON.parse(await fs.readFile(path.join(output, "managed-images.json"), "utf8"));
  type Image = {
    aliases: string[];
    width: number;
    height: number;
    src: string;
    variants: { src: string; width: number }[];
  };
  const images = Object.values(manifest) as Image[];
  const portrait = images.find((image) => image.aliases.includes(prefix + "portrait.png"))!;
  expect(portrait.aliases).toContain(prefix + "alias.png");
  expect([portrait.width, portrait.height]).toEqual([500, 1000]);
  const native = await sharp(
    path.join(output, "upload", portrait.src.slice(prefix.length)),
  ).metadata();
  expect(native.hasAlpha).toBe(true);
  expect([native.width, native.height]).toEqual([500, 1000]);
  const oriented = images.find((image) => image.aliases.includes(prefix + "rotated.jpg"))!;
  expect([oriented.width, oriented.height]).toEqual([48, 96]);
  for (const image of images)
    for (const variant of image.variants) {
      const meta = await sharp(
        path.join(output, "upload", variant.src.slice(prefix.length)),
      ).metadata();
      expect(meta.width).toBe(variant.width);
      expect(meta.height).toBe(Math.round((variant.width * image.height) / image.width));
      expect(variant.width).toBeLessThanOrEqual(image.width);
    }
  for (const { bytes } of sources)
    expect(await fs.readFile(path.join(root, "archive/objects", hash(bytes)))).toEqual(bytes);
  const before = await fs.readFile(path.join(output, "managed-images.json"), "utf8");
  await prepareBucketImages(path.join(root, "input.json"), path.join(root, "archive"), output);
  expect(await fs.readFile(path.join(output, "managed-images.json"), "utf8")).toBe(before);
}, 30000);

test("staging rejects changed backup bytes and unreviewed hosts without publishing a manifest", async () => {
  const { root, objects } = await fixture();
  await fs.writeFile(path.join(root, "archive/objects", objects[0]!.file), "changed");
  await expect(
    prepareBucketImages(
      path.join(root, "input.json"),
      path.join(root, "archive"),
      path.join(root, "bad"),
    ),
  ).rejects.toThrow("Archive digest mismatch");
  expect(await fs.exists(path.join(root, "bad/managed-images.json"))).toBe(false);
  await fs.writeFile(
    path.join(root, "input.json"),
    JSON.stringify([{ source: "https://other.example/image.jpg", role: "test" }]),
  );
  await expect(
    prepareBucketImages(
      path.join(root, "input.json"),
      path.join(root, "archive"),
      path.join(root, "unknown"),
    ),
  ).rejects.toThrow("reviewed host");
  expect(await fs.exists(path.join(root, "unknown/managed-images.json"))).toBe(false);
});
