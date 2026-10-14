import { useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, ChevronDown, X } from "lucide-react";
import { useI18n } from "@/i18n";
import type { Destination } from "@/data/resort";
import { mapCopy } from "./map-copy";
import type { Place } from "./map.types";

export function MapPreview({
  title,
  destinations,
  onDestination,
  onClose,
  kicker,
  area,
  children,
}: Readonly<{
  title: string;
  destinations: Destination[];
  onDestination: (id: string) => void;
  onClose: () => void;
  kicker: string | undefined;
  area?: Place | undefined;
  children: ReactNode;
}>) {
  const { lang, description, levelLabel } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const dragStart = useRef<number | null>(null);
  const dragged = useRef(false);
  const primary = destinations[0];
  let previewKicker = primary ? levelLabel(primary.level) : mapCopy(lang, "landmark");
  if (area) previewKicker = area.coveredLevels.map((level) => levelLabel(level)).join(" / ");
  let numberLabel: "roomNumbers" | "penthouseNumbers" | "villaNumbers" = "villaNumbers";
  if (area?.accommodationGroup === "rooms") numberLabel = "roomNumbers";
  else if (area?.accommodationGroup === "penthouses") numberLabel = "penthouseNumbers";
  return (
    <section className="atlas-preview" data-expanded={expanded} aria-label={title}>
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
        <span aria-hidden="true" />
      </button>
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
          <p>{kicker ?? previewKicker}</p>
          <h3>{title}</h3>
        </div>
      </div>
      {area?.roomNumbers && (
        <p className="atlas-description">
          {mapCopy(lang, numberLabel)}: {area.roomNumbers}
        </p>
      )}
      {primary && !area && (
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
      {children}
    </section>
  );
}
