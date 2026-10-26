-- Give the three venues at The Summit their own cards and one shared map anchor.
BEGIN;

-- Keep the new cards beside The Summit without changing existing relative order.
UPDATE public.destinations
SET display_order = display_order + 3
WHERE level_id = 'heaven' AND display_order >= 9
  AND NOT EXISTS (SELECT 1 FROM public.destinations WHERE id = 'summit-conference-centre');

INSERT INTO public.destinations (
  id, name, level_id, cluster, type, short_description,
  image_key, detail_image_key, content_kind, display_order
) VALUES
  ('summit-conference-centre', 'Summit Conference Centre', 'heaven', 'EXPERIENCES', 'experience',
   'A hilltop setting for meetings and celebrations, with elegant halls and versatile event spaces.',
   'https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Summit-Ariel-32-1024x575.jpg',
   'https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Summit-Ariel-32-1024x575.jpg', 'place', 9),
  ('summit-cinema', 'Cinema', 'heaven', 'EXPERIENCES', 'experience',
   'A leather-seated auditorium for films, presentations and private screenings at The Summit.',
   'https://www.danang.intercontinental.com/wp-content/uploads/2023/10/Theatre-2-Done-copy-2-1024x683.jpg',
   'https://www.danang.intercontinental.com/wp-content/uploads/2023/10/Theatre-2-Done-copy-2-1024x683.jpg', 'place', 10),
  ('m-club', 'M Club', 'heaven', 'EXPERIENCES', 'experience',
   'A playful nightclub for private celebrations, with a stage, bar and adjoining M Privé event space.',
   'https://www.danang.intercontinental.com/wp-content/uploads/2021/07/M-Club-Coffee-Break-2.jpg-1024x683.jpeg',
   'https://www.danang.intercontinental.com/wp-content/uploads/2021/07/M-Club-Coffee-Break-2.jpg-1024x683.jpeg', 'place', 11)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  level_id = EXCLUDED.level_id,
  cluster = EXCLUDED.cluster,
  type = EXCLUDED.type,
  short_description = EXCLUDED.short_description,
  image_key = EXCLUDED.image_key,
  detail_image_key = EXCLUDED.detail_image_key,
  content_kind = EXCLUDED.content_kind,
  display_order = EXCLUDED.display_order,
  active = true
WHERE public.destinations.id = 'm-club'
  AND public.destinations.name = 'Conference · Cinema · M-Club'
  AND NOT public.destinations.active;

-- The old combined seed pointed to the general homepage; keep only the venue link visible.
UPDATE public.destination_links SET active = false
WHERE destination_id = 'm-club'
  AND kind = 'DISCOVER'::public.destination_link_type
  AND url = 'https://www.danang.intercontinental.com/'
  AND active;

INSERT INTO public.destination_links (destination_id, kind, url, display_order)
SELECT links.destination_id, 'DISCOVER'::public.destination_link_type, links.url, 0
FROM (VALUES
  ('summit-conference-centre', 'https://www.danang.intercontinental.com/meetings/'),
  ('summit-cinema', 'https://www.danang.intercontinental.com/venues/summit-auditorium/'),
  ('m-club', 'https://www.danang.intercontinental.com/venues/m-club/')
) AS links(destination_id, url)
WHERE EXISTS (SELECT 1 FROM public.destinations d WHERE d.id = links.destination_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.destination_links existing
    WHERE existing.destination_id = links.destination_id
      AND existing.kind = 'DISCOVER'::public.destination_link_type
      AND existing.url = links.url
  );

INSERT INTO public.map_destination_links (place_id, destination_id, display_order, is_primary)
SELECT 'summit', links.destination_id, links.display_order, true
FROM (VALUES
  ('summit-conference-centre', 1), ('summit-cinema', 2), ('m-club', 3)
) AS links(destination_id, display_order)
WHERE EXISTS (SELECT 1 FROM public.map_places WHERE id = 'summit')
  AND EXISTS (SELECT 1 FROM public.destinations d WHERE d.id = links.destination_id)
ON CONFLICT (place_id, destination_id) DO NOTHING;

INSERT INTO public.destination_translations (
  destination_id, locale, description, source_description, published
)
SELECT t.destination_id, t.locale, t.description, d.short_description, true
FROM (VALUES
  ('summit-conference-centre', 'vi', 'Không gian trên đỉnh đồi dành cho các cuộc họp và lễ kỷ niệm, với những đại sảnh sang trọng và khu vực tổ chức sự kiện linh hoạt.'),
  ('summit-conference-centre', 'ru', 'Пространство на вершине холма для встреч и торжеств с элегантными залами и площадками для разных мероприятий.'),
  ('summit-conference-centre', 'zh', '坐落于山顶的会议与庆典场所，设有典雅大厅及灵活多样的活动空间。'),
  ('summit-conference-centre', 'ko', '언덕 위에 자리한 우아한 홀과 다목적 행사 공간에서 회의와 특별한 축하 행사를 열어 보세요.'),
  ('summit-conference-centre', 'ja', '丘の上に位置する優雅なホールと多目的イベントスペースで、会議や祝宴を開催できます。'),
  ('summit-cinema', 'vi', 'Khán phòng ghế da tại The Summit dành cho phim ảnh, thuyết trình và các buổi chiếu riêng tư.'),
  ('summit-cinema', 'ru', 'Зал с кожаными креслами в The Summit для фильмов, презентаций и частных кинопоказов.'),
  ('summit-cinema', 'zh', 'The Summit 的皮革座椅礼堂，适合电影放映、演讲和私人观影。'),
  ('summit-cinema', 'ko', 'The Summit의 가죽 좌석을 갖춘 강당에서 영화 상영, 프레젠테이션, 프라이빗 시사회를 즐겨보세요.'),
  ('summit-cinema', 'ja', 'The Summitのレザーシートを備えたホールで、映画上映やプレゼンテーション、プライベート上映を楽しめます。'),
  ('m-club', 'vi', 'Không gian giải trí đêm đầy màu sắc cho các buổi tiệc riêng, với sân khấu, quầy bar và khu tổ chức sự kiện M Privé liền kề.'),
  ('m-club', 'ru', 'Яркий ночной клуб для частных торжеств со сценой, баром и прилегающим пространством M Privé.'),
  ('m-club', 'zh', '充满趣味的夜间俱乐部，设有舞台、酒吧及相邻的 M Privé 活动空间，适合私人庆典。'),
  ('m-club', 'ko', '무대와 바, 인접한 M Privé 행사 공간을 갖춘 개성 넘치는 나이트클럽에서 프라이빗 파티를 즐겨보세요.'),
  ('m-club', 'ja', 'ステージとバー、隣接するM Privéのイベントスペースを備えた遊び心あふれるナイトクラブで、プライベートな祝宴を楽しめます。')
) AS t(destination_id, locale, description)
JOIN public.destinations d ON d.id = t.destination_id
ON CONFLICT (destination_id, locale) DO NOTHING;

COMMIT;
