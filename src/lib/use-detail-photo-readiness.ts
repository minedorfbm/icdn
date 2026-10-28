import { useCallback, useEffect, type RefObject } from "react";
import { imageVariants } from "./image-source";
import { prepareDetailPhoto } from "./prepare-detail-photo";

function backgroundPhotosAllowed() {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  return !connection?.saveData && !["slow-2g", "2g"].includes(connection?.effectiveType ?? "");
}

/** Prepare only a settled, front-facing card after it stays visibly in view.
 * No speculative catalogue/media reads or lower-resolution replacement. */
export function useDetailPhotoReadiness(
  element: RefObject<HTMLElement | null>,
  source: string,
  enabled: boolean,
  coverReady: boolean,
) {
  const prepare = useCallback(() => {
    if (!enabled || !coverReady || !imageVariants(source) || !backgroundPhotosAllowed()) return;
    prepareDetailPhoto(source, "low");
  }, [enabled, coverReady, source]);

  useEffect(() => {
    const node = element.current;
    if (
      !node ||
      !enabled ||
      !coverReady ||
      !imageVariants(source) ||
      !backgroundPhotosAllowed() ||
      !("IntersectionObserver" in window)
    )
      return;
    let timer: number | undefined;
    const cancel = () => window.clearTimeout(timer);
    const observer = new IntersectionObserver(
      ([entry]) => {
        cancel();
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.5) return;
        timer = window.setTimeout(() => {
          if (document.visibilityState !== "visible") return;
          prepare();
          observer.disconnect();
        }, 800);
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => {
      cancel();
      observer.disconnect();
    };
  }, [element, source, enabled, coverReady, prepare]);
  return prepare;
}
