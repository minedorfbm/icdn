import { useI18n } from "@/i18n";
import { ArrowDown } from "lucide-react";
import { lazy, Suspense, useCallback, useState } from "react";

import { scrollToHubSection } from "@/lib/scroll-to-hub-section";

const MichelinFilm = lazy(() => import("./MichelinFilm"));

export function HubHero({ image }: Readonly<{ image: string }>) {
  const { t } = useI18n();
  const [filmOpen, setFilmOpen] = useState(false);
  const closeFilm = useCallback(() => setFilmOpen(false), []);
  return (
    <section className="brand-ui hub-hero relative h-[100svh] min-h-[540px] overflow-hidden">
      <img
        src={image}
        alt={t("hero_image_alt")}
        width={1170}
        height={2532}
        fetchPriority="high"
        decoding="async"
        className="threshold-img absolute inset-0 h-full w-full object-cover"
      />

      <div className="hero-welcome">
        <img
          src="/intercontinental-touch-icon.png"
          alt="InterContinental"
          width={180}
          height={180}
          className="hero-crest"
        />
        <h1 className="font-serif">{t("hero_welcome")}</h1>
        <p className="hero-resort-name">DANANG SUN PENINSULA RESORT</p>
      </div>

      <button onClick={() => scrollToHubSection("discover")} className="hero-invitation">
        <span className="hero-invitation-title font-serif">
          {t("hero_title_1")}
          <br />
          {t("hero_title_2")}
        </span>
        <span className="hero-invitation-caption">{t("hero_sub")}</span>
        <ArrowDown className="size-4" strokeWidth={1.2} aria-hidden />
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.currentTarget.focus({ preventScroll: true });
          setFilmOpen(true);
        }}
        aria-label={`${t("play_video")}: One MICHELIN Key`}
        aria-haspopup="dialog"
        className="absolute bottom-8 left-6 grid size-20 place-items-center rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        <img
          src="/michelin-key.webp"
          alt=""
          width={494}
          height={585}
          className="size-full object-contain drop-shadow-[0_2px_3px_rgba(255,255,255,0.7)]"
        />
      </button>
      {filmOpen && (
        <Suspense fallback={null}>
          <MichelinFilm onClose={closeFilm} />
        </Suspense>
      )}
    </section>
  );
}
