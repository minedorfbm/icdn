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
  const wellnessMigration = readFileSync(
    new URL("20261016170000_wellness_events_by_venue.sql", directory),
    "utf8",
  );
  const wellnessState = async () =>
    (
      await db.query(`SELECT
    (SELECT jsonb_agg(e ORDER BY id) FROM destination_events e) AS events,
    (SELECT jsonb_agg(t ORDER BY event_id,locale) FROM event_translations t) AS translations`)
    ).rows;
  const beforeWellnessReplay = await wellnessState();
  await db.exec(wellnessMigration);
  assert.deepEqual(
    await wellnessState(),
    beforeWellnessReplay,
    "Wellness imports must be idempotent, including order and translations",
  );
  const wellnessCards = (
    await db.query<{ destination_id: string; count: number }>(`
    SELECT destination_id,count(*)::int FROM destination_events
    WHERE destination_id IN ('yoga-pavilion','mi-sol-spa','nail-hair','relaxation-pavilion') AND active
    GROUP BY destination_id ORDER BY destination_id`)
  ).rows;
  assert.deepEqual(
    wellnessCards,
    [
      { destination_id: "mi-sol-spa", count: 1 },
      { destination_id: "nail-hair", count: 1 },
      { destination_id: "yoga-pavilion", count: 3 },
    ],
    "Assign classes to the beach pavilion and workshops to their actual venues",
  );
  assert.equal(
    (
      await db.query(`SELECT count(*)::int AS count FROM event_translations t
    JOIN destination_events e ON e.id=t.event_id
    WHERE e.destination_id IN ('yoga-pavilion','mi-sol-spa','nail-hair')
      AND t.published AND t.source_title=e.title AND t.source_schedule=e.schedule
      AND t.source_description=e.description`)
    ).rows[0]?.count,
    25,
  );
  assert.deepEqual(
    (
      await db.query(`SELECT destination_id,schedule FROM destination_events
    WHERE title='Complimentary Wellness & Beauty Experiences' ORDER BY destination_id`)
    ).rows,
    [
      { destination_id: "mi-sol-spa", schedule: ["MONDAY–THURSDAY", "12:15 – 13:00"] },
      { destination_id: "nail-hair", schedule: ["FRIDAY–SUNDAY", "12:15 – 13:00"] },
    ],
    "Beauty workshops must not advertise seven days at either venue",
  );
  await db.exec(
    "BEGIN; UPDATE destination_events SET description='A newer editorial revision' WHERE title='Yoga Flow' AND destination_id='yoga-pavilion'",
  );
  await assert.rejects(
    db.exec(wellnessMigration),
    /Wellness event changed since selection/,
    "Preserve newer wellness edits",
  );
  await db.exec("ROLLBACK");
  const refreshMigration = readFileSync(
    new URL("20261016160000_reviewed_catalogue_refresh.sql", directory),
    "utf8",
  );
  const refreshedState = async () =>
    (
      await db.query(`SELECT
      (SELECT jsonb_agg(to_jsonb(d)-'updated_at' ORDER BY id) FROM destinations d) AS cards,
      (SELECT jsonb_agg(to_jsonb(l)-'updated_at' ORDER BY id) FROM destination_links l) AS links,
      (SELECT jsonb_agg(r ORDER BY destination_id,related_destination_id) FROM destination_relations r) AS relations,
      (SELECT jsonb_agg(e ORDER BY id,destination_id) FROM published_destination_events e) AS events`)
    ).rows;
  const beforeRefreshReplay = await refreshedState();
  await db.exec(refreshMigration);
  assert.deepEqual(
    await refreshedState(),
    beforeRefreshReplay,
    "Catalogue refresh must not swap photos twice or duplicate links",
  );
  const sharedEvents = (
    await db.query<{ id: string; destination_id: string }>(`
    SELECT id,destination_id FROM published_destination_events
    WHERE title='Souvenirs de France Wine Tasting' ORDER BY destination_id`)
  ).rows;
  assert.deepEqual(
    sharedEvents.map((e) => e.destination_id),
    ["la-maison-1888", "wine-cellar"],
  );
  assert.equal(
    sharedEvents[0]?.id,
    sharedEvents[1]?.id,
    "Both cards must use one event and its translations",
  );
  await db.exec("BEGIN; SET LOCAL ROLE anon");
  assert.equal(
    (
      await db.query(
        "SELECT id FROM published_destination_events WHERE destination_id='wine-cellar'",
      )
    ).rows.length,
    1,
  );
  await assert.rejects(
    db.exec(
      "INSERT INTO destination_event_links SELECT id,'citron' FROM destination_events LIMIT 1",
    ),
    /permission denied/,
  );
  await db.exec("ROLLBACK");
  await db.exec(
    "BEGIN; UPDATE destination_events SET active=false WHERE destination_id='la-maison-1888'; SET LOCAL ROLE anon",
  );
  assert.equal(
    (
      await db.query(
        "SELECT id FROM published_destination_events WHERE destination_id='wine-cellar'",
      )
    ).rows.length,
    0,
    "Unpublishing the source event hides it everywhere",
  );
  await db.exec("ROLLBACK");
  await db.exec(
    "BEGIN; UPDATE destinations SET image_key='https://example.com/newer-photo.webp' WHERE id='citron'",
  );
  await assert.rejects(
    db.exec(refreshMigration),
    /Catalogue changed since review/,
    "Preserve a newer editorial photograph",
  );
  await db.exec("ROLLBACK");
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
