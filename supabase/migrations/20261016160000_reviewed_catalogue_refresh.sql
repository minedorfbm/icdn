-- Reviewed requests from the two identical 35-row exports, 16 October 2026.
-- Upload and verify the versioned photos before applying. No rows are deleted.
BEGIN;

DO $cards$
DECLARE p jsonb; f record; current_value text;
BEGIN
 FOR p IN SELECT value FROM jsonb_array_elements($data$[
  {
    "id": "citron",
    "fields": {
      "image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2026/04/Citron_Landingpage.jpg",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/citron-home-cf8c7ab6531b.webp"
      },
      "detail_image_key": {
        "old": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/citron-detail-638d32b73a.webp",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/citron-detail-3b0c495a2769.webp"
      }
    }
  },
  {
    "id": "ihg-one-rewards",
    "fields": {
      "image_key": {
        "old": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/ihg-one-rewards-home-43918a51e2.webp",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/ihg-one-rewards-home-7d04d86f84ee.webp"
      },
      "detail_image_key": {
        "old": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/ihg-one-rewards-detail-3615b80fe8.webp",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/ihg-one-rewards-detail-d46b935eb0df.webp"
      }
    }
  },
  {
    "id": "bensley-package",
    "fields": {
      "image_key": {
        "old": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/offer-bensley-dca5bf101a26.webp",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/bensley-package-home-9ff5152260e6.webp"
      }
    }
  },
  {
    "id": "apec-garden",
    "fields": {
      "image_key": {
        "old": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/apec-garden-home-717fa09e00.webp",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/apec-garden-home-8b17b91ddf96.webp"
      }
    }
  },
  {
    "id": "culinary-activities",
    "fields": {
      "image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2024/05/Citron-Buffet-2-scaled.jpg",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/culinary-activities-home-d80f77cbe569.webp"
      },
      "detail_image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2026/04/Citron_Landingpage.jpg",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/culinary-activities-detail-6ff1ae1a839c.webp"
      }
    }
  },
  {
    "id": "buffalo-bar",
    "fields": {
      "detail_image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2021/10/Buffalo-Bar-_-with-Bartender-scaled-e1634709794933.jpg",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/buffalo-bar-detail-cee8352dc9f8.webp"
      }
    }
  },
  {
    "id": "tingara",
    "fields": {
      "detail_image_key": {
        "old": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/tingara-detail-6fbfb6722f.webp",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/tingara-detail-090e7789d872.webp"
      },
      "detail_description": {
        "old": "Watch Japanese teppanyaki unfold at a chef-led counter, with premium seafood, exceptional beef and carefully chosen wine and sake. Bill Bensley’s circular bird’s-nest design and rainforest views frame this intimate culinary experience.",
        "new": "Watch Japanese teppanyaki unfold in a culinary experience guided by Chef Junichi Yoshida, with premium seafood, exceptional beef and carefully chosen wine and sake. Bill Bensley’s circular bird’s-nest design and rainforest views frame this intimate culinary experience."
      }
    }
  },
  {
    "id": "heritage-village",
    "fields": {
      "detail_image_key": {
        "old": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/heritage-village-detail-9db978579b.webp",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/heritage-village-detail-961d3f8231e2.webp"
      }
    }
  },
  {
    "id": "bensley-gallery",
    "fields": {
      "detail_image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2022/04/COUPLE-AT-BENSLEY-GALLERY-2-scaled.jpg",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/bensley-gallery-detail-339f94ce6722.webp"
      }
    }
  },
  {
    "id": "long-bar",
    "fields": {
      "image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2026/04/Longbar_Landingpage.jpg",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/long-bar-home-3868d323bd49.webp"
      }
    }
  },
  {
    "id": "nursery",
    "fields": {
      "image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2022/11/DSC02279-e1673927393394.jpg",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/nursery-home-1b8a9fbc8b72.webp"
      },
      "detail_image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2026/03/Kids-Club-2-scaled.jpg",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/nursery-detail-a5086ebcf69a.webp"
      }
    }
  },
  {
    "id": "organic-garden",
    "fields": {
      "image_key": {
        "old": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/organic-garden-home-aae26ae34a.webp",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/organic-garden-home-e50730d3a69a.webp"
      }
    }
  },
  {
    "id": "destination-experiences",
    "fields": {
      "detail_image_key": {
        "old": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/destination-experiences-detail-cdaac3dffb.webp",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/destination-experiences-detail-2eb4384eadfb.webp"
      }
    }
  },
  {
    "id": "sea-experiences",
    "fields": {
      "image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2023/11/Kayak-2.jpg",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/sea-experiences-home-73ff1aec5edd.webp"
      },
      "detail_image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2026/02/z4459883403599_32a8b89fa940541b1b0eab9f96eead70.jpg.jpeg",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/sea-experiences-detail-39e9a31eab62.webp"
      }
    }
  },
  {
    "id": "garden-jacuzzi",
    "fields": {
      "image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2026/03/05-08-0006_Garden-Pool-2-scaled.jpg",
        "new": "https://www.danang.intercontinental.com/wp-content/uploads/2025/06/05-08-0008_Garden-Pool-Jacuzzi-1-scaled.jpg"
      },
      "detail_image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2025/06/05-08-0008_Garden-Pool-Jacuzzi-1-scaled.jpg",
        "new": "https://www.danang.intercontinental.com/wp-content/uploads/2026/03/05-08-0006_Garden-Pool-2-scaled.jpg"
      }
    }
  },
  {
    "id": "wine-cellar",
    "fields": {
      "image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2021/08/Wine-Cellar-2-scaled.jpg",
        "new": "https://www.danang.intercontinental.com/wp-content/uploads/2021/10/La-Maison-1888-Wine-Cellar.jpg"
      },
      "detail_image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2021/10/La-Maison-1888-Wine-Cellar.jpg",
        "new": "https://www.danang.intercontinental.com/wp-content/uploads/2021/08/Wine-Cellar-2-scaled.jpg"
      }
    }
  },
  {
    "id": "long-pool",
    "fields": {
      "image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2026/03/Long-Pool-Outside-2-scaled.jpg",
        "new": "https://www.danang.intercontinental.com/wp-content/uploads/2022/11/DSC05621.jpg"
      },
      "detail_image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2022/11/DSC05621.jpg",
        "new": "https://www.danang.intercontinental.com/wp-content/uploads/2026/03/Long-Pool-Outside-2-scaled.jpg"
      }
    }
  },
  {
    "id": "kids-pool",
    "fields": {
      "image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2025/08/Pool-Friends-scaled.jpg",
        "new": "https://www.danang.intercontinental.com/wp-content/uploads/2022/03/ICDN-Resort-Pool-with-family-scaled-1.jpg"
      },
      "detail_image_key": {
        "old": "https://www.danang.intercontinental.com/wp-content/uploads/2022/03/ICDN-Resort-Pool-with-family-scaled-1.jpg",
        "new": "https://www.danang.intercontinental.com/wp-content/uploads/2025/08/Pool-Friends-scaled.jpg"
      }
    }
  },
  {
    "id": "mi-sol-spa",
    "fields": {
      "image_key": {
        "old": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/mi-sol-spa-home-7a3827738f.webp",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/mi-sol-spa-detail-d463f7fef7.webp"
      },
      "detail_image_key": {
        "old": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/mi-sol-spa-detail-d463f7fef7.webp",
        "new": "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/mi-sol-spa-home-7a3827738f.webp"
      }
    }
  },
  {
    "id": "enchanted-holiday",
    "fields": {
      "image_position": {
        "old": null,
        "new": "28% 50%"
      }
    }
  },
  {
    "id": "summit-cinema",
    "fields": {
      "image_position": {
        "old": null,
        "new": "85% 50%"
      },
      "name": {
        "old": "Summit Auditorium",
        "new": "Cinema"
      }
    }
  },
  {
    "id": "la-maison-1888",
    "fields": {
      "image_position": {
        "old": null,
        "new": "55% 50%"
      }
    }
  }
]$data$::jsonb) LOOP
  PERFORM 1 FROM public.destinations WHERE id=p->>'id' AND active FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing active destination: %',p->>'id'; END IF;
  FOR f IN SELECT * FROM jsonb_each(p->'fields') LOOP
   IF f.key NOT IN ('name','image_key','detail_image_key','image_position','detail_description') THEN
    RAISE EXCEPTION 'Unsupported catalogue field';
   END IF;
   EXECUTE format('SELECT %I FROM public.destinations WHERE id=$1',f.key)
     INTO current_value USING p->>'id';
   IF current_value IS DISTINCT FROM f.value->>'old'
     AND current_value IS DISTINCT FROM f.value->>'new' THEN
    RAISE EXCEPTION 'Catalogue changed since review: % / %',p->>'id',f.key;
   END IF;
   IF current_value IS DISTINCT FROM f.value->>'new' THEN
    EXECUTE format('UPDATE public.destinations SET %I=$1 WHERE id=$2',f.key)
      USING f.value->>'new',p->>'id';
   END IF;
  END LOOP;
 END LOOP;
