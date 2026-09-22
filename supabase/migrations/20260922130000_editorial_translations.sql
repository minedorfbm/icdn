-- Additive migration: does not change existing content or its identifiers.
BEGIN;
CREATE TABLE public.destination_translations (
  destination_id text NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('vi', 'ru', 'zh')),
  description text NOT NULL CHECK (length(trim(description)) > 0),
  source_description text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  PRIMARY KEY (destination_id, locale)
);
CREATE TABLE public.event_translations (
  event_id uuid NOT NULL REFERENCES public.destination_events(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('vi', 'ru', 'zh')),
  title text NOT NULL CHECK (length(trim(title)) > 0),
  schedule text[] NOT NULL,
  description text NOT NULL CHECK (length(trim(description)) > 0),
  source_title text NOT NULL,
  source_schedule text[] NOT NULL,
  source_description text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  PRIMARY KEY (event_id, locale)
);
ALTER TABLE public.destination_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_translations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.destination_translations, public.event_translations FROM anon, authenticated;
GRANT SELECT ON public.destination_translations, public.event_translations TO anon, authenticated;
GRANT ALL ON public.destination_translations, public.event_translations TO service_role;
CREATE POLICY "Published destination translations are readable"
ON public.destination_translations FOR SELECT TO anon, authenticated
USING (status = 'published' AND EXISTS (
  SELECT 1 FROM public.destinations d WHERE d.id = destination_id AND d.active
));
CREATE POLICY "Published event translations are readable"
ON public.event_translations FOR SELECT TO anon, authenticated
USING (status = 'published' AND EXISTS (
  SELECT 1 FROM public.destination_events e WHERE e.id = event_id AND e.active
));
COMMIT;
