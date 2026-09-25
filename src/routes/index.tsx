import { localizedLinkUrl } from "@/lib/localized-links";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Phone } from "lucide-react";
import { LevelChapter } from "@/components/hub/LevelChapter";
import { NamTramRail } from "@/components/hub/NamTramRail";
import { type Level } from "@/data/resort";
import { HubProvider, useHub } from "@/data/hub-context";
import { getHubData } from "@/lib/hub.functions";
import { I18nProvider, LanguageSwitch, useI18n } from "@/i18n";
import { resolveHeroImage } from "@/data/hub-value";
import { ResortBrowserProvider, ResortLink } from "@/components/hub/ResortBrowser";

export const Route = createFileRoute("/")({
  loader: () => getHubData(),
  head: ({ loaderData }) => ({
    links: [
      { rel: "preload", as: "image", href: resolveHeroImage(loaderData), fetchPriority: "high" },
    ],
    meta: [
      { title: "InterContinental Danang — Digital Hub | Heaven to Sea" },
      {
        name: "description",
        content:
          "Descend through InterContinental Danang Sun Peninsula Resort — Heaven, Sky, Earth and Sea. Dining, spa, beaches and experiences in one immersive mobile journey.",
      },
      { property: "og:title", content: "InterContinental Danang — Digital Hub" },
      {
        property: "og:description",
        content:
          "A digital descent through the resort: Heaven, Sky, Earth, Sea. By Art Digital Journey.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HubRoute,
});

function HubRoute() {
  const data = Route.useLoaderData();
  return (
    <I18nProvider editorial={data.editorial}>
      <ResortBrowserProvider>
        <HubProvider data={data}>
          <Hub />
        </HubProvider>
      </ResortBrowserProvider>
    </I18nProvider>
  );
}

function Hub() {
  const [active, setActive] = useState<Level>("heaven");
  const [progress, setProgress] = useState(0);
  const [railVisible, setRailVisible] = useState(false);
  const journeyRef = useRef<HTMLDivElement>(null);
  const { levels, links, contact, heroImage } = useHub();
  const { lang, t, linkLabel } = useI18n();

  useEffect(() => {
    let raf = 0;
    let lastProgress = -1;
    let lastActive: Level | null = null;

    // Section-aware progress: the cabin travels station to station and the
    // gold fill always lines up exactly with the active level dot.
    const measure = () => {
      raf = 0;
      const el = journeyRef.current;
      if (!el) return;
      const probe = window.scrollY + window.innerHeight * 0.5;
      const sections = levels
        .map((l) => document.getElementById(l.id))
        .filter((n): n is HTMLElement => !!n);
      if (!sections.length) return;

      const first = sections[0]!;
      const last = sections[sections.length - 1]!;
      const visible =
        probe >= first.offsetTop - window.innerHeight * 0.4 &&
        window.scrollY + window.innerHeight <
          last.offsetTop + last.offsetHeight + window.innerHeight * 0.4;
      setRailVisible(visible);
      if (probe < first.offsetTop) {
        if (lastProgress !== 0) setProgress((lastProgress = 0));
        if (lastActive !== levels[0]!.id) setActive((lastActive = levels[0]!.id));
        return;
      }
      if (probe >= last.offsetTop + last.offsetHeight) {
        if (lastProgress !== 1) setProgress((lastProgress = 1));
        if (lastActive !== levels[levels.length - 1]!.id)
          setActive((lastActive = levels[levels.length - 1]!.id));
        return;
      }

      for (let i = 0; i < sections.length; i++) {
        const s = sections[i]!;
        const top = s.offsetTop;
        const bottom = top + s.offsetHeight;
        if (probe >= top && probe < bottom) {
          const local = (probe - top) / s.offsetHeight;
          const p = (i + local) / sections.length;
          if (Math.abs(p - lastProgress) > 0.0005) setProgress((lastProgress = p));
          const id = levels[i]!.id;
          if (id !== lastActive) setActive((lastActive = id));
          return;
        }
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [levels]);

  const jump = (level: Level) =>
    document.getElementById(level)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className="bg-background text-foreground">
      <LanguageSwitch />
      <NamTramRail active={active} progress={progress} visible={railVisible} onJump={jump} />

      {/* THRESHOLD */}
      <section className="relative h-[100svh] min-h-[600px] overflow-hidden">
        <img
          src={heroImage}
          alt={t("hero_image_alt")}
          width={1170}
          height={2532}
          fetchPriority="high"
          decoding="async"
          className="threshold-img absolute inset-0 h-full w-full object-cover"
        />

        <button
          onClick={() => jump("heaven")}
          className="absolute inset-x-0 top-[46%] z-10 flex flex-col items-center gap-4 px-5 text-center text-[#102d43] [text-shadow:0_1px_12px_rgba(255,255,255,0.9)]"
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

      {/* THE DESCENT */}
      <div ref={journeyRef}>
        {levels.map((l) => (
          <LevelChapter key={l.id} {...l} />
        ))}
      </div>

      {/* END OF JOURNEY */}
      <section className="sea-footer px-6 py-24">
        <h2 className="font-serif text-[30px] leading-tight tracking-tight">{t("footer_title")}</h2>
        <ul className="mt-8 flex flex-col divide-y divide-current/10 border-y border-current/10">
          {links.map(({ label, url, translations }) => (
            <li key={label}>
              <ResortLink
                href={localizedLinkUrl(
                  label === "Website" ? "WEBSITE" : label,
                  url,
                  translations,
                  lang,
                )}
                pageTitle={linkLabel(label)}
                target={label === "Contact" ? undefined : "_blank"}
                rel={label === "Contact" ? undefined : "noreferrer"}
                className="flex items-center justify-between py-3 text-[11px] tracking-[0.22em]"
              >
                {linkLabel(label).toUpperCase()}
                <span className="opacity-40">↗</span>
              </ResortLink>
            </li>
          ))}
        </ul>

        <p className="mt-16 text-[9px] tracking-[0.3em] opacity-40">{t("footer_credit")}</p>
      </section>

      {/* FIXED CONCIERGE BUTTON */}
      <a
        href={contact}
        aria-label={t("concierge")}
        className="fixed bottom-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-[oklch(0.78_0.11_85/0.22)] bg-[oklch(0.16_0.03_250/0.35)] pb-0 text-[oklch(0.78_0.11_85/0.55)] shadow-[0_2px_8px_oklch(0.16_0.03_250/0.14)] backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 hover:border-[oklch(0.78_0.11_85/0.42)] hover:bg-[oklch(0.16_0.03_250/0.5)] hover:text-[oklch(0.78_0.11_85/0.75)] active:scale-95"
      >
        <Phone size={14} strokeWidth={1.3} />
      </a>
    </main>
  );
}
