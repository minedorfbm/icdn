-- Người Dẫn Lối is a villa and penthouse hosting service, not a physical map place.
-- The two photographs come from the resort's official Người Dẫn Lối and Villa Host pages.
BEGIN;

INSERT INTO public.destinations (
  id, name, level_id, cluster, type, short_description,
  image_key, detail_image_key, content_kind, display_order
) VALUES (
  'nguoi-dan-loi', 'Người Dẫn Lối Signature Villa Service',
  'heaven', 'EXPERIENCES', 'service',
  'A dedicated resort host for Penthouse and Villa guests, offering discreet, personalised care and thoughtful Vietnamese welcome rituals.',
  'https://www.danang.intercontinental.com/wp-content/uploads/2023/10/Villa-Butler-2-Done-1024x683.jpg',
  'https://www.danang.intercontinental.com/wp-content/uploads/2021/10/Villa-host.jpg',
  'offer', 5
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.destination_links (destination_id, kind, url, display_order)
SELECT 'nguoi-dan-loi', 'DISCOVER'::public.destination_link_type,
       'https://www.danang.intercontinental.com/amenities/nguoi-dan-loi/', 0
WHERE EXISTS (SELECT 1 FROM public.destinations WHERE id = 'nguoi-dan-loi')
  AND NOT EXISTS (
    SELECT 1 FROM public.destination_links
    WHERE destination_id = 'nguoi-dan-loi'
      AND kind = 'DISCOVER'::public.destination_link_type
      AND url = 'https://www.danang.intercontinental.com/amenities/nguoi-dan-loi/'
  );

INSERT INTO public.destination_translations (
  destination_id, locale, description, source_description, published
)
SELECT 'nguoi-dan-loi', translations.locale, translations.description,
       d.short_description, true
FROM (VALUES
  ('vi', 'Dịch vụ Người Dẫn Lối dành riêng cho khách lưu trú tại Penthouse và Villa, với sự chăm sóc tận tâm, kín đáo và những nghi thức chào đón mang đậm bản sắc Việt Nam.'),
  ('ru', 'Персональный сопровождающий для гостей пентхаусов и вилл: деликатная забота с учётом ваших пожеланий и продуманные вьетнамские ритуалы приветствия.'),
  ('zh', '专为顶层套房和别墅宾客提供的专属管家服务，以细致贴心且不打扰的关怀，以及富有越南特色的迎宾仪式，打造个性化入住体验。'),
  ('ko', '펜트하우스와 빌라 투숙객을 위한 전담 호스트 서비스로, 세심하고 부담 없는 맞춤형 배려와 베트남의 정취를 담은 환영 의식을 선사합니다.'),
  ('ja', 'ペントハウスとヴィラにご宿泊のお客様専任のホストが、さりげない心配りとお一人おひとりに合わせたサービス、ベトナムらしい歓迎のひとときをお届けします。')
) AS translations(locale, description)
JOIN public.destinations d ON d.id = 'nguoi-dan-loi'
ON CONFLICT (destination_id, locale) DO NOTHING;

COMMIT;
