import type { Lang } from "@/i18n/dictionary";
import { localizedLinkUrl } from "./localized-links";
import { type Destination } from "@/data/resort";

const ALLOWED_LINK_PROTOCOLS = new Set(["https:", "mailto:", "tel:"]);

export function safeExternalUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return ALLOWED_LINK_PROTOCOLS.has(new URL(value).protocol) ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Only current, published database links can produce actions. */
export function instagramUrl(dest: Destination) {
  return safeExternalUrl(dest.links?.find((link) => link.kind === "INSTAGRAM")?.url);
}

export interface DestinationAction {
  kind: string;
  url: string;
  label?: string;
}

/** Database links are authoritative, including an intentionally empty list. */
export function actionsFor(
  dest: Destination,
  limit?: number,
  locale: Lang = "en",
): DestinationAction[] {
  const actions = (dest.links ?? []).flatMap((link) => {
    const url = safeExternalUrl(localizedLinkUrl(link.kind, link.url, link.translations, locale));
    return link.kind !== "INSTAGRAM" && url ? [{ ...link, url }] : [];
  });
  if (!limit || actions.length <= limit) return actions;
  // Keep the configured booking action within reach on the card; preserve the
  // database order among the selected links. The detail view shows every link.
  const book = actions.find((link) => link.kind === "BOOK");
  if (!book || actions.indexOf(book) < limit) return actions.slice(0, limit);
  const selected = new Set([...actions.slice(0, limit - 1), book]);
  return actions.filter((link) => selected.has(link));
}
