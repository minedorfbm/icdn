import { describe, expect, test } from "bun:test";
import { translatedDescription, translatedEvent } from "../src/i18n/editorial";
import sources from "../scripts/translation-snapshot/sources.json";
import eventSources from "../scripts/translation-snapshot/event-sources.json";
import { LANGUAGES, UI } from "../src/i18n/dictionary";

describe("editorial translation authority", () => {
  test("all supported languages have UI labels and never resurrect archived descriptions", () => {
    for (const { code } of LANGUAGES) {
      expect(UI[code].language).toBeTruthy();
      expect(translatedDescription(code, "citron", sources.citron, null)).toBe(sources.citron);
    }
  });
  test("published database text is authoritative; missing rows remain missing", () => {
    const rows = [
      {
        destination_id: "citron",
        locale: "vi",
        description: "Reviewed translation",
        source_description: sources.citron,
      },
    ];
    expect(translatedDescription("vi", "citron", sources.citron, rows)).toBe(
      "Reviewed translation",
    );
    expect(translatedDescription("vi", "citron", sources.citron, [])).toBe(sources.citron);
    expect(translatedDescription("en", "citron", sources.citron, rows)).toBe(sources.citron);
  });
  test("outdated and empty database translations fall back to current source", () => {
    const row = {
      destination_id: "citron",
      locale: "vi",
      description: "Old translation",
      source_description: "Old source",
    };
    expect(translatedDescription("vi", "citron", sources.citron, [row])).toBe(sources.citron);
    expect(
      translatedDescription("vi", "citron", sources.citron, [
        { ...row, description: " ", source_description: sources.citron },
      ]),
    ).toBe(sources.citron);
  });
  test("an unavailable collection shows current source text", () => {
    expect(translatedDescription("ru", "citron", sources.citron, null)).toBe(sources.citron);
  });
  test("events preserve their booking URL and reject outdated schedules", () => {
    const event = { ...eventSources[0]!, url: "https://example.com/booking" };
    const rows = [
      {
        event_id: event.id,
        locale: "zh",
        title: "Translated title",
        schedule: ["Translated hours"],
        description: "Translated description",
        source_title: event.title,
        source_schedule: event.schedule,
        source_description: event.description,
      },
    ];
    const translated = translatedEvent("zh", event, rows);
    expect(translated.title).not.toBe(event.title);
    expect(translated.schedule).not.toEqual(event.schedule);
    expect(translated.url).toBe(event.url);
    const changed = { ...event, schedule: ["NEW HOURS"] };
    expect(translatedEvent("zh", changed, rows)).toEqual(changed);
    expect(translatedEvent("zh", event, [])).toEqual(event);
  });
  test("event database identity survives a renamed title and rejects stale descriptions", () => {
    const event = { ...eventSources[0]!, title: "New event title" };
    const row = {
      event_id: event.id,
      locale: "ru",
      title: "Reviewed event",
      schedule: ["Reviewed hours"],
      description: "Reviewed description",
      source_title: event.title,
      source_schedule: event.schedule,
      source_description: event.description,
    };
    expect(translatedEvent("ru", event, [row]).title).toBe("Reviewed event");
    const changed = { ...event, description: "New offer" };
    expect(translatedEvent("ru", changed, [row])).toEqual(changed);
  });
});
