-- Apply this additive migration only after the current production schema has been backed up.
-- The imported production database does not share all historical migration records.
BEGIN;

-- A destination must use a cluster configured on its own level. This keeps the
-- existing editable levels.clusters array without hard-coding EARTH's labels.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.destinations d
    JOIN public.levels l ON l.id = d.level_id
    WHERE d.cluster IS NOT NULL AND NOT (d.cluster = ANY(l.clusters))
  ) THEN
    RAISE EXCEPTION 'A destination has a cluster absent from its level';
  END IF;
END;
$$;

CREATE FUNCTION public.check_destination_cluster()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  allowed_clusters text[];
BEGIN
  IF NEW.cluster IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT clusters INTO allowed_clusters FROM public.levels WHERE id = NEW.level_id;
  IF NOT FOUND OR NOT (NEW.cluster = ANY(allowed_clusters)) THEN
    RAISE EXCEPTION 'Cluster % is not configured on level %', NEW.cluster, NEW.level_id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER destinations_check_cluster
BEFORE INSERT OR UPDATE OF level_id, cluster ON public.destinations
FOR EACH ROW EXECUTE FUNCTION public.check_destination_cluster();

CREATE FUNCTION public.check_level_clusters()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.destinations d
    WHERE d.level_id = NEW.id
      AND d.cluster IS NOT NULL
      AND NOT (d.cluster = ANY(NEW.clusters))
  ) THEN
    RAISE EXCEPTION 'A destination still uses a cluster removed from level %', NEW.id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER levels_check_clusters
BEFORE UPDATE OF clusters ON public.levels
FOR EACH ROW EXECUTE FUNCTION public.check_level_clusters();

REVOKE ALL ON FUNCTION public.check_destination_cluster() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_level_clusters() FROM PUBLIC;

-- Children disappear from the anonymous API when their parent is unpublished.
DROP POLICY "Active destination links are publicly readable" ON public.destination_links;
CREATE POLICY "Active destination links are publicly readable"
ON public.destination_links FOR SELECT TO anon, authenticated
USING (active AND EXISTS (
  SELECT 1 FROM public.destinations d WHERE d.id = destination_id AND d.active
));

DROP POLICY "Active destination photos are publicly readable" ON public.destination_photos;
CREATE POLICY "Active destination photos are publicly readable"
ON public.destination_photos FOR SELECT TO anon, authenticated
USING (active AND EXISTS (
  SELECT 1 FROM public.destinations d WHERE d.id = destination_id AND d.active
));

DROP POLICY "Active destination events are publicly readable" ON public.destination_events;
CREATE POLICY "Active destination events are publicly readable"
ON public.destination_events FOR SELECT TO anon, authenticated
USING (active AND EXISTS (
  SELECT 1 FROM public.destinations d WHERE d.id = destination_id AND d.active
));

DROP POLICY "Active destination posts are publicly readable" ON public.destination_posts;
CREATE POLICY "Active destination posts are publicly readable"
ON public.destination_posts FOR SELECT TO anon, authenticated
USING (active AND EXISTS (
  SELECT 1 FROM public.destinations d WHERE d.id = destination_id AND d.active
));

DROP POLICY "Published event translations are readable" ON public.event_translations;
CREATE POLICY "Published event translations are readable"
ON public.event_translations FOR SELECT TO anon, authenticated
USING (published AND EXISTS (
  SELECT 1 FROM public.destination_events e
  JOIN public.destinations d ON d.id = e.destination_id
  WHERE e.id = event_id AND e.active AND d.active
));

-- Prevent an accidental delete in the Table Editor from silently removing an
-- entire level, destination, or its associated editorial content. Use active=false
-- to unpublish; deliberate permanent deletion requires removing children first.
ALTER TABLE public.destinations
  DROP CONSTRAINT destinations_level_id_fkey,
  ADD CONSTRAINT destinations_level_id_fkey
    FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE RESTRICT;
ALTER TABLE public.destination_links
  DROP CONSTRAINT destination_links_destination_id_fkey,
  ADD CONSTRAINT destination_links_destination_id_fkey
    FOREIGN KEY (destination_id) REFERENCES public.destinations(id) ON DELETE RESTRICT;
ALTER TABLE public.destination_photos
  DROP CONSTRAINT destination_photos_destination_id_fkey,
  ADD CONSTRAINT destination_photos_destination_id_fkey
    FOREIGN KEY (destination_id) REFERENCES public.destinations(id) ON DELETE RESTRICT;
ALTER TABLE public.destination_events
  DROP CONSTRAINT destination_events_destination_id_fkey,
  ADD CONSTRAINT destination_events_destination_id_fkey
    FOREIGN KEY (destination_id) REFERENCES public.destinations(id) ON DELETE RESTRICT;
ALTER TABLE public.destination_posts
  DROP CONSTRAINT destination_posts_destination_id_fkey,
  ADD CONSTRAINT destination_posts_destination_id_fkey
    FOREIGN KEY (destination_id) REFERENCES public.destinations(id) ON DELETE RESTRICT;
ALTER TABLE public.destination_translations
  DROP CONSTRAINT destination_translations_destination_id_fkey,
  ADD CONSTRAINT destination_translations_destination_id_fkey
    FOREIGN KEY (destination_id) REFERENCES public.destinations(id) ON DELETE RESTRICT;
ALTER TABLE public.event_translations
  DROP CONSTRAINT event_translations_event_id_fkey,
  ADD CONSTRAINT event_translations_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES public.destination_events(id) ON DELETE RESTRICT;

-- The post table was the only destination child without an index on its FK.
CREATE INDEX destination_posts_destination_idx
ON public.destination_posts (destination_id, display_order);

COMMIT;
