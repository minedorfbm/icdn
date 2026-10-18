import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Camera,
  Compass,
  Footprints,
  Layers,
  LocateFixed,
  Minus,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { useHub } from "@/data/hub-context";
import { useI18n } from "@/i18n";
import { SearchDialog, SearchTrigger } from "@/features/search/HubSearch";
import { ConciergeContact } from "@/components/hub/ConciergeContact";
import { LEVELS, type Destination, type Level } from "@/data/resort";
import { MapPreview } from "./MapPreview";
import { MapArtwork } from "./MapArtwork";
import { useMapCamera } from "./useMapCamera";
import { destinationPlace, linkedDestinations, liveMapPlaces } from "./map-links";
import { photoSpots } from "./map.legend";
import { bensleyTour } from "./map.data";
import { mapCopy } from "./map-copy";
import { TourOverview, TourStopContent } from "./TourContent";
import { tourCopy } from "./tour-copy";
import {
  readTourProgress,
  saveTourProgress,
  selectTourStop,
  toggleTourVisit,
} from "./tour-progress";
import type { MapMode, MapRequest } from "./map-context";
import type { PlaceCategory } from "./map.types";
import "./artwork.css";
import "./resort-map.css";

const photoParent = (id: string) => photoSpots.find((p) => p.id === id)?.parentId;
const modes = [
  { id: "explore", Icon: Compass },
  { id: "photos", Icon: Camera },
  { id: "walk", Icon: Footprints },
  { id: "tour", Icon: Sparkles },
] as const;

