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
  instagram_spot: false,
  display_order,
  active: true,
}));
const tables: Record<string, unknown[]> = {
  levels,
  destinations,
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
  site_settings: [{ key: "hero_image", value: "/intercontinental-touch-icon.png" }],
};
serve({
  hostname: "127.0.0.1",
  port: 54329,
  fetch(request) {
    const table = new URL(request.url).pathname.split("/").at(-1)!;
    const rows = tables[table] ?? [];
    return Response.json(rows, {
      headers: { "content-range": `0-${Math.max(0, rows.length - 1)}/${rows.length}` },
    });
  },
});
