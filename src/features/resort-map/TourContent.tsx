import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Circle, Footprints } from "lucide-react";
import type { Destination } from "@/data/resort";
import { useI18n } from "@/i18n";
import { mapCopy } from "./map-copy";
import { BENSLEY_TOUR_SOURCE, tourCopy, tourText } from "./tour-copy";
import type { TourProgress } from "./tour-progress";
import { tourStories } from "./tour-stories";
import type { Place, TourStop } from "./map.types";
import "./tour.css";

type TourProps = {
  stops: TourStop[];
  places: Place[];
  progress: TourProgress;
  onSelect: (id: string) => void;
};

function TourCount({ stops, progress }: Readonly<Pick<TourProps, "stops" | "progress">>) {
  const { lang } = useI18n();
  const done = stops.filter((stop) => progress.visited.includes(stop.placeId)).length;
  return (
    <p className="atlas-tour-count" aria-live="polite">
      {tourCopy(lang, "count")
        .replace("{done}", String(done))
        .replace("{total}", String(stops.length))}
    </p>
  );
}

export function TourOverview({ stops, places, progress, onSelect }: Readonly<TourProps>) {
  const { lang } = useI18n();
  const first = stops[0];
  if (!first) return null;
  const resume = stops.find((stop) => stop.placeId === progress.currentId) ?? first;
  const hasProgress = progress.visited.length > 0 || resume.placeId !== first.placeId;
  const startLabel = first.placeId === "lobby" ? "start" : "startFallback";
  return (
    <div className="atlas-tour-content">
      <p className="atlas-tour-story">{tourCopy(lang, "intro")}</p>
      <TourCount stops={stops} progress={progress} />
      <button
        className="atlas-discover"
        type="button"
        onClick={() => onSelect((hasProgress ? resume : first).placeId)}
      >
        {tourCopy(lang, hasProgress ? "resume" : startLabel)}
        <ArrowRight size={17} aria-hidden />
      </button>
      <details className="atlas-tour-details">
        <summary>{tourCopy(lang, "stops")}</summary>
        <ol className="atlas-tour-stop-list">
          {stops.map((stop) => (
            <li key={stop.placeId}>
              <button type="button" onClick={() => onSelect(stop.placeId)}>
                <span className="atlas-tour-number">{stop.order}</span>
                <span>{places.find((place) => place.id === stop.placeId)?.name}</span>
                {progress.visited.includes(stop.placeId) && (
                  <Check size={15} aria-label={tourCopy(lang, "marked")} />
                )}
              </button>
            </li>
          ))}
        </ol>
      </details>
      <a
        className="atlas-tour-source"
        href={BENSLEY_TOUR_SOURCE}
        target="_blank"
        rel="noopener noreferrer"
      >
        {tourCopy(lang, "source")}
        <ArrowUpRight size={14} aria-hidden />
      </a>
    </div>
  );
}

export function TourStopContent({
  stops,
  places,
  progress,
  onSelect,
  stop,
  destinations,
  onDestination,
  onVisit,
  onOverview,
}: Readonly<
  TourProps & {
    stop: TourStop;
    destinations: Destination[];
    onDestination: (id: string) => void;
    onVisit: (id: string) => void;
    onOverview: () => void;
  }
>) {
  const { lang, levelLabel } = useI18n();
  const story = tourStories[stop.placeId];
  if (!story) return null;
  const index = stops.findIndex((item) => item.placeId === stop.placeId);
  const next = stops[index + 1];
  const previous = stops[index - 1];
  const visited = progress.visited.includes(stop.placeId);
  const VisitIcon = visited ? Check : Circle;
  return (
    <div className="atlas-tour-content">
      <p className="atlas-tour-story">{tourText(lang, story.story)}</p>
      <details className="atlas-tour-details">
        <summary>{tourCopy(lang, "look")}</summary>
        <p>{tourText(lang, story.look)}</p>
        {stop.placeId === "la-maison-1888" && <p>{tourCopy(lang, "maisonAccess")}</p>}
      </details>
      {destinations.length > 0 && (
        <details className="atlas-tour-details">
          <summary>{tourCopy(lang, "details")}</summary>
          <div className="atlas-related">
            {destinations.map((destination) => (
              <button
                key={destination.id}
                type="button"
                onClick={() => onDestination(destination.id)}
              >
                {destination.name}
                <ArrowUpRight size={15} aria-hidden />
              </button>
            ))}
          </div>
        </details>
      )}
      <button
        type="button"
        className="atlas-tour-visit"
        aria-pressed={visited}
        onClick={() => onVisit(stop.placeId)}
      >
        <VisitIcon size={16} aria-hidden />
        {tourCopy(lang, visited ? "marked" : "mark")}
      </button>
      <TourCount stops={stops} progress={progress} />
      {next ? (
        <button
          type="button"
          className="atlas-discover atlas-tour-next"
          onClick={() => onSelect(next.placeId)}
        >
          <span>
            <small>
              {tourCopy(lang, next.travel)}
              {next.arrivalStation ? ` · ${levelLabel(next.arrivalStation)}` : ""}
            </small>
            <span>{places.find((place) => place.id === next.placeId)?.name}</span>
          </span>
          {next.travel === "walk" ? (
            <Footprints size={18} aria-hidden />
          ) : (
            <ArrowRight size={18} aria-hidden />
          )}
        </button>
      ) : (
        stop.placeId === "mi-sol-lagoon" && (
          <p className="atlas-tour-hint">{tourCopy(lang, "finish")}</p>
        )
      )}
      <nav className="atlas-tour-navigation" aria-label={mapCopy(lang, "tour")}>
        <button
          type="button"
          disabled={!previous}
          onClick={() => previous && onSelect(previous.placeId)}
          aria-label={mapCopy(lang, "previous")}
        >
          <ArrowLeft size={17} aria-hidden />
        </button>
        <button type="button" onClick={onOverview}>
          {tourCopy(lang, "overview")}
        </button>
      </nav>
    </div>
  );
}
