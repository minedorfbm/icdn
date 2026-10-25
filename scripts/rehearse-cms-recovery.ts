import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { z } from "zod";
import { hubDataSchema } from "../src/lib/hub-schema";
import { destinationCardSchema } from "../src/lib/destination-card-schema";
import { destinationMediaSchema } from "../src/lib/destination-media-schema";

// The only database this program can open is a disposable, in-memory PGlite instance.
// Remote operations are anonymous GETs to this project's existing public image bucket.
const root = fileURLToPath(new URL("../", import.meta.url));
const storageBase = "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/";
const tables = [
  "accommodation_benefit_translations",
  "accommodation_benefits",
  "destination_collection_items",
  "destination_event_links",
  "destination_events",
  "destination_link_translations",
  "destination_links",
  "destination_notice_links",
  "destination_notice_translations",
  "destination_notices",
  "destination_opening_hours",
  "destination_photos",
  "destination_posts",
  "destination_relations",
  "destination_translations",
  "destination_videos",
  "destinations",
  "event_translations",
  "levels",
  "map_destination_links",
  "map_places",
  "site_link_translations",
  "site_settings",
] as const;
const exportSchema = z.array(
  z.object({ section: z.string(), name: z.string(), payload: z.unknown() }),
);
const manifestSchema = z.object({
  format: z.literal("icdn-cms-recovery-v1"),
  captured_at: z.iso.datetime({ offset: true }),
  tables: z.array(z.string()),
  versions: z.array(z.string()),
  columns: z.record(z.string(), z.array(z.string())),
});
const storageSchema = z.array(
  z.object({
    name: z.string().min(1),
    updated_at: z.string(),
    metadata: z.object({
      size: z
        .number()
        .int()
        .nonnegative()
        .max(64 * 1024 * 1024),
      eTag: z.string(),
    }),
  }),
);
const hash = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const quote = (name: string) => '"' + name.replaceAll('"', '""') + '"';
const alphabetical = (a: string, b: string) => a.localeCompare(b, "en");
// Migrations and commands on one local PostgreSQL connection must retain their order.
// The same chain bounds image batches instead of starting all remote reads together.
async function serial<T>(items: readonly T[], step: (item: T) => Promise<unknown>): Promise<void> {
  await items.reduce<Promise<unknown>>(
    (previous, item) => previous.then(() => step(item)),
    Promise.resolve(),
  );
}
function constraintMode(fk: { deferrable: boolean; deferred: boolean }) {
  if (!fk.deferrable) return "NOT DEFERRABLE";
  return fk.deferred ? "DEFERRABLE INITIALLY DEFERRED" : "DEFERRABLE INITIALLY IMMEDIATE";
}
const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => alphabetical(a, b))
        .map(([key, item]) => [key, canonical(item)]),
    );
  }
  return value;
};
const rowsHash = (rows: unknown[]) =>
  hash(JSON.stringify(rows.map((row) => JSON.stringify(canonical(row))).sort(alphabetical)));
const unpack = (value: unknown): unknown => (typeof value === "string" ? JSON.parse(value) : value);

async function privateJson(path: string, value: unknown) {
  await writeFile(path, JSON.stringify(value, null, 2) + "\n", { mode: 0o600, flag: "wx" });
}

