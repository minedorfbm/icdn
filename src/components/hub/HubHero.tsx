import { HERO_LANDSCAPE_MEDIA } from "@/lib/hero-media";
import { ResortLogo } from "./ResortLogo";
import { useI18n } from "@/i18n";
import { ArrowDown } from "lucide-react";
import { lazy, Suspense, useCallback, useState } from "react";

import { scrollToHubSection } from "@/lib/scroll-to-hub-section";
import {
  homeHeroSizes,
  responsiveImage,
  responsiveAvif,
  thumbnailImage,
} from "@/lib/responsive-image";

const MichelinFilm = lazy(() => import("./MichelinFilm"));

export function HubHero({
  image,
  landscapeImage,
}: Readonly<{ image: string; landscapeImage: string }>) {
  const { t } = useI18n();
  const [filmOpen, setFilmOpen] = useState(false);
  const closeFilm = useCallback(() => setFilmOpen(false), []);
  const portrait = responsiveImage(image, homeHeroSizes(image));
  const landscape = responsiveImage(landscapeImage, homeHeroSizes(landscapeImage));
  const portraitAvif = responsiveAvif(image, homeHeroSizes(image));
  const landscapeAvif = responsiveAvif(landscapeImage, homeHeroSizes(landscapeImage));
  return (
    <section className="brand-ui hub-hero">
      <div className="hero-photograph">
        <picture>
          {landscapeAvif && (
            <source
              media={HERO_LANDSCAPE_MEDIA}
              type="image/avif"
              srcSet={landscapeAvif.srcSet}
              sizes={landscapeAvif.sizes}
            />
          )}
          <source
            media={HERO_LANDSCAPE_MEDIA}
            srcSet={landscape.srcSet ?? landscape.src}
            sizes={landscape.sizes}
          />
          {portraitAvif && (
            <source type="image/avif" srcSet={portraitAvif.srcSet} sizes={portraitAvif.sizes} />
          )}
          <img
            {...portrait}
            alt={t("hero_image_alt")}
            width={695}
            height={1137}
            fetchPriority="high"
            decoding="async"
            className="threshold-img"
          />
        </picture>
      </div>

      <div className="hero-brand">
        <h1 className="hero-welcome">
          <ResortLogo tone="black" className="hero-resort-logo" loading="eager" />
        </h1>
      </div>

      <div className="hero-sky">
        <div className="hero-sky-content">
          <h1 className="hero-welcome hero-desktop-brand">
            <ResortLogo tone="black" className="hero-resort-logo" loading="eager" />
          </h1>
          <button onClick={() => scrollToHubSection("discover")} className="hero-invitation">
            <span className="hero-invitation-title font-serif">
              {t("hero_title_1")}
              <br />
              {t("hero_title_2")}
            </span>
            <span className="hero-invitation-caption">{t("hero_sub")}</span>
            <ArrowDown className="hero-invitation-arrow" strokeWidth={1.2} aria-hidden />
          </button>
        </div>
      </div>
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
          {...thumbnailImage("/michelin-key.webp", "80px")}
          fetchPriority="high"
          loading="eager"
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
