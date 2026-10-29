import { GOOGLE_ANALYTICS_ID } from "./google-analytics";

const SCRIPT_ID = "adj-google-analytics";
const QUIET_MS = 2000;

/** Wait for the actual hub content, loaded/decoded photos and a quiet browser.
 * A route change disposes this wait and starts one for the newly visible card. */
export function deferGoogleAnalytics(waitForJourney: boolean): () => void {
  if (
    !(window as Window & { __adjGoogleTag?: boolean }).__adjGoogleTag ||
    document.getElementById(SCRIPT_ID)
  )
    return () => {};

  let disposed = false;
  let generation = 0;
  let timer: number | undefined;
  let frame: number | undefined;
  let idle: number | undefined;
  const events = [
    "load",
    "error",
    "scroll",
    "pointerdown",
    "touchstart",
    "keydown",
    "visibilitychange",
  ] as const;

  function cancelScheduled() {
    window.clearTimeout(timer);
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    if (idle !== undefined) window.cancelIdleCallback?.(idle);
    timer = frame = idle = undefined;
  }
  function photos() {
    return Array.from(document.images).filter((image) => {
      if (
        !image.currentSrc &&
        !image.getAttribute("src") &&
        !image.parentElement?.querySelector("source[srcset]")
      )
        return false;
      const box = image.getBoundingClientRect();
      if (!box.width || !box.height) return false;
      // Offscreen native-lazy images must not hold Analytics forever. Eager
      // pictures already requested by the page still finish before Google starts.
      return (
        image.loading !== "lazy" ||
        (box.bottom > 0 &&
          box.top < window.innerHeight &&
          box.right > 0 &&
          box.left < window.innerWidth)
      );
    });
  }
  function contentReady() {
    return (
      document.readyState === "complete" &&
      document.visibilityState === "visible" &&
      (!waitForJourney || !!document.querySelector(".discovery-paths"))
    );
  }
  function load() {
    if (disposed || !contentReady() || photos().some((image) => !image.complete)) return;
    dispose();
    if (document.getElementById(SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.fetchPriority = "low";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
    document.head.appendChild(script);
  }
  async function check() {
    const current = generation;
    if (disposed || !contentReady()) return;
    const images = photos();
    if (images.some((image) => !image.complete)) return;
    await Promise.allSettled(images.map((image) => image.decode()));
    if (disposed || current !== generation) return;
    // Give the completed pictures a paint before scheduling third-party work.
    frame = window.requestAnimationFrame(() => {
      frame = undefined;
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(load);
      else load();
    });
  }
  function activity() {
    generation++;
    cancelScheduled();
    if (!disposed)
      timer = window.setTimeout(() => {
        void check();
      }, QUIET_MS);
  }
  const observer = new MutationObserver(activity);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "srcset", "sizes", "loading", "class", "aria-hidden"],
  });
  for (const event of events)
    document.addEventListener(event, activity, { capture: true, passive: true });
  window.addEventListener("load", activity);
  window.addEventListener("resize", activity);
  function dispose() {
    disposed = true;
    generation++;
    cancelScheduled();
    observer.disconnect();
    for (const event of events) document.removeEventListener(event, activity, true);
    window.removeEventListener("load", activity);
    window.removeEventListener("resize", activity);
  }
  activity();
  return dispose;
}
