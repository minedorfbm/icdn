-- Temporarily hide the two restricted posts awaiting original video files.
-- Keep their records, ordering and metadata for later reactivation.
UPDATE public.destination_posts
SET active = false
WHERE active
  AND (destination_id, (regexp_match(post_url, '/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1]) IN (
    ('la-maison-1888', 'DdQWW42D91g'),
    ('wine-cellar', 'DdQWW42D91g'),
    ('wine-cellar', 'DFfKmy2O0Bt')
  );
