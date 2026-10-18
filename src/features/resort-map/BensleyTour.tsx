import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useI18n } from "@/i18n";
import { mapCopy } from "./map-copy";
import { BENSLEY_TOUR_SOURCE, tourCopy } from "./tour-copy";
import "./bensley-tour.css";

/** Keep the official document mounted while consulting the map, without reading its contents. */
export function BensleyTour({ open, onReturn }: Readonly<{ open: boolean; onReturn: () => void }>) {
  const { lang, t } = useI18n();
  const back = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (open) back.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    // A cross-origin frame cannot reliably report failure. Keep the external link available
    // and cap the loading indicator rather than claiming that onLoad proves success.
    const timer = window.setTimeout(() => setLoading(false), 12_000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <section
      className="atlas-tour-reader"
      data-open={open}
      inert={!open}
      aria-hidden={!open}
      aria-label={mapCopy(lang, "tour")}
    >
      <header className="atlas-tour-header">
        <button ref={back} type="button" onClick={onReturn}>
          <ArrowLeft size={18} aria-hidden />
          <span>{tourCopy(lang, "backToMap")}</span>
        </button>
        <h2>{mapCopy(lang, "tour")}</h2>
        <a
          href={BENSLEY_TOUR_SOURCE}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("open_browser")}
          title={t("open_browser")}
        >
          <ExternalLink size={18} aria-hidden />
        </a>
        <output className="sr-only">{loading ? t("page_loading") : ""}</output>
        {loading && <div className="atlas-tour-loading" aria-hidden />}
      </header>
      <iframe
        src={BENSLEY_TOUR_SOURCE}
        title={tourCopy(lang, "source")}
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
        allow="fullscreen"
        onLoad={() => setLoading(false)}
      />
    </section>
  );
}
