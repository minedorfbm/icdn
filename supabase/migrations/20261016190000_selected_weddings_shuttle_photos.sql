-- Owner-selected Weddings home and Shuttle home/detail photographs.
BEGIN;
DO $photos$
DECLARE p jsonb; actual text;
BEGIN
 FOR p IN SELECT value FROM jsonb_array_elements($data$[{"filename": "weddings-home-12a67f1a33d1.webp", "sha256": "12a67f1a33d1ef06b2e6c3bd900f89fa3d0d67c178e0a7d9ac4e98033c8107df", "bytes": 300502, "old_url": "https://www.danang.intercontinental.com/wp-content/uploads/2022/11/DSC08835.jpg", "url": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/weddings-home-12a67f1a33d1.webp", "destination_id": "weddings", "field": "image_key"}, {"destination_id": "shuttle", "field": "image_key", "filename": "shuttle-1-bcdbf5ce798d.webp", "old_url": "https://www.danang.intercontinental.com/wp-content/uploads/2021/06/japanese-covered-bridge-hoi-unesco-world-heritage-vietnam-scaled.jpg", "url": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/shuttle-1-bcdbf5ce798d.webp", "sha256": "bcdbf5ce798d131413317d25804347f4a1cb49eec7bbc4c55f6f164b4e6f0dad", "bytes": 186010}, {"destination_id": "shuttle", "field": "detail_image_key", "filename": "shuttle-2-5a2b042e29ce.webp", "old_url": "https://www.danang.intercontinental.com/wp-content/uploads/2023/02/Hoi-An-Lantern-shops-scaled.jpg", "url": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/shuttle-2-5a2b042e29ce.webp", "sha256": "5a2b042e29ced241694a57bd699df9399a22b42767e9364ad4bc988262ba9e65", "bytes": 63130}, {"destination_id": "nail-hair", "field": "detail_image_key", "filename": "nail-hair-detail-6afa029bd39c.webp", "old_url": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/nail-hair-detail-ef937d0e2c.webp", "url": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/nail-hair-detail-6afa029bd39c.webp", "sha256": "6afa029bd39cf12b694e5db2c07bf5fae670d3f4ffee285539c6bd23cb29e6b8", "bytes": 74794}]$data$::jsonb) LOOP
  IF p->>'field' NOT IN ('image_key','detail_image_key') THEN RAISE EXCEPTION 'Unexpected photo field'; END IF;
  EXECUTE format('SELECT %I FROM public.destinations WHERE id=$1 AND active FOR UPDATE',p->>'field') INTO actual USING p->>'destination_id';
  IF actual IS NULL OR actual NOT IN (p->>'old_url',p->>'url') THEN RAISE EXCEPTION 'Photo changed since selection: % / %',p->>'destination_id',p->>'field'; END IF;
  EXECUTE format('UPDATE public.destinations SET %I=$1 WHERE id=$2 AND %I IS DISTINCT FROM $1',p->>'field',p->>'field') USING p->>'url',p->>'destination_id';
 END LOOP;
END $photos$;
COMMIT;
