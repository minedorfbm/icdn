import { Component, lazy, Suspense, useCallback, useMemo, useState, type ReactNode } from "react";
import { useHub } from "@/data/hub-context";
import { useI18n } from "@/i18n";
import { FullscreenDialog } from "@/components/ui/fullscreen-dialog";
import { DestinationDetail } from "@/components/hub/DestinationDetail";
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
  const { mapPlaces, mapLinks, destinations } = useHub();
  const { lang, t } = useI18n();
  const [request, setRequest] = useState<(MapRequest & { revision: number }) | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const openMap = useCallback((next: MapRequest = {}) => {
    setDetailId(null);
    setRequest((prev) => ({ ...next, revision: (prev?.revision ?? 0) + 1 }));
  }, []);
  const value = useMemo(
    () => ({ openMap, locate: (id: string) => destinationPlace(id, mapLinks, mapPlaces) }),
    [openMap, mapLinks, mapPlaces],
  );
  const detail = destinations.find((d) => d.id === detailId && d.active);
  const close = () => {
    setRequest(null);
    setDetailId(null);
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
              <ResortMap request={request} onClose={close} onDestination={setDetailId} />
            </Suspense>
          </MapBoundary>
        </FullscreenDialog>
      )}
      {detail && (
        <DestinationDetail dest={detail} onClose={() => setDetailId(null)} aboveMap neutral />
      )}
    </MapContext.Provider>
  );
}
