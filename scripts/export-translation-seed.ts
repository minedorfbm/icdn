import { DESTINATION_DESCRIPTION } from "../src/i18n/destinations";
import { EVENT_TRANSLATIONS } from "../src/i18n/events";
import sources from "../src/i18n/sources.json";
import eventSources from "../src/i18n/event-sources.json";
import { LANGUAGES } from "../src/i18n/dictionary";

const localeFlag = process.argv.find((arg) => arg.startsWith("--locales="));
const requestedLocales = localeFlag?.slice("--locales=".length).split(",");
const supportedLocales = LANGUAGES.filter(({ code }) => code !== "en").map(({ code }) => code);
if (
  requestedLocales &&
  (requestedLocales.length === 0 ||
    requestedLocales.some(
      (code) => !supportedLocales.some((supported) => supported === code),
    ))
) {
  throw new Error(`--locales must contain only: ${supportedLocales.join(", ")}`);
}

const literal = (value: string) => "'" + value.replaceAll("'", "''") + "'";
const sqlArray = (values: string[]) => `ARRAY[${values.map(literal).join(", ")}]::text[]`;
console.log(
  "-- Import only against unchanged source text. Existing translations are preserved.\nBEGIN;",
);
for (const { code } of LANGUAGES) {
  if (code === "en" || (requestedLocales && !requestedLocales.includes(code))) continue;
  for (const [id, source] of Object.entries(sources)) {
    const text = DESTINATION_DESCRIPTION[code][id];
    if (!text) throw new Error(`Missing ${code}/${id}`);
    console.log(`INSERT INTO public.destination_translations (destination_id, locale, description, source_description, published)
SELECT id, ${literal(code)}, ${literal(text)}, short_description, true
FROM public.destinations WHERE id = ${literal(id)} AND short_description = ${literal(source)}
ON CONFLICT (destination_id, locale) DO NOTHING;`);
  }
  for (const source of eventSources) {
    const text = EVENT_TRANSLATIONS[code][source.title];
    if (!text) throw new Error(`Missing ${code}/${source.id}`);
    console.log(`INSERT INTO public.event_translations (event_id, locale, title, schedule, description, source_title, source_schedule, source_description, published)
SELECT id, ${literal(code)}, ${literal(text.title)}, ${sqlArray(text.schedule)}, ${literal(text.description)}, title, schedule, description, true
FROM public.destination_events WHERE destination_id = ${literal(source.destination_id)} AND title = ${literal(source.title)} AND schedule = ${sqlArray(source.schedule)} AND description = ${literal(source.description)}
ON CONFLICT (event_id, locale) DO NOTHING;`);
  }
}
console.log("COMMIT;");
