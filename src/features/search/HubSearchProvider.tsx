import { useCallback, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useRouterState } from "@tanstack/react-router";
import { destinationSlug } from "@/lib/destination-route";
import { useDestinationNavigation } from "@/lib/use-destination-navigation";
import type { Destination } from "@/data/resort";
import { SearchDialog } from "./HubSearch";
import { EMPTY_SEARCH, SearchContext, type SearchSnapshot } from "./search-context";

/** Search belongs to its history entry, so Back restores the exact result list. */
export function HubSearchProvider({ children }: Readonly<{ children: ReactNode }>) {
  const location = useLocation();
  // Restore the overlay after the underlying route's dialog has mounted, so it
  // cannot take focus or hide the restored search from assistive technologies.
  const routeReady = useRouterState({ select: (state) => state.status === "idle" });
  const navigate = useNavigate();
  const { openDestination } = useDestinationNavigation();
  const beforeNavigate = useRef<(() => void) | undefined>(undefined);
  const selecting = useRef(false);
  // The router updates its location before the lazy card screen is ready.
  // Retain the source overlay throughout that interval instead of revealing home.
  const [selection, setSelection] = useState<{
    snapshot: SearchSnapshot;
    historyIndex: number;
  }>();
  const openSearch = useCallback(
    (onNavigate?: () => void) => {
      beforeNavigate.current = onNavigate;
      void navigate({
        to: location.pathname,
        replace: true,
        resetScroll: false,
        state: (previous) => ({ ...previous, hubSearch: EMPTY_SEARCH }),
      });
    },
    [location.pathname, navigate],
  );
  const closeSearch = () => {
    beforeNavigate.current = undefined;
    void navigate({
      to: location.pathname,
      replace: true,
      resetScroll: false,
      state: (previous) => {
        const state = { ...previous };
        delete state.hubSearch;
        return state;
      },
    });
  };
  const selectResult = async (destination: Destination, snapshot: SearchSnapshot) => {
    if (selecting.current) return;
    selecting.current = true;
    try {
      const dismissSource = beforeNavigate.current;
      beforeNavigate.current = undefined;
      if (location.pathname === `/${destinationSlug(destination.id)}`) {
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
  const visibleSearch = selection?.snapshot ?? (routeReady ? location.state.hubSearch : undefined);
  return (
    <SearchContext.Provider value={openSearch}>
      {children}
      {visibleSearch && (
        <SearchDialog
          key={selection?.historyIndex ?? location.state.__TSR_index}
          initialState={visibleSearch}
          onClose={closeSearch}
          onSelectDestination={(destination, snapshot) => void selectResult(destination, snapshot)}
        />
      )}
    </SearchContext.Provider>
  );
}
