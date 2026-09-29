import { useCallback } from "react";
import { useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { destinationSlug } from "@/lib/destination-route";

declare module "@tanstack/react-router" {
  interface HistoryState {
    hubCard?: boolean;
    hubCardNeutral?: boolean;
  }
}

/** Keep the hub mounted and preserve its scroll, collection and carousel state. */
export function useDestinationNavigation() {
  const router = useRouter();
  const navigate = useNavigate();
  const location = useLocation();
  const isDestination = location.pathname !== "/";
  const openDestination = useCallback(
    (destinationId: string, neutral = false) => {
      void navigate({
        to: "/$destinationId",
        params: { destinationId: destinationSlug(destinationId) },
        state: { hubCard: true, hubCardNeutral: neutral },
        resetScroll: false,
      });
    },
    [navigate],
  );
  const closeDestination = useCallback(() => {
    if (location.state.hubCard) router.history.back();
    else void navigate({ to: "/", replace: true, resetScroll: false });
  }, [location.state.hubCard, navigate, router]);
  return {
    openDestination,
    closeDestination,
    isDestination,
    neutral: location.state.hubCardNeutral ?? false,
  };
}
