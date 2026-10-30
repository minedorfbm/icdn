const enteredDocuments = new WeakSet<Document>();
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

  function sync() {
    for (const node of nodes) {
      if (node.dataset["discoveryEntry"] === "enter")
        node.style.setProperty("--discovery-play", doc.hidden ? "paused" : "running");
    }
  }

  function finish(node: HTMLElement) {
    node.dataset["discoveryEntry"] = "done";
    node.style.removeProperty("--discovery-delay");
    node.style.removeProperty("--discovery-play");
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry || entry.intersectionRatio < 0.01 || enteredDocuments.has(doc)) return;
      enteredDocuments.add(doc);
      // One viewport signal starts the entire timeline; scrolling never pauses or seeks it.
      for (const [index, node] of nodes.entries()) {
        if (node.dataset["discoveryEntry"] === "done") continue;
        node.style.setProperty(
          "--discovery-delay",
          `${index === 0 ? 0 : 450 + (index - 1) * 180}ms`,
        );
        node.dataset["discoveryEntry"] = "enter";
      }
      sync();
      observer.disconnect();
    },
    { threshold: 0.01 },
  );

  function preference() {
    if (!reduced.matches) return;
    enteredDocuments.add(doc);
    observer.disconnect();
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

  if (reduced.matches || enteredDocuments.has(doc)) {
    enteredDocuments.add(doc);
    for (const node of nodes) finish(node);
  } else observer.observe(section);
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
