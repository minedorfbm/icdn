/** A direct card is already usable from its focused snapshot. Avoid competing
 * with its main photo; interaction and a bounded timeout keep the full resort available. */
export function afterDetailHero(image: HTMLImageElement | null, read: () => void) {
  if (!image || image.complete) {
    read();
    return () => {};
  }
  let finished = false;
  const timer = window.setTimeout(start, 3000);
  const interactions = ["pointerdown", "keydown", "touchstart", "wheel"] as const;
  function cleanup() {
    window.clearTimeout(timer);
    image?.removeEventListener("load", start);
    image?.removeEventListener("error", start);
    for (const event of interactions) document.removeEventListener(event, start, true);
  }
  function start() {
    if (finished) return;
    finished = true;
    cleanup();
    read();
  }
  image.addEventListener("load", start);
  image.addEventListener("error", start);
  for (const event of interactions)
    document.addEventListener(event, start, { capture: true, passive: true });
  return () => {
    finished = true;
    cleanup();
  };
}