END $cards$;

DO $links$
DECLARE p jsonb; actual public.destination_links%ROWTYPE; found_count integer;
BEGIN
 FOR p IN SELECT value FROM jsonb_array_elements($data$[
  {
    "destination_id": "relaxation-pavilion",
    "kind": "DISCOVER",
    "url": "https://www.danang.intercontinental.com/spa-and-wellbeing/",
    "label": null,
    "old_url": null
  },
  {
    "destination_id": "enchanted-holiday",
    "kind": "WEBSITE",
    "url": "https://www.danang.intercontinental.com/festive-2026/",
    "label": "Festive programme",
    "old_url": null
  },
  {
    "destination_id": "enchanted-holiday",
    "kind": "BROCHURE",
    "url": "https://www.danang.intercontinental.com/wp-content/uploads/2026/08/InterContinental-Danang-Festive-2026.pdf",
    "label": "Festive brochure",
    "old_url": null
  },
  {
    "destination_id": "ihg-one-rewards",
    "kind": "INFO",
    "url": "https://apps.apple.com/fr/app/h%C3%B4tels-ihg-r%C3%A9compenses/id368217298",
    "label": "Download on the App Store",
    "old_url": null
  },
  {
    "destination_id": "ihg-one-rewards",
    "kind": "INFO",
    "url": "https://play.google.com/store/apps/details?id=com.ihg.apps.android",
    "label": "Get it on Google Play",
    "old_url": null
  },
  {
    "destination_id": "apec-garden",
    "kind": "BROCHURE",
    "url": "https://www.danang.intercontinental.com/wp-content/uploads/2026/03/APEC-Sculpture-Garden-Discovery-brochure-Mar26.pdf",
    "label": "Sculpture guide",
    "old_url": null
  },
  {
    "destination_id": "nam-tram",
    "kind": "DISCOVER",
    "url": "https://www.danang.intercontinental.com/experiences/ride-our-nam-tram/",
    "label": null,
    "old_url": "https://www.danang.intercontinental.com/experiences/the-resort/",
    "legacy_urls": [
      "https://www.danang.intercontinental.com/"
    ]
  },
  {
    "destination_id": "nam-tram",
    "kind": "WEBSITE",
    "url": "https://www.danang.intercontinental.com/namtram-dining-journey/",
    "label": "Nam Tram Dining",
    "old_url": null
  },
  {
    "destination_id": "moulin-rouge",
    "kind": "DISCOVER",
    "url": "https://www.danang.intercontinental.com/venues/m-rouge/",
    "label": null,
    "old_url": null
  },
  {
    "destination_id": "bensley-gallery",
    "kind": "BROCHURE",
    "url": "https://www.danang.intercontinental.com/wp-content/uploads/2024/02/A-HISTORY-OF-VIETNAM-CATALOGUE-FOR-WEB.pdf",
    "label": "A History of Vietnam",
    "old_url": null
  },
  {
    "destination_id": "bensley-gallery",
    "kind": "BROCHURE",
    "url": "https://www.danang.intercontinental.com/wp-content/uploads/2025/06/Bill-Bensley-Gallery-Catalogue-June-2025.pdf",
    "label": "Gallery catalogue",
    "old_url": null
  },
  {
    "destination_id": "organic-garden",
    "kind": "DISCOVER",
    "url": "https://www.danang.intercontinental.com/experiences/nature/",
    "label": null,
    "old_url": "https://www.danang.intercontinental.com/recreation/culinary-activities/",
    "legacy_urls": [
      "https://www.danang.intercontinental.com/"
    ]
  },
  {
    "destination_id": "dia-tang",
    "kind": "DISCOVER",
    "url": "https://www.danang.intercontinental.com/amenities/our-spirit-house/",
    "label": null,
    "old_url": "https://www.danang.intercontinental.com/recreation/cultural-activities/",
    "legacy_urls": [
      "https://www.danang.intercontinental.com/"
    ]
  },
  {
    "destination_id": "club-beach",
    "kind": "DISCOVER",
    "url": "https://www.danang.intercontinental.com/amenities/club-intercontinental/",
    "label": null,
    "old_url": "https://www.danang.intercontinental.com/recreation/beach-water-sports/",
    "legacy_urls": [
      "https://www.danang.intercontinental.com/"
    ]
  }
]$data$::jsonb) LOOP
  PERFORM 1 FROM public.destinations WHERE id=p->>'destination_id' AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing link owner: %',p->>'destination_id'; END IF;
  SELECT count(*) INTO found_count FROM public.destination_links
   WHERE destination_id=p->>'destination_id' AND kind::text=p->>'kind'
    AND (url IN (p->>'url',p->>'old_url') OR url IN (SELECT jsonb_array_elements_text(p->'legacy_urls')));
  IF found_count>1 THEN RAISE EXCEPTION 'Ambiguous catalogue link: %',p->>'destination_id'; END IF;
  IF found_count=1 THEN
   SELECT * INTO STRICT actual FROM public.destination_links
    WHERE destination_id=p->>'destination_id' AND kind::text=p->>'kind'
     AND (url IN (p->>'url',p->>'old_url') OR url IN (SELECT jsonb_array_elements_text(p->'legacy_urls'))) FOR UPDATE;
   IF NOT actual.active THEN RAISE EXCEPTION 'Link deliberately inactive: %',actual.id; END IF;
   IF actual.label IS DISTINCT FROM p->>'label' THEN RAISE EXCEPTION 'Link label changed: %',actual.id; END IF;
   UPDATE public.destination_links SET url=p->>'url' WHERE id=actual.id AND url IS DISTINCT FROM p->>'url';
  ELSE
   IF p->>'old_url' IS NOT NULL AND EXISTS(SELECT 1 FROM public.destination_links
    WHERE destination_id=p->>'destination_id' AND kind::text=p->>'kind') THEN
    RAISE EXCEPTION 'Original Discover link changed: %',p->>'destination_id';
   END IF;
   INSERT INTO public.destination_links(destination_id,kind,label,url,display_order,active)
    SELECT p->>'destination_id',(p->>'kind')::public.destination_link_type,p->>'label',p->>'url',
     coalesce(max(display_order),-1)+1,true FROM public.destination_links WHERE destination_id=p->>'destination_id';
  END IF;
 END LOOP;