async function downloadImage(
  name: string,
  expectedSize: number,
  expectedTag: string,
  fetchImage: typeof fetch,
) {
  assert.ok(
    !name.split("/").some((part) => part === "." || part === ".." || part.includes("\\")),
    "Unsafe object name",
  );
  const url = new URL(name.split("/").map(encodeURIComponent).join("/"), storageBase);
  assert.ok(url.href.startsWith(storageBase), "Unexpected storage URL");
  // A unique query avoids reusing an old cached object after a recent CMS image update.
  url.searchParams.set("recovery", String(Date.now()));
  const response = await fetchImage(url, {
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 200, `Storage GET failed for ${name}`);
  const tag = (value: string) => value.replace(/^W\//, "").replaceAll('"', "");
  assert.equal(
    tag(response.headers.get("etag") ?? ""),
    tag(expectedTag),
    `Object changed since export: ${name}`,
  );
  assert.ok(response.body, `Empty response for ${name}`);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      assert.ok(length <= expectedSize, `Object exceeds its exported size: ${name}`);
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  assert.equal(length, expectedSize, `Incomplete object: ${name}`);
  return Buffer.concat(chunks);
}

function parseExport(bytes: string) {
  const rows = exportSchema.parse(JSON.parse(bytes));
  assert.equal(rows.length, tables.length + 3, "Incomplete or unexpected export");
  assert.equal(
    new Set(rows.map((row) => `${row.section}/${row.name}`)).size,
    rows.length,
    "Duplicate export rows",
  );
  const get = (section: string, name: string) => {
    const row = rows.find((row) => row.section === section && row.name === name);
    assert.ok(row, `Missing ${section}/${name}`);
    return unpack(row.payload);
  };
  const manifest = manifestSchema.parse(get("manifest", "cms-v1"));
  assert.deepEqual(
    [...manifest.tables].sort(alphabetical),
    [...tables].sort(alphabetical),
    "Public schema changed: review export scope first",
  );
  assert.deepEqual(
    Object.keys(manifest.columns).sort(alphabetical),
    [...tables].sort(alphabetical),
  );
  const data = Object.fromEntries(
    tables.map((table) => [
      table,
      z.array(z.record(z.string(), z.unknown())).parse(get("table", table)),
    ]),
  );
  for (const table of tables) {
    for (const row of data[table]!)
      assert.deepEqual(
        Object.keys(row).sort(alphabetical),
        [...manifest.columns[table]!].sort(alphabetical),
      );
  }
  const bucket = z
    .array(z.object({ id: z.literal("hub-images"), public: z.literal(true) }))
    .parse(get("bucket", "hub-images"));
  assert.equal(bucket.length, 1, "Expected the existing public bucket");
  const storage = storageSchema.parse(get("storage", "hub-images"));
  assert.equal(
    new Set(storage.map((object) => object.name)).size,
    storage.length,
    "Duplicate storage names",
  );
  const totalBytes = storage.reduce((sum, object) => sum + object.metadata.size, 0);
  assert.ok(totalBytes <= 1024 * 1024 * 1024, "Storage exceeds the 1 GiB rehearsal limit");
  return { rows, manifest, data, storage, totalBytes };
}

async function main() {
  const [inputArg, outputArg, ...extra] = process.argv.slice(2);
  if (inputArg === "--verify" && outputArg && extra.length === 0 && isAbsolute(outputArg)) {
    await verifyArchive(await realpath(outputArg));
    return;
  }
  assert.ok(
    inputArg && outputArg && extra.length === 0 && isAbsolute(inputArg) && isAbsolute(outputArg),
    "Usage: bun scripts/rehearse-cms-recovery.ts /absolute/export.json /absolute/new-private-directory",
  );
  await createCmsArchive(inputArg, outputArg);
}

export async function createCmsArchive(
  inputArg: string,
  outputArg: string,
  fetchImage: typeof fetch = fetch,
) {
  assert.ok(isAbsolute(inputArg) && isAbsolute(outputArg), "Use absolute paths");
  const input = resolve(inputArg);
  assert.ok((await stat(input)).size < 20 * 1024 * 1024, "Export exceeds 20 MiB");
  const output = join(await realpath(dirname(outputArg)), resolve(outputArg).split("/").at(-1)!);
  const fromRepo = relative(await realpath(root), output);
  assert.ok(
    fromRepo.startsWith("../") && fromRepo !== "..",
    "Keep live backups outside the Git repository",
  );
  const { rows, manifest, storage } = parseExport(await readFile(input, "utf8"));
  const migrationDir = join(root, "supabase/migrations");
  const migrationNames = (await readdir(migrationDir))
    .filter((name) => name.endsWith(".sql"))
    .sort(alphabetical);
  assert.deepEqual(
    manifest.versions,
    migrationNames.map((name) => name.split("_")[0]),
    "Migration ledger changed",
  );

  // An existing directory is rejected; no backup or local files are overwritten.
  await mkdir(output, { mode: 0o700 });
  await mkdir(join(output, "objects"), { mode: 0o700 });
  await mkdir(join(output, "migrations"), { mode: 0o700 });
  await privateJson(join(output, "cms.json"), rows);
  const migrations: { name: string; sha256: string }[] = [];
  await serial(migrationNames, async (name) => {
    const bytes = await readFile(join(migrationDir, name));
    await writeFile(join(output, "migrations", name), bytes, { mode: 0o600, flag: "wx" });
    migrations.push({ name, sha256: hash(bytes) });
  });
  const objects: { name: string; file: string; bytes: number; sha256: string }[] = [];
  // Four concurrent anonymous reads, bounded by exported lengths and per-file timeouts.
  const batches = Array.from({ length: Math.ceil(storage.length / 4) }, (_, index) =>
    storage.slice(index * 4, index * 4 + 4),
  );
  await serial(batches, async (pending) => {
    const batch = await Promise.all(
      pending.map(async (object) => {
        const bytes = await downloadImage(
          object.name,
          object.metadata.size,
          object.metadata.eTag,
          fetchImage,
        );
        const file = hash(object.name);
        await writeFile(join(output, "objects", file), bytes, { mode: 0o600, flag: "wx" });
        return { name: object.name, file, bytes: bytes.length, sha256: hash(bytes) };
      }),
    );
    objects.push(...batch);
    console.log(`Archived ${objects.length}/${storage.length} public objects`);
  });
  await privateJson(join(output, "archive.json"), {
    format: "icdn-cms-archive-v1",
    cmsSha256: hash(await readFile(join(output, "cms.json"))),
    migrations,
    objects,
  });

  return verifyArchive(output);
}

/** Offline verification; no network, production client, or credentials. */
export async function verifyArchive(output: string) {
  const started = performance.now();
  const fromRepo = relative(await realpath(root), output);
  assert.ok(
    fromRepo.startsWith("../") && fromRepo !== "..",
    "Archive must be outside the repository",
  );
  // Recovery now reads only the archive on disk, not the live database or original export.
  const digest = z.string().regex(/^[a-f0-9]{64}$/);
  const archive = z
    .object({
      format: z.literal("icdn-cms-archive-v1"),
      cmsSha256: digest,
      migrations: z.array(
        z.object({ name: z.string().regex(/^\d{14}_[a-z0-9_.-]+\.sql$/), sha256: digest }),
      ),
      objects: z.array(
        z.object({
          name: z.string(),
          file: digest,
          bytes: z.number().int().nonnegative(),
          sha256: digest,
        }),
      ),
    })
    .parse(JSON.parse(await readFile(join(output, "archive.json"), "utf8")));
  const cmsBytes = await readFile(join(output, "cms.json"));
  assert.equal(hash(cmsBytes), archive.cmsSha256);
  const { manifest, data, storage, totalBytes } = parseExport(cmsBytes.toString());
  assert.deepEqual(
    archive.migrations.map((m) => m.name.split("_")[0]),
    manifest.versions,
  );
  assert.deepEqual(
    archive.objects.map((o) => ({ name: o.name, size: o.bytes })),
    storage.map((o) => ({ name: o.name, size: o.metadata.size })),
  );
  for (const object of archive.objects) assert.equal(object.file, hash(object.name));
  const recovery = await mkdtemp(join(output, "recovery-"));
  const db = new PGlite();
  const counts: Record<string, { rows: number; sha256: string }> = {};
  let publicCards = 0;
  try {
    await db.exec(
      "SET TIME ZONE 'UTC'; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;",
    );
    await serial(archive.migrations, async (migration) => {
      const bytes = await readFile(join(output, "migrations", migration.name));
      assert.equal(hash(bytes), migration.sha256);
      await db.exec(bytes.toString());
    });
    await serial(tables, async (table) => {
      const columns = (
        await db.query<{ column_name: string }>(
          "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",
          [table],
        )
      ).rows.map((row) => row.column_name);
      assert.deepEqual(columns, manifest.columns[table], `${table}: schema drift`);
    });
    // The featured-link FK forms a destinations/links cycle. Defer FKs only in this
    // local transaction, then validate every row and restore their original modes.
    const foreignKeys = (
      await db.query<{ table_name: string; name: string; deferred: boolean; deferrable: boolean }>(
        "SELECT c.relname AS table_name, con.conname AS name, con.condeferred AS deferred, con.condeferrable AS deferrable FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND con.contype='f'",
      )
    ).rows;
    const triggerStates = (
      await db.query<{ tgenabled: string }>(
        "SELECT t.tgenabled FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal",
      )
    ).rows;
    assert.ok(
      triggerStates.every((t) => t.tgenabled === "O"),
      "Review nonstandard user trigger state",
    );
    await db.exec("BEGIN");
    // Editorial INSERT triggers recapture source text/URLs and would alter old drafts.
    // Suspend only USER triggers in this disposable database; FK checks stay active.
    await serial(tables, (table) =>
      db.exec(`ALTER TABLE public.${quote(table)} DISABLE TRIGGER USER`),
    );
    await serial(foreignKeys, (fk) =>
      db.exec(
        `ALTER TABLE public.${quote(fk.table_name)} ALTER CONSTRAINT ${quote(fk.name)} DEFERRABLE INITIALLY DEFERRED`,
      ),
    );
    const qualifiedTables = tables.map((table) => "public." + quote(table)).join(",");
    await db.exec(`TRUNCATE ${qualifiedTables}`);
    await serial(tables, (table) =>
      db.query(
        `INSERT INTO public.${quote(table)} SELECT * FROM jsonb_populate_recordset(NULL::public.${quote(table)}, $1::jsonb)`,
        [JSON.stringify(data[table])],
      ),
    );
    await db.exec("SET CONSTRAINTS ALL IMMEDIATE");
    await serial(foreignKeys, (fk) =>
      db.exec(
        `ALTER TABLE public.${quote(fk.table_name)} ALTER CONSTRAINT ${quote(fk.name)} ${constraintMode(fk)}`,
      ),
    );
    await serial(tables, (table) =>
      db.exec(`ALTER TABLE public.${quote(table)} ENABLE TRIGGER USER`),
    );
    await db.exec("COMMIT");
    await serial(tables, async (table) => {
      const actual = (
        await db.query<{ row: unknown }>(`SELECT to_jsonb(t) AS row FROM public.${quote(table)} t`)
      ).rows.map((item) => item.row);
      assert.equal(rowsHash(actual), rowsHash(data[table]!), `${table}: restored content differs`);
      counts[table] = { rows: actual.length, sha256: rowsHash(actual) };
    });
    await db.exec("BEGIN; SET LOCAL ROLE anon");
    const catalogue = hubDataSchema
      .required()
      .parse(
        (await db.query<{ data: unknown }>("SELECT public.published_hub_catalogue_v1() AS data"))
          .rows[0]!.data,
      );
    assert.deepEqual(
      catalogue.destinations.map((d) => d.id).sort(alphabetical),
      data
        .destinations!.filter((d) => d.active === true)
        .map((d) => z.string().parse(d.id))
        .sort(alphabetical),
      "All and only published cards must be readable",
    );
    const unsafeTables = (
      await db.query<{ name: string }>(
        "SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND (NOT c.relrowsecurity OR has_table_privilege('anon', c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'))",
      )
    ).rows;
    assert.deepEqual(unsafeTables, [], "Public tables must retain RLS and deny visitor writes");
    await serial(catalogue.destinations, async (destination) => {
      const card = destinationCardSchema.parse(
        (
          await db.query<{ data: unknown }>(
            "SELECT public.published_hub_destination_card_v1($1) AS data",
            [destination.id],
          )
        ).rows[0]!.data,
      );
      assert.equal(card.destination.id, destination.id);
      destinationMediaSchema.parse(
        (
          await db.query<{ data: unknown }>(
            "SELECT public.published_hub_destination_media_v1($1) AS data",
            [destination.id],
          )
        ).rows[0]!.data,
      );
      publicCards++;
    });
    await db.exec("ROLLBACK");
  } finally {
    await db.close();
  }
  await mkdir(join(recovery, "objects"), { mode: 0o700 });
  await serial(archive.objects, async (object) => {
    const source = join(output, "objects", object.file);
    assert.equal(
      hash(await readFile(source)),
      object.sha256,
      `Archived bytes differ: ${object.name}`,
    );
    await copyFile(source, join(recovery, "objects", object.file));
    assert.equal(
      hash(await readFile(join(recovery, "objects", object.file))),
      object.sha256,
      `Recovered bytes differ: ${object.name}`,
    );
  });
  const result = {
    capturedAt: manifest.captured_at,
    checkedAt: new Date().toISOString(),
    localRecoveryMs: Math.round(performance.now() - started),
    migrations: archive.migrations.length,
    tables: counts,
    publicCards,
    storageObjects: archive.objects.length,
    storageBytes: totalBytes,
    cmsSha256: archive.cmsSha256,
    status: "passed",
    scope:
      "CMS and public hub-images only; local PostgreSQL and filesystem rehearsal, not a full Supabase project restore",
  };
  await privateJson(join(recovery, "verification.json"), result);
  console.log(
    JSON.stringify({ ...result, evidence: join(recovery, "verification.json") }, null, 2),
  );
  return result;
}
if (import.meta.main) await main();
