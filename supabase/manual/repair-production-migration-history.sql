-- One-time history repair for the existing cxcffaegqyvbhrpzpowa production DB.
-- The original schema and later SQL scripts were installed manually, so the
-- migration ledger is empty. Run only on main after checking the preconditions.
-- This changes migration metadata, never editorial content or access policies.
BEGIN;

DO $$
BEGIN
  IF (SELECT count(*) FROM supabase_migrations.schema_migrations) <> 0 THEN
    RAISE EXCEPTION 'Migration ledger is not empty; review it before repairing';
  END IF;
  IF to_regclass('public.destination_translations') IS NULL
     OR to_regclass('public.event_translations') IS NULL
     OR to_regclass('public.destination_links') IS NULL THEN
    RAISE EXCEPTION 'Expected content schema is incomplete';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'destinations'
      AND column_name IN ('discover_url', 'menu_url', 'booking_url')
  ) THEN
    RAISE EXCEPTION 'Legacy URL columns are still present';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'destinations_check_cluster')
     OR NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'destinations_unpublish_changed_translations') THEN
    RAISE EXCEPTION 'Expected integrity or translation trigger is missing';
  END IF;
  IF (SELECT count(*) FROM public.destinations WHERE active) <> 47
     OR (SELECT count(*) FROM public.destination_translations WHERE locale = 'ko' AND published) <> 47
     OR (SELECT count(*) FROM public.destination_translations WHERE locale = 'ja' AND published) <> 47
     OR (SELECT count(*) FROM public.event_translations WHERE locale = 'ko' AND published) <> 4
     OR (SELECT count(*) FROM public.event_translations WHERE locale = 'ja' AND published) <> 4 THEN
    RAISE EXCEPTION 'Production content does not match the manually applied translations';
  END IF;
END;
$$;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES
  ('20260902153005', '602daa5a-655f-4eeb-a159-fd05534c0beb'),
  ('20260907181615', '1bde41ff-2957-46be-98e0-863c832956c4'),
  ('20260908213912', '389168a9-24c6-4ecc-8177-4a7649855ace'),
  ('20260908214829', '1f43b20a-2542-4938-ad85-a2fb37be7971'),
  ('20260909181955', 'dc5535fc-b1dd-4752-9e1d-a028bb0ea1e2'),
  ('20260909182153', '6a180cee-6065-4f61-9e1c-b3262ff68c7b'),
  ('20260909182400', '69fbf3b5-1d98-4cd8-a4cb-48efdb3ab9ce'),
  ('20260910211254', 'da3bfe5f-f6c1-4728-8bef-22993341d437'),
  ('20260911203038', 'd10324dc-d625-40a0-866e-645bb31f675d'),
  ('20260912094852', '96736222-8397-4fb6-b419-eff43491b720'),
  ('20260916181838', 'c42b8ab3-1a8c-46e9-8729-671097affb5b'),
  ('20260917072242', '978bb86c-20d5-44dd-83df-60a96a6486ca'),
  ('20260922130000', 'editorial_translations'),
  ('20260923120000', 'content_integrity'),
  ('20260923121000', 'translation_lifecycle'),
  ('20260924120000', 'retire_legacy_action_columns'),
  ('20260925120000', 'korean_japanese_translations');

COMMIT;

-- Expected verification result: 17 rows.
-- SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;
