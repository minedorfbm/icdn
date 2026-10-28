import { useMemo } from "react";
import { ArrowDown, ArrowUpRight, Compass, Map as MapIcon, Sparkles } from "lucide-react";
import type { Destination } from "@/data/resort";
import { useHub } from "@/data/hub-context";
import { useI18n } from "@/i18n";
import { useResortMap } from "@/features/resort-map/map-context";
import { imageSource } from "@/lib/image-source";
import { discoveryCopy } from "./discovery-copy";
import { useHubScreenNavigation } from "@/lib/use-hub-screen-navigation";
import "./discovery.css";
import { thumbnail, thumbnailAvif } from "@/lib/responsive-image";

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
        <img
          src={imageSource("src/assets/nam-tram-rail.webp")}
          alt=""
          loading="lazy"
          width={240}
          height={219}
        />
      </span>
    );
  if (kind === "map")
    return (
      <span className="discovery-art discovery-map-art" aria-hidden>
        <img
          src={thumbnail("/resort-map/official.webp")}
          alt=""
          loading="lazy"
          width={240}
          height={180}
        />
      </span>
    );
  return (
    <span className="discovery-art discovery-mini-deck" aria-hidden>
      {previews.map((card) => {
        const avif = thumbnailAvif(card.image);
        return (
          <picture key={card.id}>
            {avif && <source type="image/avif" srcSet={avif} />}
            <img src={thumbnail(card.image)} alt="" loading="lazy" width={80} height={110} />
          </picture>
        );
      })}
    </span>
  );
}

export function DiscoveryPaths({ onJourney }: Readonly<{ onJourney: () => void }>) {
  const { destinations, levels } = useHub();
  const { lang } = useI18n();
  const { openMap } = useResortMap();
  const { openScreen } = useHubScreenNavigation();
  const copy = (key: Parameters<typeof discoveryCopy>[1]) => discoveryCopy(lang, key);
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
              onClick={
                {
                  journey: onJourney,
                  map: () => openMap(),
                  surprise: () => void openScreen("/surprise-me"),
                }[key]
              }
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
    </section>
  );
}
