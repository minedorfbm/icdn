-- The resort calls this venue Summit Auditorium. Preserve its stable destination ID
-- and map relationship so existing links to /summit-cinema still resolve.
BEGIN;

UPDATE public.destinations
SET name = 'Summit Auditorium',
    short_description = 'An elegant leather-seated auditorium at The Summit for presentations, live talks and film screenings.'
WHERE id = 'summit-cinema'
  AND name = 'Cinema'
  AND short_description = 'A leather-seated auditorium for films, presentations and private screenings at The Summit.';

UPDATE public.destinations
SET short_description = 'The Summit Conference Centre, Summit Auditorium and M Club host meetings, presentations and celebrations.'
WHERE id = 'the-summit'
  AND short_description = 'The Summit Conference Centre, the Auditorium-Cinema and M Club — gatherings, screenings and celebrations.';

-- Updating English copy unpublishes previous translations. Refresh all five locales
-- in the same transaction so visitors never receive a mixed version.
INSERT INTO public.destination_translations (
  destination_id, locale, description, source_description, published
)
SELECT t.destination_id, t.locale, t.description, d.short_description, true
FROM (VALUES
  ('summit-cinema', 'vi', 'Khán phòng Summit với ghế da sang trọng, phù hợp cho thuyết trình, diễn giả trực tiếp và chiếu phim.'),
  ('summit-cinema', 'ru', 'Элегантный зал Summit Auditorium с кожаными креслами для презентаций, выступлений и кинопоказов.'),
  ('summit-cinema', 'zh', 'Summit Auditorium 设有典雅的皮革座椅，适合演讲、现场分享及电影放映。'),
  ('summit-cinema', 'ko', 'Summit Auditorium은 고급 가죽 좌석을 갖춘 공간으로, 프레젠테이션과 강연, 영화 상영에 적합합니다.'),
  ('summit-cinema', 'ja', 'Summit Auditoriumは上質なレザーシートを備え、プレゼンテーションや講演、映画上映に適した会場です。'),
  ('the-summit', 'vi', 'Trung tâm Hội nghị The Summit, Summit Auditorium và M Club là những không gian dành cho hội họp, thuyết trình và các buổi lễ.'),
  ('the-summit', 'ru', 'Конференц-центр The Summit, Summit Auditorium и M Club принимают встречи, презентации и торжества.'),
  ('the-summit', 'zh', 'The Summit 会议中心、Summit Auditorium 与 M Club 适合举办会议、演讲及庆典。'),
  ('the-summit', 'ko', 'The Summit 컨퍼런스 센터, Summit Auditorium, M Club에서 회의와 발표, 축하 행사를 열 수 있습니다.'),
  ('the-summit', 'ja', 'The Summitカンファレンスセンター、Summit Auditorium、M Clubは、会議や発表会、お祝いの場に最適です。')
) AS t(destination_id, locale, description)
JOIN public.destinations d ON d.id = t.destination_id
WHERE (d.id = 'summit-cinema' AND d.short_description = 'An elegant leather-seated auditorium at The Summit for presentations, live talks and film screenings.')
   OR (d.id = 'the-summit' AND d.short_description = 'The Summit Conference Centre, Summit Auditorium and M Club host meetings, presentations and celebrations.')
ON CONFLICT (destination_id, locale) DO UPDATE SET
  description = EXCLUDED.description,
  source_description = EXCLUDED.source_description,
  published = true;

-- The official page declares these five hreflang versions.
INSERT INTO public.destination_link_translations (link_id, locale, url, active)
SELECT l.id, variants.locale, variants.url, true
FROM (VALUES
  ('vi', 'https://www.danang.intercontinental.com/vn/venues/summit-auditorium/'),
  ('ru', 'https://www.danang.intercontinental.com/ru/venues/summit-auditorium/'),
  ('zh', 'https://www.danang.intercontinental.com/zh/venues/summit-auditorium/'),
  ('ko', 'https://www.danang.intercontinental.com/ko/venues/summit-auditorium/'),
  ('ja', 'https://www.danang.intercontinental.com/ja/venues/summit-auditorium/')
) AS variants(locale, url)
JOIN public.destination_links l ON l.destination_id = 'summit-cinema'
  AND l.kind = 'DISCOVER'::public.destination_link_type
  AND l.url = 'https://www.danang.intercontinental.com/venues/summit-auditorium/'
ON CONFLICT (link_id, locale) DO NOTHING;

COMMIT;
