import assert from "node:assert/strict";
import type { PGlite } from "@electric-sql/pglite";
import { openingHoursRow } from "../src/lib/opening-hours-schema";
import * as schema from "../src/lib/hub-schema";
import { completeCatalogue } from "../src/lib/hub-data-completeness";

const collections = [
  ["openingHours", "destination_opening_hours", openingHoursRow, "published", "display_order"],
  ["levels", "levels", schema.levelRow, undefined, "display_order"],
  ["destinations", "destinations", schema.destinationRow, "active", "display_order"],
  ["links", "destination_links", schema.linkRow, "active", "display_order"],
  ["events", "published_destination_events", schema.eventRow, "active", "display_order"],
  ["mapPlaces", "map_places", schema.mapPlaceRow, "active", "pin"],
  ["mapLinks", "map_destination_links", schema.mapLinkRow, "active", "display_order"],
  ["linkTranslations", "destination_link_translations", schema.linkTranslationRow, "active"],
  ["siteLinkTranslations", "site_link_translations", schema.siteLinkTranslationRow, "active"],
  ["relations", "destination_relations", schema.destinationRelationRow, "active", "display_order"],
  ["descriptions", "destination_translations", schema.descriptionRow, "published"],
  ["translatedEvents", "event_translations", schema.eventTranslationRow, "published"],
] as const;

function sortedStrings(values: readonly string[]): string[] {
  const sorted = [...values];
  sorted.sort((a, b) => a.localeCompare(b));
  return sorted;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value);
    entries.sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(entries.map(([key, item]) => [key, canonical(item)]));
  }
  return value;
}

function normalized(rows: unknown[]) {
  return sortedStrings(rows.map((value) => JSON.stringify(canonical(value))));
}

async function readRaw(db: PGlite) {
  const result = await db.query<{ data: Record<string, unknown> }>(
    "SELECT public.published_hub_catalogue_v1() AS data",
  );
  return result.rows[0]!.data;
}

async function read(db: PGlite) {
  return schema.hubDataSchema.required().parse(await readRaw(db));
}

async function verifyCollection(
  db: PGlite,
  view: Record<string, unknown>,
  rawView: Record<string, unknown>,
  collection: (typeof collections)[number],
) {
  const [name, table, row, filter, order] = collection;
  const columns = row.keyof().options.join(",");
  const where = filter ? " WHERE " + filter : "";
  const ordering = order ? " ORDER BY " + order : "";
  const expected = (await db.query(`SELECT ${columns} FROM public.${table}${where}${ordering}`))
    .rows;
  const actual = view[name] as Record<string, unknown>[];
  const rawRows = rawView[name] as object[];
  const approved = sortedStrings(row.keyof().options);
  for (const item of rawRows) {
    assert.deepEqual(
      sortedStrings(Object.keys(item)),
      approved,
      `${name} exposes only approved columns`,
    );
  }
  // Equal sort values have no guaranteed relative order in either API.
  assert.deepEqual(
    normalized(actual),
    normalized(expected),
    `RPC preserves every public ${name} column and row`,
  );
  if (order) {
    assert.deepEqual(
      actual.map((value) => value[order]),
      expected.map((value) => value[order]),
      `${name} ordering is preserved`,
    );
  }
}

/** Exercise the RPC as the real anonymous PostgreSQL role, independently of HTTP mocks. */
export async function checkCatalogueSnapshot(db: PGlite) {
  await db.exec("BEGIN; SET LOCAL ROLE anon");
  try {
    const snapshot = await read(db);
    const raw = await readRaw(db);
    assert.deepEqual(
      sortedStrings(Object.keys(raw)),
      sortedStrings(schema.hubDataSchema.keyof().options),
    );
    assert.ok(completeCatalogue(snapshot));
    const view = {
      ...snapshot,
      descriptions: snapshot.editorial!.descriptions,
      translatedEvents: snapshot.editorial!.events,
    };
    const editorial = raw.editorial as Record<string, unknown>;
    const rawView = {
      ...raw,
      descriptions: editorial.descriptions,
      translatedEvents: editorial.events,
    };
    await Promise.all(
      collections.map((collection) => verifyCollection(db, view, rawView, collection)),
    );
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
      read(db),
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
    const snapshot = await read(db);
    assert.ok(!snapshot.destinations!.some((row) => row.id === "citron"));
    assert.ok(!snapshot.openingHours!.some((row) => row.destination_id === "citron"));
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
      (await read(db)).links!.length > 1000,
      "JSON snapshot includes the complete catalogue above the REST row limit",
    );
  } finally {
    await db.exec("ROLLBACK");
  }
}
