import { useI18n } from "@/i18n";

import { scrollToHubSection } from "@/lib/scroll-to-hub-section";

export function HubHero({ image }: Readonly<{ image: string }>) {
  const { t } = useI18n();
  return (
    <section className="brand-ui relative h-[100svh] min-h-[600px] overflow-hidden">
      <img
        src={image}
        alt={t("hero_image_alt")}
        width={1170}
        height={2532}
        fetchPriority="high"
        decoding="async"
        className="threshold-img absolute inset-0 h-full w-full object-cover"
      />

      <button
        onClick={() => scrollToHubSection("discover")}
        className="absolute inset-x-0 top-[46%] z-10 flex flex-col items-center gap-4 px-5 text-center text-[var(--brand-ink)] [text-shadow:0_1px_12px_rgba(255,255,255,0.9)]"
      >
        <span className="reveal text-[9px] tracking-[0.36em] [animation-delay:120ms]">
          {t("hero_kicker")}
        </span>
        <h1 className="reveal max-w-[90vw] font-serif text-[clamp(36px,10vw,60px)] leading-[0.94] tracking-[-0.02em] [animation-delay:260ms]">
          {t("hero_title_1")}
          <br />
          {t("hero_title_2")}
        </h1>
        <span
          className="reveal line-drop h-12 w-px bg-current/60 [animation-delay:520ms]"
          aria-hidden
        />
        <span className="reveal text-[9px] tracking-[0.32em] [animation-delay:680ms]">
          {t("hero_sub")}
        </span>
      </button>
    </section>
  );
}
