import {
  getHubData,
  getHubSettings,
  getDestinationMedia,
  getDestinationCard,
} from "./hub.functions";
import { focusDestinationCard } from "./destination-card";
import { completeCatalogue } from "./hub-data-completeness";
import { createRequestCache } from "./request-cache";
import { takeCatalogueRequest } from "./catalogue-bootstrap";
import type { HubData } from "./hub-schema";

const cards = createRequestCache<Awaited<ReturnType<typeof getDestinationCard>>>(
  (data) => data !== null,
);

const catalogue = createRequestCache<HubData>(completeCatalogue);
const settings = createRequestCache<Awaited<ReturnType<typeof getHubSettings>>>(
  (data) => data !== null,
);
const media = createRequestCache<Awaited<ReturnType<typeof getDestinationMedia>>>((data) =>
  Object.values(data).every((rows) => rows !== null),
);

// Only browser reads are retained. SSR always uses the existing public server cache,
// never a module-global snapshot shared across requests or Worker environments.
export function loadHubData({ background = false }: { background?: boolean } = {}) {
  const early = takeCatalogueRequest(getHubData.url);
  const read = async (): Promise<HubData> => {
    const response =
      typeof window === "undefined"
        ? await getHubData()
        : await (early?.response ??
            fetch(getHubData.url, { priority: background ? "low" : "auto" }));
    if (!response.ok) throw new Error("Catalogue temporarily unavailable");
    // getHubData validates every collection on the server before writing this
    // same-origin JSON response. No dates, classes or references need hydration.
    const data: HubData = await response.json();
    if (!completeCatalogue(data)) throw new Error("Catalogue temporarily unavailable");
    return data;
  };
  return typeof window === "undefined"
    ? read()
    : catalogue.read("catalogue", read, false, early?.started);
}

export function loadHubSettings() {
  return typeof window === "undefined"
    ? getHubSettings()
    : settings.read("settings", () => getHubSettings());
}

export function loadDestinationMedia(id: string, refresh = false) {
  const load = () => getDestinationMedia({ data: id });
  return typeof window === "undefined" ? load() : media.read(id, load, refresh);
}

export function peekDestinationMedia(id: string) {
  return typeof window === "undefined" ? undefined : media.peek(id);
}

/** Hydration can reuse the public snapshots already present in the SSR document. */
export function primeHubSnapshots(values: HubData["settings"], data: HubData | null) {
  if (typeof window === "undefined") return;
  void settings.read("settings", () => Promise.resolve(values)).catch(() => {});
  if (data) void catalogue.read("catalogue", () => Promise.resolve(data)).catch(() => {});
}

export function peekHubData() {
  return typeof window === "undefined" ? undefined : catalogue.peek("catalogue");
}

export function loadDestinationCard(id: string) {
  const full = peekHubData();
  if (full) return Promise.resolve(focusDestinationCard(full, id));
  const load = () => getDestinationCard({ data: id });
  return typeof window === "undefined" ? load() : cards.read(id, load);
}