END $links$;

DO $featured$
DECLARE p jsonb; link public.destination_links%ROWTYPE;
BEGIN
 FOR p IN SELECT value FROM jsonb_array_elements($data$[
  {
    "destination_id": "bensley-gallery",
    "kind": "BROCHURE",
    "url": "https://www.danang.intercontinental.com/wp-content/uploads/2024/02/A-HISTORY-OF-VIETNAM-CATALOGUE-FOR-WEB.pdf"
  },
  {
    "destination_id": "things-to-do",
    "kind": "DAILY_SCHEDULE",
    "url": "https://www.danang.intercontinental.com/wp-content/uploads/2026/08/Your-Guide-to-Fun-at-InterContinental-Danang.pdf"
  },
  {
    "destination_id": "nature-experiences",
    "kind": "BROCHURE",
    "url": "https://www.danang.intercontinental.com/wp-content/uploads/2026/05/Nature-Discovery-Guide.pdf",
    "label": "Discovery guide"
  }
]$data$::jsonb) LOOP
  SELECT * INTO STRICT link FROM public.destination_links
   WHERE destination_id=p->>'destination_id' AND kind::text=p->>'kind' AND url=p->>'url' AND active;
  IF p ? 'label' THEN
   IF link.label IS NOT NULL AND link.label IS DISTINCT FROM p->>'label' THEN
    RAISE EXCEPTION 'Featured label changed: %',link.id;
   END IF;
   UPDATE public.destination_links SET label=p->>'label' WHERE id=link.id AND label IS DISTINCT FROM p->>'label';
  END IF;
  UPDATE public.destinations SET primary_link_id=link.id WHERE id=p->>'destination_id'
   AND primary_link_id IS DISTINCT FROM link.id;
 END LOOP;
