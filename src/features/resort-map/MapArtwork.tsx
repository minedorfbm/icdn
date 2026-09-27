/* oxlint-disable jsx-a11y/prefer-tag-over-role -- interactive SVG hotspots cannot be HTML buttons. */
import { useLayoutEffect, useMemo, useRef, useState, type SVGProps, type MouseEvent } from "react";
import { Compass, MapPin, Sparkles, Utensils } from "lucide-react";
import { ArchitectureArtwork } from "./ArchitectureArtwork";
import { bensleyTour } from "./map.data";
import { useI18n } from "@/i18n";
import { mapCopy } from "./map-copy";
import {
  MAP_SIZE,
  REFERENCE_IMAGE,
  beach,
  cliff,
  coast,
  landmass as LANDMASS,
  levelRoads,
  palms,
  stations,
  tourSegments,
  trace,
  trailEast,
  trailInterior,
  trailWest,
  tramAxis,
} from "./map.geometry";
import type { PlaceCategory, Place } from "./map.types";
import type { MapCamera } from "./useMapCamera";
import { photoSpots, walkingTimes, type LegendLayers } from "./map.legend";

const collectionIcons = {
  dining: Utensils,
  wellness: Sparkles,
  experiences: Compass,
  beach: MapPin,
  bensley: Compass,
};

type MapArtworkProps = {
  places: Place[];
  visibleIds: Set<string>;
  camera: MapCamera;
  selectedId: string | null;
  activeFilters: Set<PlaceCategory>;
  mode: "explore" | "tour";
  activeTourIndex: number;
  referenceVisible: boolean;
  photosVisible: boolean;
  selectedPhotoId: string | null;
  layers: LegendLayers;
  onSelectPhoto: (id: string) => void;
  onViewportChange: (viewport: ViewBox) => void;
  onSelectPlace: (id: string) => void;
  interactionProps: SVGProps<SVGSVGElement>;
};

type ViewBox = { x: number; y: number; width: number; height: number };

