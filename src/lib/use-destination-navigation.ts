import { useCallback } from "react";
import { useHub } from "@/data/hub-context";
import { prepareDetailPhoto } from "./prepare-detail-photo";
import { useLocation, useNavigate, useRouter, type HistoryState } from "@tanstack/react-router";
import { destinationSlug } from "@/lib/destination-route";
import { loadDestinationMedia } from "./hub-client";
import type { SearchSnapshot } from "@/features/search/search-context";
import { isDestinationPath, isHubScreen } from "./hub-screen";
import type { HubScreen } from "./hub-screen";
import type { MapRequest } from "@/features/resort-map/map-context";

declare module "@tanstack/react-router" {
  interface HistoryState {
    hubCard?: boolean;
    hubSequence?: string[];
    hubHomeIndex?: number;
    hubPreviousCard?: string;
    hubCardTrail?: Array<{
      destinationId: string;
      state: Omit<HistoryState, "hubCardTrail" | "hubScreenFromState">;
    }>;
    hubCardHistoryDetached?: boolean;
    hubCardOrigin?: {
      path: HubScreen | "/";
      search: MapRequest;
      state: Omit<HistoryState, "hubCardOrigin">;
    };
    hubSearch?: SearchSnapshot;
    hubSearchIndex?: number;
  }
}

function cardHistoryState(
  pathname: string,
  state: HistoryState,
  search: MapRequest,
  latestState: HistoryState,
): HistoryState {
  const isDestination = isDestinationPath(pathname);
  const { hubCardTrail, hubScreenFromState: _screenReturn, ...previousState } = state;
  // Search records its snapshot immediately before opening a card, possibly
  // before the hook renders again. Use the live state for the origin snapshot.
  const { hubCardOrigin: _origin, ...originState } = latestState;
  const origin = isDestination
    ? state.hubCardOrigin
    : {
        path: pathname as HubScreen | "/",
        search: pathname === "/map" ? search : {},
        state: originState,
      };
  return {
    ...(isDestination && !state.hubSearch
      ? {
          hubPreviousCard: pathname.slice(1),
          hubCardTrail: [
            ...(hubCardTrail ?? []),
            { destinationId: pathname.slice(1), state: previousState },
          ],
        }
      : {}),
    ...(origin ? { hubCardOrigin: origin } : {}),
    ...(state.hubCardHistoryDetached ? { hubCardHistoryDetached: true } : {}),
  };
}

/** Keep the hub mounted and preserve its scroll, collection and carousel state. */
export function useDestinationNavigation() {
  const router = useRouter();
  const { destinations } = useHub();
  const navigate = useNavigate();
  const location = useLocation();
  const isDestination = isDestinationPath(location.pathname);
  const openDestination = useCallback(
    (destinationId: string, sequence?: string[]) => {
      const slug = destinationSlug(destinationId);
      if (location.pathname === `/${slug}`) return;
      // Use only the selected public image while fresh publication data are fetched.
      // This warms bytes, never a catalogue or card snapshot, and matches the final picture.
      const destination = destinations.find((item) => item.id === destinationId);
      if (destination?.detailImage) {
        prepareDetailPhoto(destination.detailImage);
      }
      // Start the independent media read alongside navigation, not after mounting.
      // The endpoint still verifies publication; errors remain retryable in the card.
      void loadDestinationMedia(destinationId).catch(() => {});
      const ordered = sequence ?? (isDestination ? location.state.hubSequence : undefined);
      const homeIndex =
        location.pathname === "/" ? location.state.__TSR_index : location.state.hubHomeIndex;
      const searchIndex = location.state.hubSearch
        ? location.state.__TSR_index
        : location.state.hubSearchIndex;
      return navigate({
        to: "/$destinationId",
        params: { destinationId: slug },
        state: {
          hubCard: true,
          ...(homeIndex !== undefined ? { hubHomeIndex: homeIndex } : {}),
          ...(searchIndex !== undefined ? { hubSearchIndex: searchIndex } : {}),
          ...(isHubScreen(location.pathname)
            ? { hubScreenIndex: location.state.__TSR_index }
            : location.state.hubScreenIndex !== undefined
              ? { hubScreenIndex: location.state.hubScreenIndex }
              : {}),
          ...(location.pathname === "/map" || location.state.hubMap ? { hubMap: true } : {}),
          ...(ordered ? { hubSequence: ordered } : {}),
          ...cardHistoryState(
            location.pathname,
            location.state,
            location.search as MapRequest,
            router.latestLocation.state,
          ),
        },
        resetScroll: false,
      });
    },
    [navigate, isDestination, location.pathname, location.state, destinations, router],
  );
  const openPreviousDestination = useCallback(() => {
    if (!location.state.hubPreviousCard) return;
    if (location.state.hubCardHistoryDetached) {
      // Map readers can add joint iframe history entries. Their count does not
      // match the router's indices; restore the card trail without traversing them.
      const trail = location.state.hubCardTrail ?? [];
      const previous = trail.at(-1);
      const { hubPreviousCard: _previous, ...fallbackState } = location.state;
      void navigate({
        to: "/$destinationId",
        params: { destinationId: previous?.destinationId ?? location.state.hubPreviousCard },
        replace: true,
        state: {
          ...(previous?.state ?? fallbackState),
          hubCardTrail: trail.slice(0, -1),
          hubCardHistoryDetached: true,
        },
        resetScroll: false,
      });
    } else if (location.state.__TSR_index > 0) router.history.back();
  }, [location.state, navigate, router]);
  const closeToHub = useCallback(() => {
    // Opening the map explicitly leaves card navigation. Do not restore search over the map.
    if (location.state.hubSearchIndex !== undefined || location.state.hubCardHistoryDetached) {
      void navigate({ to: "/", replace: true, resetScroll: false });
      return;
    }
    const homeIndex = location.state.hubHomeIndex;
    const distance = homeIndex === undefined ? 0 : location.state.__TSR_index - homeIndex;
    if (distance > 0) router.history.go(-distance);
    else void navigate({ to: "/", replace: true, resetScroll: false });
  }, [
    location.state.hubHomeIndex,
    location.state.hubSearchIndex,
    location.state.hubCardHistoryDetached,
    location.state.__TSR_index,
    navigate,
    router,
  ]);
  const closeDestination = useCallback(() => {
    if (location.state.hubCardHistoryDetached) {
      const origin = location.state.hubCardOrigin;
      void navigate({
        to: origin?.path ?? "/",
        search: origin?.search ?? {},
        state: origin?.state ?? {},
        replace: true,
        resetScroll: false,
      });
      return;
    }
    const searchIndex = location.state.hubSearchIndex ?? location.state.hubScreenIndex;
    const distance = searchIndex === undefined ? 0 : location.state.__TSR_index - searchIndex;
    if (distance > 0) router.history.go(-distance);
    else closeToHub();
  }, [location.state, navigate, closeToHub, router]);
  return {
    openDestination,
    closeDestination,
    closeToHub,
    openPreviousDestination,
    previousCard: location.state.hubPreviousCard,
    isDestination,
    sequence: location.state.hubSequence,
  };
}
