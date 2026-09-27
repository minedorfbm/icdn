import { useEffect, useState, type RefObject } from "react";
import type { Level } from "@/data/resort";
import { arrivalProgress, journeyPosition } from "./journey-motion";

type JourneySection = {
  id: Level;
  element: HTMLElement;
  deck: HTMLElement | null;
  top: number;
  height: number;
  deckTop: number;
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
  section.element.dataset["journeyNear"] = String(near && !reduced);
  if (!near && !reduced) return;
  const entrance = reduced ? 1 : arrivalProgress(section.top + 96, y, viewport);
  const cards = reduced ? 1 : arrivalProgress(section.deckTop, y, viewport);
  const parallax = reduced
    ? 0
    : Math.max(-40, Math.min(40, (y + viewport / 2 - section.top - section.height / 2) * 0.06));
  section.element.style.setProperty("--journey-scene-y", `${parallax.toFixed(2)}px`);
  section.element.style.setProperty("--journey-heading-y", `${((1 - entrance) * 28).toFixed(2)}px`);
  section.element.style.setProperty("--journey-heading-opacity", String(0.3 + entrance * 0.7));
  section.element.style.setProperty("--journey-deck-y", `${((1 - cards) * 24).toFixed(2)}px`);
  section.element.style.setProperty("--journey-deck-opacity", String(0.4 + cards * 0.6));
}

/** Native scrolling owns the gesture. Only paint values change on animation frames. */
export function useJourneyMotion(
  rootRef: RefObject<HTMLElement | null>,
  levels: readonly Readonly<{ id: Level }>[],
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
              top: 0,
              height: 0,
              deckTop: 0,
            },
          ]
        : [];
    });
    if (!sections.length) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let dirty = true;
    let previousActive: Level | undefined;
    let previousVisible: boolean | undefined;

    const measure = () => {
      raf = 0;
      const y = window.scrollY;
      const viewport = window.innerHeight;
      if (dirty) {
        for (const section of sections) {
          section.top = layoutTop(section.element);
          section.height = section.element.offsetHeight;
          section.deckTop = section.deck ? layoutTop(section.deck) : section.top;
        }
        dirty = false;
      }
      const { progress, station } = journeyPosition(
        y,
        sections.map((section) => section.top),
        viewport,
      );
      const active = sections[station]!.id;
      const first = sections[0]!;
      const last = sections[sections.length - 1]!;
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

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const refresh = () => {
      dirty = true;
      schedule();
    };
    const resize = new ResizeObserver(refresh);
    sections.forEach(({ element }) => resize.observe(element));
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", refresh);
    reducedMotion.addEventListener("change", refresh);
    measure();
    return () => {
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", refresh);
      reducedMotion.removeEventListener("change", refresh);
      if (raf) cancelAnimationFrame(raf);
      carriage?.style.removeProperty("--tram-progress");
      for (const { element } of sections) {
        delete element.dataset["journeyNear"];
        for (const property of [
          "scene-y",
          "heading-y",
          "heading-opacity",
          "deck-y",
          "deck-opacity",
        ])
          element.style.removeProperty(`--journey-${property}`);
      }
    };
  }, [levels, rootRef]);

  return journey;
}
