import { HERO_LANDSCAPE_MEDIA } from "@/lib/hero-media";
import { ResortLogo } from "./ResortLogo";
import { useI18n } from "@/i18n";
import { ArrowDown } from "lucide-react";
import { lazy, Suspense, useCallback, useState } from "react";

import { scrollToHubSection } from "@/lib/scroll-to-hub-section";

const MichelinFilm = lazy(() => import("./MichelinFilm"));

export function HubHero({
  image,
  landscapeImage,
}: Readonly<{ image: string; landscapeImage: string }>) {
  const { t } = useI18n();
  const [filmOpen, setFilmOpen] = useState(false);
  const closeFilm = useCallback(() => setFilmOpen(false), []);
  return (
    <section className="brand-ui hub-hero">
      <div className="hero-photograph">
        <picture>
          <source media={HERO_LANDSCAPE_MEDIA} srcSet={landscapeImage} />
          <img
            src={image}
            alt={t("hero_image_alt")}
            width={695}
            height={1137}
            fetchPriority="high"
            decoding="async"
            className="threshold-img"
          />
        </picture>
      </div>

      <h1 className="hero-welcome">
        <ResortLogo tone="gold" className="hero-resort-logo" />
      </h1>

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
        className="hero-film-button grid place-items-center rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <img
          src="/michelin-key.webp"
          alt=""
          width={494}
          height={585}
          className="size-full object-contain"
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
