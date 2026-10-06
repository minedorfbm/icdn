import { useI18n } from "@/i18n";
import { ArrowDown } from "lucide-react";

import { scrollToHubSection } from "@/lib/scroll-to-hub-section";

export function HubHero({ image }: Readonly<{ image: string }>) {
  const { t } = useI18n();
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
    </section>
  );
}
