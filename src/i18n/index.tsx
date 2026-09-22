import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  ACTION,
  CLUSTER,
  LANGUAGES,
  LEVEL_LABEL,
  LEVEL_LINE,
  LINK_LABEL,
  TYPE_LABEL,
  UI,
  type Lang,
  type UIKey,
} from "./dictionary";
import { translatedDescription, translatedEvent, type EditorialTranslations } from "./editorial";
import type { DestinationEvent } from "@/data/events";

const STORAGE_KEY = "adj-lang";

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: UIKey) => string;
  levelLine: (id: string, fallback: string) => string;
  levelLabel: (id: string) => string;
  cluster: (c: string) => string;
  typeLabel: (t: string) => string;
  action: (a: string) => string;
  linkLabel: (l: string) => string;
  description: (id: string, fallback: string) => string;
  event: (event: DestinationEvent) => DestinationEvent;
}

const I18nContext = createContext<I18nValue | null>(null);

function isLang(v: string | null): v is Lang {
  return !!v && LANGUAGES.some((l) => l.code === v);
}

export function I18nProvider({
  children,
  editorial,
}: Readonly<{ children: ReactNode; editorial?: EditorialTranslations | undefined }>) {
  const [lang, setLangState] = useState<Lang>("en");

  // English by default; a previous choice or the device language is restored after hydration.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) {
      setLangState(stored);
      return;
    }
    const nav = navigator.language.slice(0, 2).toLowerCase();
    const guess = nav === "vi" ? "vi" : nav === "ru" ? "ru" : nav === "zh" ? "zh" : null;
    if (guess) setLangState(guess);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key) => UI[lang][key],
      levelLine: (id, fallback) => LEVEL_LINE[lang][id] ?? fallback,
      levelLabel: (id) => LEVEL_LABEL[lang][id] ?? id.toUpperCase(),
      cluster: (c) => CLUSTER[lang][c] ?? c,
      typeLabel: (t) => TYPE_LABEL[lang][t] ?? t.toUpperCase(),
      action: (a) => ACTION[lang][a] ?? a,
      linkLabel: (l) => LINK_LABEL[lang][l] ?? l,
      description: (id, fallback) =>
        translatedDescription(lang, id, fallback, editorial?.descriptions),
      event: (event) => translatedEvent(lang, event, editorial?.events),
    }),
    [lang, setLang, editorial],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/** Discreet language selector, fixed at the top-right of the journey.
 *  Tapping the current language opens a bottom sheet with all options.
 */
export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]!;

  const select = (code: Lang) => {
    setLang(code);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label={t("language")}
          className="fixed right-3 top-3 z-50 flex items-center gap-1 rounded-full border border-[oklch(0.78_0.11_85/0.2)] bg-[oklch(0.16_0.03_250/0.32)] px-2.5 py-1.5 text-[oklch(0.86_0.1_85)] backdrop-blur-md transition-all hover:border-[oklch(0.78_0.11_85/0.35)] hover:bg-[oklch(0.16_0.03_250/0.45)] active:scale-95 max-[360px]:right-2"
        >
          <span className="text-[10px] tracking-[0.18em]">{current.label}</span>
          <ChevronDown size={10} strokeWidth={1.5} className="opacity-60" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="z-[60] rounded-t-2xl border-t border-[oklch(0.78_0.11_85/0.18)] bg-[oklch(0.16_0.03_250/0.96)] px-5 pb-8 pt-5 shadow-[0_-8px_32px_oklch(0.16_0.03_250/0.24)]"
      >
        <SheetHeader className="mb-5 items-center">
          <SheetTitle className="text-[11px] font-normal uppercase tracking-[0.3em] text-[oklch(0.86_0.1_85)]">
            {t("language")}
          </SheetTitle>
        </SheetHeader>

        <nav aria-label={t("language")} className="flex flex-col gap-1">
          {LANGUAGES.map(({ code, label, name }) => {
            const active = lang === code;
            return (
              <button
                key={code}
                onClick={() => select(code)}
                aria-current={active}
                className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-left transition-all ${
                  active
                    ? "bg-[oklch(0.78_0.11_85/0.14)] text-[oklch(0.92_0.01_90)]"
                    : "text-[oklch(0.86_0.1_85/0.72)] hover:bg-[oklch(0.78_0.11_85/0.08)] hover:text-[oklch(0.92_0.01_90)]"
                }`}
              >
                <span className="flex items-baseline gap-3">
                  <span className="w-8 text-[12px] tracking-[0.12em]">{label}</span>
                  <span className="text-[13px] font-light tracking-wide opacity-80">{name}</span>
                </span>
                {active && (
                  <Check size={16} strokeWidth={1.5} className="text-[oklch(0.86_0.1_85)]" />
                )}
              </button>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
