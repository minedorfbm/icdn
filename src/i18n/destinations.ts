import type { Lang } from "./dictionary";
import translations from "./destinations.json";

/** Published editorial content; source snapshots are tracked separately. */
export const DESTINATION_DESCRIPTION: Record<
  Exclude<Lang, "en">,
  Record<string, string>
> = translations;
