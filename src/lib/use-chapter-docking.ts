import { useEffect, type RefObject } from "react";
import { chapterDockTarget } from "./chapter-docking";

/** Passive, small arrival assistance. Native scroll owns the rest of the journey. */
export function useChapterDocking(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const sections = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>(".level-chapter") ?? [],
    );
    if (!sections.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let startY: number | null = null;
    let touching = false;
    let settling = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const interrupt = () => {
      clearTimeout(timer);
      if (settling) window.scrollTo({ top: window.scrollY, behavior: "instant" });
      settling = false;
      startY = null;
    };
    const settle = () => {
      if (touching || startY === null) return;
      const origin = startY;
      startY = null;
      if (reduced.matches || document.querySelector('[role="dialog"][data-state="open"]')) return;
      const y = window.scrollY;
      const tops = sections.map(
        (section) =>
          section.getBoundingClientRect().top +
          y -
          parseFloat(getComputedStyle(section).scrollMarginTop || "0"),
      );
      const target = chapterDockTarget(tops, y, origin, window.innerHeight);
      if (target === null) return;
      settling = true;
      window.scrollTo({ top: target, behavior: "smooth" });
    };
    const schedule = () => {
      if (startY === null) return;
      clearTimeout(timer);
      timer = setTimeout(settle, 180);
    };
    const touchStart = () => {
      interrupt();
      touching = true;
      startY = window.scrollY;
    };
    const touchEnd = () => {
      touching = false;
      schedule();
    };
    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (settling) interrupt();
      startY ??= window.scrollY;
      schedule();
    };
    window.addEventListener("touchstart", touchStart, { passive: true });
    window.addEventListener("touchend", touchEnd, { passive: true });
    window.addEventListener("touchcancel", touchEnd, { passive: true });
    window.addEventListener("wheel", wheel, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("keydown", interrupt);
    window.addEventListener("pointerdown", interrupt, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchend", touchEnd);
      window.removeEventListener("touchcancel", touchEnd);
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("keydown", interrupt);
      window.removeEventListener("pointerdown", interrupt);
    };
  }, [rootRef]);
}
