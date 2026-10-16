import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

// Real PostgreSQL execution in an isolated, disposable database. Never connects to Supabase.
const directory = new URL("../supabase/migrations/", import.meta.url);
const files = readdirSync(directory)
  .filter((name) => name.endsWith(".sql"))
  .sort();
const db = new PGlite();
try {
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;");
  // Migrations depend on preceding schema/data changes; they must run sequentially.
  for (const file of files) {
    try {
      await db.exec(readFileSync(new URL(file, directory), "utf8"));
    } catch (cause) {
      throw new Error(`Migration failed on a fresh database: ${file}`, { cause });
    }
  }
  const { rows } = await db.query<{ unsafe: number }>(`
    SELECT count(*)::int AS unsafe FROM information_schema.role_table_grants
    WHERE table_schema='public' AND grantee IN ('anon','authenticated','PUBLIC')
      AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER')
  `);
  assert.equal(rows[0]?.unsafe, 0, "Visitors must not receive editorial write permissions");
  const mediaMigration = readFileSync(
    new URL("20261016120000_external_media_reliability.sql", directory),
    "utf8",
  );
  const mediaState = async () =>
    (
      await db.query(`
    SELECT id, destination_id, post_url, display_order, active, embed_mode
    FROM destination_posts ORDER BY id
  `)
    ).rows;
  const beforeReplay = await mediaState();
  await db.exec(mediaMigration);
  assert.deepEqual(
    await mediaState(),
    beforeReplay,
    "Replaying media corrections must not duplicate or reorder posts",
  );
  const { rows: media } = await db.query<{
    links: number;
    replacement: number;
    otherWatersports: number;
  }>(`
    SELECT
      count(*) FILTER (WHERE active AND embed_mode = 'link')::int AS links,
      count(*) FILTER (WHERE destination_id='la-maison-1888' AND active
        AND post_url LIKE '%/DTkauDdEt51/' AND display_order=4)::int AS replacement,
      count(*) FILTER (WHERE destination_id<>'la-maison-1888' AND active
        AND post_url LIKE '%/Dc2etiKCC_C/')::int AS "otherWatersports"
    FROM destination_posts
  `);
  assert.deepEqual(media[0], { links: 6, replacement: 1, otherWatersports: 3 });
  await db.exec(`UPDATE destination_links SET url='https://example.com/newer-schedule.pdf'
    WHERE destination_id='things-to-do' AND kind='DAILY_SCHEDULE' AND active`);
  await assert.rejects(
    db.exec(mediaMigration),
    /schedule changed since audit/,
    "Do not overwrite a newer editorial schedule",
  );
  await db.exec("ROLLBACK");
  // Fresh UUID resolution must stay strict: two matching menu rows cannot be chosen arbitrarily.
  await db.exec(`INSERT INTO destination_links(destination_id,kind,url,label,active)
    SELECT destination_id,kind,url,label,active FROM destination_links
    WHERE destination_id='la-maison-1888' AND kind='MENU';`);
  await assert.rejects(
    db.exec(readFileSync(new URL("20261013140000_current_official_menus.sql", directory), "utf8")),
    /query returned more than one row/,
    "The editorial guard must reject an ambiguous natural key",
  );
  await db.exec("ROLLBACK");
  console.log(`${files.length} migrations replayed; visitor grants and editorial guard verified.`);
} finally {
  await db.close();
}
