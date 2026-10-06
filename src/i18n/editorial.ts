import type { z } from "zod";
import type { descriptionRow, eventTranslationRow } from "@/lib/hub-schema";
import type { DestinationEvent } from "@/data/events";
import type { Lang } from "./dictionary";

export type DescriptionTranslation = z.infer<typeof descriptionRow>;
export type EventTranslation = z.infer<typeof eventTranslationRow>;
export interface EditorialTranslations {
  descriptions: DescriptionTranslation[] | null;
  events: EventTranslation[] | null;
}

/** Only current published translations can override the source text. */
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
  return source;
}

/** The expanded copy has its own source check; editing an intro cannot stale it. */
export function translatedDetailDescription(
  lang: Lang,
  id: string,
  source: string,
  rows?: DescriptionTranslation[] | null,
): string {
  if (lang === "en") return source;
  const row = rows?.find((r) => r.destination_id === id && r.locale === lang);
  return row?.source_detail_description === source && row.detail_description?.trim()
    ? row.detail_description
    : source;
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
  return event;
}
