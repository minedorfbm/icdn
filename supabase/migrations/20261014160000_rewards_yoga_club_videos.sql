-- User-supplied IHG One Rewards, Yoga Pavilion and Club Lounge videos, verified 14 October 2026.
BEGIN;
DO $videos$
DECLARE selection jsonb := $data$[
  {
    "destination_id": "ihg-one-rewards",
    "video_url": "https://www.youtube.com/watch?v=qY8aV6q1sjk",
    "video_id": "qY8aV6q1sjk",
    "title": "Discover the IHG One Rewards app",
    "title_translations": {
      "vi": "Khám phá ứng dụng IHG One Rewards",
      "ru": "Откройте приложение IHG One Rewards",
      "zh": "探索 IHG One Rewards 应用程序",
      "ko": "IHG One Rewards 앱을 만나보세요",
      "ja": "IHG One Rewardsアプリをご紹介"
    }
  },
  {
    "destination_id": "yoga-pavilion",
    "video_url": "https://www.youtube.com/watch?v=Ie7tYHeQ1AY",
    "video_id": "Ie7tYHeQ1AY",
    "title": "Wellbeing and Wellness at the InterContinental Danang Sun Peninsula Resort",
    "title_translations": {
      "vi": "Sức khỏe và thư giãn tại InterContinental Danang Sun Peninsula Resort",
      "ru": "Благополучие и оздоровление в InterContinental Danang Sun Peninsula Resort",
      "zh": "在 InterContinental Danang Sun Peninsula Resort 尽享身心康养",
      "ko": "InterContinental Danang Sun Peninsula Resort에서 누리는 웰빙과 웰니스",
      "ja": "InterContinental Danang Sun Peninsula Resortで心と体を整えるウェルネス"
    }
  },
  {
    "destination_id": "club-lounge",
    "video_url": "https://www.youtube.com/shorts/3OVPivxpr1c",
    "video_id": "3OVPivxpr1c",
    "title": "Month of Love Reel 2026",
    "title_translations": {
      "vi": "Tháng yêu thương 2026",
      "ru": "Месяц любви 2026",
      "zh": "2026 爱之月",
      "ko": "2026 사랑의 달",
      "ja": "愛の月 2026"
    }
  }
]$data$::jsonb;
 r jsonb; candidate uuid; matches integer;
BEGIN
 FOR r IN SELECT value FROM jsonb_array_elements(selection) LOOP
  PERFORM 1 FROM public.destinations WHERE id=r->>'destination_id' AND active FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Selected video card unavailable: %',r->>'destination_id'; END IF;
  SELECT count(*),min(id::text)::uuid INTO matches,candidate FROM public.destination_videos
  WHERE destination_id=r->>'destination_id' AND
   (regexp_match(video_url,'(?:[?&]v=|/shorts/|/embed/|youtu[.]be/)([A-Za-z0-9_-]{11})'))[1]=r->>'video_id';
  IF matches>1 THEN RAISE EXCEPTION 'Duplicate selected video IDs: %',r->>'destination_id'; END IF;
  IF candidate IS NULL THEN
   INSERT INTO public.destination_videos(destination_id,video_url,title,title_translations,display_order,active)
   VALUES(r->>'destination_id',r->>'video_url',r->>'title',r->'title_translations',
    COALESCE((SELECT max(display_order)+1 FROM public.destination_videos WHERE destination_id=r->>'destination_id' AND active),0),true);
  ELSE
   UPDATE public.destination_videos SET active=true WHERE id=candidate AND NOT active;
  END IF;
 END LOOP;
END;
$videos$;
COMMIT;
