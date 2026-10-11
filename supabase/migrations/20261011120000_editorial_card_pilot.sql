-- Additive, opt-in card presentation. Existing content and publication states are preserved.
BEGIN;

ALTER TABLE public.destinations
  ADD COLUMN detail_layout text NOT NULL DEFAULT 'classic' CHECK (detail_layout IN ('classic','editorial')),
  ADD COLUMN primary_link_id uuid,
  ADD COLUMN links_heading text CHECK (length(links_heading) <= 160),
  ADD COLUMN video_heading text CHECK (length(video_heading) <= 160),
  ADD COLUMN instagram_heading text CHECK (length(instagram_heading) <= 160),
  ADD COLUMN heading_translations jsonb NOT NULL DEFAULT '{}'::jsonb;

-- A featured link must belong to the same card. Removing a link clears only the selection.
ALTER TABLE public.destination_links ADD CONSTRAINT destination_links_owner_id_unique UNIQUE(destination_id,id);
ALTER TABLE public.destinations ADD CONSTRAINT destinations_primary_link_owner_fkey
  FOREIGN KEY (id, primary_link_id) REFERENCES public.destination_links(destination_id,id)
  ON DELETE SET NULL (primary_link_id);

CREATE FUNCTION public.valid_destination_headings(value jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT CASE WHEN jsonb_typeof(value) <> 'object' THEN false ELSE NOT EXISTS (
    SELECT 1 FROM jsonb_each(value) locale
    WHERE locale.key NOT IN ('vi','ru','zh','ko','ja')
      OR CASE WHEN jsonb_typeof(locale.value) <> 'object' THEN true ELSE EXISTS (
        SELECT 1 FROM jsonb_each(locale.value) heading
        WHERE heading.key NOT IN ('links','video','instagram')
          OR jsonb_typeof(heading.value) <> 'object'
          OR jsonb_typeof(heading.value->'source') IS DISTINCT FROM 'string'
          OR jsonb_typeof(heading.value->'value') IS DISTINCT FROM 'string'
          OR length(heading.value->>'source') > 160
          OR length(heading.value->>'value') NOT BETWEEN 1 AND 200
      ) END
  ) END;
$$;
ALTER TABLE public.destinations ADD CONSTRAINT destinations_heading_translations_valid
  CHECK (public.valid_destination_headings(heading_translations));

COMMENT ON COLUMN public.destinations.detail_layout IS 'classic preserves the current page; editorial enables the new shared template. Initial pilot: Citron, La Maison 1888, L_O_N_G Bar, Mi Sol Spa.';
COMMENT ON COLUMN public.destinations.primary_link_id IS 'Featured active destination_links row belonging to this card. NULL uses BOOK, then DISCOVER/WEBSITE, then the first published action. An unpublished selected link is not replaced by another CTA.';
COMMENT ON COLUMN public.destinations.heading_translations IS 'Published localized section headings: {"vi":{"links":{"source":"English heading","value":"Translation"}}}. A translation is used only while source matches its English heading.';

CREATE TABLE public.destination_relations (
  destination_id text NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  related_destination_id text NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (destination_id, related_destination_id),
  CONSTRAINT destination_relations_ordered_pair CHECK (destination_id < related_destination_id)
);
COMMENT ON TABLE public.destination_relations IS 'One symmetric relationship per pair, identifiers in alphabetical order. Titles, photographs and publication states are always read from destinations.';
CREATE INDEX destination_relations_reverse_idx ON public.destination_relations(related_destination_id);
ALTER TABLE public.destination_relations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.destination_relations FROM anon, authenticated;
GRANT SELECT ON public.destination_relations TO anon, authenticated;
GRANT ALL ON public.destination_relations TO service_role;
CREATE POLICY "Published related destinations are readable" ON public.destination_relations
  FOR SELECT TO anon, authenticated USING (
    active
    AND EXISTS (SELECT 1 FROM public.destinations d WHERE d.id=destination_id AND d.active)
    AND EXISTS (SELECT 1 FROM public.destinations d WHERE d.id=related_destination_id AND d.active)
  );

INSERT INTO public.destination_relations(destination_id,related_destination_id)
SELECT 'la-maison-1888','wine-cellar'
WHERE EXISTS(SELECT 1 FROM public.destinations WHERE id='la-maison-1888')
  AND EXISTS(SELECT 1 FROM public.destinations WHERE id='wine-cellar');

UPDATE public.destinations d SET detail_layout='editorial', primary_link_id=(
  SELECT l.id FROM public.destination_links l
  WHERE l.destination_id=d.id AND l.active AND l.kind<>'INSTAGRAM'
  ORDER BY CASE l.kind WHEN 'BOOK' THEN 0 WHEN 'DISCOVER' THEN 1 WHEN 'WEBSITE' THEN 1 ELSE 2 END,
    l.display_order,l.id LIMIT 1
)
WHERE d.id IN ('citron','la-maison-1888','long-bar','mi-sol-spa');

-- Personalized headings and their source-matched translations are seeded below.
UPDATE public.destinations d SET links_heading=s.links_heading, video_heading=s.video_heading,
  instagram_heading=s.instagram_heading, heading_translations=s.heading_translations
FROM jsonb_to_recordset($headings$
[
  {
    "id": "citron",
    "links_heading": "Flavours above the bay.",
    "video_heading": "A table above the bay.",
    "instagram_heading": "Moments at Citron.",
    "heading_translations": {
      "vi": {
        "links": {
          "source": "Flavours above the bay.",
          "value": "Hương vị trên vịnh biển."
        },
        "video": {
          "source": "A table above the bay.",
          "value": "Bàn tiệc trên vịnh biển."
        },
        "instagram": {
          "source": "Moments at Citron.",
          "value": "Khoảnh khắc tại Citron."
        }
      },
      "ru": {
        "links": {
          "source": "Flavours above the bay.",
          "value": "Вкусы над заливом."
        },
        "video": {
          "source": "A table above the bay.",
          "value": "Столик над заливом."
        },
        "instagram": {
          "source": "Moments at Citron.",
          "value": "Мгновения в Citron."
        }
      },
      "zh": {
        "links": {
          "source": "Flavours above the bay.",
          "value": "海湾之上的风味。"
        },
        "video": {
          "source": "A table above the bay.",
          "value": "海湾之上的一席。"
        },
        "instagram": {
          "source": "Moments at Citron.",
          "value": "Citron 的美好时刻。"
        }
      },
      "ko": {
        "links": {
          "source": "Flavours above the bay.",
          "value": "만 위에서 즐기는 풍미."
        },
        "video": {
          "source": "A table above the bay.",
          "value": "만을 내려다보는 식탁."
        },
        "instagram": {
          "source": "Moments at Citron.",
          "value": "Citron에서의 순간들."
        }
      },
      "ja": {
        "links": {
          "source": "Flavours above the bay.",
          "value": "湾を望む美食。"
        },
        "video": {
          "source": "A table above the bay.",
          "value": "湾を見渡すテーブル。"
        },
        "instagram": {
          "source": "Moments at Citron.",
          "value": "Citronでのひととき。"
        }
      }
    }
  },
  {
    "id": "la-maison-1888",
    "links_heading": "An evening to savour.",
    "video_heading": "The art of an evening.",
    "instagram_heading": "Moments worth sharing.",
    "heading_translations": {
      "vi": {
        "links": {
          "source": "An evening to savour.",
          "value": "Một buổi tối để tận hưởng."
        },
        "video": {
          "source": "The art of an evening.",
          "value": "Nghệ thuật của một buổi tối."
        },
        "instagram": {
          "source": "Moments worth sharing.",
          "value": "Những khoảnh khắc đáng sẻ chia."
        }
      },
      "ru": {
        "links": {
          "source": "An evening to savour.",
          "value": "Вечер, которым хочется насладиться."
        },
        "video": {
          "source": "The art of an evening.",
          "value": "Искусство прекрасного вечера."
        },
        "instagram": {
          "source": "Moments worth sharing.",
          "value": "Мгновения, которыми хочется делиться."
        }
      },
      "zh": {
        "links": {
          "source": "An evening to savour.",
          "value": "值得细品的夜晚。"
        },
        "video": {
          "source": "The art of an evening.",
          "value": "夜晚的艺术。"
        },
        "instagram": {
          "source": "Moments worth sharing.",
          "value": "值得分享的时刻。"
        }
      },
      "ko": {
        "links": {
          "source": "An evening to savour.",
          "value": "음미하고 싶은 저녁."
        },
        "video": {
          "source": "The art of an evening.",
          "value": "저녁의 예술."
        },
        "instagram": {
          "source": "Moments worth sharing.",
          "value": "함께 나누고 싶은 순간."
        }
      },
      "ja": {
        "links": {
          "source": "An evening to savour.",
          "value": "ゆっくり味わう夜。"
        },
        "video": {
          "source": "The art of an evening.",
          "value": "一夜を彩る美学。"
        },
        "instagram": {
          "source": "Moments worth sharing.",
          "value": "分かち合いたいひととき。"
        }
      }
    }
  },
  {
    "id": "long-bar",
    "links_heading": "Stay a little longer.",
    "video_heading": "Above the jungle.",
    "instagram_heading": "Life at L_O_N_G Bar.",
    "heading_translations": {
      "vi": {
        "links": {
          "source": "Stay a little longer.",
          "value": "Nán lại thêm chút nữa."
        },
        "video": {
          "source": "Above the jungle.",
          "value": "Trên những tán rừng."
        },
        "instagram": {
          "source": "Life at L_O_N_G Bar.",
          "value": "Nhịp sống tại L_O_N_G Bar."
        }
      },
      "ru": {
        "links": {
          "source": "Stay a little longer.",
          "value": "Останьтесь ещё ненадолго."
        },
        "video": {
          "source": "Above the jungle.",
          "value": "Над джунглями."
        },
        "instagram": {
          "source": "Life at L_O_N_G Bar.",
          "value": "Атмосфера L_O_N_G Bar."
        }
      },
      "zh": {
        "links": {
          "source": "Stay a little longer.",
          "value": "再多停留片刻。"
        },
        "video": {
          "source": "Above the jungle.",
          "value": "丛林之上。"
        },
        "instagram": {
          "source": "Life at L_O_N_G Bar.",
          "value": "L_O_N_G Bar 的闲适时光。"
        }
      },
      "ko": {
        "links": {
          "source": "Stay a little longer.",
          "value": "조금 더 머물러 보세요."
        },
        "video": {
          "source": "Above the jungle.",
          "value": "정글 위에서."
        },
        "instagram": {
          "source": "Life at L_O_N_G Bar.",
          "value": "L_O_N_G Bar에서의 시간."
        }
      },
      "ja": {
        "links": {
          "source": "Stay a little longer.",
          "value": "もう少し、ゆっくりと。"
        },
        "video": {
          "source": "Above the jungle.",
          "value": "ジャングルを見渡して。"
        },
        "instagram": {
          "source": "Life at L_O_N_G Bar.",
          "value": "L_O_N_G Barで過ごす時間。"
        }
      }
    }
  },
  {
    "id": "mi-sol-spa",
    "links_heading": "Find your moment of calm.",
    "video_heading": "The rhythm of renewal.",
    "instagram_heading": "A softer pace.",
    "heading_translations": {
      "vi": {
        "links": {
          "source": "Find your moment of calm.",
          "value": "Tìm khoảnh khắc bình yên của riêng bạn."
        },
        "video": {
          "source": "The rhythm of renewal.",
          "value": "Nhịp điệu của sự tái tạo."
        },
        "instagram": {
          "source": "A softer pace.",
          "value": "Một nhịp sống dịu dàng hơn."
        }
      },
      "ru": {
        "links": {
          "source": "Find your moment of calm.",
          "value": "Найдите своё мгновение покоя."
        },
        "video": {
          "source": "The rhythm of renewal.",
          "value": "Ритм обновления."
        },
        "instagram": {
          "source": "A softer pace.",
          "value": "В более мягком ритме."
        }
      },
      "zh": {
        "links": {
          "source": "Find your moment of calm.",
          "value": "寻觅属于你的宁静。"
        },
        "video": {
          "source": "The rhythm of renewal.",
          "value": "焕新的韵律。"
        },
        "instagram": {
          "source": "A softer pace.",
          "value": "放缓生活的节奏。"
        }
      },
      "ko": {
        "links": {
          "source": "Find your moment of calm.",
          "value": "나만의 평온한 순간을 찾아보세요."
        },
        "video": {
          "source": "The rhythm of renewal.",
          "value": "새로워지는 리듬."
        },
        "instagram": {
          "source": "A softer pace.",
          "value": "한결 여유로운 속도."
        }
      },
      "ja": {
        "links": {
          "source": "Find your moment of calm.",
          "value": "自分だけの安らぎを。"
        },
        "video": {
          "source": "The rhythm of renewal.",
          "value": "生まれ変わるリズム。"
        },
        "instagram": {
          "source": "A softer pace.",
          "value": "ゆるやかな時間。"
        }
      }
    }
  }
]
$headings$::jsonb) AS s(id text, links_heading text, video_heading text, instagram_heading text, heading_translations jsonb)
WHERE d.id=s.id;

COMMIT;
