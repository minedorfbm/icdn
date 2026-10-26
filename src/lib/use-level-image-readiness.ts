import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import {
  getHubScrollSnapshot,
  initialHubScroll,
  subscribeHubScrollTarget,
} from "./scroll-to-hub-section";

/** Keep scroll-through chapters dormant during an intentional jump. */
export function useLevelImageReadiness(id: string, section: RefObject<HTMLElement | null>) {
  const { target, revision } = useSyncExternalStore(
    subscribeHubScrollTarget,
    getHubScrollSnapshot,
    () => initialHubScroll,
  );
  const [near, setNear] = useState({ revision: -1, value: false });
  useEffect(() => {
    const element = section.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      setNear({ revision, value: true });
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setNear({ revision, value: Boolean(entry?.isIntersecting) }),
      { rootMargin: "0px 0px 200px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [section, revision]);
  // Re-observe on arrival: an intersection from mid-jump must not start a photo.
  return target ? target === id : near.revision === revision && near.value;
}
