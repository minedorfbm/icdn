-- Run only after the PR adding the Benefits dialog has been merged and deployed.
BEGIN;
DO $activate$
DECLARE ids uuid[] := ARRAY['a55af8fd-d032-58d4-b73c-0e5ba0d20163','2a32bd27-550b-5dd2-ad9a-498b5720adaa','691511e5-81c7-56a9-a549-ebd4a517c6c1','e7b05acd-5bee-5a82-b12e-ee9174534bbf','81eaa2fd-7149-5bd6-b065-d141329f7b24','5c17a28a-6de1-5137-b8fa-e5d2887d3e3a','1cec6d60-11e1-51fd-9a58-76fdbc77b84d','811e8df7-3120-5923-9a98-e483656b6110','c5391fbb-9d24-5454-967c-b5b993c8d631','9c52d20e-210d-579c-b577-59b12ecf0c10','e372ba5e-862d-565d-9271-5ee36f6e1c7f','b87bbdbd-7f5d-5139-9865-38080d32b3f8','6ab00a4f-3c21-5657-a39b-fde6afd6dac0','a6443371-0218-5b99-a745-2d440d282ee5','31160658-8fc4-5edf-8d85-06314cfab120','ee7b2c12-16a1-5200-9ab7-82cd4700a36e','7dc92ae5-8a57-5273-9ade-9952e2dfa4b2','6f321383-e379-51ab-8b8b-dde574957326','2eb3e156-69e3-5e35-812e-0df954e65249','fad107e8-bee0-5d07-a214-c016ede8a3ab','df8c6fc8-083d-52e5-b1c3-1f55fd1e235a','c6240057-6909-504a-b4e9-2eb3dc6822e6','4a3a9857-dcdc-5793-8bfd-70e1e75ac2fe','2c68b2c5-c01d-590e-a7ab-a5a6ae5d7fcf','fe65f464-f12d-59bb-a2ac-77471d574b41','0c1d16e5-0461-58d4-8650-7574469ae717','797cf44e-82ba-57fc-8618-13493f834ea2','cd0fe6a9-01d1-5882-b310-dad13804d66e','137717ec-801d-580f-8d88-549a5e5b7fbc','1c1de74b-d8c1-56c4-b9ed-142f9e773c2b']::uuid[];
BEGIN
 IF (SELECT count(*) FROM public.destination_links WHERE id=ANY(ids))<>30 THEN RAISE EXCEPTION 'Expected 30 prepared links'; END IF;
 IF (SELECT count(*) FROM public.accommodation_benefits WHERE active)<>5 THEN RAISE EXCEPTION 'Expected 5 groups'; END IF;
 IF (SELECT count(*) FROM public.accommodation_benefit_translations t JOIN public.accommodation_benefits b ON b.id=t.benefits_id WHERE t.published AND t.source_items=b.items)<>25 THEN RAISE EXCEPTION 'Expected 25 current translations'; END IF;
 UPDATE public.destination_links SET active=true WHERE id=ANY(ids) AND NOT active;
END;
$activate$;
COMMIT;
SELECT destination_id,label,active,benefits_id FROM public.destination_links WHERE label IN ('Floor plan','Benefits') ORDER BY destination_id,display_order;
