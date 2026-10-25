import { afterAll, beforeAll, expect, test } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createCmsArchive, verifyArchive } from "../scripts/rehearse-cms-recovery";

let directory: string;
let input: string;
let exported: { section: string; name: string; payload: unknown }[];
const bytes = new Uint8Array([1, 2, 3, 4]);
const publicImage = (async (url, options) => {
  expect(String(url)).toStartWith(
    "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/fixture%20image.webp?",
  );
  expect(options?.redirect).toBe("error");
  expect(options?.signal).toBeInstanceOf(AbortSignal);
  return new Response(bytes, { headers: { etag: '"fixture"' } });
}) as typeof fetch;

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "icdn-cms-recovery-test-"));
  input = join(directory, "export.json");
  const db = new PGlite();
  try {
    await db.exec(
      "SET TIME ZONE 'UTC'; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;",
    );
    const migrations = (await readdir(new URL("../supabase/migrations", import.meta.url)))
      .filter((name) => name.endsWith(".sql"))
      .sort();
    for (const name of migrations)
      await db.exec(
        await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8"),
      );
    // A stale, inactive language variant must survive byte-for-byte without an INSERT trigger recapturing its source.
    await db.exec(
      "ALTER TABLE destination_link_translations DISABLE TRIGGER USER; UPDATE destination_link_translations SET active=false, source_url='https://old.example/draft' WHERE (link_id,locale) IN (SELECT link_id,locale FROM destination_link_translations LIMIT 1); ALTER TABLE destination_link_translations ENABLE TRIGGER USER",
    );
    await db.exec(
      "CREATE SCHEMA supabase_migrations; CREATE TABLE supabase_migrations.schema_migrations(version text PRIMARY KEY); CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text, public boolean); CREATE TABLE storage.objects(bucket_id text, name text, metadata jsonb, updated_at timestamptz); INSERT INTO storage.buckets VALUES('hub-images',true); INSERT INTO storage.objects VALUES('hub-images','fixture image.webp','{\"size\":4,\"eTag\":\"fixture\"}',now())",
    );
    await db.query(
      "INSERT INTO supabase_migrations.schema_migrations SELECT jsonb_array_elements_text($1::jsonb)",
      [JSON.stringify(migrations.map((name) => name.split("_")[0]))],
    );
    exported = (
      await db.query<{ section: string; name: string; payload: unknown }>(
        await readFile(
          new URL("../supabase/manual/export-cms-recovery.sql", import.meta.url),
          "utf8",
        ),
      )
    ).rows;
    await writeFile(input, JSON.stringify(exported), { mode: 0o600 });
  } finally {
    await db.close();
  }
}, 30_000);

afterAll(async () => {
  if (directory) await rm(directory, { recursive: true, force: true });
});

test("real SQL export, archived bytes and a fresh offline PostgreSQL recovery preserve published cards and drafts", async () => {
  const output = join(directory, "archive");
  const result = await createCmsArchive(input, output, publicImage);
  expect(result.status).toBe("passed");
  expect(result.publicCards).toBeGreaterThan(0);
  expect(Object.keys(result.tables)).toHaveLength(23);
  expect(result.storageObjects).toBe(1);
  expect(result.storageBytes).toBe(4);
  expect((await stat(join(output, "cms.json"))).mode & 0o777).toBe(0o600);
  expect((await stat(output)).mode & 0o777).toBe(0o700);
  const again = await verifyArchive(output);
  expect(again.tables).toEqual(result.tables);
  expect(again.cmsSha256).toBe(result.cmsSha256);
  expect((await readdir(output)).filter((name) => name.startsWith("recovery-"))).toHaveLength(2);
  await expect(createCmsArchive(input, output, publicImage)).rejects.toThrow();

  const archive = JSON.parse(await readFile(join(output, "archive.json"), "utf8"));
  const image = join(output, "objects", archive.objects[0].file);
  await writeFile(image, new Uint8Array([1, 9, 3, 4]));
  await expect(verifyArchive(output)).rejects.toThrow("Archived bytes differ:");
  await writeFile(image, bytes);
  await writeFile(
    join(output, "cms.json"),
    (await readFile(join(output, "cms.json"), "utf8")) + " ",
  );
  await expect(verifyArchive(output)).rejects.toThrow();
}, 30_000);

test("incomplete, duplicate, drifted and unsafe exports are refused before remote image reads", async () => {
  let reads = 0;
  const noReads = (async () => {
    reads++;
    throw new Error("Unexpected network request");
  }) as typeof fetch;
  const cases = [
    exported.slice(1),
    [...exported.slice(0, -1), exported[0]],
    exported.map((row) =>
      row.section === "manifest"
        ? { ...row, payload: { ...(row.payload as object), versions: [] } }
        : row,
    ),
  ];
  for (let index = 0; index < cases.length; index++) {
    const path = join(directory, `bad-${index}.json`);
    await writeFile(path, JSON.stringify(cases[index]));
    await expect(
      createCmsArchive(path, join(directory, `bad-out-${index}`), noReads),
    ).rejects.toThrow();
  }
  await expect(
    createCmsArchive(input, new URL("../private-backup", import.meta.url).pathname, noReads),
  ).rejects.toThrow("outside the Git repository");
  await expect(
    createCmsArchive("relative.json", join(directory, "relative"), noReads),
  ).rejects.toThrow("absolute paths");
  await expect(verifyArchive(new URL("../", import.meta.url).pathname)).rejects.toThrow(
    "outside the repository",
  );
  expect(reads).toBe(0);
});

test("changed, oversized and unavailable image objects never produce a complete archive", async () => {
  const responses = [
    new Response(bytes, { headers: { etag: "changed" } }),
    new Response(new Uint8Array(5), { headers: { etag: "fixture" } }),
    new Response(null, { status: 404 }),
    new Response(new Uint8Array(3), { headers: { etag: "fixture" } }),
  ];
  for (let index = 0; index < responses.length; index++) {
    const output = join(directory, `failed-image-${index}`);
    await expect(
      createCmsArchive(input, output, (async () => responses[index]!) as typeof fetch),
    ).rejects.toThrow();
    expect(await readdir(output)).not.toContain("archive.json");
  }
}, 30_000);
