import { Component, lazy, Suspense, useCallback, useMemo, useState, type ReactNode } from "react";
import { CataloguePending } from "@/components/hub/CataloguePending";
import { useCatalogueStatus } from "@/data/catalogue-status";
import { useHub } from "@/data/hub-context";
import { useI18n } from "@/i18n";
import { FullscreenDialog } from "@/components/ui/fullscreen-dialog";
import { useDestinationNavigation } from "@/lib/use-destination-navigation";
import { MapContext, type MapRequest } from "./map-context";
import { destinationPlace } from "./map-links";
import { mapCopy } from "./map-copy";
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
  const { ready } = useCatalogueStatus();
  const { openDestination, closeToHub, isDestination } = useDestinationNavigation();
  const { lang, t } = useI18n();
  const [request, setRequest] = useState<(MapRequest & { revision: number }) | null>(null);
  const openMap = useCallback(
    (next: MapRequest = {}) => {
      if (isDestination) closeToHub();
      setRequest((prev) => ({ ...next, revision: (prev?.revision ?? 0) + 1 }));
    },
    [isDestination, closeToHub],
  );
  const value = useMemo(
    () => ({ openMap, locate: (id: string) => destinationPlace(id, mapLinks, mapPlaces) }),
    [openMap, mapLinks, mapPlaces],
  );
  const close = () => {
    setRequest(null);
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
      {request && (
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
              {ready ? (
                <ResortMap
                  request={request}
                  onClose={close}
                  onDestination={(id) => openDestination(id)}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center">
                  <CataloguePending />
                  <button className="min-h-11 border-b px-4" onClick={close}>
                    {t("close")}
                  </button>
                </div>
              )}
            </Suspense>
          </MapBoundary>
        </FullscreenDialog>
      )}
    </MapContext.Provider>
  );
}
