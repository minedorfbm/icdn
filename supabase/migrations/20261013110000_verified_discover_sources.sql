-- Backfill the source links already present when the 13 October audit ran.
-- Only replace the original generic homepage; preserve subsequent editorial edits.
BEGIN;
UPDATE public.destination_links
SET url='https://www.danang.intercontinental.com/contact-us/'
WHERE destination_id IN ('reception','information') AND kind='DISCOVER'
  AND url='https://www.danang.intercontinental.com/';

INSERT INTO public.destination_links(destination_id,kind,url,display_order,active)
SELECT 'ihg-one-rewards','DISCOVER','https://www.ihg.com/onerewards/content/us/en/home',0,true
WHERE EXISTS(SELECT 1 FROM public.destinations WHERE id='ihg-one-rewards')
  AND NOT EXISTS(SELECT 1 FROM public.destination_links WHERE destination_id='ihg-one-rewards' AND kind IN ('DISCOVER','WEBSITE'));
-- These two rows were created through the editor before the menu audit.
-- Keep the audited UUIDs so an existing corrected production row is untouched.
INSERT INTO public.destination_links(id,destination_id,kind,url,display_order,active)
VALUES
('4eb013b2-fd51-40f6-af8f-43f5d4a7ebf6','weddings','MENU','https://www.danang.intercontinental.com/wp-content/uploads/2026/06/InterContinental-Danang-Wedding-Brochure.pdf',0,true),
('c352fc2d-b691-4239-9c93-640a8180b4c7','tingara','MENU','https://www.danang.intercontinental.com/dining/heavenly-afternoon-tea/',0,true)
ON CONFLICT(id) DO NOTHING;
COMMIT;
