import type { DestinationEvent } from "@/data/events";
import type { Lang } from "./dictionary";
import translations from "./events.json";
import korean from "./events.ko.json";
import japanese from "./events.ja.json";

export const EVENT_TRANSLATIONS: Record<Exclude<Lang, "en">, Record<string, DestinationEvent>> = {
  ...translations,
  ko: korean,
  ja: japanese,
};
