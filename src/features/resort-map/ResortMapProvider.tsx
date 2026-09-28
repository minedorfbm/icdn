import { Component, lazy, Suspense, useCallback, useMemo, useState, type ReactNode } from "react";
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
  const { openDestination, closeDestination, isDestination } = useDestinationNavigation();
  const { lang, t } = useI18n();
  const [request, setRequest] = useState<(MapRequest & { revision: number }) | null>(null);
  const openMap = useCallback(
    (next: MapRequest = {}) => {
      if (isDestination) closeDestination();
      setRequest((prev) => ({ ...next, revision: (prev?.revision ?? 0) + 1 }));
    },
    [isDestination, closeDestination],
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
          overlayClassName="fixed inset-0 z-[89] bg-black/40"
          className="fixed inset-0 z-[90] h-dvh overflow-hidden brand-ui brand-surface"
        >
          <MapBoundary fallback={message(mapCopy(lang, "unavailable"))}>
            <Suspense fallback={message(mapCopy(lang, "loading"))}>
              <ResortMap
                request={request}
                onClose={close}
                onDestination={(id) => openDestination(id, true)}
              />
            </Suspense>
          </MapBoundary>
        </FullscreenDialog>
      )}
    </MapContext.Provider>
  );
}
