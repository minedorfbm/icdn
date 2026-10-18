import { useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, ChevronDown, X } from "lucide-react";
import { useI18n } from "@/i18n";
import type { Destination } from "@/data/resort";
import { mapCopy } from "./map-copy";
import type { MapCamera } from "./map-camera";
import { useMapBubblePosition } from "./useMapBubblePosition";
import "./map-preview.css";
import type { MapPoint, Place } from "./map.types";

export function MapPreview({
  title,
  anchor,
  camera,
  destinations,
  onDestination,
  onClose,
  kicker,
  area,
  metadata,
  children,
}: Readonly<{
  title: string;
  anchor: MapPoint;
  camera: MapCamera;
  destinations: Destination[];
  onDestination: (id: string) => void;
  onClose: () => void;
  kicker: string | undefined;
  area?: Place | undefined;
  metadata?: string | undefined;
  children?: ReactNode;
}>) {
  const { lang, description, levelLabel, typeLabel } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const dragStart = useRef<number | null>(null);
  const dragged = useRef(false);
  const primary = destinations[0];
  const [failedImage, setFailedImage] = useState<string>();
  const photoFailed = failedImage === primary?.image;
  const previewRef = useRef<HTMLElement>(null);
  useMapBubblePosition(previewRef, anchor, camera);
  let previewKicker = primary ? levelLabel(primary.level) : mapCopy(lang, "landmark");
  if (primary) previewKicker += ` · ${typeLabel(primary.type)}`;
  if (area)
    previewKicker = `${area.coveredLevels.map((level) => levelLabel(level)).join(" / ")} · ${mapCopy(lang, "accommodation")}`;
  let numberLabel: "roomNumbers" | "penthouseNumbers" | "villaNumbers" = "villaNumbers";
  if (area?.accommodationGroup === "rooms") numberLabel = "roomNumbers";
  else if (area?.accommodationGroup === "penthouses") numberLabel = "penthouseNumbers";
  return (
    <section
      ref={previewRef}
      className="atlas-preview"
      data-expanded={expanded}
      data-photo={!!primary && !photoFailed}
      aria-label={title}
    >
      <div className="atlas-preview-background" aria-hidden="true">
        {primary && !photoFailed && (
          <img
            key={primary.image}
            src={primary.image}
            alt=""
            decoding="async"
            style={{ objectPosition: primary.imagePosition }}
            onError={() => setFailedImage(primary.image)}
          />
        )}
      </div>
      <div className="atlas-preview-surface">
        <div className="atlas-preview-header">
          {children ? (
            <p className="atlas-preview-meta">
              {metadata ?? (kicker ? `${kicker} · ${previewKicker}` : previewKicker)}
            </p>
          ) : (
            <button
              type="button"
              className="atlas-sheet-handle"
              aria-label={mapCopy(lang, expanded ? "collapse" : "expand")}
              aria-expanded={expanded}
              onPointerDown={(event) => {
                dragStart.current = event.clientY;
                dragged.current = false;
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerUp={(event) => {
                if (dragStart.current !== null) {
                  const delta = event.clientY - dragStart.current;
                  dragged.current = Math.abs(delta) > 24;
                  if (dragged.current) setExpanded(delta < 0);
                }
                dragStart.current = null;
              }}
              onPointerCancel={() => {
                dragStart.current = null;
                dragged.current = false;
              }}
              onClick={() => {
                if (!dragged.current) setExpanded((value) => !value);
                dragged.current = false;
              }}
            >
              <span>{kicker ? `${kicker} · ${previewKicker}` : previewKicker}</span>
              <ChevronDown size={12} aria-hidden />
            </button>
          )}
          <button
            type="button"
            className="atlas-preview-close"
            onClick={onClose}
            aria-label={mapCopy(lang, "dismiss")}
          >
            <X size={18} />
          </button>
        </div>
        <div className="atlas-preview-heading">
          <h3>{title}</h3>
        </div>
        {children || (
          <>
            {area?.roomNumbers && (
              <p className="atlas-description">
                {mapCopy(lang, numberLabel)}: {area.roomNumbers}
              </p>
            )}
            {primary && !area && (
              <>
                {!expanded && (
                  <p className="atlas-preview-summary">
                    {description(primary.id, primary.short_description)}
                  </p>
                )}
                <button
                  type="button"
                  className="atlas-discover"
                  onClick={() => onDestination(primary.id)}
                >
                  {mapCopy(lang, "discover")}
                  <ArrowUpRight size={17} />
                </button>
                {expanded && (
                  <p className="atlas-description">
                    {description(primary.id, primary.short_description)}
                  </p>
                )}
              </>
            )}
            {(area || destinations.length > 1) && (
              <div className="atlas-related">
                <p>{mapCopy(lang, area ? "accommodation" : "here")}</p>
                {(area ? destinations : destinations.slice(1)).map((d) => (
                  <button type="button" key={d.id} onClick={() => onDestination(d.id)}>
                    {d.name}
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
