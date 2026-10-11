import type { Destination } from "@/data/resort";
import type { Lang } from "@/i18n/dictionary";
import type { HubData } from "./hub-schema";
import { actionsFor } from "./destination-actions";

export function detailActions(destination: Destination, locale: Lang) {
  const actions = actionsFor(destination, undefined, locale);
  const primary = destination.primaryLinkId
    ? actions.find((link) => link.id === destination.primaryLinkId)
    : (actions.find((link) => link.kind === "BOOK") ??
      actions.find((link) => link.kind === "DISCOVER" || link.kind === "WEBSITE") ??
      actions[0]);
  return { primary, secondary: actions.filter((link) => link !== primary) };
}

export function detailHeading(
  destination: Destination,
  section: "links" | "video" | "instagram",
  locale: Lang,
) {
  const source = destination.headings?.[section]?.trim();
  if (!source) return undefined;
  const translated = destination.headingTranslations?.[locale]?.[section];
  return locale !== "en" && translated?.source === source && translated.value.trim()
    ? translated.value
    : source;
}

/** One canonical pair powers both directions, without copying destination content. */
export function relatedDestinations(
  id: string,
  catalogue: Destination[],
  relations: NonNullable<HubData["relations"]>,
) {
  const ids = [...relations]
    .sort((a, b) => a.display_order - b.display_order)
    .flatMap((row) => {
      if (row.destination_id === id) return [row.related_destination_id];
      if (row.related_destination_id === id) return [row.destination_id];
      return [];
    });
  return [...new Set(ids)].flatMap((related) => {
    const destination = catalogue.find(
      (item) => item.id === related && item.active && item.id !== id,
    );
    return destination ? [destination] : [];
  });
}

export function nextDestination(id: string, catalogue: Destination[], sequence?: string[]) {
  const active = catalogue.filter((item) => item.active);
  const levels = ["heaven", "sky", "earth", "sea"];
  const ordered = [...active].sort(
    (a, b) =>
      levels.indexOf(a.level) - levels.indexOf(b.level) ||
      a.display_order - b.display_order ||
      a.id.localeCompare(b.id),
  );
  const contextual = [...new Set(sequence ?? [])].flatMap((key) => {
    const item = active.find((dest) => dest.id === key);
    return item ? [item] : [];
  });
  const items = contextual.some((dest) => dest.id === id) ? contextual : ordered;
  if (items.length < 2) return undefined;
  const index = items.findIndex((dest) => dest.id === id);
  return index < 0 ? undefined : items[(index + 1) % items.length];
}
