import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { deferGoogleAnalytics } from "@/lib/defer-google-analytics";

export function GoogleAnalytics({
  ready,
  waitForJourney,
}: Readonly<{ ready: boolean; waitForJourney: boolean }>) {
  const pathname = useLocation({ select: (location) => location.pathname });
  useEffect(() => {
    if (!ready) return undefined;
    return deferGoogleAnalytics(waitForJourney);
  }, [ready, waitForJourney, pathname]);
  return null;
}
