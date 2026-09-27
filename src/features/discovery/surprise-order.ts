import type { Destination } from "@/data/resort";

export interface SavedDiscovery {
  order: string[];
  currentId?: string | undefined;
}

export function shuffledIds(destinations: Destination[], random = Math.random): string[] {
  const ids = [...new Set(destinations.filter((d) => d.active).map((d) => d.id))];
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  }
  return ids;
}

export function readDiscovery(raw: string | null): SavedDiscovery | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || !("order" in value) || !Array.isArray(value.order))
      return null;
    if (!value.order.every((id): id is string => typeof id === "string")) return null;
    return {
      order: [...new Set(value.order)],
      currentId:
        "currentId" in value && typeof value.currentId === "string" ? value.currentId : undefined,
    };
  } catch {
    return null;
  }
}

/** Keep the visit's sequence, discard unpublished cards and append newly available ones. */
export function restoreDiscovery(
  saved: SavedDiscovery | null,
  destinations: Destination[],
  random = Math.random,
) {
  const published = shuffledIds(destinations, random);
  const available = new Set(published);
  const retained = [...new Set(saved?.order ?? [])].filter((id) => available.has(id));
  const known = new Set(retained);
  const order = [...retained, ...published.filter((id) => !known.has(id))];
  return { order, index: Math.max(0, order.indexOf(saved?.currentId ?? "")) };
}
