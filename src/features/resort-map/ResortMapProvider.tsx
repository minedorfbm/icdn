import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "@tanstack/react-router";
import { useHub } from "@/data/hub-context";
import { useI18n } from "@/i18n";
import { FullscreenDialog } from "@/components/ui/fullscreen-dialog";
import { useDestinationNavigation } from "@/lib/use-destination-navigation";
import { MapContext, type MapRequest } from "./map-context";
import { destinationPlace } from "./map-links";
import { mapCopy } from "./map-copy";
import { useHubScreenNavigation } from "@/lib/use-hub-screen-navigation";
import { mapRequest, prepareMapBackground } from "./map-background";
import mapStyles from "./map-styles.css?url";
const ResortMap = lazy(() => import("./ResortMap"));
class MapBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function ResortMapProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { mapPlaces, mapLinks } = useHub();
  const { openDestination } = useDestinationNavigation();
  const location = useLocation();
  const { openScreen, closeScreen } = useHubScreenNavigation();
  const { lang, t } = useI18n();
  const [request, setRequest] = useState<MapRequest & { revision: number }>(() => ({
    ...mapRequest(location.search),
    revision: 0,
  }));
  const lastEntry = useRef<string | undefined>(undefined);
  const visible = location.pathname === "/map" || location.state.hubMap === true;
  useEffect(() => {
    if (location.pathname !== "/map" || lastEntry.current === location.state.__TSR_key) return;
    lastEntry.current = location.state.__TSR_key;
    prepareMapBackground();
    setRequest((previous) => ({ ...mapRequest(location.search), revision: previous.revision + 1 }));
  }, [location.pathname, location.search, location.state.__TSR_key]);
  const openMap = useCallback(
    (next: MapRequest = {}) => {
      prepareMapBackground();
      void openScreen("/map", next);
    },
    [openScreen],
  );
  const value = useMemo(
    () => ({ openMap, locate: (id: string) => destinationPlace(id, mapLinks, mapPlaces) }),
    [openMap, mapLinks, mapPlaces],
  );
  const close = () => {
    closeScreen();
  };
  const message = (text: string) => (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
      <output>{text}</output>
      <button onClick={close} className="min-h-11 border-b px-4">
        {t("close")}
      </button>
    </div>
  );
  return (
    <MapContext.Provider value={value}>
      {children}
      {visible && (
        <>
          <link rel="stylesheet" href={mapStyles} precedence="resort-map" data-hub-map-style="" />
          <FullscreenDialog
            title={mapCopy(lang, "title")}
            onClose={close}
            // Keep map and SSR card dialogs as siblings: a body portal would hide
            // the card's main ancestor while the map stays mounted behind it.
            portalled={false}
            overlayClassName="fixed inset-0 z-[89] bg-black/40"
            className="fixed inset-0 z-[90] h-dvh overflow-hidden brand-ui brand-surface"
          >
            <MapBoundary fallback={message(mapCopy(lang, "unavailable"))}>
              <Suspense fallback={message(mapCopy(lang, "loading"))}>
                <ResortMap
                  request={request}
                  onClose={close}
                  onDestination={(id) => openDestination(id)}
                />
              </Suspense>
            </MapBoundary>
          </FullscreenDialog>
        </>
      )}
    </MapContext.Provider>
  );
}
