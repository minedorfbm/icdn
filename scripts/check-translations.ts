import { writeFileSync } from "node:fs";
import { ACTION, LANGUAGES, UI } from "../src/i18n/dictionary";
import { DESTINATION_DESCRIPTION } from "../src/i18n/destinations";
import { EVENT_TRANSLATIONS } from "../src/i18n/events";
import sources from "../src/i18n/sources.json";
import eventSources from "../src/i18n/event-sources.json";
import {
  sameEventSource,
  type DescriptionTranslation,
  type EventTranslation,
} from "../src/i18n/editorial";

const live = process.argv.includes("--live");
const database = process.argv.includes("--database");
if (database && !live) throw new Error("--database requires --live");
async function readTable<T>(table: string, query: string): Promise<T[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing public Supabase configuration");
  const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: { apikey: key },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`${table}: HTTP ${response.status}`);
  return response.json();
}
const destinations = live
  ? await readTable<{ id: string; short_description: string }>(
      "destinations",
      "select=id,short_description&active=eq.true",
    )
  : Object.entries(sources).map(([id, short_description]) => ({ id, short_description }));
const events = live
  ? await readTable<(typeof eventSources)[number]>(
      "destination_events",
      "select=id,destination_id,title,schedule,description&active=eq.true",
    )
  : eventSources;
const descriptions = database
  ? await readTable<DescriptionTranslation>(
      "destination_translations",
      "select=*&published=eq.true",
    )
  : null;
const translatedEvents = database
  ? await readTable<EventTranslation>("event_translations", "select=*&published=eq.true")
  : null;
const issues: string[] = [];
for (const { code } of LANGUAGES) {
  if (code === "en") continue;
  for (const key of Object.keys(UI.en) as (keyof typeof UI.en)[]) {
    if (!UI[code][key]?.trim()) issues.push(`${code}: UI ${key}`);
  }
  for (const key of Object.keys(ACTION.en)) {
    if (!ACTION[code][key]?.trim()) issues.push(`${code}: action ${key}`);
  }
  for (const item of destinations) {
    const row = descriptions?.find((r) => r.destination_id === item.id && r.locale === code);
    const text = database ? row?.description : DESTINATION_DESCRIPTION[code][item.id];
    const source = database
      ? row?.source_description
      : (sources as Record<string, string>)[item.id];
    if (!text?.trim()) issues.push(`${code}: missing description ${item.id}`);
    else if (source !== item.short_description)
      issues.push(`${code}: stale description ${item.id}`);
  }
  for (const item of events) {
    const row = translatedEvents?.find((r) => r.event_id === item.id && r.locale === code);
    const snapshot = eventSources.find((s) => s.id === item.id);
    const text = database ? row : EVENT_TRANSLATIONS[code][item.title];
    const source =
      database && row
        ? {
            title: row.source_title,
            schedule: row.source_schedule,
            description: row.source_description,
          }
        : snapshot;
    if (!text?.title?.trim() || !text.description?.trim() || !text.schedule?.length)
      issues.push(`${code}: missing event ${item.id}`);
    else if (!source || !sameEventSource(item, source))
      issues.push(`${code}: stale event ${item.id}`);
  }
}
writeFileSync(
  "translation-audit.json",
  JSON.stringify(
    {
      destinations: destinations.length,
      events: events.length,
      live,
      database,
      issues,
    },
    null,
    2,
  ) + "\n",
);
if (issues.length) {
  console.error("Translation audit failed. See translation-audit.json for details.");
  process.exitCode = 1;
} else {
  console.log("Translation audit passed. See translation-audit.json for details.");
}
