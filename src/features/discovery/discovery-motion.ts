const seenByDocument = new WeakMap<Document, Set<number>>();
const endings = new Set([
  "discovery-heading-enter",
  "discovery-tram-enter",
  "discovery-map-enter",
  "discovery-photo-first-enter",
]);

/** Finite CSS entrances; no scroll handler, frame loop, timer or image-decode gate. */
export function mountDiscoveryMotion(section: HTMLElement) {
  if (typeof IntersectionObserver !== "function") return () => {};
  const doc = section.ownerDocument;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const nodes = [...section.querySelectorAll<HTMLElement>(".discovery-heading, .discovery-choice")];
  const seen = seenByDocument.get(doc) ?? new Set<number>();
  seenByDocument.set(doc, seen);
  const visible = new Set<HTMLElement>();
  let nextStart = 0;

  function sync() {
    for (const node of nodes) {
      if (node.dataset["discoveryEntry"] === "enter")
        node.style.setProperty(
          "--discovery-play",
          visible.has(node) && !doc.hidden ? "running" : "paused",
        );
    }
  }

  function finish(node: HTMLElement) {
    seen.add(nodes.indexOf(node));
    node.dataset["discoveryEntry"] = "done";
    node.style.removeProperty("--discovery-delay");
    node.style.removeProperty("--discovery-play");
    observer.unobserve(node);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const node = entry.target as HTMLElement;
        if (entry.intersectionRatio > 0.01) visible.add(node);
        else visible.delete(node);
      }
      // DOM order, including when several cards become visible in one observer delivery.
      for (const [index, node] of nodes.entries()) {
        if (
          seen.has(index) ||
          !entries.some((entry) => entry.target === node && entry.intersectionRatio >= 0.2)
        )
          continue;
        seen.add(index);
        const now = performance.now();
        const delay = Math.max(0, nextStart - now);
        node.style.setProperty("--discovery-delay", `${delay}ms`);
        node.dataset["discoveryEntry"] = "enter";
        nextStart = now + delay + (index === 0 ? 450 : 180);
      }
      sync();
    },
    { threshold: [0.01, 0.2] },
  );

  function preference() {
    if (!reduced.matches) return;
    for (const node of nodes) finish(node);
  }

  function focus(event: FocusEvent) {
    const target = event.target;
    if (!(target instanceof Element) || !target.matches(":focus-visible")) return;
    const node = target.closest<HTMLElement>(".discovery-choice");
    if (node) finish(node);
  }

  function ended(event: AnimationEvent) {
    if (!endings.has(event.animationName) || !(event.target instanceof Element)) return;
    const node = event.target.closest<HTMLElement>(".discovery-heading, .discovery-choice");
    if (node) finish(node);
  }

  for (const [index, node] of nodes.entries()) {
    if (reduced.matches || seen.has(index)) finish(node);
    else observer.observe(node);
  }
  section.addEventListener("animationend", ended);
  section.addEventListener("focusin", focus);
  doc.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", preference);
  return () => {
    observer.disconnect();
    section.removeEventListener("animationend", ended);
    section.removeEventListener("focusin", focus);
    doc.removeEventListener("visibilitychange", sync);
    reduced.removeEventListener("change", preference);
    for (const node of nodes) {
      delete node.dataset["discoveryEntry"];
      node.style.removeProperty("--discovery-delay");
      node.style.removeProperty("--discovery-play");
    }
  };
}
