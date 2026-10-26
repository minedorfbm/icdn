BEGIN;
-- Focal position follows the home photograph; the expanded cover stays independent.
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS image_position text
  CHECK (image_position ~ '^(100|[0-9]{1,2})% (100|[0-9]{1,2})%$');
COMMENT ON COLUMN public.destinations.image_position IS
  'Optional object-position for the home photo, for example 28% 50%. Reset when changing image_key; NULL uses the centre.';

-- One event and one set of translations can appear on several related cards.
CREATE TABLE IF NOT EXISTS public.destination_event_links (
  event_id uuid NOT NULL REFERENCES public.destination_events(id) ON DELETE CASCADE,
  destination_id text NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, destination_id)
);
CREATE INDEX IF NOT EXISTS destination_event_links_destination_idx
  ON public.destination_event_links(destination_id);
ALTER TABLE public.destination_event_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.destination_event_links FROM anon, authenticated;
GRANT SELECT ON public.destination_event_links TO anon, authenticated;
GRANT ALL ON public.destination_event_links TO service_role;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='destination_event_links' AND policyname='Published event associations') THEN
    CREATE POLICY "Published event associations" ON public.destination_event_links
      FOR SELECT TO anon, authenticated USING (
        EXISTS (SELECT 1 FROM public.destination_events e WHERE e.id=event_id AND e.active)
        AND EXISTS (SELECT 1 FROM public.destinations d WHERE d.id=destination_id AND d.active)
      );
  END IF;
END $$;
CREATE OR REPLACE VIEW public.published_destination_events WITH (security_invoker=true) AS
  SELECT e.id, targets.destination_id, e.title, e.schedule, e.description,
    e.url, e.display_order, e.active
  FROM public.destination_events e
  CROSS JOIN LATERAL (
    SELECT e.destination_id
    UNION
    SELECT l.destination_id FROM public.destination_event_links l WHERE l.event_id=e.id
  ) targets
  JOIN public.destinations d ON d.id=targets.destination_id AND d.active
  WHERE e.active;
REVOKE ALL ON public.published_destination_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.published_destination_events TO anon, authenticated;
COMMIT;
