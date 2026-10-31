import { HERO_DESKTOP_MEDIA, HERO_LANDSCAPE_MEDIA } from "./hero-media";

const entered = new WeakSet<Document>();
const easeOut = "cubic-bezier(0.33, 1, 0.68, 1)";

/** Native compositor timelines: no animation-frame loop or image-decode gate. */
export function mountHeroMotion(hero: HTMLElement) {
  const doc = hero.ownerDocument;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = matchMedia(HERO_DESKTOP_MEDIA);
  const landscape = matchMedia(HERO_LANDSCAPE_MEDIA);
  let animations: Animation[] = [];
  let supported = true;
  let visible =
    hero.getBoundingClientRect().bottom > 0 && hero.getBoundingClientRect().top < innerHeight;

  function add(
    selector: string,
    frames: Keyframe[],
    options: KeyframeAnimationOptions,
    id: string,
  ) {
    if (!supported) return;
    for (const node of hero.querySelectorAll<HTMLElement>(selector)) {
      try {
        const animation = node.animate(frames, options);
        animation.id = `hero-brume-${id}`;
        animation.pause();
        animations.push(animation);
      } catch {
        // Progressive enhancement: an unavailable animation engine keeps the still design.
        supported = false;
        return;
      }
    }
  }

  function rise(selector: string, delay: number, duration: number, distance: number) {
    add(
      selector,
      [{ transform: `translate3d(0,${distance}px,0)` }, { transform: "none" }],
      { delay, duration, easing: easeOut, fill: "both" },
      "entry",
    );
  }

  function wave(period: number, frame: (phase: number) => Keyframe) {
    const steps = Math.ceil(period * 2);
    return Array.from({ length: steps + 1 }, (_, i) => ({
      ...frame((i / steps) * Math.PI * 2),
      offset: i / steps,
    }));
  }

  function build() {
    if (reduced.matches) {
      entered.add(doc);
      return;
    }
    const cloudOpacity = Number(getComputedStyle(hero).getPropertyValue("--hero-cloud-opacity"));
    const intro = !entered.has(doc);
    entered.add(doc);
    const delay = intro ? 3300 : 0;
    if (intro) {
      rise(".hero-welcome", 400, 2200, 6);
      rise(".hero-title-first", 1150, 1250, 8);
      rise(".hero-title-second", 1380, 1350, 8);
      rise(".hero-invitation-caption", 1850, 1200, 5);
      rise(".hero-key-arrival", 2100, 1150, 7);
      add(
        ".hero-cloud-main .hero-cloud-arrival",
        [{ transform: "translate3d(-26px,9px,0)" }, { transform: "none" }],
        { duration: 3300, easing: easeOut, fill: "both" },
        "entry",
      );
      add(
        ".hero-cloud-main",
        [{ opacity: cloudOpacity - 0.14 }, { opacity: cloudOpacity }],
        { duration: 3300, easing: easeOut },
        "entry",
      );
      add(
        ".hero-cloud-front .hero-cloud-arrival",
        [{ transform: "translate3d(30px,5px,0)" }, { transform: "none" }],
        { duration: 3300, easing: easeOut, fill: "both" },
        "entry",
      );
      add(
        ".hero-cloud-front",
        [{ opacity: 0.3, offset: 0 }, { opacity: 0.3, offset: 1.4 / 4.4 }, { opacity: 0 }],
        { duration: 4400, easing: "ease-in-out" },
        "entry",
      );
    }
    add(
      ".hero-cloud-main .hero-cloud-texture",
      wave(18, (p) => ({
        transform: `translate3d(${Math.sin(p) * 13}px,${(1 - Math.cos(p)) * 1.8}px,0)`,
      })),
      { duration: 18000, delay, iterations: Infinity },
      "loop-cloud",
    );
    add(
      ".hero-cloud-main",
      wave(18, (p) => ({ opacity: cloudOpacity + Math.sin(p) * 0.035 })),
      { duration: 18000, delay, iterations: Infinity },
      "loop-cloud",
    );
    add(
      ".hero-cloud-front .hero-cloud-texture",
      wave(36, (p) => ({
        transform: `translate3d(${-Math.sin(p * 2) * 18}px,${-Math.sin(p) * 2}px,0)`,
      })),
      { duration: 36000, delay, iterations: Infinity },
      "loop-mist",
    );
    add(
      ".hero-cloud-front",
      wave(18, (p) => ({ opacity: (1 - Math.cos(p)) * 0.065 })),
      { duration: 18000, delay: intro ? 4400 : 0, iterations: Infinity },
      "loop-mist",
    );
    add(
      ".hero-key-float",
      wave(7, (p) => ({ transform: `translate3d(0,${-Math.sin(p) * 1.8}px,0)` })),
      { duration: 7000, delay, iterations: Infinity },
      "loop-key",
    );
    add(
      ".hero-key-sway",
      wave(10, (p) => ({ transform: `rotate(${Math.sin(p) * 2.5}deg)` })),
      { duration: 10000, delay, iterations: Infinity },
      "loop-key",
    );
  }

  // Resolve theme opacity only at a breakpoint change, not on every animation frame.
  function refreshCloudOpacity() {
    const opacity = Number(getComputedStyle(hero).getPropertyValue("--hero-cloud-opacity"));
    for (const animation of hero.querySelector(".hero-cloud-main")?.getAnimations() ?? []) {
      const effect = animation.effect as KeyframeEffect;
      if (animation.id === "hero-brume-entry") {
        effect.setKeyframes([{ opacity: opacity - 0.14 }, { opacity }]);
      } else if (animation.id === "hero-brume-loop-cloud") {
        effect.setKeyframes(wave(18, (p) => ({ opacity: opacity + Math.sin(p) * 0.035 })));
      }
    }
    sync();
  }

  function sync() {
    const running = visible && !doc.hidden && !reduced.matches;
    const renderedTargets = new Map<Element, boolean>();
    for (const animation of animations) {
      if (animation.playState === "finished") continue;
      const target = (animation.effect as KeyframeEffect).target;
      let rendered = false;
      if (target) {
        if (!renderedTargets.has(target))
          renderedTargets.set(target, target.getClientRects().length > 0);
        rendered = renderedTargets.get(target)!;
      }
      // CSS can hide a logo or all clouds at a responsive breakpoint. Finish
      // hidden entrances so rotating later never starts an old delayed entry.
      if (!rendered && animation.id === "hero-brume-entry") animation.finish();
      else if (running && rendered) animation.play();
      else animation.pause();
    }
    hero.dataset["heroMotion"] = reduced.matches ? "static" : running ? "running" : "paused";
  }

  function preference() {
    for (const animation of animations) animation.cancel();
    animations = [];
    build();
    sync();
  }

  if (typeof hero.animate !== "function") return () => {};
  build();
  if (!supported) {
    for (const animation of animations) animation.cancel();
    return () => {};
  }
  sync();
  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = (entry?.intersectionRatio ?? 0) > 0.01;
      sync();
    },
    { threshold: 0.01 },
  );
  observer.observe(hero);
  doc.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", preference);
  desktop.addEventListener("change", refreshCloudOpacity);
  landscape.addEventListener("change", sync);
  return () => {
    observer.disconnect();
    doc.removeEventListener("visibilitychange", sync);
    reduced.removeEventListener("change", preference);
    desktop.removeEventListener("change", refreshCloudOpacity);
    landscape.removeEventListener("change", sync);
    for (const animation of animations) animation.cancel();
    delete hero.dataset["heroMotion"];
  };
}
