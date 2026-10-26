-- Optional language variants. Shared/default links remain authoritative.
BEGIN;

CREATE TABLE public.destination_link_translations (
  link_id uuid NOT NULL REFERENCES public.destination_links(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('en', 'vi', 'ru', 'zh', 'ko', 'ja')),
  url text NOT NULL CHECK (url ~ '^https://[^/@[:space:]]+(/[^[:space:]]*)?$'),
  source_url text NOT NULL,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (link_id, locale)
);

-- The footer's Website link belongs to site_settings, not to a destination.
CREATE TABLE public.site_link_translations (
  setting_key text NOT NULL REFERENCES public.site_settings(key) ON DELETE CASCADE
    CHECK (setting_key = 'website'),
  locale text NOT NULL CHECK (locale IN ('en', 'vi', 'ru', 'zh', 'ko', 'ja')),
  url text NOT NULL CHECK (url ~ '^https://[^/@[:space:]]+(/[^[:space:]]*)?$'),
  source_url text NOT NULL,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (setting_key, locale)
);

ALTER TABLE public.destination_link_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_link_translations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.destination_link_translations, public.site_link_translations FROM anon, authenticated;
GRANT SELECT ON public.destination_link_translations, public.site_link_translations TO anon, authenticated;
GRANT ALL ON public.destination_link_translations, public.site_link_translations TO service_role;

CREATE POLICY "Published variants of visible discovery links"
ON public.destination_link_translations FOR SELECT TO anon, authenticated
USING (active AND EXISTS (
  SELECT 1 FROM public.destination_links l
  JOIN public.destinations d ON d.id = l.destination_id
  WHERE l.id = link_id AND l.active AND d.active
    AND l.kind IN ('DISCOVER', 'WEBSITE') AND l.url = source_url
));

CREATE POLICY "Published variants of the current website link"
ON public.site_link_translations FOR SELECT TO anon, authenticated
USING (active AND EXISTS (
  SELECT 1 FROM public.site_settings s WHERE s.key = setting_key AND s.value = source_url
));

-- Capture the URL being translated automatically when an editor saves a variant.
CREATE FUNCTION public.prepare_link_translation() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  parent_url text;
  parent_kind text;
BEGIN
  IF TG_TABLE_NAME = 'destination_link_translations' THEN
    SELECT url, kind::text INTO parent_url, parent_kind
    FROM public.destination_links WHERE id = NEW.link_id;
    IF NEW.active AND parent_kind NOT IN ('DISCOVER', 'WEBSITE') THEN
      RAISE EXCEPTION 'Only DISCOVER and WEBSITE support language variants';
    END IF;
  ELSE
    SELECT value INTO parent_url FROM public.site_settings WHERE key = NEW.setting_key;
  END IF;
  IF parent_url IS NULL THEN
    RAISE EXCEPTION 'The original link must exist before adding a language variant';
  END IF;
  NEW.source_url := parent_url;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prepare_link_translation() FROM PUBLIC;

CREATE TRIGGER prepare_destination_link_translation
BEFORE INSERT OR UPDATE ON public.destination_link_translations
FOR EACH ROW EXECUTE FUNCTION public.prepare_link_translation();
CREATE TRIGGER prepare_site_link_translation
BEFORE INSERT OR UPDATE ON public.site_link_translations
FOR EACH ROW EXECUTE FUNCTION public.prepare_link_translation();
CREATE TRIGGER destination_link_translations_updated_at
BEFORE UPDATE ON public.destination_link_translations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER site_link_translations_updated_at
BEFORE UPDATE ON public.site_link_translations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Changing the original destination requires review of its language variants.
CREATE FUNCTION public.unpublish_changed_link_translations() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_TABLE_NAME = 'destination_links' THEN
    UPDATE public.destination_link_translations SET active = false WHERE link_id = NEW.id AND active;
  ELSE
    UPDATE public.site_link_translations SET active = false WHERE setting_key = NEW.key AND active;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.unpublish_changed_link_translations() FROM PUBLIC;
CREATE TRIGGER changed_destination_link_translations
AFTER UPDATE OF url, kind ON public.destination_links
FOR EACH ROW WHEN (OLD.url IS DISTINCT FROM NEW.url OR OLD.kind IS DISTINCT FROM NEW.kind)
EXECUTE FUNCTION public.unpublish_changed_link_translations();
CREATE TRIGGER changed_website_link_translations
AFTER UPDATE OF value ON public.site_settings
FOR EACH ROW WHEN (OLD.value IS DISTINCT FROM NEW.value AND NEW.key = 'website')
EXECUTE FUNCTION public.unpublish_changed_link_translations();

COMMIT;
