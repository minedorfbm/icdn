import { useCallback, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useRouterState } from "@tanstack/react-router";
import { useDestinationNavigation } from "@/lib/use-destination-navigation";
import type { Destination } from "@/data/resort";
import { SearchDialog } from "./HubSearch";
import searchStyles from "./search.css?url";
import { EMPTY_SEARCH, SearchContext, type SearchSnapshot } from "./search-context";
import type { SearchOptions } from "./search-context";
import { useHubScreenNavigation } from "@/lib/use-hub-screen-navigation";
import { useHub } from "@/data/hub-context";
import { destinationPlace } from "@/features/resort-map/map-links";
import { canonicalDestinationId } from "@/lib/destination-route";

/** Search belongs to its history entry, so Back restores the exact result list. */
export function HubSearchProvider({ children }: Readonly<{ children: ReactNode }>) {
  const location = useLocation();
  // Restore the overlay after the underlying route's dialog has mounted, so it
  // cannot take focus or hide the restored search from assistive technologies.
  const routeReady = useRouterState({ select: (state) => state.status === "idle" });
  const navigate = useNavigate();
  const { openScreen, closeScreen } = useHubScreenNavigation();
  const { mapLinks, mapPlaces } = useHub();
  const { openDestination } = useDestinationNavigation();
  const beforeNavigate = useRef<(() => void) | undefined>(undefined);
  const mapSelection = useRef<SearchOptions["onSelect"]>(undefined);
  const selecting = useRef(false);
  // The router updates its location before the lazy card screen is ready.
  // Retain the source overlay throughout that interval instead of revealing home.
  const [selection, setSelection] = useState<{
    snapshot: SearchSnapshot;
    historyIndex: number;
  }>();
  const openSearch = useCallback(
    (onNavigate?: () => void, options?: SearchOptions) => {
      beforeNavigate.current = onNavigate;
      mapSelection.current = options?.onSelect;
      if (location.pathname !== "/search") {
        void openScreen("/search", undefined, {
          hubSearch: EMPTY_SEARCH,
          hubSearchPlacesOnly: !!options?.placesOnly,
        });
      } else {
        void navigate({
          to: "/search",
          replace: true,
          resetScroll: false,
          state: (previous) => ({ ...previous, hubSearch: EMPTY_SEARCH }),
        });
      }
    },
    [location.pathname, navigate, openScreen],
  );
  const closeSearch = () => {
    beforeNavigate.current = undefined;
    mapSelection.current = undefined;
    closeScreen();
  };
  const selectResult = async (destination: Destination, snapshot: SearchSnapshot) => {
    if (selecting.current) return;
    selecting.current = true;
    try {
      if (location.state.hubSearchPlacesOnly) {
        if (mapSelection.current?.(destination)) {
          closeSearch();
          return;
        }
        if (!mapSelection.current) {
          const placeId = destinationPlace(destination.id, mapLinks, mapPlaces);
          if (placeId) {
            void navigate({
              to: "/map",
              search: { placeId },
              replace: true,
              resetScroll: false,
              state: (previous) => {
                const state = { ...previous, hubMap: true };
                delete state.hubSearch;
                return state;
              },
            });
            return;
          }
        }
      }
      const dismissSource = beforeNavigate.current;
      beforeNavigate.current = undefined;
      const source = location.state.hubScreenFromPath;
      if (source && canonicalDestinationId(source.slice(1)) === destination.id) {
        dismissSource?.();
        closeSearch();
        return;
      }
      setSelection({ snapshot, historyIndex: location.state.__TSR_index });
      await navigate({
        to: location.pathname,
        replace: true,
        resetScroll: false,
        state: (previous) => ({ ...previous, hubSearch: snapshot }),
      });
      dismissSource?.();
      await openDestination(destination.id, []);
    } finally {
      selecting.current = false;
      setSelection(undefined);
    }
  };
  const visibleSearch =
    selection?.snapshot ??
    (routeReady && location.pathname === "/search"
      ? (location.state.hubSearch ?? EMPTY_SEARCH)
      : undefined);
  return (
    <SearchContext.Provider value={openSearch}>
      {children}
      {visibleSearch && (
        <>
          <link
            rel="stylesheet"
            href={searchStyles}
            precedence="hub-search"
            data-hub-search-style=""
          />
          <SearchDialog
            key={selection?.historyIndex ?? location.state.__TSR_index}
            initialState={visibleSearch}
            placesOnly={!!location.state.hubSearchPlacesOnly}
            onClose={closeSearch}
            onSelectDestination={(destination, snapshot) =>
              void selectResult(destination, snapshot)
            }
          />
        </>
      )}
    </SearchContext.Provider>
  );
}
