import { readdirSync } from "node:fs";

// A shared timestamp is one Supabase migration identity, regardless of filename.
const files = readdirSync(new URL("../supabase/migrations/", import.meta.url)).filter((file) =>
  file.endsWith(".sql"),
);
const versions = new Map<string, string>();
for (const file of files) {
  const version = /^(\d{14})_[a-z0-9_-]+\.sql$/.exec(file)?.[1];
  if (!version) throw new Error(`Invalid migration filename: ${file}`);
  const existing = versions.get(version);
  if (existing) throw new Error(`Duplicate migration version: ${existing} and ${file}`);
  versions.set(version, file);
}
console.log(`${files.length} migration filenames verified; no duplicate versions.`);
