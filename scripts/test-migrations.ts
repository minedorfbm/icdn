import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { checkCatalogueSnapshot } from "./check-catalogue-snapshot";
import { checkDestinationMediaSnapshot } from "./check-destination-media-snapshot";

// Real PostgreSQL execution in an isolated, disposable database. Never connects to Supabase.
const directory = new URL("../supabase/migrations/", import.meta.url);
const files = readdirSync(directory)
  .filter((name) => name.endsWith(".sql"))
  .sort((a, b) => a.localeCompare(b));
const db = new PGlite();
const earthLevelMigration = "20261018120000_la_maison_building_earth_level.sql";
const maisonState = async () =>
  (
    await db.query(`SELECT
  (SELECT jsonb_agg(to_jsonb(d) - 'level_id' - 'updated_at' ORDER BY id) FROM destinations d WHERE id IN ('la-maison-1888','buffalo-bar','wine-cellar')) AS cards,
  (SELECT to_jsonb(m) - 'level_id' - 'updated_at' FROM map_places m WHERE id='la-maison-1888') AS map,
  (SELECT jsonb_agg(n ORDER BY id) FROM destination_notices n WHERE destination_id IN ('la-maison-1888','buffalo-bar','wine-cellar')) AS notices
`)
  ).rows;
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
const refreshedState = async () =>
  (
    await db.query(`SELECT
      (SELECT jsonb_agg(to_jsonb(d)-'updated_at' ORDER BY id) FROM destinations d) AS cards,
      (SELECT jsonb_agg(to_jsonb(l)-'updated_at' ORDER BY id) FROM destination_links l) AS links,
      (SELECT jsonb_agg(r ORDER BY destination_id,related_destination_id) FROM destination_relations r) AS relations,
      (SELECT jsonb_agg(e ORDER BY id,destination_id) FROM published_destination_events e) AS events`)
  ).rows;

const longBarMigration = "20261018170000_long_bar_sea_hd_photo.sql";
const longBarPreservedState = async () =>
  (
    await db.query(`SELECT
  (SELECT jsonb_agg(CASE
    WHEN id='long-bar' THEN to_jsonb(d)-'updated_at'-'level_id'-'image_key'
    WHEN id IN ('long-pool','soar-gym','planet-trekkers') THEN to_jsonb(d)-'updated_at'-'level_id'
    ELSE to_jsonb(d) END ORDER BY id) FROM destinations d) AS cards,
  (SELECT jsonb_agg(CASE WHEN id='long-bar' THEN to_jsonb(m)-'level_id' ELSE to_jsonb(m) END ORDER BY id) FROM map_places m) AS places,
  (SELECT jsonb_agg(l ORDER BY place_id,destination_id) FROM map_destination_links l) AS map_links,
  (SELECT jsonb_agg(p ORDER BY id) FROM destination_photos p) AS photos,
  (SELECT jsonb_agg(p ORDER BY id) FROM destination_posts p) AS posts,
  (SELECT jsonb_agg(v ORDER BY id) FROM destination_videos v) AS videos
`)
  ).rows;

const discoveryBalanceMigration = "20261019030000_balance_discovery_chapters.sql";
const discoveryPreservedState = async () =>
  (
    await db.query(`SELECT
    (SELECT jsonb_agg(to_jsonb(d)-'level_id'-'display_order'-'updated_at' ORDER BY id) FROM destinations d) AS cards,
    (SELECT jsonb_agg(m ORDER BY id) FROM map_places m) AS places,
    (SELECT jsonb_agg(l ORDER BY place_id,destination_id) FROM map_destination_links l) AS links
  `)
  ).rows;

