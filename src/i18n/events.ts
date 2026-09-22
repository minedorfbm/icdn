import type { DestinationEvent } from "@/data/events";
import type { Lang } from "./dictionary";
import translations from "./events.json";

export const EVENT_TRANSLATIONS: Record<
  Exclude<Lang, "en">,
  Record<string, DestinationEvent>
> = translations;
