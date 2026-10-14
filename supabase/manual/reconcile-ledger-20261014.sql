-- One-time production ledger repair, based on the 14 October schema/content audit.
-- These migrations already took effect via SQL Editor. Do not execute their bodies again.
-- Exact content fingerprints reject concurrent edits; abort and re-audit on mismatch.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL TIME ZONE 'UTC';
LOCK TABLE public.accommodation_benefit_translations,public.accommodation_benefits,public.destination_events,public.destination_link_translations,public.destination_links,public.destination_notice_links,public.destination_notice_translations,public.destination_notices,public.destination_opening_hours,public.destination_photos,public.destination_posts,public.destination_relations,public.destination_translations,public.destination_videos,public.destinations,public.event_translations,public.levels,public.map_destination_links,public.map_places,public.site_link_translations,public.site_settings IN SHARE MODE;
LOCK TABLE supabase_migrations.schema_migrations IN SHARE ROW EXCLUSIVE MODE;
DO $verify$
DECLARE entry record; actual text;
BEGIN
 IF (SELECT count(*) FROM supabase_migrations.schema_migrations)<>42 THEN
  RAISE EXCEPTION 'Migration history changed; re-audit before repair';
 END IF;
 FOR entry IN SELECT key,value FROM jsonb_each_text($fingerprints${"accommodation_benefit_translations":"e9182cf3ca9fde8566b0ab022a5959a8","accommodation_benefits":"15dce7517ecfae95eb3b35a39800a8ab","destination_events":"ce1738cfbac782ad9f76a1571b295df2","destination_link_translations":"a643b7b6afd672ccd6b6a80ef0b0675d","destination_links":"e37f9c4995d42b76c44e4fd9faf3580e","destination_notice_links":"834622ccdd9b6f87b5598153cea1ba31","destination_notice_translations":"5e8309b487051b3167d0ff59b0f45f0b","destination_notices":"30057250bd15818da0a0faa52dbc358a","destination_opening_hours":"c90c5a965242d2a71293037862cd9e87","destination_photos":"577f8a3ebc6a001e10b514202def1168","destination_posts":"aeacaf928986df61920888740214394d","destination_relations":"107e457538239ccf84409a81ac63953f","destination_translations":"ec8d910b8b8be1da94fcb4d406ad4124","destination_videos":"78344d6f2049744ab28a69fdf97bb8a7","destinations":"fc7bf215993254ca3090e81cc6557929","event_translations":"ea7fd1359d8b4bc3553936bd32786aae","levels":"c4e2ed84b2227a2354d61d1381f7fc81","map_destination_links":"3aff7f5f0b07791c9774d825b071a8e2","map_places":"c4db768e1f22a322541884e7926bb9c6","site_link_translations":"4182904e2ffd7155e2e1f36c17377954","site_settings":"e257cfddaf7b3670612c8b410c2485bd"}$fingerprints$::jsonb) LOOP
  EXECUTE format('SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text COLLATE "C"),''[]''::jsonb)::text) FROM public.%I t',entry.key) INTO actual;
  IF actual IS DISTINCT FROM entry.value THEN RAISE EXCEPTION 'Content changed in %; re-audit before repair',entry.key; END IF;
 END LOOP;
END;
$verify$;
INSERT INTO supabase_migrations.schema_migrations(version,name) VALUES
('20261006090000','destination_opening_hours'),
('20261006110000','destination_editorial_taxonomy'),
('20261006140000','complete_official_destination_cards'),
('20261006153000','general_shuttle_service'),
('20261006170000','concierge_messaging_settings'),
('20261006170001','expanded_card_descriptions'),
('20261006180000','destination_notices'),
('20261006183000','shared_destination_notices'),
('20261006190000','concise_destination_notices'),
('20261011120000','editorial_card_pilot'),
('20261011150000','complete_pilot_relations'),
('20261012120000','editorial_catalogue_rollout'),
('20261013003000','destination_search_keywords'),
('20261013120000','translation_audit_corrections'),
('20261013140000','current_official_menus'),
('20261013160000','accommodation_map_areas'),
('20261014100000','accommodation_collection_benefits'),
('20261014120000','selected_youtube_videos'),
('20261014130000','instagram_complements'),
('20261014140000','instagram_six_precise_links'),
('20261014150000','instagram_three_validated_links'),
('20261014160000','rewards_yoga_club_videos');
SELECT count(*) AS recorded_migrations, '22 already-applied versions recorded; public content unchanged' AS result FROM supabase_migrations.schema_migrations;
COMMIT;
