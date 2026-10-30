import { useEffect, useState, type RefObject } from "react";
import type { Level } from "@/data/resort";
import { arrivalProgress, journeyPosition } from "./journey-motion";
import { createJourneyAtmosphere } from "./journey-atmosphere";

type JourneySection = {
  id: Level;
  element: HTMLElement;
  deck: HTMLElement | null;
  heading: HTMLElement | null;
  headingTop: number;
  top: number;
  height: number;
  deckTop: number;
  arrivalTop: number;
};

function layoutTop(element: HTMLElement): number {
  let top = 0;
  let current: HTMLElement | null = element;
  while (current) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return top;
}

function paintSection(section: JourneySection, y: number, viewport: number, reduced: boolean) {
  const near =
    section.top < y + viewport * 1.25 && section.top + section.height > y - viewport * 0.25;
  if (!near && !reduced) return;
  const entrance = reduced ? 1 : arrivalProgress(section.headingTop, y, viewport);
  const cards = reduced ? 1 : arrivalProgress(section.deckTop, y, viewport);
  const headingY = (1 - entrance) * 28;
  section.element.style.setProperty("--journey-heading-y", `${headingY.toFixed(2)}px`);
  section.element.style.setProperty("--journey-heading-opacity", String(0.3 + entrance * 0.7));
  section.element.style.setProperty("--journey-deck-y", `${((1 - cards) * 24).toFixed(2)}px`);
  section.element.style.setProperty("--journey-deck-opacity", String(0.4 + cards * 0.6));
}

/** Native scrolling owns the gesture. Only paint values change on animation frames. */
export function useJourneyMotion(
  rootRef: RefObject<HTMLElement | null>,
  levels: readonly Readonly<{ id: Level }>[],
  atmosphereEnabled = false,
) {
  const [journey, setJourney] = useState<{ active: Level; visible: boolean }>({
    active: "heaven",
    visible: false,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const carriage = root.querySelector<HTMLElement>(".nam-tram-carriage");
    const sections = levels.flatMap(({ id }) => {
      const element = root.querySelector<HTMLElement>(`#${id}`);
      return element
        ? [
            {
              id,
              element,
              deck: element.querySelector<HTMLElement>(".journey-deck"),
              heading: element.querySelector<HTMLElement>("header"),
              headingTop: 0,
              top: 0,
              height: 0,
              deckTop: 0,
              arrivalTop: 0,
            },
          ]
        : [];
    });
    if (!sections.length) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const atmosphere = atmosphereEnabled ? createJourneyAtmosphere(root) : null;
    let raf = 0;
    let dirty = true;
    let previousActive: Level | undefined;
    let previousVisible: boolean | undefined;
    let lastPaintY = NaN,
      lastViewport = NaN;

    const paintJourney = (y: number, viewport: number) => {
      const { progress, station } = journeyPosition(
        y,
        sections.map((section) => section.top),
        viewport,
      );
      const active = sections[station]!.id;
      const first = sections[0]!;
      const last = sections.at(-1)!;
      const visible =
        y + viewport * 0.7 >= first.top && y < last.top + last.height - viewport * 0.3;
      const railProgress = reducedMotion.matches
        ? station / Math.max(1, sections.length - 1)
        : progress;
      carriage?.style.setProperty("--tram-progress", String(railProgress));

      for (const section of sections) paintSection(section, y, viewport, reducedMotion.matches);
      if (active !== previousActive || visible !== previousVisible) {
        previousActive = active;
        previousVisible = visible;
        setJourney({ active, visible });
      }
    };

    const measure = (now = performance.now()) => {
      raf = 0;
      if (document.hidden) {
        atmosphere?.hide();
        return;
      }
      const y = window.scrollY;
      const viewport = window.innerHeight;
      const repaint = dirty || lastPaintY !== y || lastViewport !== viewport;
      if (dirty) {
        atmosphere?.invalidate();
        for (const section of sections) {
          section.top = section.element.getBoundingClientRect().top + y;
          section.height = section.element.offsetHeight;
          section.deckTop = section.deck ? layoutTop(section.deck) : section.top;
          section.headingTop = section.heading ? layoutTop(section.heading) : section.top;
          section.arrivalTop =
            section.top - parseFloat(getComputedStyle(section.element).scrollMarginTop || "0");
        }
        dirty = false;
      }
      if (repaint) {
        paintJourney(y, viewport);
        lastPaintY = y;
        lastViewport = viewport;
      }
      const finishing = atmosphere?.paint(
        sections.map((section) => ({
          id: section.id,
          top: section.arrivalTop,
          height: section.height,
        })),
        y,
        viewport,
        window.innerWidth,
        now,
      );
      if (finishing && !raf) raf = requestAnimationFrame(measure);
    };

    const schedule = () => {
      if (!raf && !document.hidden) raf = requestAnimationFrame(measure);
    };
    const refresh = () => {
      dirty = true;
      schedule();
    };
    const resize = new ResizeObserver(refresh);
    sections.forEach(({ element }) => resize.observe(element));
    // The translated discovery choices above the levels can also change their offsets.
    resize.observe(root);
    window.addEventListener("scroll", schedule, { passive: true });
    // A cold cloud asset may become ready after scrolling has already stopped.
    root.addEventListener("load", schedule, true);
    window.addEventListener("resize", refresh);
    reducedMotion.addEventListener("change", refresh);
    const visibility = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        atmosphere?.hide();
      } else refresh();
    };
    document.addEventListener("visibilitychange", visibility);
    measure();
    return () => {
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      root.removeEventListener("load", schedule, true);
      window.removeEventListener("resize", refresh);
      reducedMotion.removeEventListener("change", refresh);
      document.removeEventListener("visibilitychange", visibility);
      atmosphere?.hide();
      if (raf) cancelAnimationFrame(raf);
      carriage?.style.removeProperty("--tram-progress");
      for (const { element } of sections) {
        for (const property of ["heading-y", "heading-opacity", "deck-y", "deck-opacity"])
          element.style.removeProperty(`--journey-${property}`);
      }
    };
  }, [levels, rootRef, atmosphereEnabled]);

  return journey;
}
