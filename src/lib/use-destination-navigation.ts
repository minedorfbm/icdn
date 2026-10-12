import { useCallback } from "react";
import { useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { destinationSlug } from "@/lib/destination-route";

declare module "@tanstack/react-router" {
  interface HistoryState {
    hubCard?: boolean;
    hubCardNeutral?: boolean;
    hubSequence?: string[];
    hubHomeIndex?: number;
    hubPreviousCard?: string;
  }
}

/** Keep the hub mounted and preserve its scroll, collection and carousel state. */
export function useDestinationNavigation() {
  const router = useRouter();
  const navigate = useNavigate();
  const location = useLocation();
  const isDestination = location.pathname !== "/";
  const openDestination = useCallback(
    (destinationId: string, neutral = false, sequence?: string[]) => {
      const slug = destinationSlug(destinationId);
      if (location.pathname === `/${slug}`) return;
      const ordered = sequence ?? (isDestination ? location.state.hubSequence : undefined);
      const homeIndex = isDestination ? location.state.hubHomeIndex : location.state.__TSR_index;
      void navigate({
        to: "/$destinationId",
        params: { destinationId: slug },
        state: {
          hubCard: true,
          hubCardNeutral: neutral,
          ...(homeIndex !== undefined ? { hubHomeIndex: homeIndex } : {}),
          ...(isDestination ? { hubPreviousCard: location.pathname.slice(1) } : {}),
          ...(ordered ? { hubSequence: ordered } : {}),
        },
        resetScroll: false,
      });
    },
    [navigate, isDestination, location.pathname, location.state],
  );
  const openPreviousDestination = useCallback(() => {
    if (location.state.hubPreviousCard && location.state.__TSR_index > 0) router.history.back();
  }, [location.state.hubPreviousCard, location.state.__TSR_index, router]);
  const closeDestination = useCallback(() => {
    const homeIndex = location.state.hubHomeIndex;
    const distance = homeIndex === undefined ? 0 : location.state.__TSR_index - homeIndex;
    if (distance > 0) router.history.go(-distance);
    else void navigate({ to: "/", replace: true, resetScroll: false });
  }, [location.state.hubHomeIndex, location.state.__TSR_index, navigate, router]);
  return {
    openDestination,
    closeDestination,
    openPreviousDestination,
    previousCard: location.state.hubPreviousCard,
    isDestination,
    neutral: location.state.hubCardNeutral ?? false,
    sequence: location.state.hubSequence,
  };
}
