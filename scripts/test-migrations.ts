import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

// Real PostgreSQL execution in an isolated, disposable database. Never connects to Supabase.
const directory = new URL("../supabase/migrations/", import.meta.url);
const files = readdirSync(directory)
  .filter((name) => name.endsWith(".sql"))
  .sort();
const db = new PGlite();
const marineRemoval = "20261016140000_remove_duplicate_marine_centre.sql";
const seasideState = async () =>
  (
    await db.query(`SELECT
      (SELECT to_jsonb(d) FROM destinations d WHERE id='sea-experiences') AS destination,
      (SELECT jsonb_agg(p ORDER BY id) FROM destination_posts p WHERE destination_id='sea-experiences') AS posts,
      (SELECT jsonb_agg(l ORDER BY id) FROM destination_links l WHERE destination_id='sea-experiences') AS links,
      (SELECT jsonb_agg(t ORDER BY locale) FROM destination_translations t WHERE destination_id='sea-experiences') AS translations,
      (SELECT to_jsonb(m) FROM map_places m WHERE id='beach-activity-centre') AS map_place`)
  ).rows;
try {
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;");
  // Migrations depend on preceding schema/data changes; they must run sequentially.
  for (const file of files) {
    try {
      const beforeRemoval = file === marineRemoval ? await seasideState() : undefined;
      await db.exec(readFileSync(new URL(file, directory), "utf8"));
      if (beforeRemoval) {
        assert.deepEqual(
          await seasideState(),
          beforeRemoval,
          "Keep Seaside content and official map point unchanged",
        );
      }
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
  assert.deepEqual(media[0], { links: 6, replacement: 1, otherWatersports: 2 });
  const thingsToDoMigration = readFileSync(
    new URL("20261016130000_things_to_do_instagram_additions.sql", directory),
    "utf8",
  );
  const beforeThingsToDoReplay = await mediaState();
  await db.exec(thingsToDoMigration);
  assert.deepEqual(
    await mediaState(),
    beforeThingsToDoReplay,
    "Instagram additions must be idempotent",
  );
  const { rows: thingsToDoPosts } = await db.query<{ shortcode: string }>(`
    SELECT (regexp_match(post_url, '/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1] AS shortcode
    FROM destination_posts WHERE destination_id='things-to-do' AND active ORDER BY display_order
  `);
  assert.deepEqual(
    thingsToDoPosts.map((post) => post.shortcode),
    ["Dc2etiKCC_C", "DeB5v5MjKSV", "DThay1Lksbj", "DQOWKlCj7-M", "DLrapcEP3SQ"],
    "Keep watersports first and append the four selected posts in order",
  );
  const beforeRemovalReplay = await seasideState();
  await db.exec(readFileSync(new URL(marineRemoval, directory), "utf8"));
  assert.deepEqual(
    await seasideState(),
    beforeRemovalReplay,
    "Duplicate removal must be idempotent",
  );
  const { rows: removedCard } = await db.query(
    `SELECT id FROM destinations WHERE id='marine-centre'`,
  );
  assert.deepEqual(removedCard, []);
  const { rows: beachMap } = await db.query(`
    SELECT destination_id, active, is_primary FROM map_destination_links WHERE place_id='beach-activity-centre'
  `);
  assert.deepEqual(beachMap, [
    { destination_id: "sea-experiences", active: true, is_primary: true },
  ]);
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
