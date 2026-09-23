import { describe, expect, test } from "bun:test";
import { translatedDescription, translatedEvent } from "../src/i18n/editorial";
import sources from "../src/i18n/sources.json";
import eventSources from "../src/i18n/event-sources.json";
import { LANGUAGES, UI } from "../src/i18n/dictionary";

describe("editorial translation authority", () => {
  test("Korean and Japanese cover the current catalogue and can be selected", () => {
    for (const lang of ["ko", "ja"] as const) {
      expect(LANGUAGES.some((option) => option.code === lang)).toBe(true);
      expect(UI[lang].language).toBeTruthy();
      for (const [id, source] of Object.entries(sources)) {
        expect(translatedDescription(lang, id, source, null)).not.toBe(source);
      }
      for (const event of eventSources) {
        expect(translatedEvent(lang, event, null).title).not.toBe(event.title);
      }
    }
  });
  test("newly covered destinations translate, but changed English is never hidden by old text", () => {
    expect(translatedDescription("vi", "moulin-rouge", sources["moulin-rouge"])).not.toBe(
      sources["moulin-rouge"],
    );
    expect(translatedDescription("vi", "moulin-rouge", "New information")).toBe("New information");
  });
  test("published database text overrides bundled text; missing rows remain missing", () => {
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
  test("an unavailable collection can use a source-matched snapshot", () => {
    expect(translatedDescription("ru", "citron", sources.citron, null)).not.toBe(sources.citron);
  });
  test("events preserve their booking URL and reject outdated schedules", () => {
    const event = { ...eventSources[0]!, url: "https://example.com/booking" };
    const translated = translatedEvent("zh", event);
    expect(translated.title).not.toBe(event.title);
    expect(translated.schedule).not.toEqual(event.schedule);
    expect(translated.url).toBe(event.url);
    const changed = { ...event, schedule: ["NEW HOURS"] };
    expect(translatedEvent("zh", changed)).toEqual(changed);
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
