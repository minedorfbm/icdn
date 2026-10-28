import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { PGlite } from "@electric-sql/pglite";

export async function checkInstagramRestoration(db: PGlite) {
  const expected = {
    "the-summit": ["De4FTUOF1p_", "De33jQOCJnk", "DV-RiYhjqfR"],
    reception: ["De4FTUOF1p_", "De33jQOCJnk", "C_cqjLcsoGL", "DVK4hyuGYI2"],
    "la-maison-1888": ["De8RMgAD51E", "DbNEUtJiSro", "DdVfCTwFhaw", "DdBZAppDyR5", "DTkauDdEt51"],
    "mi-sol-spa": ["De6jNPGHWBY", "DKG_o52sB3l", "DbZ43WrnKAG", "DMuQbvapZMP", "DL4Lxeotfvi"],
    "moulin-rouge": ["DfBhhlvAGem", "DBipQdVRn8F"],
  };
  for (const [destination, codes] of Object.entries(expected)) {
    const { rows } = await db.query<{
      post_url: string;
      embed_mode: string;
      display_order: number;
    }>(
      "SELECT post_url,embed_mode,display_order FROM destination_posts WHERE destination_id=$1 AND active ORDER BY display_order,id",
      [destination],
    );
    assert.deepEqual(
      rows.map((row) => /\/(?:p|reel|reels)\/([^/]+)/.exec(row.post_url)![1]),
      codes,
    );
    assert.deepEqual(
      rows.map((row) => row.display_order),
      codes.map((_, index) => index),
    );
    assert.ok(rows.length <= 5 && rows.every((row) => row.embed_mode === "embed"));
  }
  assert.equal(
    (
      await db.query<{ post_url: string }>(
        "SELECT post_url FROM destination_posts WHERE destination_id='moulin-rouge' AND active AND display_order=0",
      )
    ).rows[0]!.post_url,
    "https://www.instagram.com/reel/DfBhhlvAGem/",
  );
  const state = async () => (await db.query("SELECT * FROM destination_posts ORDER BY id")).rows;
  const beforeReplay = await state();
  const migration = readFileSync(
    new URL(
      "../supabase/migrations/20261028134500_restore_instagram_carousels.sql",
      import.meta.url,
    ),
    "utf8",
  );
  await db.exec(migration);
  assert.deepEqual(await state(), beforeReplay, "Restoration is idempotent, including timestamps");
  await db.exec(
    "BEGIN; UPDATE destination_posts SET active=false,embed_mode='link' WHERE destination_id='the-summit' AND post_url LIKE '%/DV-RiYhjqfR/'",
  );
  await assert.rejects(db.exec(migration), /Do not restore a restricted Instagram post/);
  await db.exec("ROLLBACK");
  await db.exec(
    "BEGIN; UPDATE destination_posts SET active=false WHERE destination_id='reception' AND post_url LIKE '%/De33jQOCJnk/'",
  );
  await assert.rejects(db.exec(migration), /Instagram selection changed since restoration review/);
  await db.exec("ROLLBACK");
  assert.deepEqual(await state(), beforeReplay, "Failed guards preserve all post associations");
}
