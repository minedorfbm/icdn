export const initialHubScroll = { target: null as string | null, revision: 0 };
let snapshot = initialHubScroll;
const listeners = new Set<() => void>();
let finishPrevious: (() => void) | undefined;

export const getHubScrollSnapshot = () => snapshot;
export function subscribeHubScrollTarget(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function publishTarget(next: string | null) {
  snapshot = { target: next, revision: snapshot.revision + 1 };
  listeners.forEach((listener) => listener());
}

export function scrollToHubSection(id: string) {
  const section = document.getElementById(id);
  if (!section) return;
  finishPrevious?.();
  publishTarget(id);
  // User input interrupts a jump. The timeout covers browsers without scrollend
  // and a click on the already-centred level, where no scroll event is emitted.
  const events = ["scrollend", "wheel", "touchstart", "pointerdown", "keydown"] as const;
  const finish = (event?: Event) => {
    // A sheet or a previous smooth scroll may emit scrollend before this arrival.
    if (
      event?.type === "scrollend" &&
      Math.abs(
        section.getBoundingClientRect().top -
          parseFloat(window.getComputedStyle(section).scrollMarginTop || "0"),
      ) > 2
    )
      return;
    window.clearTimeout(timeout);
    events.forEach((event) => window.removeEventListener(event, finish));
    finishPrevious = undefined;
    publishTarget(null);
  };
  const timeout = window.setTimeout(finish, 2000);
  finishPrevious = finish;
  events.forEach((event) => window.addEventListener(event, finish, { passive: true }));
  section.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    block: "start",
  });
}