END $featured$;

DO $relations$
DECLARE pair record;
BEGIN
 FOR pair IN SELECT * FROM (VALUES ('summit-cinema','the-summit'),
('nam-tram','nam-tram-dining'),
('bensley-gallery','kate-mccoy'),
('bensley-gallery','bensley-package'),
('long-bar','long-pool'),
('nursery','planet-trekkers'),
('nature-experiences','things-to-do'),
('shuttle','things-to-do'),
('destination-experiences','things-to-do'),
('culinary-activities','things-to-do'),
('mi-sol-spa','nail-hair'),
('club-intercontinental','club-lounge'),
('club-beach','club-lounge')) AS chosen(a,b) LOOP
  IF (SELECT count(*) FROM public.destinations WHERE id IN (pair.a,pair.b) AND active)<>2 THEN
   RAISE EXCEPTION 'Missing active related place: % / %',pair.a,pair.b;
  END IF;
  IF EXISTS(SELECT 1 FROM public.destination_relations WHERE destination_id=pair.a
   AND related_destination_id=pair.b AND NOT active) THEN
   RAISE EXCEPTION 'Relation deliberately inactive: % / %',pair.a,pair.b;
  END IF;
  INSERT INTO public.destination_relations(destination_id,related_destination_id,display_order,active)
   SELECT pair.a,pair.b,coalesce(max(display_order),-1)+1,true FROM public.destination_relations
   ON CONFLICT(destination_id,related_destination_id) DO NOTHING;
 END LOOP;
END $relations$;

