import { CardEntryProvider } from "@/components/hub/CardEntryProvider";
import { NotFoundPage } from "@/components/NotFoundPage";
import { HubHero } from "@/components/hub/HubHero";
import { GoogleAnalytics } from "@/components/hub/GoogleAnalytics";
import {
  HERO_CLOUD_SOURCE,
  HERO_DESKTOP_MEDIA,
  HERO_PORTRAIT_MEDIA,
  HERO_TABLET_LANDSCAPE_MEDIA,
} from "@/lib/hero-media";
import { homeHeroSizes, picturePreload, thumbnailImage } from "@/lib/responsive-image";
import { HubSearchProvider } from "@/features/search/HubSearchProvider";
import { ResortMapProvider } from "@/features/resort-map/ResortMapProvider";
import { createFileRoute, notFound, Outlet, useLocation } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from "react";
import { HubProvider } from "@/data/hub-context";
import { getHubData, type HubData } from "@/lib/hub.functions";
import { catalogueBootstrap } from "@/lib/catalogue-bootstrap";
import {
  loadDestinationCard,
  loadHubData,
  loadHubSettings,
  peekHubData,
  primeHubSnapshots,
} from "@/lib/hub-client";
import { canonicalDestinationId } from "@/lib/destination-route";
import { cardHubData } from "@/lib/destination-card";
import { afterDetailHero } from "@/lib/after-detail-hero";
import { NavigationProgress } from "@/components/hub/NavigationProgress";
import { I18nProvider, LanguageSwitch, useI18n } from "@/i18n";
import { resolveHeroImage } from "@/data/hub-value";
import { ResortBrowserProvider } from "@/components/hub/ResortBrowser";
import { EMPTY_HUB_SHELL, isHubScreen } from "@/lib/hub-screen";
import { mapBackgroundSource } from "@/features/resort-map/map-background";

const prepareHubJourney = () => import("@/components/hub/HubJourney");
const HubJourney = lazy(prepareHubJourney);

