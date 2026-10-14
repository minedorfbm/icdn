import { useCallback, useEffect, useRef } from "react";
import { useHub } from "@/data/hub-context";
import { adjacentDestination } from "./destination-presentation";
import { useDestinationNavigation } from "./use-destination-navigation";
import { findPublicDestination } from "./destination-route";

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
      if (Math.max(dx, dy) < 10) return;
      if (dx <= dy * 1.4) return cancel();
      gesture.horizontal = true;
    }
    if (event.cancelable) event.preventDefault();
  };
  const end = (event: TouchEvent) => {
    const completed = gesture;
    cancel();
    const touch = event.changedTouches[0];
    if (!completed?.horizontal || !touch || touch.identifier !== completed.id) return;
    if (event.timeStamp - completed.time > 900 || window.getSelection()?.isCollapsed === false)
      return;
    const dx = touch.clientX - completed.x;
    const dy = touch.clientY - completed.y;
    const threshold = Math.min(96, Math.max(56, node.clientWidth * 0.18));
    if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy) * 1.4) return;
    navigate(dx < 0 ? 1 : -1);
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
  const { destinations } = useHub();
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
    if (!node || (!nextId && !previousId)) return;
    return bindSwipe(node, (direction) => {
      if (direction === 1) openNext();
      else if (previousId) openPreviousDestination();
    });
  }, [id, nextId, previousId, openNext, openPreviousDestination]);
  return { ref, next, previous, openNext, openPrevious: openPreviousDestination };
}