export default function ResortMap({
  request,
  onClose,
  onDestination,
}: Readonly<{
  request: MapRequest & { revision: number };
  onClose: () => void;
  onDestination: (id: string) => void;
}>) {
  const { mapPlaces, mapLinks, destinations } = useHub();
  const { lang, t, cluster, levelLabel, typeLabel } = useI18n();
  const copy = useCallback((key: Parameters<typeof mapCopy>[1]) => mapCopy(lang, key), [lang]);
  const places = useMemo(
    () => liveMapPlaces(mapPlaces, mapLinks, destinations),
    [mapPlaces, mapLinks, destinations],
  );
  const [selectedId, setSelectedId] = useState<string | null>(request.placeId ?? null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [mode, setMode] = useState<MapMode>(request.mode ?? "explore");
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [tourProgress, setTourProgress] = useState(readTourProgress);
  const [tourView, setTourView] = useState<"intro" | "stop" | "closed">("intro");
  const appliedRequest = useRef<number | null>(null);
  useEffect(() => saveTourProgress(tourProgress), [tourProgress]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [options, setOptions] = useState(false);
  const [reference, setReference] = useState(false);
  const [collection, setCollection] = useState<PlaceCategory | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const { camera, onViewportChange, focusOn, zoomBy, fit, allowPlaceClick, handlers } =
    useMapCamera();
  const selected = places.find((p) => p.id === selectedId);
  const photoDestinationId =
    mode === "photos" ? photoSpots.find((spot) => spot.id === photoId)?.destinationId : undefined;
  const photoGuide = destinations.find(
    (destination) => destination.id === "instagram-spots" && destination.active,
  );
  const tourStops = useMemo(
    () => bensleyTour.filter((s) => places.some((p) => p.id === s.placeId)),
    [places],
  );
  const tourIndex = Math.max(
    0,
    tourStops.findIndex((stop) => stop.placeId === tourProgress.currentId),
  );
  const tourStop = tourStops[tourIndex];
  const tourIntro = mode === "tour" && tourView === "intro";
  const previewPlace = tourIntro
    ? places.find((place) => place.id === tourStops[0]?.placeId)
    : selected;
  const related = useMemo(() => {
    const linked = previewPlace ? linkedDestinations(previewPlace.id, mapLinks, destinations) : [];
    return photoDestinationId
      ? linked.filter((destination) => destination.id === photoDestinationId)
      : linked;
  }, [previewPlace, mapLinks, destinations, photoDestinationId]);
  const filtered = useMemo(
    () =>
      places.filter(
        (p) =>
          (!level ||
            p.coveredLevels.includes(level) ||
            (!p.accommodationGroup &&
              linkedDestinations(p.id, mapLinks, destinations).some((d) => d.level === level)) ||
            p.level === level) &&
          (!collection || p.categories.includes(collection)),
      ),
    [places, level, collection, mapLinks, destinations],
  );
  const visibleIds = useMemo(() => new Set(filtered.map((p) => p.id)), [filtered]);
  const filters = useMemo(
    () => new Set<PlaceCategory>(collection ? [collection] : []),
    [collection],
  );
  const select = useCallback(
    (id: string) => {
      const place = places.find((p) => p.id === id);
      if (!place) return;
      setSelectedId(id);
      setSelectedStation(null);
      setSearchOpen(false);
      setOptions(false);
      // Keep accommodation zones wider than individual venues.
      focusOn(place.focus, Math.max(place.focus.zoom, place.accommodationGroup ? 2.4 : 3.4));
    },
    [places, focusOn],
  );
  useEffect(() => {
    // Card navigation refreshes the catalogue, but is not a new map request.
    // Keep the current tour, selection and camera until openMap is called again.
    if (appliedRequest.current === request.revision || places.length === 0) return;
    appliedRequest.current = request.revision;
    setSelectedStation(null);
    setMode(request.mode ?? "explore");
    setPhotoId(null);
    setCollection(null);
    setLevel(null);
    setTourView("intro");
    const id = request.mode === "tour" ? undefined : request.placeId;
    if (id) select(id);
    else {
      setSelectedId(null);
      fit();
    }
  }, [request, select, fit, places.length]);
  const changeMode = (next: MapMode) => {
    setSelectedStation(null);
    setMode(next);
    setSelectedId(null);
    setPhotoId(null);
    setCollection(null);
    setLevel(null);
    setSearchOpen(false);
    setOptions(false);
    setTourView("intro");
    fit();
  };
  const tourStep = (id: string) => {
    if (!tourStops.some((stop) => stop.placeId === id)) return;
    setTourProgress((current) => selectTourStop(current, id));
    setTourView("stop");
    select(id);
  };
  const tourOverview = () => {
    setTourView("intro");
    setSelectedId(null);
    setSelectedStation(null);
    fit();
  };
  const choosePhoto = (id: string) => {
    if (!allowPlaceClick()) return;
    setSelectedStation(null);
    const spot = photoSpots.find((p) => p.id === id);
    if (!spot) return;
    setPhotoId(id);
    setSelectedId(photoParent(id) ?? null);
    focusOn(spot.point, 2.1);
  };
  const applyLevel = (next: Level | null) => {
    setSelectedStation(null);
    setLevel(next);
    setSelectedId(null);
    setOptions(false);
    fit();
  };
  let previewKicker: string | undefined;
  if (mode === "photos") previewKicker = `${copy("photos")} ${photoId ?? ""}`;
  else if (mode === "tour")
    previewKicker = `${copy("tour")} · ${tourIndex + 1}/${tourStops.length}`;
  let previewTitle = previewPlace?.name ?? "";
  if (tourIntro) previewTitle = copy("tour");
  else if (previewPlace?.accommodationGroup) previewTitle = copy(previewPlace.accommodationGroup);
  else if (photoDestinationId && related[0]) previewTitle = related[0].name;
  let previewMetadata: string | undefined;
  if (mode === "tour" && previewPlace) {
    previewMetadata = tourIntro
      ? tourCopy(lang, "selfGuided")
      : `${previewKicker} · ${levelLabel(previewPlace.level)}`;
  }
  const hasPreview = !!previewPlace && !searchOpen;
  const chooseSearchResult = (destination: Destination) => {
    const placeId = destinationPlace(destination.id, mapLinks, mapPlaces);
    if (!placeId) {
      onDestination(destination.id);
      return;
    }
    setMode("explore");
    setCollection(null);
    setLevel(null);
    select(placeId);
  };

  return (
    <div className="hub-atlas">
      <header className="atlas-header">
        <button type="button" onClick={onClose} aria-label={copy("close")}>
          <X size={20} strokeWidth={1.4} aria-hidden />
        </button>
        <h2>{copy("title")}</h2>
        <SearchTrigger compact onOpen={() => setSearchOpen(true)} />
        <ConciergeContact className="relative" />
        <button
          type="button"
          aria-label={copy("layers")}
          aria-expanded={options}
          onClick={() => setOptions((current) => !current)}
        >
          <Layers size={19} strokeWidth={1.4} aria-hidden />
        </button>
      </header>
      {places.length === 0 ? (
        <output className="atlas-empty">{copy("unavailable")}</output>
      ) : (
        <>
          <div className="atlas-canvas">
            <MapArtwork
              camera={camera}
              places={places}
              visibleIds={visibleIds}
              selectedId={selectedId}
              selectedStation={selectedStation}
              activeFilters={filters}
              mode={mode === "tour" ? "tour" : "explore"}
              activeTourIndex={
                tourIntro || tourView === "closed"
                  ? -1
                  : bensleyTour.findIndex((stop) => stop.placeId === tourStop?.placeId)
              }
              visitedTourIds={tourProgress.visited}
              nextTourId={tourView === "stop" ? tourStops[tourIndex + 1]?.placeId : undefined}
              referenceVisible={reference}
              photosVisible={mode === "photos"}
              selectedPhotoId={photoId}
              previewVisible={hasPreview}
              layers={{
                trail: mode === "walk",
                walking: mode === "walk",
              }}
              onSelectPhoto={choosePhoto}
              onSelectStation={(station) => {
                if (allowPlaceClick())
                  setSelectedStation((current) => (current === station ? null : station));
              }}
              onViewportChange={onViewportChange}
              onSelectPlace={(id) => {
                if (allowPlaceClick()) {
                  if (mode === "tour") {
                    const i = tourStops.findIndex((s) => s.placeId === id);
                    if (i >= 0) {
                      tourStep(id);
                      return;
                    } else setMode("explore");
                  }
                  select(id);
                }
              }}
              interactionProps={{
                ...handlers,
                tabIndex: 0,
                "aria-label": copy("gestures"),
                onClick: (event) => {
                  if (
                    event.target instanceof Element &&
                    !event.target.closest('[role="button"]') &&
                    allowPlaceClick()
                  )
                    setSelectedStation(null);
                },
                onKeyDown: (event) => {
                  if (event.key === "Home" || event.key === "0") setSelectedStation(null);
                  handlers.onKeyDown(event);
                },
              }}
            />
          </div>
          {options && (
            <section className="atlas-options" aria-label={copy("layers")}>
              <button
                type="button"
                aria-pressed={reference}
                onClick={() => setReference(!reference)}
              >
                {reference ? copy("illustrated") : copy("official")}
              </button>
              <div className="atlas-levels">
                <button type="button" aria-pressed={!level} onClick={() => applyLevel(null)}>
                  {copy("all")}
                </button>
                {LEVELS.map((l) => (
                  <button
                    type="button"
                    key={l.id}
                    aria-pressed={level === l.id}
                    onClick={() => applyLevel(l.id)}
                  >
                    {levelLabel(l.id)}
                  </button>
                ))}
              </div>
            </section>
          )}
          <div className="atlas-zoom">
            <button type="button" aria-label={copy("zoomIn")} onClick={() => zoomBy(0.35)}>
              <Plus size={18} />
            </button>
            <button type="button" aria-label={copy("zoomOut")} onClick={() => zoomBy(-0.35)}>
              <Minus size={18} />
            </button>
            <button
              type="button"
              aria-label={copy("fit")}
              onClick={() => {
                setSelectedStation(null);
                fit();
              }}
            >
              <LocateFixed size={18} />
            </button>
          </div>
          {mode === "walk" && !hasPreview && <p className="atlas-context">{copy("walkNote")}</p>}
          {mode === "tour" && !hasPreview && !searchOpen && tourStops.length > 0 && (
            <button type="button" className="atlas-photo-guide" onClick={tourOverview}>
              {tourCopy(lang, "resume")}
              <ArrowUpRight size={18} aria-hidden />
            </button>
          )}
          {mode === "photos" && !hasPreview && !searchOpen && photoGuide && (
            <button
              type="button"
              className="atlas-photo-guide"
              onClick={() => onDestination(photoGuide.id)}
            >
              <span>{photoGuide.name}</span>
              <ArrowUpRight size={18} aria-hidden />
            </button>
          )}
          {hasPreview && previewPlace && (
            <MapPreview
              key={`${previewPlace.id}:${photoId ?? ""}:${tourIntro}`}
              anchor={
                mode === "photos"
                  ? (photoSpots.find((spot) => spot.id === photoId)?.point ?? previewPlace.point)
                  : previewPlace.point
              }
              camera={camera}
              title={previewTitle}
              area={previewPlace.accommodationGroup ? previewPlace : undefined}
              destinations={related}
              onDestination={onDestination}
              onClose={() => {
                setSelectedId(null);
                setPhotoId(null);
                setTourView("closed");
              }}
              kicker={previewKicker}
              metadata={previewMetadata}
            >
              {mode === "tour" &&
                (tourIntro ? (
                  <TourOverview
                    stops={tourStops}
                    places={places}
                    progress={tourProgress}
                    onSelect={tourStep}
                  />
                ) : (
                  tourStop && (
                    <TourStopContent
                      stops={tourStops}
                      places={places}
                      progress={tourProgress}
                      onSelect={tourStep}
                      stop={tourStop}
                      destinations={related}
                      onDestination={onDestination}
                      onVisit={(id) => setTourProgress((current) => toggleTourVisit(current, id))}
                      onOverview={tourOverview}
                    />
                  )
                ))}
            </MapPreview>
          )}
          <div className="atlas-bottom">
            {mode === "explore" && !hasPreview && !searchOpen && (
              <div className="atlas-collections" aria-label={t("collections")}>
                {(["dining", "wellness", "experiences", "accommodation"] as const).map((c) => (
                  <button
                    type="button"
                    aria-pressed={collection === c}
                    key={c}
                    onClick={() => {
                      setSelectedStation(null);
                      setCollection(collection === c ? null : c);
                      fit();
                    }}
                  >
                    {c === "accommodation" ? typeLabel("accommodation") : cluster(c.toUpperCase())}
                  </button>
                ))}
              </div>
            )}
            <nav className="atlas-dock" aria-label={copy("title")}>
              {modes.map(({ id, Icon }) => (
                <button
                  type="button"
                  key={id}
                  aria-pressed={mode === id}
                  onClick={() => changeMode(id)}
                >
                  <Icon size={18} />
                  <span>{copy(id)}</span>
                </button>
              ))}
            </nav>
          </div>
          <p className="atlas-footnote">{copy("note")}</p>
        </>
      )}
      {searchOpen && (
        <SearchDialog
          placesOnly
          onClose={() => setSearchOpen(false)}
          onSelectDestination={chooseSearchResult}
        />
      )}
    </div>
  );
}
