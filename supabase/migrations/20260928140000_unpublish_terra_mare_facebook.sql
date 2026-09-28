-- Facebook video integration cancelled; retain the row as an unpublished archive.
UPDATE public.destination_videos
SET active = false
WHERE destination_id = 'terra-mare'
  AND video_url = 'https://www.facebook.com/reel/2019955602291134/'
  AND active = true;