export function MapArtwork({
  camera,
  places,
  visibleIds,
  selectedId,
  activeFilters,
  mode,
  activeTourIndex,
  referenceVisible,
  photosVisible,
  selectedPhotoId,
  layers,
  onSelectPhoto,
  onViewportChange,
  onSelectPlace,
  interactionProps,
}: Readonly<MapArtworkProps>) {
  const { lang, levelLabel } = useI18n();
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState<ViewBox>({ x: 0, y: 0, ...MAP_SIZE });
  const [pixelScale, setPixelScale] = useState(1);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const update = () => {
      const { width, height } = svg.getBoundingClientRect();
      if (!width || !height) return;
      const ratio = width / height;
      const nextWidth = ratio > 1.5 ? MAP_SIZE.height * ratio : MAP_SIZE.width;
      const nextHeight = nextWidth / ratio;
      const next = {
        x: (MAP_SIZE.width - nextWidth) / 2,
        y: (MAP_SIZE.height - nextHeight) / 2,
        width: nextWidth,
        height: nextHeight,
      };
      setViewBox(next);
      setPixelScale(nextWidth / width);
      onViewportChange(next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(svg);
    return () => observer.disconnect();
  }, [onViewportChange]);

  const hotspotsRef = useRef<SVGGElement>(null);
  const interactivePlaces = useMemo(
    () =>
      places.filter(
        (place) =>
          visibleIds.has(place.id) &&
          (activeFilters.size === 0 ||
            place.categories.some((category) => activeFilters.has(category))) &&
          (mode !== "tour" || bensleyTour.some((stop) => stop.placeId === place.id)),
      ),
    [places, visibleIds, activeFilters, mode],
  );
  const selectNearestPlace = (event: MouseEvent<SVGGElement>, fallback: Place) => {
    const matrix = hotspotsRef.current?.getScreenCTM();
    if (!matrix) return onSelectPlace(fallback.id);
    // Overlapping touch targets must prefer the marker nearest the finger.
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const distance = (place: Place) => Math.hypot(place.point.x - point.x, place.point.y - point.y);
    const nearest = interactivePlaces.reduce(
      (best, place) => (distance(place) < distance(best) ? place : best),
      fallback,
    );
    onSelectPlace(nearest.id);
  };

  const tramCar = useMemo(() => {
    const index = mode !== "tour" || activeTourIndex <= 2 ? 0 : Math.min(3, activeTourIndex - 2);
    return { ...stations[index], r: -72 };
  }, [activeTourIndex, mode]);

  return (
    <svg
      {...interactionProps}
      ref={svgRef}
      className={`resort-art ${referenceVisible ? "shows-reference" : ""}`}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      aria-labelledby="map-title map-description"
    >
      <title id="map-title">{mapCopy(lang, "title")}</title>
      <desc id="map-description">{mapCopy(lang, "note")}</desc>
      <defs>
        <linearGradient id="sea-gradient-v2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#031119" />
          <stop offset=".48" stopColor="#082b34" />
          <stop offset="1" stopColor="#0a3440" />
        </linearGradient>
        <radialGradient id="sea-light" cx="74%" cy="4%" r="84%">
          <stop offset="0" stopColor="#5c9ba3" stopOpacity=".26" />
          <stop offset=".44" stopColor="#174d58" stopOpacity=".09" />
          <stop offset="1" stopColor="#031119" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="forest-wash" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#0b2825" />
          <stop offset=".48" stopColor="#173e31" stopOpacity=".72" />
          <stop offset="1" stopColor="#285943" stopOpacity=".55" />
        </linearGradient>
        <linearGradient id="sand-gradient-v2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c7ae6b" stopOpacity="0" />
          <stop offset=".22" stopColor="#ead9a2" stopOpacity=".92" />
          <stop offset=".76" stopColor="#f0e4bd" stopOpacity=".78" />
          <stop offset="1" stopColor="#c7ae6b" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="wall-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5ead1" />
          <stop offset="1" stopColor="#bfae87" />
        </linearGradient>
        <linearGradient id="architecture-ivory" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff7df" />
          <stop offset=".55" stopColor="#e3d5b5" />
          <stop offset="1" stopColor="#b7a37e" />
        </linearGradient>
        <linearGradient id="architecture-shade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#cdbf9e" />
          <stop offset="1" stopColor="#81775f" />
        </linearGradient>
        <linearGradient id="architecture-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#223a3a" />
          <stop offset="1" stopColor="#08191f" />
        </linearGradient>
        <linearGradient id="lagoon-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#79aeb0" stopOpacity=".86" />
          <stop offset=".58" stopColor="#357b82" stopOpacity=".82" />
          <stop offset="1" stopColor="#173f49" stopOpacity=".9" />
        </linearGradient>
        <linearGradient id="copper-patina" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bd704c" />
          <stop offset=".35" stopColor="#7c8d72" />
          <stop offset=".72" stopColor="#3f8580" />
          <stop offset="1" stopColor="#244f52" />
        </linearGradient>
        <pattern
          id="charcoal-tiles"
          width="11"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="skewX(-18)"
        >
          <rect width="11" height="8" fill="#1a2d31" />
          <path d="M0 1h11M0 7h11M5.5 1v6" stroke="#7f8b83" strokeOpacity=".24" strokeWidth=".7" />
        </pattern>
        <pattern
          id="thatch-weave"
          width="9"
          height="9"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(18)"
        >
          <rect width="9" height="9" fill="#a98652" />
          <path d="M1 0v9M4 0v9M7 0v9" stroke="#ead29a" strokeOpacity=".36" strokeWidth=".8" />
        </pattern>
        <linearGradient id="coral-roof" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c76e55" />
          <stop offset="1" stopColor="#733d39" />
        </linearGradient>
        <linearGradient id="orchid-roof" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b28b9d" />
          <stop offset="1" stopColor="#634b65" />
        </linearGradient>
        <linearGradient id="jade-roof" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5c8668" />
          <stop offset="1" stopColor="#274c3a" />
        </linearGradient>
        <linearGradient id="terra-roof" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b85a42" />
          <stop offset="1" stopColor="#69372f" />
        </linearGradient>
        <pattern id="water-etch" width="82" height="38" patternUnits="userSpaceOnUse">
          <path
            d="M0 20Q19 5 41 20T82 20"
            fill="none"
            stroke="#b7d5d3"
            strokeOpacity=".07"
            strokeWidth="1"
          />
          <path
            d="M16 31q13-9 26 0t26 0"
            fill="none"
            stroke="#b7d5d3"
            strokeOpacity=".035"
            strokeWidth="1"
          />
        </pattern>
        <clipPath id="landmass-clip">
          <path d={LANDMASS} />
        </clipPath>
        <filter id="landmark-shadow" x="-60%" y="-60%" width="220%" height="240%">
          <feDropShadow dx="0" dy="9" stdDeviation="7" floodColor="#000" floodOpacity=".48" />
        </filter>
        <filter id="gold-glow-v2" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect
        x={viewBox.x - 120}
        y={viewBox.y - 120}
        width={viewBox.width + 240}
        height={viewBox.height + 240}
        fill="url(#sea-gradient-v2)"
      />
      <rect
        x={viewBox.x - 120}
        y={viewBox.y - 120}
        width={viewBox.width + 240}
        height={viewBox.height + 240}
        fill="url(#sea-light)"
      />
      <rect
        x={viewBox.x - 120}
        y={viewBox.y - 120}
        width={viewBox.width + 240}
        height={viewBox.height + 240}
        fill="url(#water-etch)"
      />

      <g
        className="map-scene"
        transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale})`}
      >
        <g className="illustrated-scene" visibility={referenceVisible ? "hidden" : "visible"}>
          <path className="forest-base" d={LANDMASS} fill="url(#forest-wash)" />
          <image
            className="canopy-texture"
            href="/resort-map/canopy.webp"
            x="0"
            y="0"
            width="1500"
            height="1100"
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#landmass-clip)"
          />
          <path className="forest-veil" d={LANDMASS} />

          <g className="terrain-contours" fill="none" aria-hidden="true">
            {[0, 18, 36, 58].map((offset) => (
              <path key={offset} d={cliff} transform={`translate(${-offset * 0.65} ${offset})`} />
            ))}
          </g>
          <path className="beach-ribbon-v2" d={beach} />
          <path className="shoreline-v2" d={coast} />
          <path className="shore-foam" d={coast} transform="translate(0 -4)" />
          <g className="map-paths" fill="none" strokeLinecap="round" aria-hidden="true">
            {[trailWest, trailInterior, trailEast].map((d) => (
              <g key={d}>
                <path className="path-shadow" d={d} />
                <path className="discovery-trail" d={d} />
              </g>
            ))}
            {levelRoads.map(({ id, d }) => (
              <path key={`${id}-${d}`} className={`level-road road-${id}`} d={d} />
            ))}
            <path
              className="entry-road"
              d={trace([
                [1650, 1350],
                [1680, 1400],
                [1700, 1490],
              ])}
            />
          </g>

          <ArchitectureArtwork
            places={places}
            cameraScale={camera.scale}
            selectedId={
              selectedId ??
              (photosVisible
                ? photoSpots.find((spot) => spot.id === selectedPhotoId)?.parentId
                : null) ??
              null
            }
            activeFilters={activeFilters}
            mode={mode}
          />

          <g className="palm-grove-v2" fill="none" aria-hidden="true">
            {palms.map(({ x, y, scale }) => (
              <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${scale})`}>
                <path d="M0 39Q-2 18 2 0" />
                <path d="M2 2q-22 0-31 17M2 2q21 1 32 17M2 2Q-9-16-25-11M2 2Q17-17 30-9M2 2Q1-17 8-25" />
              </g>
            ))}
          </g>

          <g className="level-cartouches" aria-hidden="true">
            <g transform="translate(472 490)">
              <path d="M0 0h126" />
              <text className="level-name" x="29" y="-10">
                {levelLabel("heaven")}
              </text>
            </g>
            <g transform="translate(445 374)">
              <path d="M0 0h95" />
              <text className="level-name" x="29" y="-10">
                {levelLabel("sky")}
              </text>
            </g>
            <g transform="translate(498 232)">
              <path d="M0 0h104" />
              <text className="level-name" x="29" y="-10">
                {levelLabel("earth")}
              </text>
            </g>
            <g transform="translate(880 404)">
              <path d="M0 0h96" />
              <text className="level-name" x="29" y="-10">
                {levelLabel("sea")}
              </text>
            </g>
            <text className="bay-title-v2" x="785" y="110">
              Bãi Bắc Bay
            </text>
            <text className="entrance-caption" x="927" y="847" textAnchor="end">
              RESORT ENTRANCE
            </text>
            <text className="lagoon-caption" x="1060" y="530" textAnchor="end">
              MI SOL LAGOON
            </text>
          </g>
        </g>
        {referenceVisible && (
          <image
            className="official-plan-layer"
            href="/resort-map/official.webp"
            {...REFERENCE_IMAGE}
            preserveAspectRatio="none"
          />
        )}

        {layers.trail && (
          <g className="trail-highlight" aria-label={mapCopy(lang, "walkNote")}>
            {[trailWest, trailInterior, trailEast].map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        )}
        {layers.walking && (
          <g className="walking-time-labels" aria-label={mapCopy(lang, "walkNote")}>
            {walkingTimes.map((time) => (
              <g
                key={`${time.point.x}-${time.point.y}`}
                transform={`translate(${time.point.x} ${time.point.y}) scale(${pixelScale / camera.scale})`}
              >
                <title>{time.minutes} min · Nam Tram</title>
                <rect x="-30" y="-11" width="60" height="22" rx="11" />
                <text textAnchor="middle" y="4">
                  {time.direction === "←" ? "← " : ""}
                  {time.minutes} min{time.direction === "→" ? " →" : ""}
                </text>
              </g>
            ))}
          </g>
        )}

        <g
          className={`nam-tram-axis-v2 ${referenceVisible ? "on-reference" : ""}`}
          aria-label="Nam Tram"
        >
          <path className="tram-glow" d={tramAxis} />
          <path className="tram-rail tram-rail-a" d={tramAxis} transform="translate(-2 -1)" />
          <path className="tram-rail tram-rail-b" d={tramAxis} transform="translate(2 1)" />
          <path className="tram-ties" d={tramAxis} />
          {stations.map(({ x, y, label }) => (
            <g className="tram-station-v2" key={label} transform={`translate(${x} ${y})`}>
              <circle className="station-outer" r="7" />
              <circle className="station-inner" r="2.8" />
              <g className="station-plaque" transform="translate(13 -4) scale(.8)">
                <rect width="72" height="22" rx="11" />
                <text x="10" y="14">
                  {levelLabel(label.toLowerCase())}
                </text>
              </g>
            </g>
          ))}
          <g
            className="tram-car-v2"
            transform={`translate(${tramCar.x} ${tramCar.y}) rotate(${tramCar.r}) scale(.48)`}
          >
            <path d="M-18 7Q0-22 18 7l-7 15h-22Z" />
            <path d="M-10 7h20M0-16V18" />
          </g>
        </g>

        <g className={`bensley-route-v2 ${mode === "tour" ? "is-visible" : ""}`} aria-hidden="true">
          {tourSegments.map((segment, index) => (
            <path
              key={segment.d}
              d={segment.d}
              className={`${segment.type} ${index < activeTourIndex ? "is-complete" : ""} ${index === activeTourIndex ? "is-current" : ""}`}
            />
          ))}
          {bensleyTour.map((stop, index) => {
            const place = places.find((candidate) => candidate.id === stop.placeId);
            if (!place) return null;
            return (
              <g
                key={stop.placeId}
                className={`tour-marker-v2 ${index === activeTourIndex ? "is-current" : ""} ${index < activeTourIndex ? "is-complete" : ""}`}
                transform={`translate(${place.point.x} ${place.point.y}) scale(${pixelScale / camera.scale})`}
              >
                <circle r="14" />
                <text textAnchor="middle" y="3.5">
                  {String(stop.order).padStart(2, "0")}
                </text>
              </g>
            );
          })}
        </g>

        <g
          ref={hotspotsRef}
          className="hotspots-v2"
          visibility={photosVisible ? "hidden" : "visible"}
          aria-hidden={photosVisible}
        >
          {places.map((place) => {
            const dimmed = !interactivePlaces.includes(place);
            const Icon = collectionIcons[place.categories[0] ?? "beach"];
            return (
              // SVG groups cannot be HTML buttons; keyboard behavior mirrors one.
              <g
                key={place.id}
                className={`hotspot-v2 ${place.id === selectedId ? "is-selected" : ""} ${dimmed ? "is-dimmed" : ""}`}
                transform={`translate(${place.point.x} ${place.point.y})`}
                role="button"
                tabIndex={photosVisible || dimmed ? -1 : 0}
                aria-label={`${place.name} · ${levelLabel(place.level)}`}
                aria-pressed={place.id === selectedId}
                aria-disabled={dimmed}
                onClick={(event) => {
                  if (!dimmed) selectNearestPlace(event, place);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (!dimmed) onSelectPlace(place.id);
                  }
                }}
              >
                <g transform={`scale(${pixelScale / camera.scale})`}>
                  <circle className="hotspot-hit" r="22" />
                  <circle className="hotspot-pulse" r="15" />
                  <circle className="hotspot-medallion" r="12" />
                  <Icon
                    className="hotspot-icon"
                    x={-7}
                    y={-7}
                    width={14}
                    height={14}
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />
                </g>
              </g>
            );
          })}
        </g>

        {photosVisible && (
          <g className="photo-hotspots" aria-label={mapCopy(lang, "photos")}>
            {photoSpots.map((spot) => (
              <g
                key={spot.id}
                role="button"
                tabIndex={0}
                aria-label={`${mapCopy(lang, "photos")} ${spot.id}`}
                aria-pressed={selectedPhotoId === spot.id}
                className={`photo-hotspot ${selectedPhotoId === spot.id ? "is-selected" : ""}`}
                transform={`translate(${spot.point.x} ${spot.point.y}) scale(${pixelScale / camera.scale})`}
                onClick={() => onSelectPhoto(spot.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectPhoto(spot.id);
                  }
                }}
              >
                <title>
                  {spot.id} ·{" "}
                  {places.find((place) => place.id === spot.parentId)?.name ??
                    mapCopy(lang, "photos")}
                </title>
                <circle className="photo-anchor" r="3" />
                <path className="photo-leader" d={`M0 0L${spot.offset.x} ${spot.offset.y}`} />
                <g transform={`translate(${spot.offset.x} ${spot.offset.y})`}>
                  <circle className="photo-hit" r="22" />
                  <rect className="photo-marker" x="-15" y="-17" width="30" height="34" rx="8" />
                  <text textAnchor="middle" y="5">
                    {spot.id}
                  </text>
                </g>
              </g>
            ))}
          </g>
        )}
      </g>
    </svg>
  );
}