-- Share La Maison's current wine-tasting event, including the same five translations.
DO $event$
DECLARE event_id uuid;
BEGIN
 SELECT id INTO STRICT event_id FROM public.destination_events
  WHERE destination_id='la-maison-1888' AND title='Souvenirs de France Wine Tasting' AND active;
 INSERT INTO public.destination_event_links(event_id,destination_id) VALUES(event_id,'wine-cellar')
  ON CONFLICT DO NOTHING;
END $event$;

DO $translation$
DECLARE t jsonb; actual public.destination_translations%ROWTYPE;
BEGIN
 FOR t IN SELECT value FROM jsonb_array_elements($data$[
  {
    "destination_id": "tingara",
    "locale": "ja",
    "description": "熱帯雨林を望む日本の鉄板焼き。",
    "source_description": "Japanese teppanyaki above the rainforest.",
    "published": true,
    "created_at": "2026-09-23T14:52:37.000055+00:00",
    "updated_at": "2026-10-06T13:36:07.158025+00:00",
    "detail_description": "シェフのカウンターで、上質な魚介と牛肉の鉄板焼きを味わうひととき。厳選したワインや日本酒、Bill Bensleyの丸い鳥の巣のデザイン、熱帯雨林の眺めが親密な食体験を彩ります。",
    "source_detail_description": "Watch Japanese teppanyaki unfold at a chef-led counter, with premium seafood, exceptional beef and carefully chosen wine and sake. Bill Bensley’s circular bird’s-nest design and rainforest views frame this intimate culinary experience.",
    "new_detail": "シェフ、吉田純一の監修による日本の鉄板焼きを、上質な魚介類、厳選された牛肉、ワインや日本酒とともにお楽しみください。Bill Bensleyによる円形の鳥の巣を思わせるデザインと熱帯雨林の眺めが、親密な美食体験を彩ります。"
  },
  {
    "destination_id": "tingara",
    "locale": "ko",
    "description": "열대우림 위에서 즐기는 일본식 테판야키.",
    "source_description": "Japanese teppanyaki above the rainforest.",
    "published": true,
    "created_at": "2026-09-23T14:52:37.000055+00:00",
    "updated_at": "2026-10-06T13:36:07.158025+00:00",
    "detail_description": "셰프 카운터에서 프리미엄 해산물과 엄선한 소고기로 펼쳐지는 일본식 테판야키를 만나보세요. 와인과 사케, Bill Bensley의 원형 새 둥지 디자인과 열대우림 전망이 특별한 식사를 완성합니다.",
    "source_detail_description": "Watch Japanese teppanyaki unfold at a chef-led counter, with premium seafood, exceptional beef and carefully chosen wine and sake. Bill Bensley’s circular bird’s-nest design and rainforest views frame this intimate culinary experience.",
    "new_detail": "Junichi Yoshida 셰프의 요리 철학을 담은 일본식 철판요리를 만나보세요. 최상급 해산물과 소고기에 엄선한 와인과 사케가 어우러집니다. Bill Bensley가 설계한 원형 새 둥지 공간과 열대우림 전망이 아늑한 미식 경험을 완성합니다."
  },
  {
    "destination_id": "tingara",
    "locale": "ru",
    "description": "Японское теппанъяки над тропическим лесом.",
    "source_description": "Japanese teppanyaki above the rainforest.",
    "published": true,
    "created_at": "2026-09-23T13:15:49.076643+00:00",
    "updated_at": "2026-10-06T13:36:07.158025+00:00",
    "detail_description": "Наблюдайте за приготовлением японского теппанъяки за стойкой шефа: морепродукты, отборная говядина, вина и саке. Круглый интерьер в форме птичьего гнезда и виды тропического леса создают камерную атмосферу.",
    "source_detail_description": "Watch Japanese teppanyaki unfold at a chef-led counter, with premium seafood, exceptional beef and carefully chosen wine and sake. Bill Bensley’s circular bird’s-nest design and rainforest views frame this intimate culinary experience.",
    "new_detail": "Откройте искусство японского тэппанъяки в гастрономическом опыте под творческим руководством шеф-повара Дзюнъити Ёсиды: отборные морепродукты, исключительная говядина и тщательно подобранные вина и саке. Круглый «птичий гнездовой» дизайн Билла Бенсли и виды на тропический лес создают камерную атмосферу."
  },
  {
    "destination_id": "tingara",
    "locale": "vi",
    "description": "Teppanyaki Nhật Bản trên rừng nhiệt đới.",
    "source_description": "Japanese teppanyaki above the rainforest.",
    "published": true,
    "created_at": "2026-09-23T13:15:49.076643+00:00",
    "updated_at": "2026-10-06T13:36:07.158025+00:00",
    "detail_description": "Trải nghiệm teppanyaki Nhật Bản tại quầy đầu bếp với hải sản cao cấp, thịt bò tuyển chọn, rượu vang và sake. Thiết kế tổ chim tròn của Bill Bensley cùng tầm nhìn rừng nhiệt đới tạo nên không gian ẩm thực thân mật.",
    "source_detail_description": "Watch Japanese teppanyaki unfold at a chef-led counter, with premium seafood, exceptional beef and carefully chosen wine and sake. Bill Bensley’s circular bird’s-nest design and rainforest views frame this intimate culinary experience.",
    "new_detail": "Khám phá nghệ thuật teppanyaki Nhật Bản trong trải nghiệm ẩm thực do đầu bếp Junichi Yoshida định hướng, với hải sản cao cấp, thịt bò hảo hạng cùng rượu vang và sake được tuyển chọn kỹ lưỡng. Thiết kế tổ chim hình tròn của Bill Bensley và tầm nhìn ra rừng mưa tạo nên không gian ẩm thực thân mật."
  },
  {
    "destination_id": "tingara",
    "locale": "zh",
    "description": "雨林之上的日式铁板烧。",
    "source_description": "Japanese teppanyaki above the rainforest.",
    "published": true,
    "created_at": "2026-09-23T13:15:49.076643+00:00",
    "updated_at": "2026-10-06T13:36:07.158025+00:00",
    "detail_description": "在主厨料理台前欣赏日式铁板烧，品味优质海鲜、精选牛肉及搭配的葡萄酒与清酒。Bill Bensley的圆形鸟巢设计与雨林景致，共同呈现亲密而精彩的美食体验。",
    "source_detail_description": "Watch Japanese teppanyaki unfold at a chef-led counter, with premium seafood, exceptional beef and carefully chosen wine and sake. Bill Bensley’s circular bird’s-nest design and rainforest views frame this intimate culinary experience.",
    "new_detail": "探索由主厨吉田纯一指导的日式铁板烧体验，品尝优质海鲜、上乘牛肉以及精心挑选的葡萄酒和清酒。比尔·本斯利设计的圆形鸟巢建筑与雨林景致，为这场私享美食体验营造独特氛围。"
  }
]$data$::jsonb) LOOP
  SELECT * INTO STRICT actual FROM public.destination_translations
   WHERE destination_id='tingara' AND locale=t->>'locale' FOR UPDATE;
  IF actual.detail_description IS DISTINCT FROM t->>'detail_description'
    AND actual.detail_description IS DISTINCT FROM t->>'new_detail' THEN
   RAISE EXCEPTION 'Tingara translation changed: %',t->>'locale';
  END IF;
  IF actual.source_description IS DISTINCT FROM (SELECT short_description FROM public.destinations WHERE id='tingara') THEN
   RAISE EXCEPTION 'Tingara short translation is stale: %',t->>'locale';
  END IF;
  UPDATE public.destination_translations SET detail_description=t->>'new_detail',
   source_detail_description='Watch Japanese teppanyaki unfold in a culinary experience guided by Chef Junichi Yoshida, with premium seafood, exceptional beef and carefully chosen wine and sake. Bill Bensley’s circular bird’s-nest design and rainforest views frame this intimate culinary experience.',published=true
   WHERE destination_id='tingara' AND locale=t->>'locale';
 END LOOP;