async function applyAndCheckMigration(file: string): Promise<void> {
  try {
    const beforePhotos =
      file === "20261019040000_lobby_instagram_first_images.sql"
        ? (
            await db.query(
              `SELECT jsonb_agg(CASE WHEN id IN ('reception','instagram-spots') THEN to_jsonb(d)-'image_key'-'updated_at' ELSE to_jsonb(d) END ORDER BY id) AS cards FROM destinations d`,
            )
          ).rows
        : undefined;
    const beforeDiscovery =
      file === discoveryBalanceMigration ? await discoveryPreservedState() : undefined;
    const beforeLevel = file === earthLevelMigration ? await maisonState() : undefined;
    const beforeRemoval = file === marineRemoval ? await seasideState() : undefined;
    const beforeLongBar = file === longBarMigration ? await longBarPreservedState() : undefined;
    const migration = readFileSync(new URL(file, directory), "utf8");
    await db.exec(migration);
    if (beforePhotos) {
      assert.deepEqual(
        (
          await db.query(
            `SELECT jsonb_agg(CASE WHEN id IN ('reception','instagram-spots') THEN to_jsonb(d)-'image_key'-'updated_at' ELSE to_jsonb(d) END ORDER BY id) AS cards FROM destinations d`,
          )
        ).rows,
        beforePhotos,
        "Photo replacement preserves detail images and all other card content",
      );
      assert.deepEqual(
        (
          await db.query(
            `SELECT id,image_key FROM destinations WHERE id IN ('reception','instagram-spots') ORDER BY id`,
          )
        ).rows,
        [
          { id: "instagram-spots", image_key: "/images/instagram-spots-home-b9f70907d92f.jpg" },
          {
            id: "reception",
            image_key:
              "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/instagram-spots-home-8755d08eef.webp",
          },
        ],
      );
      const after = await refreshedState();
      await db.exec(migration);
      assert.deepEqual(await refreshedState(), after, "First photo replacement is idempotent");
    }
    if (beforeDiscovery) {
      assert.deepEqual(
        await discoveryPreservedState(),
        beforeDiscovery,
        "Rebalancing preserves card content and physical map locations",
      );
      assert.deepEqual(
        (
          await db.query(
            `SELECT level_id, count(*)::int AS count FROM destinations WHERE active AND cluster='EXPERIENCES' AND type<>'accommodation' GROUP BY level_id ORDER BY level_id`,
          )
        ).rows,
        [
          { level_id: "earth", count: 9 },
          { level_id: "heaven", count: 9 },
          { level_id: "sea", count: 8 },
          { level_id: "sky", count: 9 },
        ],
      );
      for (const [level, expected] of [
        ["heaven", ["citron", "club-lounge"]],
        ["sea", ["terra-mare", "long-bar", "b-lounge"]],
      ] as const) {
        const rows = (
          await db.query<{ id: string }>(
            `SELECT id FROM destinations WHERE active AND cluster='DINING' AND level_id=$1 ORDER BY display_order LIMIT $2`,
            [level, expected.length],
          )
        ).rows;
        assert.deepEqual(
          rows.map((row) => row.id),
          [...expected],
        );
      }
      const after = await refreshedState();
      await db.exec(migration);
      assert.deepEqual(await refreshedState(), after, "Discovery rebalancing is idempotent");
    }
    if (file === "20261016160000_reviewed_catalogue_refresh.sql") {
      // Check replay at this migration's own point in history, before later photo replacements.
      const before = await refreshedState();
      await db.exec(migration);
      assert.deepEqual(
        await refreshedState(),
        before,
        "Catalogue refresh replay preserves content",
      );
    }
    if (beforeLongBar) {
      assert.deepEqual(
        await longBarPreservedState(),
        beforeLongBar,
        "Sea correction preserves all other content, map positions and media associations",
      );
      assert.deepEqual(
        (
          await db.query(
            "SELECT id,level_id FROM destinations WHERE id IN ('long-bar','long-pool','planet-trekkers','soar-gym') ORDER BY id",
          )
        ).rows,
        ["long-bar", "long-pool", "planet-trekkers", "soar-gym"].map((id) => ({
          id,
          level_id: "sea",
        })),
      );
      const after = await refreshedState();
      await db.exec(migration);
      assert.deepEqual(await refreshedState(), after, "Long Bar update is idempotent");
      await db.exec(
        "BEGIN; UPDATE destinations SET image_key='https://example.com/newer.webp' WHERE id='long-bar'",
      );
      await assert.rejects(
        db.exec(migration),
        /Long Bar changed since/,
        "Keep a newer editorial photo",
      );
      await db.exec("ROLLBACK");
    }
    if (beforeLevel)
      assert.deepEqual(
        await maisonState(),
        beforeLevel,
        "Level correction preserves coordinates, notices and all other card content",
      );
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
try {
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;");
  // Migrations depend on preceding schema/data changes; they must run sequentially.
  await files.reduce(
    (previous, file) => previous.then(() => applyAndCheckMigration(file)),
    Promise.resolve(),
  );
  await checkCatalogueSnapshot(db);
  await checkDestinationMediaSnapshot(db);
  const guideMigration = readFileSync(
    new URL("20261018151000_instagram_spots_guide.sql", directory),
    "utf8",
  );
  const guideState = async () =>
    (
      await db.query(`SELECT
    (SELECT jsonb_agg(c ORDER BY key) FROM destination_collection_items c) AS collection,
    (SELECT jsonb_agg(p ORDER BY id) FROM destination_posts p) AS posts,
    (SELECT jsonb_agg(v ORDER BY id) FROM destination_videos v) AS videos,
    (SELECT jsonb_agg(l ORDER BY id) FROM destination_links l) AS links,
    (SELECT jsonb_agg(t ORDER BY link_id,locale) FROM destination_link_translations t) AS translations,
    (SELECT jsonb_agg(d ORDER BY id) FROM destinations d) AS destinations
  `)
    ).rows;
  const guideBefore = await guideState();
  await db.exec(readFileSync(new URL("20261018150500_publish_lobby.sql", directory), "utf8"));
  await db.exec(guideMigration);
  assert.deepEqual(
    await guideState(),
    guideBefore,
    "Guide replay preserves every card and media association",
  );
  const guide = (
    await db.query<{ key: string; translations: Record<string, unknown>; description: string }>(
      "SELECT key,translations,description FROM destination_collection_items WHERE destination_id='instagram-spots' ORDER BY display_order",
    )
  ).rows;
  assert.deepEqual(
    guide.map((row) => row.key),
    [..."ABCDEFGHI"],
  );
  assert.ok(guide.every((row) => Object.keys(row.translations).length === 5));
  assert.match(guide[3]!.description, /Christian Le Squer/);
  assert.deepEqual((await db.query("SELECT active FROM destinations WHERE id='reception'")).rows, [
    { active: true },
  ]);
  assert.equal(
    (
      await db.query(
        "SELECT id FROM destination_posts WHERE destination_id='instagram-spots' AND active",
      )
    ).rows.length,
    6,
  );
  assert.equal(
    (
      await db.query(
        "SELECT id FROM destination_videos WHERE destination_id='instagram-spots' AND active",
      )
    ).rows.length,
    1,
  );
  assert.deepEqual(
    (
      await db.query(`SELECT
        (SELECT count(*)::int FROM destination_posts WHERE destination_id='reception' AND active) AS posts,
        (SELECT count(*)::int FROM destination_videos WHERE destination_id='reception' AND active) AS videos`)
    ).rows,
    [{ posts: 2, videos: 1 }],
    "Shared media import publishes both Lobby posts and its design video",
  );
  await db.exec("SET ROLE anon");
  assert.equal((await db.query("SELECT key FROM destination_collection_items")).rows.length, 9);
  await assert.rejects(
    db.exec("UPDATE destination_collection_items SET active=false"),
    /permission denied/,
  );
  await db.exec(
    "RESET ROLE; BEGIN; UPDATE destinations SET active=false WHERE id='citron'; SET ROLE anon",
  );
  assert.equal(
    (await db.query("SELECT key FROM destination_collection_items WHERE key='C'")).rows.length,
    0,
  );
  await db.exec(
    "ROLLBACK; RESET ROLE; BEGIN; UPDATE destinations SET active=false WHERE id='instagram-spots'; SET ROLE anon",
  );
  assert.equal((await db.query("SELECT key FROM destination_collection_items")).rows.length, 0);
  await db.exec("ROLLBACK; RESET ROLE");
  const earthCards = await db.query(
    "SELECT id, level_id FROM destinations WHERE id IN ('la-maison-1888','buffalo-bar','wine-cellar') ORDER BY id",
  );
  assert.deepEqual(
    earthCards.rows,
    ["buffalo-bar", "la-maison-1888", "wine-cellar"].map((id) => ({ id, level_id: "earth" })),
  );
  assert.deepEqual(
    (await db.query("SELECT level_id FROM map_places WHERE id='la-maison-1888'")).rows,
    [{ level_id: "earth" }],
  );
  const beforeLevelReplay = await maisonState();
  await db.exec(readFileSync(new URL(earthLevelMigration, directory), "utf8"));
  assert.deepEqual(await maisonState(), beforeLevelReplay, "Level correction is idempotent");
  const { rows } = await db.query<{ unsafe: number }>(`
    SELECT count(*)::int AS unsafe FROM information_schema.role_table_grants
    WHERE table_schema='public' AND grantee IN ('anon','authenticated','PUBLIC')
      AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER')
  `);
  assert.equal(rows[0]?.unsafe, 0, "Visitors must not receive editorial write permissions");
  const selectedPhotoMigration = readFileSync(
    new URL("20261016190000_selected_weddings_shuttle_photos.sql", directory),
    "utf8",
  );
  const selectedPhotoState = async () =>
    (
      await db.query(
        "SELECT to_jsonb(d) AS destination FROM destinations d WHERE id IN ('weddings','shuttle','nail-hair') ORDER BY id",
      )
    ).rows;
  const beforePhotoReplay = await selectedPhotoState();
  await db.exec(selectedPhotoMigration);
  assert.deepEqual(
    await selectedPhotoState(),
    beforePhotoReplay,
    "Selected photos replay without changing card content",
  );
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
  const wheelMigration = readFileSync(
    new URL("20261016180000_yoga_wheel_stretch.sql", directory),
    "utf8",
  );
  const beforeWheelReplay = await wellnessState();
  await db.exec(wheelMigration);
  assert.deepEqual(
    await wellnessState(),
    beforeWheelReplay,
    "Yoga Wheel must not duplicate or reorder classes on replay",
  );
  assert.deepEqual(
    (
      await db.query(`SELECT title,schedule FROM destination_events
    WHERE destination_id='yoga-pavilion' AND title IN ('Yoga Flow','Yoga Wheel Stretch')
    ORDER BY display_order`)
    ).rows,
    [
      { title: "Yoga Flow", schedule: ["MONDAY & WEDNESDAY–SATURDAY", "07:30 – 08:30"] },
      { title: "Yoga Wheel Stretch", schedule: ["TUESDAY AND SUNDAY", "07:30 – 08:30"] },
    ],
    "Preserve the two distinct classes and their own days",
  );
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
      { destination_id: "yoga-pavilion", count: 4 },
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
    30,
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
  assert.deepEqual(media[0], { links: 3, replacement: 1, otherWatersports: 2 });
  const { rows: pausedVideos } = await db.query<{ total: number; active: number }>(`
    SELECT count(*)::int AS total,
      count(*) FILTER (WHERE active)::int AS active
    FROM destination_posts
    WHERE (destination_id, (regexp_match(post_url, '/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1]) IN (
      ('la-maison-1888', 'DdQWW42D91g'),
      ('wine-cellar', 'DdQWW42D91g'),
      ('wine-cellar', 'DFfKmy2O0Bt')
    )
  `);
  assert.deepEqual(pausedVideos[0], { total: 3, active: 0 });
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
