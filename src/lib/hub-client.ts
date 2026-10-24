import { getHubData, getHubSettings, getDestinationMedia } from "./hub.functions";
import { completeCatalogue } from "./hub-data-completeness";
import { createRequestCache } from "./request-cache";
import type { HubData } from "./hub-schema";

const catalogue = createRequestCache<Awaited<ReturnType<typeof getHubData>>>(completeCatalogue);
const settings = createRequestCache<Awaited<ReturnType<typeof getHubSettings>>>(
  (data) => data !== null,
);
const media = createRequestCache<Awaited<ReturnType<typeof getDestinationMedia>>>((data) =>
  Object.values(data).every((rows) => rows !== null),
);

// Only browser reads are retained. SSR always uses the existing public server cache,
// never a module-global snapshot shared across requests or Worker environments.
export function loadHubData() {
  return typeof window === "undefined"
    ? getHubData()
    : catalogue.read("catalogue", () => getHubData());
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
