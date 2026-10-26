-- The resort's hreflang links incorrectly pair Club InterContinental Rate with
-- Book Now, Pay Later. Keep the correct shared page until equivalent translations exist.
BEGIN;
UPDATE public.destination_link_translations t
SET active = false
FROM public.destination_links l
WHERE t.link_id = l.id
  AND l.destination_id = 'club-lounge'
  AND l.kind IN ('DISCOVER', 'WEBSITE')
  AND t.source_url = 'https://www.danang.intercontinental.com/offers/club-intercontinental-rate/'
  AND t.url IN (
    'https://www.danang.intercontinental.com/ja/offers/book-now-pay-later/',
    'https://www.danang.intercontinental.com/ko/offers/book-now-pay-later/',
    'https://www.danang.intercontinental.com/ru/offers/book-now-pay-later/',
    'https://www.danang.intercontinental.com/zh/offers/book-now-pay-later/',
    'https://www.danang.intercontinental.com/vn/offers/book-now-pay-later/'
  )
  AND t.active;
COMMIT;
