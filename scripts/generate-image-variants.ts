// Explicit maintenance task: only reads published sources; publishes derivatives through Git.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
const root = path.resolve(import.meta.dirname, "..");
if (!process.argv.includes("--apply")) {
  console.log(
    "Regenerate local image variants from the public catalogue with --apply. Originals and database rows are never modified.",
  );
  process.exit(0);
}
const config = JSON.parse(await fs.readFile(path.join(root, "wrangler.json"), "utf8"));
const response = await fetch(
  config.vars.SUPABASE_URL + "/rest/v1/destinations?select=id,image_key&active=eq.true",
  { headers: { apikey: config.vars.SUPABASE_PUBLISHABLE_KEY, Prefer: "count=exact" } },
);
if (!response.ok) throw new Error("Public catalogue read failed " + response.status);
const rows = await response.json();
const count = Number(response.headers.get("content-range")?.split("/")[1]);
if (!Array.isArray(rows) || (Number.isFinite(count) && count > rows.length)) {
  throw new Error("Published image catalogue is unavailable or truncated");
}
const sources: string[] = [
  ...new Set(
    (rows as { image_key: string | null }[])
      .map((r) => r.image_key)
      .filter(
        (s): s is string =>
          !!s?.startsWith(config.vars.SUPABASE_URL + "/storage/v1/object/public/hub-images/"),
      ),
  ),
].sort();
const out = path.join(root, "public/images/optimized");
await fs.mkdir(out, { recursive: true });
const manifest: Record<
  string,
  { width: number; height: number; variants: { src: string; width: number; bytes: number }[] }
> = {};
let originalTotal = 0,
  optimizedTotal = 0;
async function processImage(source: string) {
  const r = await fetch(source, { signal: AbortSignal.timeout(30000) });
  if (!r.ok || !r.headers.get("content-type")?.startsWith("image/"))
    throw new Error("Image unavailable " + source);
  const bytes = Buffer.from(await r.arrayBuffer());
  const meta = await sharp(bytes).metadata();
  if (!meta.width || !meta.height) throw new Error("Missing image dimensions");
  const variants: { src: string; width: number; bytes: number }[] = [];
  for (const width of [320, 960, 1600].filter((w) => w < meta.width)) {
    const result = await sharp(bytes)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 85, effort: 5 })
      .toBuffer();
    const hash = crypto.createHash("sha256").update(result).digest("hex").slice(0, 16);
    const file = hash + "-" + width + ".webp";
    await fs.writeFile(path.join(out, file), result);
    variants.push({ src: "/images/optimized/" + file, width, bytes: result.length });
    optimizedTotal += result.length;
  }
  if (variants.length) manifest[source] = { width: meta.width, height: meta.height, variants };
  originalTotal += bytes.length;
}
for (let i = 0; i < sources.length; i += 4) {
  await Promise.all(sources.slice(i, i + 4).map(processImage));
  console.log("Processed", Math.min(i + 4, sources.length), "/", sources.length);
}
for (const [source, file, width] of [
  ["/resort-map/official.webp", "discovery-map", 480],
  ["/michelin-key.webp", "michelin-key", 160],
] as const) {
  const meta = await sharp(path.join(root, "public", source)).metadata();
  const bytes = await sharp(path.join(root, "public", source))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 88, effort: 6 })
    .toBuffer();
  const hash = crypto.createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const name = file + "-" + hash + ".webp";
  await fs.writeFile(path.join(out, name), bytes);
  manifest[source] = {
    width: meta.width!,
    height: meta.height!,
    variants: [{ src: "/images/optimized/" + name, width, bytes: bytes.length }],
  };
}
await fs.writeFile(
  path.join(root, "src/data/image-variants.json"),
  JSON.stringify(
    Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))),
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify({ sources: sources.length, originalTotal, optimizedTotal }));
