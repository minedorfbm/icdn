import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUpRight, Compass, Map as MapIcon, Sparkles } from "lucide-react";
import type { Destination } from "@/data/resort";
import { useHub } from "@/data/hub-context";
import { useI18n } from "@/i18n";
import { useResortMap } from "@/features/resort-map/map-context";
import tramIllustration from "@/assets/nam-tram-signature.webp";
import { discoveryCopy } from "./discovery-copy";
import { readDiscovery, restoreDiscovery, type SavedDiscovery } from "./surprise-order";
import { SurpriseDiscovery } from "./SurpriseDiscovery";
import "./discovery.css";

const STORAGE_KEY = "adj-discovery-v1";
const choices = [
  { key: "journey", note: "journeyNote", Icon: Compass, Arrow: ArrowDown },
  { key: "map", note: "mapNote", Icon: MapIcon, Arrow: ArrowUpRight },
  { key: "surprise", note: "surpriseNote", Icon: Sparkles, Arrow: ArrowUpRight },
] as const;

function ChoiceArtwork({
  kind,
  previews,
}: Readonly<{ kind: (typeof choices)[number]["key"]; previews: Destination[] }>) {
  if (kind === "journey")
    return (
      <span className="discovery-art discovery-tram" aria-hidden>
        <span className="discovery-tram-line" />
        <img src={tramIllustration} alt="" loading="lazy" width={160} height={120} />
      </span>
    );
  if (kind === "map")
    return (
      <span className="discovery-art discovery-map-art" aria-hidden>
        <img src="/resort-map/official.webp" alt="" loading="lazy" width={240} height={180} />
      </span>
    );
  return (
    <span className="discovery-art discovery-mini-deck" aria-hidden>
      {previews.map((card) => (
        <img key={card.id} src={card.image} alt="" loading="lazy" width={80} height={110} />
      ))}
    </span>
  );
}

export function DiscoveryPaths({ onJourney }: Readonly<{ onJourney: () => void }>) {
  const { destinations, levels } = useHub();
  const { lang } = useI18n();
  const { openMap } = useResortMap();
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const copy = (key: Parameters<typeof discoveryCopy>[1]) => discoveryCopy(lang, key);
  const items = useMemo(() => {
    const live = new Map(destinations.filter((d) => d.active).map((d) => [d.id, d]));
    return order.flatMap((id) => {
      const card = live.get(id);
      return card ? [card] : [];
    });
  }, [destinations, order]);
  const activeIndex = Math.min(index, Math.max(0, items.length - 1));
  const previews = useMemo(
    () =>
      levels
        .flatMap((level) => {
          const card = destinations.find((d) => d.active && d.level === level.id);
          return card ? [card] : [];
        })
        .slice(0, 3),
    [destinations, levels],
  );

  const openSurprise = () => {
    let saved: SavedDiscovery | null = order.length
      ? { order, currentId: items[activeIndex]?.id }
      : null;
    if (!saved) {
      try {
        saved = readDiscovery(sessionStorage.getItem(STORAGE_KEY));
      } catch {
        /* Storage is optional. */
      }
    }
    const restored = restoreDiscovery(saved, destinations);
    setOrder(restored.order);
    setIndex(restored.index);
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ order, currentId: items[activeIndex]?.id }),
      );
    } catch {
      /* Continue in memory when browser storage is unavailable. */
    }
  }, [open, order, items, activeIndex]);

  return (
    <section id="discover" className="discovery-paths" aria-labelledby="discovery-title">
      <div className="discovery-inner">
        <header className="discovery-heading">
          <p>{copy("kicker")}</p>
          <h2 id="discovery-title">{copy("title")}</h2>
        </header>
        <div className="discovery-choices">
          {choices.map(({ key, note, Icon, Arrow }) => (
            <button
              key={key}
              type="button"
              onClick={{ journey: onJourney, map: () => openMap(), surprise: openSurprise }[key]}
              className={`discovery-choice discovery-${key}`}
            >
              <span className="discovery-choice-text">
                <Icon size={17} strokeWidth={1.3} aria-hidden />
                <span className="discovery-choice-title">{copy(key)}</span>
                <span className="discovery-choice-note">{copy(note)}</span>
              </span>
              <ChoiceArtwork kind={key} previews={previews} />
              <Arrow className="discovery-arrow" size={18} strokeWidth={1.3} aria-hidden />
            </button>
          ))}
        </div>
      </div>
      {open && (
        <SurpriseDiscovery
          items={items}
          index={activeIndex}
          onIndexChange={setIndex}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}
