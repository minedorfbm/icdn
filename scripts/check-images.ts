import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import manifest from "./storage-manifest.json";
import config from "../wrangler.json";

const remote = process.argv.includes("--remote");
const publicBase = `${config.vars.SUPABASE_URL}/storage/v1/object/public/hub-images/`;

async function checkImage(entry: (typeof manifest)[number]) {
  try {
    let bytes: Uint8Array;
    if (remote) {
      const response = await fetch(publicBase + entry.file, {
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      });
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
        return { file: entry.file, valid: false, reason: "not publicly readable as an image" };
      }
      bytes = new Uint8Array(await response.arrayBuffer());
    } else {
      bytes = readFileSync(new URL(`../src/assets/${entry.key}.webp`, import.meta.url));
    }
    const valid =
      bytes.byteLength === entry.bytes &&
      createHash("sha256").update(bytes).digest("hex") === entry.sha256;
    return { file: entry.file, valid, reason: valid ? null : "content differs from manifest" };
  } catch {
    return { file: entry.file, valid: false, reason: "image unavailable" };
  }
}

// Bound concurrency so auditing does not saturate the image origin.
const results = [];
for (let offset = 0; offset < manifest.length; offset += 4) {
  results.push(...(await Promise.all(manifest.slice(offset, offset + 4).map(checkImage))));
}
writeFileSync("image-audit.json", JSON.stringify({ remote, results }, null, 2) + "\n");
if (results.some((result) => !result.valid)) {
  console.error("Image audit failed. See image-audit.json.");
  process.exitCode = 1;
} else {
  console.log("Image audit passed. See image-audit.json.");
}
