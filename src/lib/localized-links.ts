import { LANGUAGES, type Lang } from "@/i18n/dictionary";

export type LinkTranslations = Partial<Record<Lang, string>>;

export interface LinkTranslationRow {
  locale: string;
  url: string;
  source_url: string;
}

export interface DestinationLinkTranslationRow extends LinkTranslationRow {
  link_id: string;
}

export interface SiteLinkTranslationRow extends LinkTranslationRow {
  setting_key: string;
}

/** Menus, booking links and all other action kinds keep their shared URL. */
export function localizedLinkUrl(
  kind: string,
  url: string,
  translations: LinkTranslations | undefined,
  locale: Lang,
): string {
  if (kind !== "DISCOVER" && kind !== "WEBSITE") return url;
  const translated = translations?.[locale];
  if (!translated) return url;
  try {
    const parsed = new URL(translated);
    if (parsed.protocol === "https:" && !parsed.username && !parsed.password) return translated;
  } catch {
    // A malformed optional variant must never break the original action.
  }
  return url;
}

/** Discard translations of an earlier URL, including during mixed cache/deployment states. */
export function currentLinkTranslations(
  rows: readonly LinkTranslationRow[],
  sourceUrl: string,
): LinkTranslations {
  const translations: LinkTranslations = {};
  for (const row of rows) {
    const language = LANGUAGES.find(({ code }) => code === row.locale);
    if (language && row.source_url === sourceUrl) translations[language.code] = row.url;
  }
  return translations;
}
