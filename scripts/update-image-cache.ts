import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import manifest from "./storage-manifest.json";
import config from "../wrangler.json";

const apply = process.argv.includes("--apply");
const cacheControl = "31536000";
const bucket = "hub-images";
const publicBase = `${config.vars.SUPABASE_URL}/storage/v1/object/public/${bucket}/`;

function digest(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function verify(entry: (typeof manifest)[number]): Promise<Uint8Array> {
  const local = readFileSync(new URL(`../src/assets/${entry.key}.webp`, import.meta.url));
  if (local.byteLength !== entry.bytes || digest(local) !== entry.sha256) {
    throw new Error(`Local image differs from the manifest: ${entry.file}`);
  }

  const response = await fetch(publicBase + entry.file, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Published image unavailable: ${entry.file}`);
  const published = new Uint8Array(await response.arrayBuffer());
  if (published.byteLength !== entry.bytes || digest(published) !== entry.sha256) {
    throw new Error(`Published image differs from the manifest: ${entry.file}`);
  }
  return local;
}

// Verify the entire original collection before replacing even one object.
const images: { file: string; bytes: Uint8Array }[] = [];
for (const entry of manifest) images.push({ file: entry.file, bytes: await verify(entry) });

if (!apply) {
  console.log(
    `${images.length} published images verified. Run with --apply to update their cache metadata.`,
  );
} else {
  const secret = process.env["SUPABASE_SECRET_KEY"];
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is required for --apply.");

  const supabase = createClient(config.vars.SUPABASE_URL, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  for (const image of images) {
    const { error } = await supabase.storage
      .from(bucket)
      .update(image.file, new Blob([new Uint8Array(image.bytes)], { type: "image/webp" }), {
        contentType: "image/webp",
        cacheControl,
      });
    if (error)
      throw new Error(`Unable to update cache metadata for ${image.file}: ${error.message}`);
  }
  console.log(`Updated cache metadata for ${images.length} images (${cacheControl} seconds).`);
}
