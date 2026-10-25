import { useCallback } from "react";
import { preload } from "react-dom";
import { useHub } from "@/data/hub-context";
import { detailHeroPreload } from "./responsive-image";
import { useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { destinationSlug } from "@/lib/destination-route";
import { loadDestinationMedia } from "./hub-client";
import type { SearchSnapshot } from "@/features/search/search-context";

declare module "@tanstack/react-router" {
  interface HistoryState {
    hubCard?: boolean;
    hubSequence?: string[];
    hubHomeIndex?: number;
    hubPreviousCard?: string;
    hubSearch?: SearchSnapshot;
    hubSearchIndex?: number;
  }
}

/** Keep the hub mounted and preserve its scroll, collection and carousel state. */
export function useDestinationNavigation() {
  const router = useRouter();
  const { destinations } = useHub();
  const navigate = useNavigate();
  const location = useLocation();
  const isDestination = location.pathname !== "/";
  const openDestination = useCallback(
    (destinationId: string, sequence?: string[]) => {
      const slug = destinationSlug(destinationId);
      if (location.pathname === `/${slug}`) return;
      // Use only the selected public image while fresh publication data are fetched.
      // This warms bytes, never a catalogue or card snapshot, and matches the final picture.
      const destination = destinations.find((item) => item.id === destinationId);
      if (destination?.detailImage) {
        const { href, ...image } = detailHeroPreload(destination.detailImage);
        preload(href, { ...image, as: "image", fetchPriority: "high" });
      }
      // Start the independent media read alongside navigation, not after mounting.
      // The endpoint still verifies publication; errors remain retryable in the card.
      void loadDestinationMedia(destinationId).catch(() => {});
      const ordered = sequence ?? (isDestination ? location.state.hubSequence : undefined);
      const homeIndex = isDestination ? location.state.hubHomeIndex : location.state.__TSR_index;
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
          ...(isDestination && !location.state.hubSearch
            ? { hubPreviousCard: location.pathname.slice(1) }
            : {}),
          ...(ordered ? { hubSequence: ordered } : {}),
        },
        resetScroll: false,
      });
    },
    [navigate, isDestination, location.pathname, location.state, destinations],
  );
  const openPreviousDestination = useCallback(() => {
    if (location.state.hubPreviousCard && location.state.__TSR_index > 0) router.history.back();
  }, [location.state.hubPreviousCard, location.state.__TSR_index, router]);
  const closeToHub = useCallback(() => {
    // Opening the map explicitly leaves card navigation. Do not restore search over the map.
    if (location.state.hubSearchIndex !== undefined) {
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
    location.state.__TSR_index,
    navigate,
    router,
  ]);
  const closeDestination = useCallback(() => {
    const searchIndex = location.state.hubSearchIndex;
    const distance = searchIndex === undefined ? 0 : location.state.__TSR_index - searchIndex;
    if (distance > 0) router.history.go(-distance);
    else closeToHub();
  }, [location.state.hubSearchIndex, location.state.__TSR_index, closeToHub, router]);
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
