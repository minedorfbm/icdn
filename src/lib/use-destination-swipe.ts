import { useCallback, useEffect, useRef } from "react";
import { createHubValue } from "@/data/hub-value";
import { loadHubData } from "./hub-client";
import { useCatalogueStatus } from "@/data/catalogue-status";
import { useHub } from "@/data/hub-context";
import { adjacentDestination } from "./destination-presentation";
import { useDestinationNavigation } from "./use-destination-navigation";
import { findPublicDestination } from "./destination-route";
import { destinationSwipeAxis, destinationSwipeStep } from "./card-swipe";

const INTERACTIVE =
  'a,button,input,select,textarea,summary,iframe,video,[contenteditable]:not([contenteditable="false"]),[data-instagram-track],[data-destination-swipe-ignore]';

/** Native touch listeners leave vertical scrolling, pinch zoom and nested media gestures intact. */
function bindSwipe(node: HTMLElement, navigate: (direction: 1 | -1) => void) {
  let gesture: { id: number; x: number; y: number; time: number; horizontal: boolean } | null =
    null;
  const cancel = () => {
    gesture = null;
  };
  const start = (event: TouchEvent) => {
    cancel();
    const touch = event.touches[0];
    if (event.touches.length !== 1 || !touch || !(event.target instanceof Element)) return;
    if (event.target.closest(INTERACTIVE)) return;
    // Reserve the screen edges for the browser's back/forward gestures.
    if (touch.clientX < 24 || touch.clientX > window.innerWidth - 24) return;
    gesture = {
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      time: event.timeStamp,
      horizontal: false,
    };
  };
  const move = (event: TouchEvent) => {
    const touch = event.touches[0];
    if (event.touches.length !== 1 || !touch || touch.identifier !== gesture?.id) return cancel();
    const dx = Math.abs(touch.clientX - gesture.x);
    const dy = Math.abs(touch.clientY - gesture.y);
    if (!gesture.horizontal) {
      const axis = destinationSwipeAxis(dx, dy);
      if (!axis) return;
      if (axis === "vertical") return cancel();
      gesture.horizontal = true;
    }
    if (event.cancelable) event.preventDefault();
  };
  const end = (event: TouchEvent) => {
    const completed = gesture;
    cancel();
    const touch = event.changedTouches[0];
    if (!completed?.horizontal || touch?.identifier !== completed.id) return;
    if (window.getSelection()?.isCollapsed === false) return;
    const dx = touch.clientX - completed.x;
    const dy = touch.clientY - completed.y;
    const step = destinationSwipeStep(dx, dy, node.clientWidth, event.timeStamp - completed.time);
    if (step) navigate(step);
  };
  node.addEventListener("touchstart", start, { passive: true });
  node.addEventListener("touchmove", move, { passive: false });
  node.addEventListener("touchend", end, { passive: true });
  node.addEventListener("touchcancel", cancel, { passive: true });
  return () => {
    node.removeEventListener("touchstart", start);
    node.removeEventListener("touchmove", move);
    node.removeEventListener("touchend", end);
    node.removeEventListener("touchcancel", cancel);
  };
}

export function useDestinationSwipe(id: string) {
  const ref = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const { destinations } = useHub();
  const { ready, retry } = useCatalogueStatus();
  const { sequence, openDestination, previousCard, openPreviousDestination } =
    useDestinationNavigation();
  const next = adjacentDestination(id, destinations, sequence);
  const previous = previousCard ? findPublicDestination(destinations, previousCard) : undefined;
  const nextId = next?.id;
  const previousId = previous?.id;
  const openNext = useCallback(() => {
    if (nextId) openDestination(nextId);
  }, [nextId, openDestination]);
  useEffect(() => {
    const node = ref.current;
    if (!node || (ready && !nextId && !previousId)) return;
    return bindSwipe(node, (direction) => {
      if (!ready && direction === 1) {
        if (pending.current) return;
        pending.current = true;
        void loadHubData()
          .then(
            (data) => {
              const next = adjacentDestination(id, createHubValue(data).destinations, sequence);
              if (next && mounted.current) void openDestination(next.id);
            },
            () => {
              if (mounted.current) retry();
            },
          )
          .finally(() => {
            pending.current = false;
          });
      } else if (direction === 1) openNext();
      else if (previousId) openPreviousDestination();
    });
  }, [
    id,
    nextId,
    previousId,
    openNext,
    openPreviousDestination,
    ready,
    sequence,
    openDestination,
    retry,
  ]);
  return { ref, next, previous, openNext, openPrevious: openPreviousDestination };
}
