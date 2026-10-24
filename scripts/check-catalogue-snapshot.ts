import assert from "node:assert/strict";
import type { PGlite } from "@electric-sql/pglite";
import * as schema from "../src/lib/hub-schema";
import { completeCatalogue } from "../src/lib/hub-data-completeness";

/** Exercise the RPC as the real anonymous PostgreSQL role, independently of HTTP mocks. */
export async function checkCatalogueSnapshot(db: PGlite) {
  const collections = [
    ["levels", "levels", schema.levelRow, undefined, "display_order"],
    ["destinations", "destinations", schema.destinationRow, "active", "display_order"],
    ["links", "destination_links", schema.linkRow, "active", "display_order"],
    ["events", "published_destination_events", schema.eventRow, "active", "display_order"],
    ["mapPlaces", "map_places", schema.mapPlaceRow, "active", "pin"],
    ["mapLinks", "map_destination_links", schema.mapLinkRow, "active", "display_order"],
    ["linkTranslations", "destination_link_translations", schema.linkTranslationRow, "active"],
    ["siteLinkTranslations", "site_link_translations", schema.siteLinkTranslationRow, "active"],
    [
      "relations",
      "destination_relations",
      schema.destinationRelationRow,
      "active",
      "display_order",
    ],
    ["descriptions", "destination_translations", schema.descriptionRow, "published"],
    ["translatedEvents", "event_translations", schema.eventTranslationRow, "published"],
  ] as const;
  const readRaw = async () =>
    (
      await db.query<{ data: Record<string, unknown> }>(
        "SELECT public.published_hub_catalogue_v1() AS data",
      )
    ).rows[0]!.data;
  const read = async () => schema.hubDataSchema.required().parse(await readRaw());
  await db.exec("BEGIN; SET LOCAL ROLE anon");
  try {
    const snapshot = await read();
    const raw = await readRaw();
    assert.deepEqual(Object.keys(raw).sort(), schema.hubDataSchema.keyof().options.sort());
    assert.ok(completeCatalogue(snapshot));
    for (const [name, table, row, filter, order] of collections) {
      const columns = row.keyof().options.join(",");
      const expected = (
        await db.query(
          `SELECT ${columns} FROM public.${table}${filter ? ` WHERE ${filter}` : ""}${order ? ` ORDER BY ${order}` : ""}`,
        )
      ).rows;
      const actual =
        name === "descriptions"
          ? snapshot.editorial!.descriptions
          : name === "translatedEvents"
            ? snapshot.editorial!.events
            : snapshot[name];
      const rawRows =
        name === "descriptions"
          ? (raw.editorial as { descriptions: object[] }).descriptions
          : name === "translatedEvents"
            ? (raw.editorial as { events: object[] }).events
            : (raw[name] as object[]);
      for (const item of rawRows)
        assert.deepEqual(
          Object.keys(item).sort(),
          row.keyof().options.sort(),
          `${name} exposes only approved columns`,
        );
      // Equal sort values have no guaranteed relative order in either API.
      const canonical = (value: unknown): unknown => {
        if (Array.isArray(value)) return value.map(canonical);
        if (value !== null && typeof value === "object")
          return Object.fromEntries(
            Object.entries(value)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, item]) => [key, canonical(item)]),
          );
        return value;
      };
      const normalized = (rows: unknown[]) =>
        rows.map((value) => JSON.stringify(canonical(value))).sort();
      assert.deepEqual(
        normalized(actual!),
        normalized(expected),
        `RPC preserves every public ${name} column and row`,
      );
      if (order)
        assert.deepEqual(
          actual!.map((value) => (value as Record<string, unknown>)[order]),
          expected.map((value) => value[order]),
          `${name} ordering is preserved`,
        );
    }
    assert.deepEqual(snapshot.settings, {});
    assert.ok(!("photos" in snapshot) && !("posts" in snapshot) && !("videos" in snapshot));
  } finally {
    await db.exec("ROLLBACK");
  }
  const properties = (
    await db.query<{ prosecdef: boolean; provolatile: string; proconfig: string[] }>(
      "SELECT prosecdef,provolatile,proconfig FROM pg_proc WHERE oid='public.published_hub_catalogue_v1()'::regprocedure",
    )
  ).rows[0]!;
  assert.equal(properties.prosecdef, false, "The RPC must never bypass the caller's RLS");
  assert.equal(properties.provolatile, "s", "GET must remain read-only");
  assert.ok(properties.proconfig.some((value) => value.startsWith("search_path=")));
  await db.exec("BEGIN; REVOKE SELECT ON public.destination_links FROM anon; SET LOCAL ROLE anon");
  try {
    await assert.rejects(
      read(),
      /permission denied/,
      "RPC execution never grants access to a table the caller cannot read",
    );
  } finally {
    await db.exec("ROLLBACK");
  }
  await db.exec(
    "BEGIN; UPDATE destinations SET active=false WHERE id='citron'; SET LOCAL ROLE anon",
  );
  try {
    const snapshot = await read();
    assert.ok(!snapshot.destinations!.some((row) => row.id === "citron"));
    assert.ok(!snapshot.links!.some((row) => row.destination_id === "citron"));
    assert.ok(!snapshot.editorial!.descriptions!.some((row) => row.destination_id === "citron"));
  } finally {
    await db.exec("ROLLBACK");
  }
  await db.exec(`BEGIN; INSERT INTO destination_links(destination_id,kind,url,label,active)
    SELECT 'citron','MENU','https://example.com/catalogue-' || n || '.pdf','Snapshot cap test',true FROM generate_series(1,1005) n;
    SET LOCAL ROLE anon`);
  try {
    assert.ok(
      (await read()).links!.length > 1000,
      "JSON snapshot includes the complete catalogue above the REST row limit",
    );
  } finally {
    await db.exec("ROLLBACK");
  }
}
