import { useEffect, useState } from "react";
import { UI, type Lang } from "./dictionary";
import { readPreferredLanguage } from "./preferred-language";

// Error boundaries render outside the hub's I18nProvider.
export function useErrorCopy() {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    setLang(readPreferredLanguage());
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return UI[lang];
}
