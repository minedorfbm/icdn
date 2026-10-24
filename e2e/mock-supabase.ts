import { serve } from "bun";
import benefitsSeed from "../docs/accommodation-benefits.json";
import { editorialTables } from "./editorial-fixtures";

// A deterministic read-only API: browser tests never need production credentials.
const levels = ["heaven", "sky", "earth", "sea"].map((id, display_order) => ({
  id,
  title: id.toUpperCase(),
  line: "Explore the resort",
  image_key: "/intercontinental-touch-icon.png",
  clusters: ["DINING", "WELLNESS", "EXPERIENCES"],
  display_order,
}));
const destinations = ["citron", "tingara"].map((id, display_order) => ({
  id,
  name: id === "citron" ? "Citron" : "TINGARA",
  level_id: "heaven",
  cluster: "DINING",
  type: "restaurant",
  short_description: "A restaurant overlooking the sea.",
  search_keywords:
    id === "tingara"
      ? ["japanese", "dining", "romantic", "rain"]
      : ["vietnamese", "dining", "romantic"],
  image_key: "/intercontinental-touch-icon.png",
  detail_image_key: "/intercontinental-touch-icon.png",
  content_kind: "place",
  content_family: "resort",
  audience_tags: ["all"],
  instagram_spot: false,
  display_order,
  active: true,
}));
destinations.push(
  {
    ...destinations[0]!,
    id: "design-digital-tour",
    name: "Bill Bensley Digital Design Tour",
    cluster: "EXPERIENCES",
    type: "experience",
    content_kind: "place",
    content_family: "storytelling",
    display_order: 4,
  },
  {
    ...destinations[0]!,
    id: "enchanted-holiday",
    name: "Enchanted Holiday Escape",
    cluster: "EXPERIENCES",
    type: "experience",
    content_kind: "offer",
    content_family: "offer",
    search_keywords: ["family", "activity"],
    display_order: 2,
  },
  {
    ...destinations[0]!,
    id: "nature-experiences",
    name: "Nature Discovery",
    cluster: "EXPERIENCES",
    type: "experience",
    content_kind: "offer",
    content_family: "storytelling",
    search_keywords: ["nature", "activity"],
    display_order: 3,
  },
);
const tables: Record<string, unknown[]> = {
  levels,
  destinations,
  map_places: [
    {
      id: "lobby",
      name: "Reception Lobby",
      level_id: "heaven",
      pin: 4,
      x: 730,
      y: 610,
      zoom: 2,
      active: true,
    },
    {
      id: "nam-tram",
      name: "Nam Tram",
      level_id: "heaven",
      pin: 6,
      x: 740,
      y: 560,
      zoom: 2,
      active: true,
    },
    {
      id: "heritage-village",
      name: "Heritage Village",
      level_id: "sky",
      pin: 11,
      x: 700,
      y: 480,
      zoom: 2,
      active: true,
    },
    {
      id: "mi-sol-lagoon",
      name: "Mi Sol Lagoon",
      level_id: "sea",
      pin: 22,
      x: 1000,
      y: 400,
      zoom: 2,
      active: true,
    },
    {
      id: "la-maison-1888",
      name: "La Maison 1888",
      level_id: "earth",
      pin: 12,
      x: 700,
      y: 440,
      zoom: 2,
      active: true,
    },
    {
      id: "citron",
      name: "Citron",
      level_id: "heaven",
      pin: 8,
      x: 600,
      y: 420,
      zoom: 2,
      active: true,
    },
  ],
  map_destination_links: [
    {
      place_id: "la-maison-1888",
      destination_id: "la-maison-1888",
      display_order: 0,
      is_primary: true,
      active: true,
    },
    {
      place_id: "citron",
      destination_id: "citron",
      display_order: 0,
      is_primary: true,
      active: true,
    },
  ],
  destination_links: [
    {
      id: "test-rewards",
      destination_id: "citron",
      kind: "DISCOVER",
      label: "IHG One Rewards",
      url: "https://www.ihg.com/onerewards/content/us/en/home",
      display_order: 1,
      active: true,
    },
    {
      id: "test-menu",
      destination_id: "citron",
      kind: "MENU",
      label: "Test menu",
      url: "https://www.danang.intercontinental.com/wp-content/uploads/test-menu.pdf",
      display_order: 0,
    },
  ],
  destination_translations: [
    {
      destination_id: "citron",
      locale: "ja",
      description: "海を望むレストラン。",
      source_description: destinations[0]!.short_description,
    },
  ],
  published_destination_notices: ["current", "changed-title", "changed-body", "untranslated"].map(
    (id, display_order) => ({
      id,
      destination_id: "nature-experiences",
      kind: "information",
      title: `Update ${id}`,
      body: `Current information ${id}`,
      starts_at: "2020-01-01T00:00:00Z",
      ends_at: null,
      display_order,
      translations:
        id === "untranslated"
          ? []
          : [
              {
                locale: "ja",
                title: `お知らせ ${id}`,
                body: `最新情報 ${id}`,
                source_title: id === "changed-title" ? "Old title" : `Update ${id}`,
                source_body: id === "changed-body" ? "Old body" : `Current information ${id}`,
              },
            ],
    }),
  ),
  destination_opening_hours: [
    {
      id: "citron-breakfast",
      destination_id: "citron",
      service: "breakfast",
      days: [1, 2, 3, 4, 5, 6, 7],
      opens_minutes: 390,
      closes_minutes: 630,
      last_order_minutes: null,
      display_order: 0,
    },
    {
      id: "tingara-dinner",
      destination_id: "tingara",
      service: "dinner",
      days: [2, 3, 4, 5, 6, 7],
      opens_minutes: 1050,
      closes_minutes: 1320,
      last_order_minutes: 1305,
      display_order: 0,
    },
  ],
  destination_posts: [
    ...["DGwwT3cCPE5", "DL9jFzytrOp", "DMPkp9hM_nP"].map((post, display_order) => ({
      destination_id: "enchanted-holiday",
      post_url: `https://www.instagram.com/p/${post}/`,
      embed_mode: "link",
      account: "intercontinentaldanang",
      caption: null,
      image_url: null,
      posted_at: null,
      display_order,
    })),
    ...["WINDOW0", "WINDOW1", "WINDOW2", "DIRECT3", "WINDOW4"].map((post, display_order) => ({
      destination_id: "tingara",
      post_url: `https://www.instagram.com/p/${post}/`,
      embed_mode: post === "DIRECT3" ? "link" : "embed",
      account: "intercontinentaldanang",
      caption: null,
      image_url: null,
      posted_at: null,
      display_order,
    })),
    ...["SHORT", "TALL"].map((post, display_order) => ({
      destination_id: "nature-experiences",
      post_url: `https://www.instagram.com/p/${post}/`,
      account: "intercontinentaldanang",
      caption: null,
      image_url: null,
      posted_at: null,
      display_order,
    })),
    {
      destination_id: "citron",
      post_url: "https://www.instagram.com/p/TESTPOST/",
      account: "intercontinentaldanang",
      caption: null,
      image_url: null,
      posted_at: null,
      display_order: 0,
    },
  ],
  destination_videos: [
    ...["citron", "tingara"].map((destination_id) => ({
      destination_id,
      video_url: "https://www.youtube.com/watch?v=PVN005yvGpY",
      title: "Test video",
      title_translations: {},
      display_order: 0,
    })),
    ...["-ujKdRnRmOs", "u2N6FLjmAJs", "Ie7tYHeQ1AY"].map((id, index) => ({
      destination_id: "citron",
      video_url: `https://www.youtube.com/watch?v=${id}`,
      title: `Carousel video ${index + 2}`,
      title_translations: {},
      display_order: index + 1,
    })),
  ],
  site_settings: [
    { key: "hero_image", value: "/intercontinental-touch-icon.png" },
    { key: "hero_image_landscape", value: "/intercontinental-favicon.png" },
    { key: "contact", value: "tel:+842363938888" },
    { key: "whatsapp", value: "https://wa.me/842363938888" },
    { key: "zalo", value: "https://zalo.me/842363938888" },
  ],
};
for (const [table, rows] of Object.entries(editorialTables)) {
  tables[table] = [...(tables[table] ?? []), ...rows];
}
// The bar and pool share a map venue, but their Instagram letters select distinct cards.
tables["map_places"]!.push({
  id: "long-bar",
  name: "L_O_N_G Bar & Pool",
  level_id: "earth",
  pin: 17,
  x: 882.6,
  y: 303.8,
  zoom: 2,
  active: true,
});
for (const [display_order, destination_id] of ["long-bar", "long-pool"].entries()) {
  tables["map_destination_links"]!.push({
    place_id: "long-bar",
    destination_id,
    display_order,
    is_primary: true,
    active: true,
  });
}
for (const [index, id] of ["rooms", "club-panoramic-room-oceanview"].entries()) {
  tables["destinations"]!.push({
    ...destinations[0],
    id,
    name: index === 0 ? "Resort Classic Room Oceanview" : "Club Panoramic Room Oceanview",
    type: "accommodation",
    cluster: "EXPERIENCES",
    display_order: 90 + index,
    search_keywords: ["room", "accommodation"],
  });
  tables["map_destination_links"]!.push({
    place_id: "hillside-rooms",
    destination_id: id,
    display_order: index,
    is_primary: true,
    active: true,
  });
}
tables["map_places"]!.push({
  id: "hillside-rooms",
  name: "Rooms & Suites",
  level_id: "heaven",
  pin: 101,
  x: 438,
  y: 320,
  zoom: 1.65,
  active: true,
  accommodation_group: "rooms",
  covered_levels: ["heaven", "sky", "earth"],
  room_numbers: "501-567 / 301-393 / 219-245",
});
const standardBenefits = benefitsSeed.groups.find((group) => group.id === "standard")!;
tables["accommodation_benefits"] = [{ id: "standard", items: standardBenefits.items }];
tables["accommodation_benefit_translations"] = Object.entries(standardBenefits.translations).map(
  ([locale, items]) => ({
    benefits_id: "standard",
    locale,
    items,
    source_items: standardBenefits.items,
  }),
);
tables["destination_links"]!.push(
  {
    id: "rooms-discover",
    label: null,
    destination_id: "rooms",
    kind: "DISCOVER",
    url: "https://www.danang.intercontinental.com/room-suites/resort-classic-room-oceanview/",
    display_order: 0,
  },
  {
    id: "rooms-floor",
    destination_id: "rooms",
    kind: "BROCHURE",
    label: "Floor plan",
    url: benefitsSeed.accommodations[0]!.floor_plan,
    display_order: 20,
  },
  {
    id: "rooms-benefits",
    destination_id: "rooms",
    kind: "INFO",
    label: "Benefits",
    benefits_id: "standard",
    url: benefitsSeed.accommodations[0]!.source_url,
    display_order: 21,
  },
);
let delay = 0;
const reads: string[] = [];
serve({
  hostname: "127.0.0.1",
  port: 54329,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/control") {
      if (request.method === "POST") {
        const config = await request.json();
        delay = config.delay ?? 0;
      }
      return Response.json({ reads });
    }
    reads.push(url.pathname + url.search);

    if (url.pathname === "/rest/v1/rpc/published_hub_destination_card_v1") {
      const id = url.searchParams.get("requested_destination_id");
      const destination = tables.destinations?.find(
        (row) =>
          (row as { id: string; active: boolean }).id === id && (row as { active: boolean }).active,
      );
      if (!destination) return Response.json(null);
      const belongs = (table: string) =>
        (tables[table] ?? []).filter(
          (row) => (row as { destination_id: string }).destination_id === id,
        );
      const links = belongs("destination_links");
      const events = belongs("published_destination_events");
      const mapLinks = belongs("map_destination_links");
      return Response.json({
        destination,
        links,
        events,
        mapLinks,
        mapPlaces: (tables.map_places ?? []).filter((row) =>
          mapLinks.some(
            (link) => (link as { place_id: string }).place_id === (row as { id: string }).id,
          ),
        ),
        linkTranslations: (tables.destination_link_translations ?? []).filter((row) =>
          links.some(
            (link) => (link as { id: string }).id === (row as { link_id: string }).link_id,
          ),
        ),
        editorial: {
          descriptions: belongs("destination_translations"),
          events: (tables.event_translations ?? []).filter((row) =>
            events.some(
              (event) => (event as { id: string }).id === (row as { event_id: string }).event_id,
            ),
          ),
        },
      });
    }

    if (url.pathname === "/rest/v1/rpc/published_hub_destination_media_v1") {
      if (delay) await Bun.sleep(delay);
      const id = url.searchParams.get("requested_destination_id");
      const published = tables.destinations?.some((row) => {
        const destination = row as { id: string; active: boolean };
        return destination.id === id && destination.active;
      });
      const definitions = {
        photos: "destination_photos",
        posts: "destination_posts",
        videos: "destination_videos",
        hours: "destination_opening_hours",
        notices: "published_destination_notices",
        collection: "destination_collection_items",
      };
      return Response.json(
        Object.fromEntries(
          Object.entries(definitions).map(([key, table]) => [
            key,
            published
              ? (tables[table] ?? []).filter(
                  (row) => (row as { destination_id: string }).destination_id === id,
                )
              : [],
          ]),
        ),
      );
    }

    if (url.pathname === "/rest/v1/rpc/published_hub_catalogue_v1") {
      if (delay) await Bun.sleep(delay);
      return Response.json({
        levels: tables.levels,
        destinations: tables.destinations,
        links: tables.destination_links,
        events: tables.published_destination_events,
        mapPlaces: tables.map_places,
        mapLinks: tables.map_destination_links,
        linkTranslations: tables.destination_link_translations ?? [],
        siteLinkTranslations: tables.site_link_translations ?? [],
        relations: tables.destination_relations ?? [],
        editorial: {
          descriptions: tables.destination_translations ?? [],
          events: tables.event_translations ?? [],
        },
        settings: {},
      });
    }

    const table = new URL(request.url).pathname.split("/").at(-1)!;
    if (table === "destinations" && delay) await Bun.sleep(delay);
    let rows = tables[table] ?? [];
    for (const column of ["destination_id", "id", "benefits_id"]) {
      const filter = url.searchParams.get(column);
      if (filter?.startsWith("eq."))
        rows = rows.filter((row) => (row as Record<string, unknown>)[column] === filter.slice(3));
    }
    return Response.json(rows, {
      headers: { "content-range": `0-${Math.max(0, rows.length - 1)}/${rows.length}` },
    });
  },
});
