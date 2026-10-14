-- Current documents verified against the resort's published pages, 13 October 2026.
-- Preserve historical rows as inactive; do not delete menus or alter other actions.
BEGIN;
DO $menus$
DECLARE p jsonb; actual record;
BEGIN
 FOR p IN SELECT value FROM jsonb_array_elements($changes$[
  {
    "id": "4eb013b2-fd51-40f6-af8f-43f5d4a7ebf6",
    "destination_id": "weddings",
    "old": {
      "url": "https://www.danang.intercontinental.com/wp-content/uploads/2026/06/InterContinental-Danang-Wedding-Brochure.pdf",
      "kind": "MENU",
      "label": null,
      "active": true
    },
    "new": {
      "url": "https://www.danang.intercontinental.com/wp-content/uploads/2026/10/InterContinental-Danang_Wedding-Brochure.pdf",
      "kind": "BROCHURE",
      "label": null,
      "active": true
    },
    "official_source": "https://www.danang.intercontinental.com/weddings/",
    "reason": "Remplacer la brochure de juin par celle liée en octobre. Corriger aussi le type MENU en BROCHURE et son libellé pour ne pas présenter une brochure de mariage comme un menu."
  },
  {
    "id": "5765f05c-db4b-4608-9d37-686811542f08",
    "destination_id": "la-maison-1888",
    "old": {
      "url": "https://www.danang.intercontinental.com/wp-content/uploads/2026/07/La-Maison-1888-Michelin-Dinner-Menu-Q3.26.pdf",
      "kind": "MENU",
      "label": null,
      "active": true
    },
    "new": {
      "url": "https://www.danang.intercontinental.com/wp-content/uploads/2026/09/Limited-Edition-Gourmand-Menu.pdf",
      "kind": "MENU",
      "label": "Gourmand Menu",
      "active": true
    },
    "official_source": "https://www.danang.intercontinental.com/dining/la-maison-1888/",
    "reason": "Remplacer le menu Q3 par le menu Gourmand Limited Edition, actuellement seul menu publié sur la page de La Maison. Prévoir un libellé Gourmand Menu et ses traductions."
  },
  {
    "id": "b9229bb0-18bb-46b1-8bf1-94eda6d3e50b",
    "destination_id": "la-maison-1888",
    "old": {
      "url": "https://www.danang.intercontinental.com/wp-content/uploads/2025/05/La-Maison-1888-Michelin-Vegetarian-Dinner-Menu-Q3.26.pdf",
      "kind": "VEGETARIAN_MENU",
      "label": null,
      "active": true
    },
    "new": {
      "url": "https://www.danang.intercontinental.com/wp-content/uploads/2025/05/La-Maison-1888-Michelin-Vegetarian-Dinner-Menu-Q3.26.pdf",
      "kind": "VEGETARIAN_MENU",
      "label": null,
      "active": false
    },
    "official_source": "https://www.danang.intercontinental.com/dining/la-maison-1888/",
    "reason": "Masquer ce lien historique dans le hub en attendant confirmation du resort. Le PDF reste accessible mais ce menu ne figure plus dans la sélection actuelle ; cela ne prouve pas que toute adaptation végétarienne/végane est impossible."
  },
  {
    "id": "9c207809-d476-4f54-9bc6-afc824ee4637",
    "destination_id": "la-maison-1888",
    "old": {
      "url": "https://www.danang.intercontinental.com/wp-content/uploads/2025/05/La-Maison-1888-Michelin-Vegan-Dinner-Menu-Q3.26.pdf",
      "kind": "VEGAN_MENU",
      "label": null,
      "active": true
    },
    "new": {
      "url": "https://www.danang.intercontinental.com/wp-content/uploads/2025/05/La-Maison-1888-Michelin-Vegan-Dinner-Menu-Q3.26.pdf",
      "kind": "VEGAN_MENU",
      "label": null,
      "active": false
    },
    "official_source": "https://www.danang.intercontinental.com/dining/la-maison-1888/",
    "reason": "Masquer ce lien historique dans le hub en attendant confirmation du resort. Le PDF reste accessible mais ce menu ne figure plus dans la sélection actuelle ; cela ne prouve pas que toute adaptation végétarienne/végane est impossible."
  },
  {
    "id": "c352fc2d-b691-4239-9c93-640a8180b4c7",
    "destination_id": "tingara",
    "old": {
      "url": "https://www.danang.intercontinental.com/dining/heavenly-afternoon-tea/",
      "kind": "MENU",
      "label": null,
      "active": true
    },
    "new": {
      "url": "https://www.danang.intercontinental.com/dining/heavenly-afternoon-tea/",
      "kind": "MENU",
      "label": null,
      "active": false
    },
    "official_source": "https://www.danang.intercontinental.com/dining/tingara/",
    "reason": "Retirer ce lien de Tingara : il mène à Heavenly Afternoon Tea chez Citron. Le rattacher au contexte Afternoon Tea de Citron si souhaité, sans créer de second menu Dinner identique."
  },
  {
    "id": "dad645f4-de6c-437d-91aa-1c0a2c6bb3aa",
    "destination_id": "tingara",
    "old": {
      "url": "https://www.danang.intercontinental.com/wp-content/uploads/2026/08/Lunch-Summer-Menu.pdf",
      "kind": "LUNCH_MENU",
      "label": null,
      "active": true
    },
    "new": {
      "url": "https://www.danang.intercontinental.com/wp-content/uploads/2026/08/Lunch-Summer-Menu.pdf",
      "kind": "LUNCH_MENU",
      "label": null,
      "active": false
    },
    "official_source": "https://www.danang.intercontinental.com/dining/tingara/",
    "reason": "Masquer le menu Lunch historique en attendant confirmation : la page actuelle ne publie que Dinner Menu et annonce uniquement le dîner du mardi au dimanche."
  }
]$changes$::jsonb) LOOP
   SELECT id, destination_id, url, kind::text AS kind, label, active INTO actual
   FROM public.destination_links WHERE id=(p->>'id')::uuid FOR UPDATE;
   IF NOT FOUND THEN
     SELECT l.id,l.destination_id,l.url,l.kind::text AS kind,l.label,l.active INTO STRICT actual
     FROM public.destination_links l
     WHERE l.destination_id=p->>'destination_id'
       AND jsonb_build_object('url',l.url,'kind',l.kind,'label',l.label,'active',l.active) IN (p->'old',p->'new')
     FOR UPDATE;
   END IF;
   IF NOT FOUND OR actual.destination_id IS DISTINCT FROM p->>'destination_id' THEN
     RAISE EXCEPTION 'Menu link owner changed: %',p->>'id';
   END IF;
   IF jsonb_build_object('url',actual.url,'kind',actual.kind,'label',actual.label,'active',actual.active) NOT IN (p->'old',p->'new') THEN
     RAISE EXCEPTION 'Menu link edited since audit: %',p->>'id';
   END IF;
   IF jsonb_build_object('url',actual.url,'kind',actual.kind,'label',actual.label,'active',actual.active) IS DISTINCT FROM p->'new' THEN
     UPDATE public.destination_links
     SET url=p->'new'->>'url', kind=(p->'new'->>'kind')::public.destination_link_type,
       label=p->'new'->>'label', active=(p->'new'->>'active')::boolean
     WHERE id=actual.id;
   END IF;
 END LOOP;
END;
$menus$;
COMMIT;
