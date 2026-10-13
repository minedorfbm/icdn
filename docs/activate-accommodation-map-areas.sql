-- Run only after the accommodation-area UI is deployed to production.
BEGIN;
DO $activate$
DECLARE ids text[]:=ARRAY['hillside-rooms','hillside-penthouses','earth-villas','seaside-villas','lagoon-villas'];
BEGIN
 IF (SELECT count(*) FROM public.map_places WHERE id=ANY(ids) AND accommodation_group IS NOT NULL)<>5 OR
    EXISTS(SELECT 1 FROM (VALUES
 ('hillside-rooms','rooms'),
 ('hillside-rooms','resort-classic-panoramic-room-oceanview'),
 ('hillside-rooms','club-panoramic-room-oceanview'),
 ('hillside-rooms','resort-terrace-suite-oceanview'),
 ('hillside-rooms','club-terrace-suite-panoramic-oceanview'),
 ('hillside-penthouses','penthouses'),
 ('earth-villas','four-bedroom-pool-villa'),
 ('seaside-villas','one-bedroom-seaside-villa-by-the-beach'),
 ('seaside-villas','one-bedroom-seaside-villa-on-the-rocks'),
 ('seaside-villas','two-bedroom-seaside-villa-on-the-rocks'),
 ('seaside-villas','two-bedroom-royal-residence-by-the-sea'),
 ('seaside-villas','three-bedroom-bai-bac-bay-villa'),
 ('seaside-villas','two-bedroom-sun-peninsula-residence'),
 ('seaside-villas','three-bedroom-sun-peninsula-residence'),
 ('lagoon-villas','spa-lagoon-villas')
    ) AS expected(place_id,destination_id)
    LEFT JOIN public.map_destination_links link USING(place_id,destination_id)
    WHERE link.destination_id IS NULL OR NOT link.is_primary) THEN
  RAISE EXCEPTION 'Accommodation preparation is incomplete';
 END IF;
 IF EXISTS(SELECT 1 FROM public.map_destination_links link
   JOIN (VALUES
 ('hillside-rooms','rooms'),
 ('hillside-rooms','resort-classic-panoramic-room-oceanview'),
 ('hillside-rooms','club-panoramic-room-oceanview'),
 ('hillside-rooms','resort-terrace-suite-oceanview'),
 ('hillside-rooms','club-terrace-suite-panoramic-oceanview'),
 ('hillside-penthouses','penthouses'),
 ('earth-villas','four-bedroom-pool-villa'),
 ('seaside-villas','one-bedroom-seaside-villa-by-the-beach'),
 ('seaside-villas','one-bedroom-seaside-villa-on-the-rocks'),
 ('seaside-villas','two-bedroom-seaside-villa-on-the-rocks'),
 ('seaside-villas','two-bedroom-royal-residence-by-the-sea'),
 ('seaside-villas','three-bedroom-bai-bac-bay-villa'),
 ('seaside-villas','two-bedroom-sun-peninsula-residence'),
 ('seaside-villas','three-bedroom-sun-peninsula-residence'),
 ('lagoon-villas','spa-lagoon-villas')
   ) AS expected ON expected.column2=link.destination_id
   WHERE link.active AND link.is_primary AND link.place_id<>expected.column1) THEN
  RAISE EXCEPTION 'A different primary accommodation location has been published';
 END IF;
 UPDATE public.map_places SET active=true WHERE id=ANY(ids);
 UPDATE public.map_destination_links link SET active=true FROM (VALUES
 ('hillside-rooms','rooms'),
 ('hillside-rooms','resort-classic-panoramic-room-oceanview'),
 ('hillside-rooms','club-panoramic-room-oceanview'),
 ('hillside-rooms','resort-terrace-suite-oceanview'),
 ('hillside-rooms','club-terrace-suite-panoramic-oceanview'),
 ('hillside-penthouses','penthouses'),
 ('earth-villas','four-bedroom-pool-villa'),
 ('seaside-villas','one-bedroom-seaside-villa-by-the-beach'),
 ('seaside-villas','one-bedroom-seaside-villa-on-the-rocks'),
 ('seaside-villas','two-bedroom-seaside-villa-on-the-rocks'),
 ('seaside-villas','two-bedroom-royal-residence-by-the-sea'),
 ('seaside-villas','three-bedroom-bai-bac-bay-villa'),
 ('seaside-villas','two-bedroom-sun-peninsula-residence'),
 ('seaside-villas','three-bedroom-sun-peninsula-residence'),
 ('lagoon-villas','spa-lagoon-villas')
 ) AS expected(place_id,destination_id)
 WHERE link.place_id=expected.place_id AND link.destination_id=expected.destination_id;
END;
$activate$;
COMMIT;
