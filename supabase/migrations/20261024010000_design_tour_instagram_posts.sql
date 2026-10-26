-- Add the three supplied posts before the two existing design-tour posts.
BEGIN;
UPDATE public.destination_posts
SET display_order = CASE
  WHEN post_url LIKE '%/DcDFnE1ETps/%' THEN 3
  WHEN post_url LIKE '%/DNAcxe1siwR/%' THEN 4
END
WHERE destination_id = 'design-digital-tour'
  AND (post_url LIKE '%/DcDFnE1ETps/%' OR post_url LIKE '%/DNAcxe1siwR/%');

DO $posts$
DECLARE post record;
BEGIN
  FOR post IN SELECT * FROM (VALUES
    ('https://www.instagram.com/p/DZcewFHTx3u/', 0),
    ('https://www.instagram.com/p/DZXffQsSWWX/', 1),
    ('https://www.instagram.com/p/DXNWU7bDjmS/', 2)
  ) AS selected(url, position)
  LOOP
    IF EXISTS (SELECT 1 FROM public.destination_posts
      WHERE destination_id = 'design-digital-tour' AND rtrim(post_url, '/') = rtrim(post.url, '/')) THEN
      UPDATE public.destination_posts SET display_order = post.position, active = true
      WHERE destination_id = 'design-digital-tour' AND rtrim(post_url, '/') = rtrim(post.url, '/');
    ELSE
      INSERT INTO public.destination_posts(destination_id, post_url, display_order, active)
      VALUES ('design-digital-tour', post.url, post.position, true);
    END IF;
  END LOOP;
END;
$posts$;
COMMIT;
