import type { DestinationEvent } from "@/data/events";
import { DESTINATION_DESCRIPTION } from "./destinations";
import { EVENT_TRANSLATIONS } from "./events";
import sources from "./sources.json";
import eventSources from "./event-sources.json";
import type { Lang } from "./dictionary";

export interface DescriptionTranslation {
  destination_id: string;
  locale: string;
  description: string;
  source_description: string;
}
export interface EventTranslation {
  event_id: string;
  locale: string;
  title: string;
  schedule: string[];
  description: string;
  source_title: string;
  source_schedule: string[];
  source_description: string;
}
export interface EditorialTranslations {
  descriptions: DescriptionTranslation[] | null;
  events: EventTranslation[] | null;
}

/** A successful empty collection is authoritative; unavailable collections use the snapshot. */
export function translatedDescription(
  lang: Lang,
  id: string,
  source: string,
  rows?: DescriptionTranslation[] | null,
): string {
  if (lang === "en") return source;
  if (rows != null) {
    const row = rows.find((r) => r.destination_id === id && r.locale === lang);
    return row?.source_description === source && row.description.trim() ? row.description : source;
  }
  const original = (sources as Record<string, string>)[id];
  return original === source ? (DESTINATION_DESCRIPTION[lang][id] ?? source) : source;
}

export function sameEventSource(
  event: DestinationEvent,
  source: Pick<DestinationEvent, "title" | "schedule" | "description">,
): boolean {
  return (
    event.title === source.title &&
    event.description === source.description &&
    JSON.stringify(event.schedule) === JSON.stringify(source.schedule)
  );
}

export function translatedEvent(
  lang: Lang,
  event: DestinationEvent,
  rows?: EventTranslation[] | null,
): DestinationEvent {
  if (lang === "en") return event;
  if (rows != null) {
    const row = rows.find((r) => r.event_id === event.id && r.locale === lang);
    if (
      !row ||
      !sameEventSource(event, {
        title: row.source_title,
        schedule: row.source_schedule,
        description: row.source_description,
      })
    )
      return event;
    return { ...event, title: row.title, schedule: row.schedule, description: row.description };
  }
  const source = eventSources.find((s) =>
    event.id ? s.id === event.id : sameEventSource(event, s),
  );
  if (!source || !sameEventSource(event, source)) return event;
  const translation = EVENT_TRANSLATIONS[lang][source.title];
  return translation ? { ...event, ...translation } : event;
}
