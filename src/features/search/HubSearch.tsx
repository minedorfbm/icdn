import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { FullscreenDialog } from "@/components/ui/fullscreen-dialog";
import { useHub } from "@/data/hub-context";
import { useI18n } from "@/i18n";
import { useDestinationNavigation } from "@/lib/use-destination-navigation";
import type { Destination } from "@/data/resort";
import { SEARCH_COLLECTIONS, searchEntries, type SearchCollection } from "./search";
import { searchCopy } from "./search-copy";
import "./search.css";

export function HubSearch() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SearchTrigger onOpen={() => setOpen(true)} />
      {open && <SearchDialog onClose={() => setOpen(false)} />}
    </>
  );
}

export function SearchTrigger({ onOpen }: Readonly<{ onOpen: () => void }>) {
  const { lang } = useI18n();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="brand-ui brand-floating hub-search-trigger"
      aria-haspopup="dialog"
    >
      <Search size={16} strokeWidth={1.4} aria-hidden />
      <span>{searchCopy(lang, "search")}</span>
    </button>
  );
}

export function SearchDialog({
  onClose,
  onSelectDestination,
  aboveMap = false,
}: Readonly<{
  onClose: () => void;
  onSelectDestination?: (destination: Destination) => void;
  aboveMap?: boolean;
}>) {
  const [query, setQuery] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);
  const [collection, setCollection] = useState<SearchCollection | "">("");
  useEffect(() => {
    if (resultsRef.current) resultsRef.current.scrollTop = 0;
  }, [query, collection]);
  const { destinations } = useHub();
  const { lang, t, cluster, levelLabel, typeLabel, description, event } = useI18n();
  const { openDestination } = useDestinationNavigation();
  const copy = (key: Parameters<typeof searchCopy>[1]) => searchCopy(lang, key);
  const entries = useMemo(
    () =>
      destinations
        .filter((d) => d.active)
        .map((d) => ({
          item: d,
          name: d.name,
          collection: d.cluster ?? "",
          text: [
            d.id,
            d.short_description,
            description(d.id, d.short_description),
            d.type,
            typeLabel(d.type),
            d.level,
            levelLabel(d.level),
            d.cluster ?? "",
            cluster(d.cluster ?? ""),
            ...(d.events ?? []).flatMap((source) => {
              const translated = event(source);
              return [source.title, source.description, translated.title, translated.description];
            }),
          ].join(" "),
        })),
    [destinations, description, typeLabel, levelLabel, cluster, event],
  );
  const results = useMemo(
    () => searchEntries(entries, query, collection),
    [entries, query, collection],
  );
  const reset = () => {
    setQuery("");
    setCollection("");
  };
  const selectDestination = (destination: Destination) => {
    onClose();
    if (onSelectDestination) onSelectDestination(destination);
    else openDestination(destination.id, true);
  };
  const categoryNotes = {
    DINING: "dining",
    WELLNESS: "wellness",
    EXPERIENCES: "experiences",
  } as const;
  const groups = query.trim()
    ? [{ key: "results", label: copy("results"), note: "", items: results }]
    : [...SEARCH_COLLECTIONS, ""]
        .map((key) => ({
          key,
          label: key ? cluster(key) : t("all_places"),
          note: key ? copy(categoryNotes[key as SearchCollection]) : "",
          items: results.filter((entry) =>
            key
              ? entry.collection === key
              : !(SEARCH_COLLECTIONS as readonly string[]).includes(entry.collection),
          ),
        }))
        .filter((group) => group.items.length > 0);
  return (
    <FullscreenDialog
      title={copy("search")}
      onClose={onClose}
      overlayClassName={`fixed inset-0 bg-black/30 ${aboveMap ? "z-[96]" : "z-[74]"}`}
      className={`brand-ui brand-surface hub-search-dialog fixed inset-0 ${aboveMap ? "z-[97]" : "z-[75]"}`}
    >
      <div className="hub-search-shell">
        <header className="hub-search-header">
          <div className="hub-search-heading">
            <h2>{copy("title")}</h2>
            <button type="button" onClick={onClose} aria-label={t("close")}>
              <X size={22} strokeWidth={1.3} />
            </button>
          </div>
          <div className="hub-search-input">
            <Search size={20} strokeWidth={1.3} aria-hidden />
            <input
              type="search"
              value={query}
              maxLength={120}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={copy("placeholder")}
              aria-label={copy("search")}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label={copy("clear")}>
                <X size={17} strokeWidth={1.4} />
              </button>
            )}
          </div>
          <nav className="hub-search-categories" aria-label={t("collections")}>
            {SEARCH_COLLECTIONS.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={collection === key}
                onClick={() => setCollection((current) => (current === key ? "" : key))}
              >
                {cluster(key)}
              </button>
            ))}
          </nav>
          <div className="hub-search-summary">
            <button type="button" onClick={reset} aria-pressed={!query && !collection}>
              {t("all_places")}
            </button>
            <output aria-live="polite" aria-atomic="true">
              {results.length} · {copy("results")}
            </output>
          </div>
        </header>
        <div ref={resultsRef} className="hub-search-results">
          {groups.map((group) => (
            <section key={group.key} aria-label={group.label}>
              <h3>{group.label}</h3>
              {group.note && <p className="hub-search-note">{group.note}</p>}
              <div className="hub-search-grid">
                {group.items.map(({ item: d }) => (
                  <button
                    key={d.id}
                    type="button"
                    className="hub-search-result"
                    onClick={() => selectDestination(d)}
                  >
                    <img
                      src={d.image}
                      alt=""
                      width={56}
                      height={70}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="hub-search-result-text">
                      <span className="hub-search-name">{d.name}</span>
                      <span className="hub-search-meta">
                        {levelLabel(d.level)} · {typeLabel(d.type)}
                      </span>
                      <span className="hub-search-description">
                        {description(d.id, d.short_description)}
                      </span>
                    </span>
                    <ArrowUpRight size={17} strokeWidth={1.3} aria-hidden />
                  </button>
                ))}
              </div>
            </section>
          ))}
          {!results.length && (
            <div className="hub-search-empty">
              <h3>{copy("empty")}</h3>
              <p>{copy("hint")}</p>
              <button type="button" onClick={reset}>
                {t("all_places")}
              </button>
            </div>
          )}
        </div>
      </div>
    </FullscreenDialog>
  );
}
