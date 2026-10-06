import { serve } from "bun";

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
  image_key: "/intercontinental-touch-icon.png",
  detail_image_key: "/intercontinental-touch-icon.png",
  content_kind: "place",
  content_family: "resort",
  audience_tags: ["all"],
  instagram_spot: false,
  display_order,
  active: true,
}));
destinations.push({
  ...destinations[0]!,
  id: "enchanted-holiday",
  name: "Enchanted Holiday Escape",
  cluster: "EXPERIENCES",
  type: "experience",
  content_kind: "offer",
  content_family: "offer",
  display_order: 2,
});
destinations.push({
  ...destinations[0]!,
  id: "nature-experiences",
  name: "Nature Discovery",
  cluster: "EXPERIENCES",
  type: "experience",
  content_kind: "offer",
  content_family: "storytelling",
  display_order: 3,
});
const tables: Record<string, unknown[]> = {
  levels,
  destinations,
  map_places: [
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
      place_id: "citron",
      destination_id: "citron",
      display_order: 0,
      is_primary: true,
      active: true,
    },
  ],
  destination_links: [
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
  destination_videos: [
    {
      destination_id: "citron",
      video_url: "https://www.youtube.com/watch?v=PVN005yvGpY",
      title: "Test video",
      title_translations: {},
      display_order: 0,
    },
  ],
  site_settings: [
    { key: "hero_image", value: "/intercontinental-touch-icon.png" },
    { key: "contact", value: "tel:+842363938888" },
    { key: "whatsapp", value: "https://wa.me/842363938888" },
    { key: "zalo", value: "https://zalo.me/842363938888" },
  ],
};
let delay = 0;
let failCatalogue = false;
let failMediaOnce = false;
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
        failCatalogue = config.failCatalogue ?? false;
        failMediaOnce = config.failMediaOnce ?? false;
      }
      return Response.json({ reads });
    }
    reads.push(url.pathname + url.search);

    const table = new URL(request.url).pathname.split("/").at(-1)!;
    if (table === "destinations" && delay) await Bun.sleep(delay);
    if (table === "destinations" && failCatalogue)
      return Response.json({ message: "test offline" }, { status: 503 });
    if (table === "destination_videos" && failMediaOnce) {
      failMediaOnce = false;
      return Response.json({ message: "test media offline" }, { status: 503 });
    }
    let rows = tables[table] ?? [];
    for (const column of ["destination_id", "id"]) {
      const filter = url.searchParams.get(column);
      if (filter?.startsWith("eq."))
        rows = rows.filter((row) => (row as Record<string, unknown>)[column] === filter.slice(3));
    }
    return Response.json(rows, {
      headers: { "content-range": `0-${Math.max(0, rows.length - 1)}/${rows.length}` },
    });
  },
});
