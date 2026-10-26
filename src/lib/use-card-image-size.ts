import { useLayoutEffect, useRef, useState } from "react";

/** Measure layout, not transformed bounds: dragging must never change image resolution. */
export function useCardImageSize(itemCount: number, layout: string) {
  const stage = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ width: number; height: number }>();
  useLayoutEffect(() => {
    const element = stage.current;
    if (!element) return;
    const measure = () => {
      const card = element.querySelector<HTMLElement>(".perspective-card");
      if (!card) return;
      const width = card.clientWidth;
      const height = card.clientHeight;
      if (!width || !height) return;
      setBox((previous) =>
        previous?.width === width && previous.height === height ? previous : { width, height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [itemCount, layout]);
  return { stage, box };
}
