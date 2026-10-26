-- Directional editorial subcards, loaded only when their parent card is opened.
BEGIN;
CREATE TABLE public.destination_collection_items (
  destination_id text NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  key text NOT NULL CHECK (length(key) BETWEEN 1 AND 20),
  target_destination_id text NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text NOT NULL CHECK (length(trim(description)) > 0),
  translations jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(translations) = 'object'),
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (destination_id, key),
  CHECK (target_destination_id IS DISTINCT FROM destination_id)
);
ALTER TABLE public.destination_collection_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.destination_collection_items FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.destination_collection_items TO anon, authenticated;
GRANT ALL ON public.destination_collection_items TO service_role;
CREATE POLICY "Published collection items with visible destinations"
ON public.destination_collection_items FOR SELECT TO anon, authenticated
USING (active
  AND EXISTS (SELECT 1 FROM public.destinations d WHERE d.id=destination_id AND d.active)
  AND EXISTS (
    SELECT 1 FROM public.destinations d WHERE d.id=target_destination_id AND d.active
  )
);
CREATE TRIGGER destination_collection_items_updated_at
BEFORE UPDATE ON public.destination_collection_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
COMMIT;
