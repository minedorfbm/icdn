-- Accommodation areas traced from the user-supplied official plan.
-- Prepare unpublished data; activate after the area-aware map UI is deployed.
BEGIN;
ALTER TABLE public.map_places
 ADD COLUMN IF NOT EXISTS accommodation_group text CHECK(accommodation_group IN ('rooms','penthouses','earthVillas','seasideVillas','lagoonVillas')),
 ADD COLUMN IF NOT EXISTS covered_levels text[] NOT NULL DEFAULT '{}' CHECK(covered_levels <@ ARRAY['heaven','sky','earth','sea']::text[]),
 ADD COLUMN IF NOT EXISTS room_numbers text;
DO $areas$
DECLARE a jsonb; destination text; actual jsonb; i integer;
BEGIN
 FOR a IN SELECT value FROM jsonb_array_elements($seed$[
  {
    "id": "hillside-rooms",
    "name": "Rooms & Suites",
    "level_id": "heaven",
    "pin": 101,
    "x": 438.0,
    "y": 320.0,
    "zoom": 1.65,
    "active": true,
    "accommodation_group": "rooms",
    "covered_levels": [
      "heaven",
      "sky",
      "earth"
    ],
    "room_numbers": "501-567 / 301-393 / 219-245",
    "destination_ids": [
      "rooms",
      "resort-classic-panoramic-room-oceanview",
      "club-panoramic-room-oceanview",
      "resort-terrace-suite-oceanview",
      "club-terrace-suite-panoramic-oceanview"
    ],
    "official_point": [
      830,
      550
    ]
  },
  {
    "id": "hillside-penthouses",
    "name": "Heavenly Penthouses",
    "level_id": "heaven",
    "pin": 102,
    "x": 375.0,
    "y": 134.0,
    "zoom": 1.85,
    "active": true,
    "accommodation_group": "penthouses",
    "covered_levels": [
      "heaven",
      "sky"
    ],
    "room_numbers": "598-599 / 398-399",
    "destination_ids": [
      "penthouses"
    ],
    "official_point": [
      725,
      240
    ]
  },
  {
    "id": "earth-villas",
    "name": "Earth Villas",
    "level_id": "earth",
    "pin": 103,
    "x": 498.0,
    "y": 203.0,
    "zoom": 1.85,
    "active": true,
    "accommodation_group": "earthVillas",
    "covered_levels": [
      "earth"
    ],
    "room_numbers": "296-299",
    "destination_ids": [
      "four-bedroom-pool-villa"
    ],
    "official_point": [
      930,
      355
    ]
  },
  {
    "id": "seaside-villas",
    "name": "Seaside Villas & Residences",
    "level_id": "sea",
    "pin": 104,
    "x": 1290.0,
    "y": 140.0,
    "zoom": 1.85,
    "active": true,
    "accommodation_group": "seasideVillas",
    "covered_levels": [
      "sea"
    ],
    "room_numbers": "101-103 / 105-108 / 996-999",
    "destination_ids": [
      "one-bedroom-seaside-villa-by-the-beach",
      "one-bedroom-seaside-villa-on-the-rocks",
      "two-bedroom-seaside-villa-on-the-rocks",
      "two-bedroom-royal-residence-by-the-sea",
      "three-bedroom-bai-bac-bay-villa",
      "two-bedroom-sun-peninsula-residence",
      "three-bedroom-sun-peninsula-residence"
    ],
    "official_point": [
      2250,
      250
    ]
  },
  {
    "id": "lagoon-villas",
    "name": "Spa Lagoon Villas",
    "level_id": "sea",
    "pin": 105,
    "x": 1122.0,
    "y": 734.0,
    "zoom": 1.85,
    "active": true,
    "accommodation_group": "lagoonVillas",
    "covered_levels": [
      "sea"
    ],
    "room_numbers": "109-110",
    "destination_ids": [
      "spa-lagoon-villas"
    ],
    "official_point": [
      1970,
      1240
    ]
  }
]$seed$::jsonb) LOOP
  SELECT to_jsonb(p) INTO actual FROM public.map_places p WHERE p.id=a->>'id' FOR UPDATE;
  IF actual IS NOT NULL AND NOT (actual @> ((a-'destination_ids'-'official_point') || jsonb_build_object('active',false))) THEN
   RAISE EXCEPTION 'Accommodation area already edited: %',a->>'id';
  END IF;
  INSERT INTO public.map_places(id,name,level_id,pin,x,y,zoom,active,accommodation_group,covered_levels,room_numbers)
  VALUES(a->>'id',a->>'name',a->>'level_id',(a->>'pin')::integer,(a->>'x')::float8,(a->>'y')::float8,(a->>'zoom')::float8,false,a->>'accommodation_group',ARRAY(SELECT jsonb_array_elements_text(a->'covered_levels')),a->>'room_numbers')
  ON CONFLICT(id) DO NOTHING;
  i:=0;
  FOR destination IN SELECT jsonb_array_elements_text(a->'destination_ids') LOOP
   IF NOT EXISTS(SELECT 1 FROM public.destinations WHERE id=destination AND type::text='accommodation' AND content_family='resort') THEN
    RAISE EXCEPTION 'Expected resort accommodation card missing: %',destination;
   END IF;
   IF EXISTS(SELECT 1 FROM public.map_destination_links WHERE destination_id=destination AND active AND is_primary AND place_id<>a->>'id') THEN
    RAISE EXCEPTION 'Accommodation already has a different primary location: %',destination;
   END IF;
   IF EXISTS(SELECT 1 FROM public.map_destination_links WHERE place_id=a->>'id' AND destination_id=destination AND (active OR NOT is_primary OR display_order<>i)) THEN
    RAISE EXCEPTION 'Accommodation association already edited: %',destination;
   END IF;
   INSERT INTO public.map_destination_links(place_id,destination_id,display_order,is_primary,active)
   VALUES(a->>'id',destination,i,true,false) ON CONFLICT(place_id,destination_id) DO NOTHING;
   i:=i+1;
  END LOOP;
 END LOOP;
END;
$areas$;
COMMIT;
