-- Retain the source-text guard in the application and make stale rows visible
-- as unpublished work in Supabase immediately after an English source edit.
BEGIN;

ALTER TABLE public.destination_translations
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.event_translations
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER destination_translations_set_updated_at
BEFORE UPDATE ON public.destination_translations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER event_translations_set_updated_at
BEFORE UPDATE ON public.event_translations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE FUNCTION public.unpublish_changed_destination_translations()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.destination_translations
  SET published = false
  WHERE destination_id = NEW.id
    AND published
    AND source_description IS DISTINCT FROM NEW.short_description;
  RETURN NEW;
END;
$$;

CREATE TRIGGER destinations_unpublish_changed_translations
AFTER UPDATE OF short_description ON public.destinations
FOR EACH ROW
WHEN (OLD.short_description IS DISTINCT FROM NEW.short_description)
EXECUTE FUNCTION public.unpublish_changed_destination_translations();

CREATE FUNCTION public.unpublish_changed_event_translations()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.event_translations
  SET published = false
  WHERE event_id = NEW.id
    AND published
    AND (source_title IS DISTINCT FROM NEW.title
      OR source_schedule IS DISTINCT FROM NEW.schedule
      OR source_description IS DISTINCT FROM NEW.description);
  RETURN NEW;
END;
$$;

CREATE TRIGGER events_unpublish_changed_translations
AFTER UPDATE OF title, schedule, description ON public.destination_events
FOR EACH ROW
WHEN (OLD.title IS DISTINCT FROM NEW.title
  OR OLD.schedule IS DISTINCT FROM NEW.schedule
  OR OLD.description IS DISTINCT FROM NEW.description)
EXECUTE FUNCTION public.unpublish_changed_event_translations();

REVOKE ALL ON FUNCTION public.unpublish_changed_destination_translations() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unpublish_changed_event_translations() FROM PUBLIC;

COMMIT;
