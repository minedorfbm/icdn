import { CTA_BY_TYPE, bookingLink, type Destination } from "@/data/resort";

/** Resolves a link kind from the database list, falling back to the legacy columns. */
export function linkUrl(dest: Destination, kind: string): string | undefined {
  if (dest.links !== undefined) return dest.links.find((l) => l.kind === kind)?.url;
  const legacy: Record<string, string | undefined> = {
    DISCOVER: dest.discover_url,
    MENU: dest.menu_url,
    BROCHURE: dest.menu_url,
    TREATMENTS: dest.menu_url,
    ACTIVITIES: dest.menu_url,
    PRICE_LIST: dest.price_list_url,
    VEGETARIAN_MENU: dest.vegetarian_menu_url,
    VEGAN_MENU: dest.vegan_menu_url,
    BREAKFAST_MENU: dest.breakfast_menu_url,
    LUNCH_MENU: dest.lunch_menu_url,
    DINNER_MENU: dest.dinner_menu_url,
    BOOK: dest.booking_url,
    INSTAGRAM: dest.instagram_url,
  };
  return legacy[kind];
}

export function instagramUrl(dest: Destination) {
  return linkUrl(dest, "INSTAGRAM");
}

export function actionHref(action: string, dest: Destination) {
  const direct = linkUrl(dest, action);
  if (direct) return direct;
  switch (action) {
    case "MENU":
    case "TREATMENTS":
    case "ACTIVITIES":
    case "BROCHURE":
      return linkUrl(dest, "MENU") ?? linkUrl(dest, "DISCOVER");
    case "PRICE_LIST":
    case "VEGETARIAN_MENU":
    case "VEGAN_MENU":
    case "BREAKFAST_MENU":
    case "LUNCH_MENU":
    case "DINNER_MENU":
      return linkUrl(dest, "MENU") ?? linkUrl(dest, "DISCOVER");
    case "BOOK":
      return dest.links === undefined && dest.booking_message ? bookingLink(dest) : undefined;
    default:
      return linkUrl(dest, "DISCOVER");
  }
}

function appendConfiguredActions(list: string[], kinds: string[], dest: Destination) {
  return [...list, ...kinds.filter((kind) => !list.includes(kind) && Boolean(linkUrl(dest, kind)))];
}

/** Compatibility actions for destinations without a database link collection. */
function legacyActions(dest: Destination) {
  const has = (kind: string) => Boolean(linkUrl(dest, kind));
  let list = CTA_BY_TYPE[dest.type];
  if (has("MENU") && !list.includes("MENU")) {
    list = list.map((a) => (a === "DETAILS" ? "BROCHURE" : a));
    if (!list.includes("BROCHURE")) list = [...list, "BROCHURE"];
  }
  list = appendConfiguredActions(list, ["BOOK"], dest);
  // Meal-specific menus replace the generic MENU action
  const menus = ["BREAKFAST_MENU", "LUNCH_MENU", "DINNER_MENU"].filter(has);
  if (menus.length > 0) {
    list = list.includes("MENU")
      ? list.flatMap((a) => (a === "MENU" ? menus : [a]))
      : [...list, ...menus];
  }
  return appendConfiguredActions(list, ["PRICE_LIST", "VEGETARIAN_MENU", "VEGAN_MENU"], dest);
}

export interface DestinationAction {
  kind: string;
  url: string;
  label?: string;
}

/** Database links are authoritative, including an intentionally empty list. */
export function actionsFor(dest: Destination, limit?: number): DestinationAction[] {
  const actions =
    dest.links !== undefined
      ? dest.links.filter((link) => link.kind !== "INSTAGRAM" && Boolean(link.url))
      : legacyActions(dest).flatMap((kind) => {
          const url = actionHref(kind, dest);
          return url ? [{ kind, url }] : [];
        });
  if (!limit || actions.length <= limit) return actions;
  // Keep the configured booking action within reach on the card; preserve the
  // database order among the selected links. The detail view shows every link.
  const book = actions.find((link) => link.kind === "BOOK");
  if (!book || actions.indexOf(book) < limit) return actions.slice(0, limit);
  const selected = new Set([...actions.slice(0, limit - 1), book]);
  return actions.filter((link) => selected.has(link));
}