export const Route = createFileRoute("/_hub")({
  loader: async ({ location }) => {
    // Finish HTML without streaming a deferred catalogue (mobile browsers may buffer it).
    // A direct card needs only its own published content, including all its translations.
    const isHome = location.pathname === "/";
    const screen = isHubScreen(location.pathname) ? location.pathname : null;
    const catalogue = peekHubData() ?? null;
    const id = canonicalDestinationId(location.pathname.slice(1));
    if (!isHome && !screen && !/^[a-z0-9-]{1,120}$/.test(id)) throw notFound();
    const [settings, card] = await Promise.all([
      loadHubSettings(),
      isHome || screen || catalogue ? Promise.resolve(null) : loadDestinationCard(id),
    ]);
    if (!isHome && !screen && !catalogue && !card) throw notFound();
    return { settings, catalogue, card, isHome, screen };
  },
  staleTime: 0,
  head: ({ loaderData }) => ({
    scripts: loaderData?.isHome ? [{ children: catalogueBootstrap(getHubData.url) }] : [],
    links: loaderData?.isHome
      ? [
          {
            rel: "preload",
            as: "image",
            ...picturePreload(
              resolveHeroImage(loaderData),
              homeHeroSizes(resolveHeroImage(loaderData)),
            ),
            media: HERO_PORTRAIT_MEDIA,
            fetchPriority: "high",
          },
          {
            rel: "preload",
            as: "image",
            ...picturePreload(
              resolveHeroImage(loaderData, "landscape"),
              homeHeroSizes(resolveHeroImage(loaderData, "landscape")),
            ),
            media: HERO_TABLET_LANDSCAPE_MEDIA,
            fetchPriority: "high",
          },
          {
            rel: "preload",
            as: "image",
            ...picturePreload(
              resolveHeroImage(loaderData, "desktop"),
              homeHeroSizes(resolveHeroImage(loaderData, "desktop")),
            ),
            media: HERO_DESKTOP_MEDIA,
            fetchPriority: "high",
          },
          {
            rel: "preload",
            as: "image",
            href: HERO_CLOUD_SOURCE,
            type: "image/webp",
            media: HERO_PORTRAIT_MEDIA,
            fetchPriority: "high",
          },
          {
            rel: "preload",
            as: "image",
            href: thumbnailImage("/michelin-key.webp", "80px").src,
            imageSrcSet: thumbnailImage("/michelin-key.webp", "80px").srcSet,
            imageSizes: "80px",
            fetchPriority: "high",
          },
        ]
      : loaderData?.screen === "/map"
        ? [{ rel: "preload", as: "image", href: mapBackgroundSource(), fetchPriority: "high" }]
        : [],
    meta: [
      { title: "InterContinental Danang — Digital Discovery | Heaven to Sea" },
      {
        name: "description",
        content:
          "Digital Discovery: descend through InterContinental Danang Sun Peninsula Resort — Heaven, Sky, Earth and Sea. Dining, spa, beaches and experiences in one immersive mobile journey.",
      },
      { property: "og:title", content: "InterContinental Danang — Digital Discovery" },
      {
        property: "og:description",
        content:
          "Digital Discovery through the resort: Heaven, Sky, Earth, Sea. By Art Digital Journey.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HubRoute,
  notFoundComponent: NotFoundPage,
});

function HubRoute() {
  const { settings, catalogue, card } = Route.useLoaderData();
  useEffect(() => primeHubSnapshots(settings, catalogue), [settings, catalogue]);
  const location = useLocation();
  const screen = isHubScreen(location.pathname);
  // History state survives a refresh. Keep the hub behind a card only when this
  // mounted page actually came from the homepage during client navigation.
  const [hasVisitedHome, setHasVisitedHome] = useState(location.pathname === "/");
  useEffect(() => {
    if (location.pathname === "/") setHasVisitedHome(true);
  }, [location.pathname]);
  const showHub = location.pathname === "/" || (hasVisitedHome && location.state.hubCard === true);
  const [heroActive, setHeroActive] = useState(true);
  useEffect(() => {
    if (!showHub) return;
    const hero = document.querySelector(".hub-hero");
    if (!hero) return;
    const update = () => setHeroActive(hero.getBoundingClientRect().bottom > 1);
    update();
    // Only observe the hero boundary; no work on every scroll frame.
    const observer = new IntersectionObserver(update, { rootMargin: "-1px 0px 0px 0px" });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [showHub]);
  // On home, start the journey chunk alongside the catalogue, not after it.
  // Direct cards never request it until the visitor returns to the homepage.
  useEffect(() => {
    if (showHub) void prepareHubJourney().catch(() => {});
  }, [showHub]);
  const [result, setResult] = useState<{ data: HubData | null; failed: boolean }>({
    data: catalogue,
    failed: false,
  });
  const [attempt, setAttempt] = useState(0);
  const retryCatalogue = useCallback(() => setAttempt((n) => n + 1), []);
  const data = catalogue ?? result.data;
  // Keep providers mounted if a map click leaves the focused card before the catalogue arrives.
  const [focusedCard, setFocusedCard] = useState(card);
  useEffect(() => {
    if (card) setFocusedCard(card);
  }, [card]);
  const focused = card ?? focusedCard;
  const presentation = useMemo(
    () => data ?? (focused ? cardHubData(focused) : screen ? EMPTY_HUB_SHELL : null),
    [data, focused, screen],
  );
  const providerData = useMemo(
    () => (presentation ? { ...presentation, settings } : undefined),
    [presentation, settings],
  );
  useEffect(() => {
    if (catalogue) {
      setResult({ data: catalogue, failed: false });
      return;
    }
    if (result.data) return;
    let current = true;
    setResult({ data: null, failed: false });
    const read = () => {
      void loadHubData({ background: attempt === 0 }).then(
        (data) => {
          if (current) setResult({ data, failed: false });
        },
        () => {
          if (current) setResult({ data: null, failed: true });
        },
      );
    };
    // The focused snapshot already contains this card. Let its main photo finish
    // before fetching the full resort, unless the visitor starts interacting.
    const cancel = afterDetailHero(
      !showHub && attempt === 0
        ? document.querySelector<HTMLImageElement>(".editorial-hero img")
        : null,
      read,
    );
    return () => {
      current = false;
      cancel();
    };
  }, [catalogue, attempt, result.data, showHub]);
  return (
    <I18nProvider editorial={presentation?.editorial}>
      <GoogleAnalytics ready={!!data || result.failed} waitForJourney={showHub && !!data} />
      <NavigationProgress />
      <main
        className="min-h-svh bg-background text-foreground"
        data-hero-active={showHub && heroActive ? "true" : undefined}
      >
        {showHub && (
          <>
            <div className="hub-tools">
              <LanguageSwitch />
            </div>
            <HubHero
              image={resolveHeroImage({ settings })}
              landscapeImage={resolveHeroImage({ settings }, "landscape")}
              desktopImage={resolveHeroImage({ settings }, "desktop")}
            />
          </>
        )}
        {providerData ? (
          <HubProvider
            data={providerData}
            ready={!!data}
            failed={result.failed}
            retry={retryCatalogue}
          >
            <HubSearchProvider>
              <ResortBrowserProvider>
                <ResortMapProvider>
                  {showHub &&
                    (data ? (
                      <Suspense fallback={<CatalogueStatus />}>
                        <HubJourney />
                      </Suspense>
                    ) : (
                      <CatalogueStatus failed={result.failed} onRetry={retryCatalogue} />
                    ))}
                  <CardEntryProvider>
                    <Outlet />
                  </CardEntryProvider>
                </ResortMapProvider>
              </ResortBrowserProvider>
            </HubSearchProvider>
          </HubProvider>
        ) : (
          <CatalogueStatus failed={result.failed} onRetry={retryCatalogue} />
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
      <output className="block">{t(failed ? "content_unavailable" : "page_loading")}</output>
      {failed && (
        <button className="min-h-11 border-b" onClick={onRetry}>
          {t("retry")}
        </button>
      )}
    </section>
  );
}
