import assert from "node:assert/strict";
import type { PGlite } from "@electric-sql/pglite";
import { hubDataSchema } from "../src/lib/hub-schema";
import { destinationCardSchema, focusDestinationCard } from "../src/lib/destination-card-schema";

export async function checkDestinationCardSnapshot(db: PGlite) {
  const read = async (id: string) =>
    (
      await db.query<{ data: unknown }>(
        "SELECT public.published_hub_destination_card_v1($1) AS data",
        [id],
      )
    ).rows[0]!.data;
  await db.exec("BEGIN; SET LOCAL ROLE anon");
  try {
    const full = hubDataSchema.parse(
      (await db.query<{ data: unknown }>("SELECT public.published_hub_catalogue_v1() AS data"))
        .rows[0]!.data,
    );
    for (const destination of full.destinations ?? []) {
      const actual = destinationCardSchema.parse(await read(destination.id));
      const expected = focusDestinationCard(full, destination.id)!;
      const normalize = (card: typeof actual) => ({
        ...card,
        linkTranslations: [...card.linkTranslations].sort(
          (a, b) => a.locale.localeCompare(b.locale) || a.link_id.localeCompare(b.link_id),
        ),
        editorial: {
          descriptions: [...card.editorial.descriptions].sort((a, b) =>
            a.locale.localeCompare(b.locale),
          ),
          events: [...card.editorial.events].sort(
            (a, b) => a.locale.localeCompare(b.locale) || a.event_id.localeCompare(b.event_id),
          ),
        },
      });
      assert.deepEqual(normalize(actual), normalize(expected), destination.id);
    }
    assert.equal(await read("missing-destination"), null);
  } finally {
    await db.exec("ROLLBACK");
  }
  const properties = (
    await db.query<{ prosecdef: boolean; provolatile: string; proconfig: string[] }>(
      "SELECT prosecdef,provolatile,proconfig FROM pg_proc WHERE oid='public.published_hub_destination_card_v1(text)'::regprocedure",
    )
  ).rows[0]!;
  assert.equal(properties.prosecdef, false);
  assert.equal(properties.provolatile, "s");
  assert.ok(properties.proconfig.some((value) => value.startsWith("search_path=")));
  await db.exec(
    "BEGIN; UPDATE destinations SET active=false WHERE id='citron'; SET LOCAL ROLE anon",
  );
  try {
    assert.equal(await read("citron"), null);
  } finally {
    await db.exec("ROLLBACK");
  }
  await db.exec("BEGIN; REVOKE SELECT ON public.destination_links FROM anon; SET LOCAL ROLE anon");
  try {
    await assert.rejects(read("citron"), /permission denied/);
  } finally {
    await db.exec("ROLLBACK");
  }
  await db.exec(
    "BEGIN; INSERT INTO destination_links(destination_id,kind,label,url,active) SELECT 'citron','INFO','Test','https://example.com/' || n,true FROM generate_series(1,1005) n; SET LOCAL ROLE anon",
  );
  try {
    assert.ok(destinationCardSchema.parse(await read("citron")).links.length > 1000);
  } finally {
    await db.exec("ROLLBACK");
  }
}
