// Explicit maintenance command. Reads reviewed public sources and a local backup;
// never uploads, deletes objects, or writes the production catalogue.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const digest = (bytes: Buffer) => crypto.createHash("sha256").update(bytes).digest("hex");
const bucket = "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/";
type Usage = { source: string; role: string };
type Candidate = { src: string; width: number; bytes: number };
type Image = {
  aliases: string[];
  original: string;
  src: string;
  width: number;
  height: number;
  variants: Candidate[];
  avif?: Candidate;
  avifVariants?: Candidate[];
};

export async function prepareBucketImages(input: string, archiveDir: string, output: string) {
  const root = path.resolve(import.meta.dir, "..");
  if (![input, archiveDir, output].every(path.isAbsolute)) throw new Error("Use absolute paths");
  if (!path.relative(root, output).startsWith("../")) throw new Error("Keep staging outside Git");
  const usages: Usage[] = JSON.parse(await fs.readFile(input, "utf8"));
  const archived = JSON.parse(await fs.readFile(path.join(archiveDir, "archive.json"), "utf8"));
  const originals = new Map<string, { name: string; file: string; sha256: string }>(
    archived.objects.map((object: { name: string; file: string; sha256: string }) => [
      bucket + object.name,
      object,
    ]),
  );
  const reviewedSources = new Set(usages.map((usage) => usage.source));
  const originalByHash = new Map<string, string>();
  for (const [source, object] of [...originals].sort(([a], [b]) => a.localeCompare(b))) {
    if (reviewedSources.has(source) && !originalByHash.has(object.sha256))
      originalByHash.set(object.sha256, source);
  }
  await fs.mkdir(output, { recursive: true, mode: 0o700 });
  for (const folder of ["masters", "upload", "cache"])
    await fs.mkdir(path.join(output, folder), { recursive: true });
  const entries: Record<string, Image> = {};
  const upload = new Map<
    string,
    { name: string; bytes: number; sha256: string; cacheControl: string }
  >();
  const processing = new Map<string, Promise<Image>>();
  const audit: { source: string; originalBytes: number; optimizedBytes: number; sha256: string }[] =
    [];
  sharp.concurrency(1);

  async function publish(bytes: Buffer, suffix: string) {
    const hash = digest(bytes);
    const name = `adj-${hash.slice(0, 24)}-${suffix}`;
    await fs.writeFile(path.join(output, "upload", name), bytes);
    upload.set(name, { name, bytes: bytes.length, sha256: hash, cacheControl: "31536000" });
    return bucket + name;
  }
  async function load(source: string) {
    const archived = originals.get(source);
    if (archived) {
      const bytes = await fs.readFile(path.join(archiveDir, "objects", archived.file));
      if (digest(bytes) !== archived.sha256) throw new Error("Archive digest mismatch");
      return bytes;
    }
    if (source.startsWith("/") || source.startsWith("src/assets/")) {
      const file = path.resolve(root, source.startsWith("/") ? "public" + source : source);
      if (!file.startsWith(root + path.sep)) throw new Error("Source escapes repository");
      return fs.readFile(file);
    }
    const url = new URL(source);
    if (
      !["www.danang.intercontinental.com", "i.ytimg.com"].includes(url.hostname) ||
      url.protocol !== "https:"
    )
      throw new Error("Source not in the reviewed host inventory: " + source);
    const cache = path.join(output, "cache", digest(Buffer.from(source)));
    try {
      return await fs.readFile(cache);
    } catch {
      /* download reviewed source once */
    }
    const response = await fetch(source, { signal: AbortSignal.timeout(45000), redirect: "error" });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/"))
      throw new Error("Unavailable image: " + source);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 50 * 1024 * 1024) throw new Error("Image exceeds bucket limit");
    await fs.writeFile(cache, bytes);
    return bytes;
  }
  async function encode(source: string, bytes: Buffer): Promise<Image> {
    const hash = digest(bytes);
    await fs.writeFile(path.join(output, "masters", hash), bytes);
    const metadata = await sharp(bytes).metadata();
    if (!metadata.width || !metadata.height || (metadata.pages ?? 1) > 1)
      throw new Error("Unsupported image: " + source);
    const width = metadata.autoOrient?.width ?? metadata.width;
    const height = metadata.autoOrient?.height ?? metadata.height;
    const format = metadata.format === "jpeg" ? "jpg" : metadata.format!;
    const existingMaster = originalByHash.get(hash);
    const original = existingMaster ?? (await publish(bytes, "original." + format));
    // Vector logos stay vector; application icons retain PNG. Neither is rasterized.
    if (format === "svg" || /intercontinental-(favicon|touch-icon)\.png$/.test(source)) {
      return { aliases: [], original, src: original, width, height, variants: [] };
    }
    const webp = await sharp(bytes).rotate().webp({ quality: 85, effort: 5 }).toBuffer();
    const native = format === "webp" && bytes.length <= webp.length ? bytes : webp;
    const src =
      native === bytes && existingMaster ? existingMaster : await publish(native, "native.webp");
    const candidates: Candidate[] = [];
    for (const target of [320, 640, 960, 1280, 1600].filter((w) => w < width)) {
      const encoded = await sharp(bytes)
        .rotate()
        .resize({ width: target, withoutEnlargement: true })
        .webp({ quality: 85, effort: 5 })
        .toBuffer();
      candidates.push({
        src: await publish(encoded, target + ".webp"),
        width: target,
        bytes: encoded.length,
      });
    }
    candidates.push({ src, width, bytes: native.length });
    // AVIF is used by the existing detail picture element. Preserve native HD.
    const detail = usages.some(
      (u) =>
        (u.source === source || originals.get(u.source)?.sha256 === hash) &&
        (u.role === "Fiche agrandie" || u.role === "Galerie"),
    );
    const avifs: Candidate[] = [];
    if (detail)
      for (const target of [...[960, 1280].filter((w) => w < width), width]) {
        const encoded = await sharp(bytes)
          .rotate()
          .resize({ width: target, withoutEnlargement: true })
          .avif({ quality: 60, effort: 4, chromaSubsampling: "4:2:0" })
          .toBuffer();
        avifs.push({
          src: await publish(encoded, target + ".avif"),
          width: target,
          bytes: encoded.length,
        });
      }
    audit.push({
      source,
      originalBytes: bytes.length,
      optimizedBytes: native.length,
      sha256: hash,
    });
    return {
      aliases: [],
      original,
      src,
      width,
      height,
      variants: candidates,
      ...(avifs.length ? { avif: avifs.at(-1), avifVariants: avifs.slice(0, -1) } : {}),
    };
  }
  const sources = [...new Set(usages.map((u) => u.source))].sort();
  let finished = 0;
  // Two encoders bound CPU/memory use; existing masters are reused from backup.
  async function worker() {
    for (;;) {
      const source = sources.shift();
      if (!source) return;
      const bytes = await load(source);
      const key = digest(bytes);
      let result = processing.get(key);
      if (!result) {
        result = encode(source, bytes);
        processing.set(key, result);
      }
      const image = await result;
      image.aliases.push(source);
      entries[image.src] = image;
      finished++;
      if (finished % 5 === 0) console.log(`Prepared ${finished} sources`);
      await fs.writeFile(
        path.join(output, "progress.json"),
        JSON.stringify({ finished, images: Object.keys(entries).length, files: upload.size }),
      );
    }
  }
  await Promise.all([worker(), worker()]);
  for (const image of Object.values(entries)) image.aliases.sort();
  const manifest = Object.fromEntries(
    Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)),
  );
  await fs.writeFile(
    path.join(output, "managed-images.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  await fs.writeFile(
    path.join(output, "upload.json"),
    JSON.stringify(
      [...upload.values()].sort((a, b) => a.name.localeCompare(b.name)),
      null,
      2,
    ),
  );
  await fs.writeFile(path.join(output, "encoding-audit.json"), JSON.stringify(audit, null, 2));
  return { sources: finished, uniqueImages: Object.keys(entries).length, uploadFiles: upload.size };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args.length !== 3)
    throw new Error(
      "Usage: bun scripts/prepare-bucket-images.ts /inventory.json /verified-backup /new-staging-directory",
    );
  console.log(await prepareBucketImages(args[0]!, args[1]!, args[2]!));
}
