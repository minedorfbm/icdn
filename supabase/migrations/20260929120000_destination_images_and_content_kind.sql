-- Two independently editable cover images and an explicit content classification.
-- Run before deploying code that reads these new columns.
BEGIN;

ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS detail_image_key text,
  ADD COLUMN IF NOT EXISTS content_kind text NOT NULL DEFAULT 'place';

UPDATE public.destinations
SET detail_image_key = image_key
WHERE detail_image_key IS NULL;

UPDATE public.destinations
SET content_kind = 'offer'
WHERE id IN (
  'bensley-package',
  'enchanted-holiday',
  'weddings',
  'ihg-one-rewards',
  'instagram-spots'
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.destinations'::regclass
      AND conname = 'destinations_content_kind_check'
  ) THEN
    ALTER TABLE public.destinations
      ADD CONSTRAINT destinations_content_kind_check
      CHECK (content_kind IN ('place', 'offer'));
  END IF;
END $$;

COMMENT ON COLUMN public.destinations.image_key IS
  'Photo used for compact cards, search results and previews; public Storage URL or legacy asset key.';
COMMENT ON COLUMN public.destinations.detail_image_key IS
  'Independent photo used for the expanded destination cover; public Storage URL or legacy asset key.';
COMMENT ON COLUMN public.destinations.content_kind IS
  'place = physical resort place/activity; offer = marketing or editorial offer. Map search shows places only.';

COMMIT;