END $translation$;

DO $locales$
DECLARE p jsonb; resolved_link_id uuid;
BEGIN
 FOR p IN SELECT value FROM jsonb_array_elements($data$[
  {
    "destination_id": "relaxation-pavilion",
    "source": "https://www.danang.intercontinental.com/spa-and-wellbeing/",
    "locale": "vi",
    "url": "https://www.danang.intercontinental.com/vn/spa-and-wellbeing/"
  },
  {
    "destination_id": "relaxation-pavilion",
    "source": "https://www.danang.intercontinental.com/spa-and-wellbeing/",
    "locale": "ja",
    "url": "https://www.danang.intercontinental.com/ja/spa-and-wellbeing/"
  },
  {
    "destination_id": "relaxation-pavilion",
    "source": "https://www.danang.intercontinental.com/spa-and-wellbeing/",
    "locale": "ko",
    "url": "https://www.danang.intercontinental.com/ko/spa-and-wellbeing/"
  },
  {
    "destination_id": "relaxation-pavilion",
    "source": "https://www.danang.intercontinental.com/spa-and-wellbeing/",
    "locale": "ru",
    "url": "https://www.danang.intercontinental.com/ru/spa-and-wellbeing/"
  },
  {
    "destination_id": "relaxation-pavilion",
    "source": "https://www.danang.intercontinental.com/spa-and-wellbeing/",
    "locale": "zh",
    "url": "https://www.danang.intercontinental.com/zh/spa-and-wellbeing/"
  },
  {
    "destination_id": "enchanted-holiday",
    "source": "https://www.danang.intercontinental.com/festive-2026/",
    "locale": "vi",
    "url": "https://www.danang.intercontinental.com/vn/festive-2026/"
  },
  {
    "destination_id": "enchanted-holiday",
    "source": "https://www.danang.intercontinental.com/festive-2026/",
    "locale": "ja",
    "url": "https://www.danang.intercontinental.com/ja/festive-2026/"
  },
  {
    "destination_id": "enchanted-holiday",
    "source": "https://www.danang.intercontinental.com/festive-2026/",
    "locale": "ko",
    "url": "https://www.danang.intercontinental.com/ko/festive-2026/"
  },
  {
    "destination_id": "enchanted-holiday",
    "source": "https://www.danang.intercontinental.com/festive-2026/",
    "locale": "ru",
    "url": "https://www.danang.intercontinental.com/festive-2026/"
  },
  {
    "destination_id": "enchanted-holiday",
    "source": "https://www.danang.intercontinental.com/festive-2026/",
    "locale": "zh",
    "url": "https://www.danang.intercontinental.com/zh/festive-2026/"
  },
  {
    "destination_id": "nam-tram",
    "source": "https://www.danang.intercontinental.com/experiences/ride-our-nam-tram/",
    "locale": "vi",
    "url": "https://www.danang.intercontinental.com/vn/experiences/vn-ride-our-nam-tram/"
  },
  {
    "destination_id": "nam-tram",
    "source": "https://www.danang.intercontinental.com/experiences/ride-our-nam-tram/",
    "locale": "ja",
    "url": "https://www.danang.intercontinental.com/ja/experiences/ja-ride-our-nam-tram/"
  },
  {
    "destination_id": "nam-tram",
    "source": "https://www.danang.intercontinental.com/experiences/ride-our-nam-tram/",
    "locale": "ko",
    "url": "https://www.danang.intercontinental.com/ko/experiences/ko-ride-our-nam-tram/"
  },
  {
    "destination_id": "nam-tram",
    "source": "https://www.danang.intercontinental.com/experiences/ride-our-nam-tram/",
    "locale": "ru",
    "url": "https://www.danang.intercontinental.com/ru/experiences/ru-ride-our-nam-tram/"
  },
  {
    "destination_id": "nam-tram",
    "source": "https://www.danang.intercontinental.com/experiences/ride-our-nam-tram/",
    "locale": "zh",
    "url": "https://www.danang.intercontinental.com/zh/experiences/zh-ride-our-nam-tram/"
  },
  {
    "destination_id": "nam-tram",
    "source": "https://www.danang.intercontinental.com/namtram-dining-journey/",
    "locale": "vi",
    "url": "https://www.danang.intercontinental.com/vn/namtram-dining-journey/"
  },
  {
    "destination_id": "nam-tram",
    "source": "https://www.danang.intercontinental.com/namtram-dining-journey/",
    "locale": "ja",
    "url": "https://www.danang.intercontinental.com/ja/namtram-dining-journey/"
  },
  {
    "destination_id": "nam-tram",
    "source": "https://www.danang.intercontinental.com/namtram-dining-journey/",
    "locale": "ko",
    "url": "https://www.danang.intercontinental.com/ko/namtram-dining-journey/"
  },
  {
    "destination_id": "nam-tram",
    "source": "https://www.danang.intercontinental.com/namtram-dining-journey/",
    "locale": "ru",
    "url": "https://www.danang.intercontinental.com/ru/namtram-dining-journey/"
  },
  {
    "destination_id": "nam-tram",
    "source": "https://www.danang.intercontinental.com/namtram-dining-journey/",
    "locale": "zh",
    "url": "https://www.danang.intercontinental.com/zh/namtram-dining-journey/"
  },
  {
    "destination_id": "moulin-rouge",
    "source": "https://www.danang.intercontinental.com/venues/m-rouge/",
    "locale": "vi",
    "url": "https://www.danang.intercontinental.com/vn/venues/m-rouge/"
  },
  {
    "destination_id": "moulin-rouge",
    "source": "https://www.danang.intercontinental.com/venues/m-rouge/",
    "locale": "ja",
    "url": "https://www.danang.intercontinental.com/ja/venues/m-rouge/"
  },
  {
    "destination_id": "moulin-rouge",
    "source": "https://www.danang.intercontinental.com/venues/m-rouge/",
    "locale": "ko",
    "url": "https://www.danang.intercontinental.com/ko/venues/m-rouge/"
  },
  {
    "destination_id": "moulin-rouge",
    "source": "https://www.danang.intercontinental.com/venues/m-rouge/",
    "locale": "ru",
    "url": "https://www.danang.intercontinental.com/ru/venues/m-rouge/"
  },
  {
    "destination_id": "moulin-rouge",
    "source": "https://www.danang.intercontinental.com/venues/m-rouge/",
    "locale": "zh",
    "url": "https://www.danang.intercontinental.com/zh/venues/m-rouge/"
  },
  {
    "destination_id": "organic-garden",
    "source": "https://www.danang.intercontinental.com/experiences/nature/",
    "locale": "vi",
    "url": "https://www.danang.intercontinental.com/vn/experiences/nature/"
  },
  {
    "destination_id": "organic-garden",
    "source": "https://www.danang.intercontinental.com/experiences/nature/",
    "locale": "ja",
    "url": "https://www.danang.intercontinental.com/ja/experiences/nature/"
  },
  {
    "destination_id": "organic-garden",
    "source": "https://www.danang.intercontinental.com/experiences/nature/",
    "locale": "ko",
    "url": "https://www.danang.intercontinental.com/ko/experiences/nature/"
  },
  {
    "destination_id": "organic-garden",
    "source": "https://www.danang.intercontinental.com/experiences/nature/",
    "locale": "ru",
    "url": "https://www.danang.intercontinental.com/ru/experiences/nature/"
  },
  {
    "destination_id": "organic-garden",
    "source": "https://www.danang.intercontinental.com/experiences/nature/",
    "locale": "zh",
    "url": "https://www.danang.intercontinental.com/zh/experiences/nature/"
  },
  {
    "destination_id": "dia-tang",
    "source": "https://www.danang.intercontinental.com/amenities/our-spirit-house/",
    "locale": "vi",
    "url": "https://www.danang.intercontinental.com/vn/amenities/our-spirit-house/"
  },
  {
    "destination_id": "dia-tang",
    "source": "https://www.danang.intercontinental.com/amenities/our-spirit-house/",
    "locale": "ja",
    "url": "https://www.danang.intercontinental.com/ja/amenities/our-spirit-house/"
  },
  {
    "destination_id": "dia-tang",
    "source": "https://www.danang.intercontinental.com/amenities/our-spirit-house/",
    "locale": "ko",
    "url": "https://www.danang.intercontinental.com/ko/amenities/our-spirit-house/"
  },
  {
    "destination_id": "dia-tang",
    "source": "https://www.danang.intercontinental.com/amenities/our-spirit-house/",
    "locale": "ru",
    "url": "https://www.danang.intercontinental.com/ru/amenities/our-spirit-house/"
  },
  {
    "destination_id": "dia-tang",
    "source": "https://www.danang.intercontinental.com/amenities/our-spirit-house/",
    "locale": "zh",
    "url": "https://www.danang.intercontinental.com/zh/amenities/our-spirit-house/"
  },
  {
    "destination_id": "club-beach",
    "source": "https://www.danang.intercontinental.com/amenities/club-intercontinental/",
    "locale": "vi",
    "url": "https://www.danang.intercontinental.com/vn/amenities/club-intercontinental/"
  },
  {
    "destination_id": "club-beach",
    "source": "https://www.danang.intercontinental.com/amenities/club-intercontinental/",
    "locale": "ja",
    "url": "https://www.danang.intercontinental.com/ja/amenities/club-intercontinental/"
  },
  {
    "destination_id": "club-beach",
    "source": "https://www.danang.intercontinental.com/amenities/club-intercontinental/",
    "locale": "ko",
    "url": "https://www.danang.intercontinental.com/ko/amenities/club-intercontinental/"
  },
  {
    "destination_id": "club-beach",
    "source": "https://www.danang.intercontinental.com/amenities/club-intercontinental/",
    "locale": "ru",
    "url": "https://www.danang.intercontinental.com/ru/amenities/club-intercontinental/"
  },
  {
    "destination_id": "club-beach",
    "source": "https://www.danang.intercontinental.com/amenities/club-intercontinental/",
    "locale": "zh",
    "url": "https://www.danang.intercontinental.com/zh/amenities/club-intercontinental/"
  }
]$data$::jsonb) LOOP
  SELECT id INTO STRICT resolved_link_id FROM public.destination_links WHERE destination_id=p->>'destination_id'
    AND url=p->>'source' AND kind IN ('DISCOVER','WEBSITE') AND active;
  INSERT INTO public.destination_link_translations(link_id,locale,url,source_url,active)
    VALUES(resolved_link_id,p->>'locale',p->>'url',p->>'source',true)
    ON CONFLICT(link_id,locale) DO UPDATE SET url=EXCLUDED.url,source_url=EXCLUDED.source_url,active=true;
 END LOOP;
END $locales$;
COMMIT;
