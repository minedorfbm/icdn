import assert from "node:assert/strict";
import type { PGlite } from "@electric-sql/pglite";
import { destinationMediaSchema } from "../src/lib/destination-media-schema";

const collections = [
  ["photos", "destination_photos", "active"],
  ["posts", "destination_posts", "active"],
  ["videos", "destination_videos", "active"],
  ["hours", "destination_opening_hours", "published"],
  ["notices", "published_destination_notices", undefined],
  ["collection", "destination_collection_items", "active"],
] as const;
function ordered(values: string[]) {
  const result = [...values];
  result.sort((a, b) => a.localeCompare(b));
  return result;
}
async function read(db: PGlite, id: string) {
  const result = await db.query<{ data: Record<string, Record<string, unknown>[]> }>(
    "SELECT public.published_hub_destination_media_v1($1) AS data",
    [id],
  );
  const data = result.rows[0]!.data;
  destinationMediaSchema.parse(data);
  return data;
}
async function verifyCollection(
  db: PGlite,
  id: string,
  data: Awaited<ReturnType<typeof read>>,
  definition: (typeof collections)[number],
) {
  const [key, table, filter] = definition;
  const columns = destinationMediaSchema.shape[key].unwrap().element.keyof().options;
  const predicate = filter ? " AND " + filter : "";
  const expected = (
    await db.query<{ data: object }>(
      `SELECT to_jsonb(row) AS data FROM (SELECT ${columns.join(",")} FROM public.${table} WHERE destination_id=$1${predicate} ORDER BY display_order) AS row`,
      [id],
    )
  ).rows.map((row) => row.data);
  const actual = data[key]!;
  for (const row of actual) {
    assert.equal(row.destination_id, id);
    assert.deepEqual(ordered(Object.keys(row)), ordered([...columns]));
  }
  assert.deepEqual(
    ordered(actual.map((row) => JSON.stringify(row))),
    ordered(expected.map((row) => JSON.stringify(row))),
    `${id}/${key} preserves all public columns and rows`,
  );
  assert.deepEqual(
    actual.map((row) => row.display_order),
    expected.map((row) => (row as { display_order: number }).display_order),
  );
}
async function checkEmpty(db: PGlite, id: string) {
  assert.ok(Object.values(await read(db, id)).every((rows) => rows.length === 0));
}
/** Real anonymous PostgreSQL checks; the database is disposable and never production. */
export async function checkDestinationMediaSnapshot(db: PGlite) {
  await db.exec("BEGIN; SET LOCAL ROLE anon");
  try {
    const destinations = (
      await db.query<{ id: string }>("SELECT id FROM public.destinations WHERE active")
    ).rows;
    await Promise.all(
      destinations.map(async ({ id }) => {
        const data = await read(db, id);
        assert.deepEqual(
          ordered(Object.keys(data)),
          ordered(Object.keys(destinationMediaSchema.shape)),
        );
        await Promise.all(
          collections.map((definition) => verifyCollection(db, id, data, definition)),
        );
      }),
    );
    await checkEmpty(db, "missing-destination");
  } finally {
    await db.exec("ROLLBACK");
  }
  const properties = (
    await db.query<{ prosecdef: boolean; provolatile: string; proconfig: string[] }>(
      "SELECT prosecdef,provolatile,proconfig FROM pg_proc WHERE oid='public.published_hub_destination_media_v1(text)'::regprocedure",
    )
  ).rows[0]!;
  assert.equal(properties.prosecdef, false);
  assert.equal(properties.provolatile, "s");
  assert.ok(properties.proconfig.some((value) => value.startsWith("search_path=")));
  await db.exec(
    "BEGIN; UPDATE destinations SET active=false WHERE id='citron'; SET LOCAL ROLE anon",
  );
  try {
    await checkEmpty(db, "citron");
    assert.ok(
      (await read(db, "instagram-spots")).collection!.every(
        (row) => row.target_destination_id !== "citron",
      ),
    );
  } finally {
    await db.exec("ROLLBACK");
  }
  await db.exec("BEGIN; REVOKE SELECT ON public.destination_photos FROM anon; SET LOCAL ROLE anon");
  try {
    await assert.rejects(read(db, "citron"), /permission denied/);
  } finally {
    await db.exec("ROLLBACK");
  }
  await db.exec(
    "BEGIN; INSERT INTO destination_photos(destination_id,image_url,active) SELECT 'citron','https://example.com/media-' || n || '.webp',true FROM generate_series(1,1005) n; SET LOCAL ROLE anon",
  );
  try {
    assert.ok((await read(db, "citron")).photos!.length > 1000);
  } finally {
    await db.exec("ROLLBACK");
  }
}
