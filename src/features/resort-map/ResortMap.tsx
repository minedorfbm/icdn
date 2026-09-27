import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Footprints,
  Layers,
  LocateFixed,
  Minus,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useHub } from "@/data/hub-context";
import { useI18n } from "@/i18n";
import { LEVELS, type Destination, type Level } from "@/data/resort";
import { MapArtwork } from "./MapArtwork";
import { useMapCamera } from "./useMapCamera";
import { linkedDestinations, liveMapPlaces } from "./map-links";
import { photoSpots } from "./map.legend";
import { bensleyTour } from "./map.data";
import { mapCopy } from "./map-copy";
import type { MapMode, MapRequest } from "./map-context";
import type { PlaceCategory } from "./map.types";
import "./artwork.css";
import "./resort-map.css";

const photoParent = (id: string) => photoSpots.find((p) => p.id === id)?.parentId;
const normalized = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
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
  const { lang, t, cluster, levelLabel } = useI18n();
  const copy = useCallback((key: Parameters<typeof mapCopy>[1]) => mapCopy(lang, key), [lang]);
  const places = useMemo(
    () => liveMapPlaces(mapPlaces, mapLinks, destinations),
    [mapPlaces, mapLinks, destinations],
  );
  const [selectedId, setSelectedId] = useState<string | null>(request.placeId ?? null);
  const [mode, setMode] = useState<MapMode>(request.mode ?? "explore");
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [tourIndex, setTourIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [options, setOptions] = useState(false);
  const [reference, setReference] = useState(false);
  const [collection, setCollection] = useState<PlaceCategory | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { camera, onViewportChange, focusOn, zoomBy, fit, allowPlaceClick, handlers } =
    useMapCamera();
  const selected = places.find((p) => p.id === selectedId);
  const related = useMemo(
    () => (selectedId ? linkedDestinations(selectedId, mapLinks, destinations) : []),
    [selectedId, mapLinks, destinations],
  );
  const tourStops = useMemo(
    () => bensleyTour.filter((s) => places.some((p) => p.id === s.placeId)),
    [places],
  );
  const filtered = useMemo(
    () =>
      places.filter(
        (p) =>
          (!level ||
            linkedDestinations(p.id, mapLinks, destinations).some((d) => d.level === level) ||
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
  const results = useMemo(() => {
    const term = normalized(query.trim());
    return filtered.flatMap((place) => {
      const cards = linkedDestinations(place.id, mapLinks, destinations);
      const entries = cards.length
        ? cards.map((d) => ({
            placeId: place.id,
            destinationId: d.id,
            name: d.name,
            level: d.level,
          }))
        : [{ placeId: place.id, destinationId: "", name: place.name, level: place.level }];
      return entries.filter((item) => !term || normalized(item.name).includes(term));
    });
  }, [query, filtered, mapLinks, destinations]);
  const select = useCallback(
    (id: string) => {
      const place = places.find((p) => p.id === id);
      if (!place) return;
      setSelectedId(id);
      setSearchOpen(false);
      setOptions(false);
      setQuery("");
      focusOn(place.focus, place.focus.zoom);
    },
    [places, focusOn],
  );
  useEffect(() => {
    setMode(request.mode ?? "explore");
    setPhotoId(null);
    setCollection(null);
    setLevel(null);
    setTourIndex(0);
    const id = request.mode === "tour" ? tourStops[0]?.placeId : request.placeId;
    if (id) select(id);
    else {
      setSelectedId(null);
      focusOn({ x: 800, y: 450 }, 1.25);
    }
  }, [request, select, focusOn, tourStops]);
  const changeMode = (next: MapMode) => {
    setMode(next);
    setSelectedId(null);
    setPhotoId(null);
    setCollection(null);
    setLevel(null);
    setSearchOpen(false);
    setOptions(false);
    setTourIndex(0);
    if (next === "tour" && tourStops[0]) select(tourStops[0].placeId);
    else fit();
  };
  const tourStep = (index: number) => {
    const stop = tourStops[index];
    if (!stop) return;
    setTourIndex(index);
    select(stop.placeId);
  };
  const choosePhoto = (id: string) => {
    if (!allowPlaceClick()) return;
    const spot = photoSpots.find((p) => p.id === id);
    if (!spot) return;
    setPhotoId(id);
    setSelectedId(photoParent(id) ?? null);
    focusOn(spot.point, 2.1);
  };
  const applyLevel = (next: Level | null) => {
    setLevel(next);
    setSelectedId(null);
    setOptions(false);
    fit();
  };
  const hasPreview = !!selected && !searchOpen;

  return (
    <div className="hub-atlas" data-detail={hasPreview}>
      <header className="atlas-header">
        <div>
          <span>INTERCONTINENTAL DANANG</span>
          <h2>{copy("title")}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label={copy("close")}>
          <X size={20} />
        </button>
      </header>
      {places.length === 0 ? (
        <div className="atlas-empty" role="status">
          {copy("unavailable")}
        </div>
      ) : (
        <>
          <div className="atlas-canvas">
            <MapArtwork
              camera={camera}
              places={places}
              visibleIds={visibleIds}
              selectedId={selectedId}
              activeFilters={filters}
              mode={mode === "tour" ? "tour" : "explore"}
              activeTourIndex={tourIndex}
              referenceVisible={reference}
              photosVisible={mode === "photos"}
              selectedPhotoId={photoId}
              layers={{
                trail: mode === "walk",
                walking: mode === "walk",
              }}
              onSelectPhoto={choosePhoto}
              onViewportChange={onViewportChange}
              onSelectPlace={(id) => {
                if (allowPlaceClick()) {
                  if (mode === "tour") {
                    const i = tourStops.findIndex((s) => s.placeId === id);
                    if (i >= 0) setTourIndex(i);
                    else setMode("explore");
                  }
                  select(id);
                }
              }}
              interactionProps={{ ...handlers, tabIndex: 0, "aria-label": copy("gestures") }}
            />
          </div>
          <div className="atlas-tools">
            <div className="atlas-search">
              <Search size={18} />
              <input
                ref={searchRef}
                aria-label={copy("search")}
                placeholder={copy("search")}
                value={query}
                onFocus={() => {
                  setSearchOpen(true);
                  setOptions(false);
                }}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setSearchOpen(false);
                    searchRef.current?.blur();
                  }
                }}
              />
              {searchOpen && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setQuery("");
                    searchRef.current?.blur();
                  }}
                  aria-label={t("close")}
                >
                  <X size={17} />
                </button>
              )}
            </div>
            <button
              className="atlas-tool"
              type="button"
              aria-label={copy("layers")}
              aria-expanded={options}
              onClick={() => {
                setOptions(!options);
                setSearchOpen(false);
              }}
            >
              <Layers size={19} />
            </button>
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
          {searchOpen && (
            <section className="atlas-results" aria-label={copy("search")}>
              <p aria-live="polite">
                {results.length} · {copy("all")}
              </p>
              {results.map((r) => (
                <button
                  type="button"
                  key={`${r.placeId}/${r.destinationId}`}
                  onClick={() => {
                    searchRef.current?.blur();
                    setMode("explore");
                    select(r.placeId);
                  }}
                >
                  <span>
                    {r.name}
                    <small>{levelLabel(r.level)}</small>
                  </span>
                  <ChevronRight size={16} />
                </button>
              ))}
              {results.length === 0 && <p>{copy("noResults")}</p>}
            </section>
          )}
          <div className="atlas-zoom">
            <button type="button" aria-label={copy("zoomIn")} onClick={() => zoomBy(0.35)}>
              <Plus size={18} />
            </button>
            <button type="button" aria-label={copy("zoomOut")} onClick={() => zoomBy(-0.35)}>
              <Minus size={18} />
            </button>
            <button type="button" aria-label={copy("fit")} onClick={fit}>
              <LocateFixed size={18} />
            </button>
          </div>
          {mode === "walk" && !hasPreview && <p className="atlas-context">{copy("walkNote")}</p>}
          {mode === "photos" && !hasPreview && (
            <div className="atlas-photo-index" aria-label={copy("photos")}>
              {photoSpots.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => choosePhoto(p.id)}
                  aria-label={`${copy("photos")} ${p.id}`}
                >
                  {p.id}
                </button>
              ))}
            </div>
          )}
          {hasPreview && (
            <MapPreview
              key={selected.id}
              title={selected.name}
              destinations={related}
              onDestination={onDestination}
              onClose={() => {
                setSelectedId(null);
                setPhotoId(null);
              }}
              kicker={
                mode === "photos"
                  ? `${copy("photos")} ${photoId ?? ""}`
                  : mode === "tour"
                    ? `${copy("tour")} · ${tourIndex + 1}/${tourStops.length}`
                    : undefined
              }
            >
              {mode === "tour" && (
                <>
                  <p className="atlas-tour-note">{copy("tourNote")}</p>
                  <div className="atlas-tour-controls">
                    <button
                      type="button"
                      disabled={tourIndex === 0}
                      onClick={() => tourStep(tourIndex - 1)}
                    >
                      <ChevronLeft size={16} />
                      {copy("previous")}
                    </button>
                    <button
                      type="button"
                      disabled={tourIndex === tourStops.length - 1}
                      onClick={() => tourStep(tourIndex + 1)}
                    >
                      {copy("next")}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </>
              )}
            </MapPreview>
          )}
          <div className="atlas-bottom">
            {mode === "explore" && !hasPreview && !searchOpen && (
              <div className="atlas-collections" aria-label={t("collections")}>
                {(["dining", "wellness", "experiences"] as const).map((c) => (
                  <button
                    type="button"
                    aria-pressed={collection === c}
                    key={c}
                    onClick={() => {
                      setCollection(collection === c ? null : c);
                      fit();
                    }}
                  >
                    {cluster(c.toUpperCase())}
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
    </div>
  );
}

function MapPreview({
  title,
  destinations,
  onDestination,
  onClose,
  kicker,
  children,
}: Readonly<{
  title: string;
  destinations: Destination[];
  onDestination: (id: string) => void;
  onClose: () => void;
  kicker: string | undefined;
  children: React.ReactNode;
}>) {
  const { lang, description, levelLabel } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const primary = destinations[0];
  return (
    <section className="atlas-preview" data-expanded={expanded} aria-label={title}>
      <button
        type="button"
        className="atlas-preview-close"
        onClick={onClose}
        aria-label={mapCopy(lang, "dismiss")}
      >
        <X size={18} />
      </button>
      <div className="atlas-preview-heading">
        {primary && <img src={primary.image} alt="" width={64} height={64} decoding="async" />}
        <div>
          <p>{kicker ?? (primary ? levelLabel(primary.level) : mapCopy(lang, "landmark"))}</p>
          <h3>{title}</h3>
        </div>
      </div>
      {primary && (
        <>
          <button
            type="button"
            className="atlas-discover"
            onClick={() => onDestination(primary.id)}
          >
            {mapCopy(lang, "discover")}
            <ArrowUpRight size={17} />
          </button>
          <button
            type="button"
            className="atlas-expand"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {mapCopy(lang, expanded ? "collapse" : "expand")}
            <ChevronDown size={16} />
          </button>
          {expanded && (
            <p className="atlas-description">
              {description(primary.id, primary.short_description)}
            </p>
          )}
        </>
      )}
      {destinations.length > 1 && (
        <div className="atlas-related">
          <p>{mapCopy(lang, "here")}</p>
          {destinations.slice(1).map((d) => (
            <button type="button" key={d.id} onClick={() => onDestination(d.id)}>
              {d.name}
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
      )}
      {children}
    </section>
  );
}
