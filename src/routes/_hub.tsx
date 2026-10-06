import { scrollToHubSection } from "@/lib/scroll-to-hub-section";
import { HubHero } from "@/components/hub/HubHero";
import { HubSearch } from "@/features/search/HubSearch";
import { DiscoveryPaths } from "@/features/discovery/DiscoveryPaths";
import { ResortMapProvider } from "@/features/resort-map/ResortMapProvider";
import { useResortMap } from "@/features/resort-map/map-context";
import { mapCopy } from "@/features/resort-map/map-copy";
import { localizedLinkUrl } from "@/lib/localized-links";
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useJourneyMotion } from "@/lib/use-journey-motion";
import { ArrowUpRight } from "lucide-react";
import { ConciergeContact } from "@/components/hub/ConciergeContact";
import { LevelChapter } from "@/components/hub/LevelChapter";
import { NamTramRail } from "@/components/hub/NamTramRail";
import { type Level } from "@/data/resort";
import { HubProvider, useHub } from "@/data/hub-context";
import { getHubData, getHubSettings, type HubData } from "@/lib/hub.functions";
import { I18nProvider, LanguageSwitch, useI18n } from "@/i18n";
import { resolveHeroImage } from "@/data/hub-value";
import { ResortBrowserProvider, ResortLink } from "@/components/hub/ResortBrowser";

export const Route = createFileRoute("/_hub")({
  loader: async ({ location }) => {
    // Complete the homepage HTML before requesting its catalogue. Some mobile
    // browsers buffer streamed documents; direct card URLs retain their SSR metadata.
    const isHome = location.pathname === "/";
    const [settings, catalogue] = await Promise.all([
      getHubSettings(),
      isHome ? Promise.resolve(null) : getHubData(),
    ]);
    return { settings, catalogue, isHome };
  },
  staleTime: 0,
  head: ({ loaderData }) => ({
    links: loaderData?.isHome
      ? [{ rel: "preload", as: "image", href: resolveHeroImage(loaderData), fetchPriority: "high" }]
      : [],
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
  const { settings, catalogue } = Route.useLoaderData();
  const location = useLocation();
  // History state survives a refresh. Keep the hub behind a card only when this
  // mounted page actually came from the homepage during client navigation.
  const [hasVisitedHome, setHasVisitedHome] = useState(location.pathname === "/");
  useEffect(() => {
    if (location.pathname === "/") setHasVisitedHome(true);
  }, [location.pathname]);
  const showHub = location.pathname === "/" || (hasVisitedHome && location.state.hubCard === true);
  const [result, setResult] = useState<{ data: HubData | null; failed: boolean }>({
    data: catalogue,
    failed: false,
  });
  const [attempt, setAttempt] = useState(0);
  const data = catalogue ?? result.data;
  useEffect(() => {
    if (catalogue) {
      setResult({ data: catalogue, failed: false });
      return;
    }
    if (result.data) return;
    let current = true;
    setResult({ data: null, failed: false });
    getHubData().then(
      (data) => {
        if (current) setResult({ data, failed: false });
      },
      () => {
        if (current) setResult({ data: null, failed: true });
      },
    );
    return () => {
      current = false;
    };
  }, [catalogue, attempt, result.data]);
  return (
    <I18nProvider editorial={data?.editorial}>
      <main className="min-h-svh bg-background text-foreground">
        {showHub && (
          <>
            <div className="hub-tools">
              <LanguageSwitch />
            </div>
            <HubHero image={resolveHeroImage({ settings })} />
          </>
        )}
        {data ? (
          <HubProvider data={{ ...data, settings }}>
            <ResortBrowserProvider>
              <ResortMapProvider>
                {showHub && <Hub />}
                <Outlet />
              </ResortMapProvider>
            </ResortBrowserProvider>
          </HubProvider>
        ) : (
          <CatalogueStatus failed={result.failed} onRetry={() => setAttempt((n) => n + 1)} />
        )}
      </main>
    </I18nProvider>
  );
}

function CatalogueStatus({
  failed = false,
  onRetry,
}: Readonly<{ failed?: boolean; onRetry?: () => void }>) {
  const { t } = useI18n();
  return (
    <section
      id="discover"
      className="brand-ui grid min-h-[50svh] place-content-center gap-5 px-7 text-center"
      aria-busy={!failed}
    >
      <p role="status">{t(failed ? "content_unavailable" : "page_loading")}</p>
      {failed && (
        <button className="min-h-11 border-b" onClick={onRetry}>
          {t("retry")}
        </button>
      )}
    </section>
  );
}

function Hub() {
  const { openMap } = useResortMap();
  const hubRef = useRef<HTMLDivElement>(null);
  const { levels, links } = useHub();
  const { active, visible } = useJourneyMotion(hubRef, levels);
  const { lang, t, linkLabel } = useI18n();

  const scrollTo = scrollToHubSection;

  return (
    <div ref={hubRef} className="bg-background text-foreground">
      <div className="hub-search-tool">
        <HubSearch />
      </div>
      <NamTramRail active={active} visible={visible} onJump={(level: Level) => scrollTo(level)} />

      <DiscoveryPaths onJourney={() => scrollTo(levels[0]?.id ?? "heaven")} />

      {/* THE DESCENT */}
      <div>
        {levels.map((l) => (
          <LevelChapter key={l.id} {...l} />
        ))}
      </div>

      {/* END OF JOURNEY */}
      <section className="brand-ui sea-footer px-6 py-24">
        <h2 className="font-serif text-[30px] leading-tight tracking-tight">{t("footer_title")}</h2>
        <ul className="mt-8 flex flex-col divide-y divide-current/10 border-y border-current/10">
          {links.map(({ label, url, translations }) => (
            <li key={label}>
              {label === "Resort Map" ? (
                <button
                  type="button"
                  onClick={() => openMap()}
                  className="flex w-full items-center justify-between py-3 text-[11px] tracking-[0.22em]"
                >
                  {mapCopy(lang, "open").toUpperCase()}
                  <ArrowUpRight aria-hidden className="size-4 shrink-0" strokeWidth={1.3} />
                </button>
              ) : (
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
                  <ArrowUpRight aria-hidden className="size-4 shrink-0" strokeWidth={1.3} />
                </ResortLink>
              )}
            </li>
          ))}
        </ul>

        <p className="mt-16 text-[9px] tracking-[0.3em] opacity-40">{t("footer_credit")}</p>
      </section>

      {/* FIXED CONCIERGE BUTTON */}
      <ConciergeContact />
    </div>
  );
}
