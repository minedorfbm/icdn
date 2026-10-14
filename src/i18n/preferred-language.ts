import { LANGUAGES, type Lang } from "./dictionary";

export const LANGUAGE_STORAGE_KEY = "adj-lang";
function isLang(value: string | null): value is Lang {
  return LANGUAGES.some(({ code }) => code === value);
}
export function preferredLanguage(stored: string | null, browserLanguage: string): Lang {
  if (isLang(stored)) return stored;
  const locale = browserLanguage.split(/[-_]/)[0]?.toLowerCase() ?? "";
  return isLang(locale) ? locale : "en";
}
export function readPreferredLanguage(): Lang {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    /* Persistence is optional. */
  }
  return preferredLanguage(stored, navigator.language);
}
export function requestLanguage(header: string | null): Lang {
  const preferences = (header ?? "")
    .split(",")
    .map((entry) => {
      const [tag = "", quality] = entry.trim().split(";");
      const q = quality ? Number(quality.trim().replace(/^q=/, "")) : 1;
      return { locale: tag.split("-")[0]?.toLowerCase() ?? "", q };
    })
    .filter(({ locale, q }) => isLang(locale) && Number.isFinite(q) && q > 0 && q <= 1)
    .sort((a, b) => b.q - a.q);
  return (preferences[0]?.locale as Lang | undefined) ?? "en";
}
