import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Destination } from "@/data/resort";
import { useI18n } from "@/i18n";
import "./destination-journey-navigation.css";

export function DestinationJourneyNavigation({
  previous,
  next,
  openPrevious,
  openNext,
}: Readonly<{
  previous: Destination | undefined;
  next: Destination | undefined;
  openPrevious: () => void;
  openNext: () => void;
}>) {
  const { t } = useI18n();
  if (!previous && !next) return null;
  return (
    <footer
      className="destination-journey"
      data-two-directions={(!!previous && !!next) || undefined}
    >
      {previous && (
        <button type="button" data-previous-destination onClick={openPrevious}>
          <span className="destination-journey-label">
            <ArrowLeft size={19} strokeWidth={1.4} aria-hidden />
            <span>{t("previous_discovery")}</span>
          </span>
          <strong>{previous.name}</strong>
        </button>
      )}
      {next && (
        <button type="button" data-next-destination onClick={openNext}>
          <span className="destination-journey-label">
            <span>{t("continue_journey")}</span>
            <ArrowRight size={19} strokeWidth={1.4} aria-hidden />
          </span>
          <strong>{next.name}</strong>
        </button>
      )}
    </footer>
  );
}
