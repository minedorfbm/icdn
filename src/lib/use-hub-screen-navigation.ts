import { useCallback } from "react";
import { useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import type { HubScreen } from "./hub-screen";
import type { MapRequest } from "@/features/resort-map/map-context";
import { mapRequest } from "@/features/resort-map/map-background";
import type { SearchSnapshot } from "@/features/search/search-context";

declare module "@tanstack/react-router" {
  interface HistoryState {
    hubScreenFromIndex?: number;
    hubScreenIndex?: number;
    hubMap?: boolean;
    hubSearchPlacesOnly?: boolean;
    hubScreenFromPath?: string;
    hubScreenFromState?: Omit<HistoryState, "hubScreenFromState">;
  }
}

export function useHubScreenNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const openScreen = useCallback(
    (
      to: HubScreen,
      search?: MapRequest,
      extra?: {
        hubSearch?: SearchSnapshot;
        hubSearchPlacesOnly?: boolean;
      },
    ) => {
      const { hubScreenFromState: _parentReturn, ...sourceState } = location.state;
      return navigate({
        to,
        search: to === "/map" ? (search ?? {}) : {},
        resetScroll: false,
        state: {
          hubCard: true,
          hubScreenFromIndex: location.state.__TSR_index,
          hubScreenFromPath: location.pathname,
          hubScreenFromState: sourceState,
          ...(location.pathname === "/"
            ? { hubHomeIndex: location.state.__TSR_index }
            : location.state.hubHomeIndex !== undefined
              ? { hubHomeIndex: location.state.hubHomeIndex }
              : {}),
          hubMap: to === "/map" || location.pathname === "/map" || !!location.state.hubMap,
          ...extra,
        },
      });
    },
    [location.pathname, location.state, navigate],
  );
  const closeScreen = useCallback(() => {
    if (location.pathname === "/map") {
      // Embedded tour links add entries to the browser's joint iframe history.
      // A numeric Back could stay on the map instead of closing its live reader.
      const from = mapRequest(location.search).from;
      const source = location.state.hubScreenFromPath ?? (from ? `/${from}` : undefined);
      const fallback = !source || source === "/map";
      void navigate({
        to: fallback ? "/" : source,
        replace: true,
        state: fallback ? {} : (location.state.hubScreenFromState ?? {}),
        resetScroll: false,
      });
      return;
    }
    const from = location.state.hubScreenFromIndex;
    const distance = from === undefined ? 0 : location.state.__TSR_index - from;
    if (distance > 0) router.history.go(-distance);
    else void navigate({ to: "/", replace: true, resetScroll: false });
  }, [location.pathname, location.search, location.state, navigate, router]);
  return { openScreen, closeScreen };
}
