import type { Level } from "@/data/resort";
import { getHubScrollSnapshot } from "./scroll-to-hub-section";
import {
  atmosphereMix,
  birdPoses,
  clampAtmosphere,
  passageProgress,
  plantPoses,
  wavePoses,
  type AtmosphericPose,
} from "./atmosphere-motion";

export type AtmosphereStation = { id: Level; top: number; height: number };
const durations: Record<Level, number> = { heaven: 2100, sky: 950, earth: 750, sea: 1700 };
function write(element: HTMLElement | undefined | null, property: string, value: string) {
  if (element && element.style.getPropertyValue(property) !== value)
    element.style.setProperty(property, value);
}
function paintPoses(elements: HTMLElement[], poses: AtmosphericPose[]) {
  elements.forEach((element, i) => {
    const p = poses[i];
    if (!p) return;
    write(element, "opacity", p.opacity.toFixed(3));
    write(
      element,
      "transform",
      `translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,0) rotate(${p.rotate.toFixed(2)}deg) scale(${p.scale})`,
    );
  });
}

/** Shares the rail's existing scroll clock. No scroll interception or perpetual RAF. */
export function createJourneyAtmosphere(root: HTMLElement) {
  const plate = root.querySelector<HTMLElement>(".journey-atmosphere");
  const container = root.querySelector<HTMLElement>(".journey-worlds");
  const worlds = new Map(
    Array.from(root.querySelectorAll<HTMLElement>("[data-atmosphere-level]"), (el) => [
      el.dataset["atmosphereLevel"],
      el,
    ]),
  );
  const groups = new Map(
    Array.from(root.querySelectorAll<HTMLElement>("[data-atmosphere-effect]"), (el) => [
      el.dataset["atmosphereEffect"],
      el,
    ]),
  );
  const sprites = new Map(
    Array.from(groups, ([id, group]) => [
      id,
      Array.from(group.querySelectorAll<HTMLElement>("img")),
    ]),
  );
  const images = new Map(
    Array.from(worlds, ([id, world]) => [
      id,
      world.querySelector<HTMLElement>(".journey-backdrop"),
    ]),
  );
  const visibleEffects = new Set<Level>();
  let lastWorldY = NaN,
    lastViewport = NaN;
  const tails = new Map<Level, number>();
  let previousY: number | undefined, introStart: number | undefined;

  function warm(id: Level) {
    for (const element of sprites.get(id) ?? []) {
      const image = element as HTMLImageElement;
      if (!image.hasAttribute("src") && image.dataset["src"]) image.src = image.dataset["src"];
    }
  }
  function hide() {
    for (const group of groups.values()) write(group, "visibility", "hidden");
    tails.clear();
    introStart = undefined;
    if (plate) plate.dataset["atmosphereMoving"] = "false";
  }
  function heaven(progress: number, width: number, height: number) {
    const group = groups.get("heaven");
    visibleEffects.add("heaven");
    const glow = Math.pow(Math.sin(progress * Math.PI), 1.1);
    const halo = group?.querySelector<HTMLElement>(".atmosphere-halo"),
      rays = group?.querySelector<HTMLElement>(".atmosphere-rays");
    write(halo, "opacity", (glow * 0.85).toFixed(3));
    write(halo, "transform", `translate3d(${(progress * width * 0.08).toFixed(2)}px,0,0)`);
    write(rays, "opacity", (glow * 0.8).toFixed(3));
    write(rays, "transform", `rotate(${-8 + progress * 15}deg)`);
    paintPoses(
      sprites.get("heaven") ?? [],
      [0, 1].map((i) => ({
        x: (i ? 1 : -1) * progress * width * 0.17,
        y: -progress * height * 0.14,
        rotate: 0,
        scale: 1,
        opacity: (1 - progress) * 0.73,
      })),
    );
  }
  function paintWorlds(stations: AtmosphereStation[], y: number, viewport: number) {
    if (lastWorldY === y && lastViewport === viewport) return;
    lastWorldY = y;
    lastViewport = viewport;
    const mix = atmosphereMix(
      y,
      stations.map((s) => s.top),
      viewport,
    );
    stations.forEach((station, index) => {
      let opacity = 0;
      if (index === mix.base) opacity = 1;
      else if (index === mix.next) opacity = mix.blend;
      write(worlds.get(station.id), "opacity", String(opacity));
      const parallax = Math.max(
        -40,
        Math.min(40, (y + viewport / 2 - station.top - station.height / 2) * 0.06),
      );
      write(images.get(station.id), "transform", `translate3d(0,${parallax.toFixed(2)}px,0)`);
    });
    if (container && worlds.size && container.dataset["atmosphereReady"] !== "true")
      container.dataset["atmosphereReady"] = "true";
  }
  function paintIntro(
    first: AtmosphereStation,
    y: number,
    viewport: number,
    width: number,
    now: number,
    target: string | null,
  ) {
    if (
      !root.dataset["heavenIlluminated"] &&
      y >= first.top - viewport * 0.07 &&
      y < first.top + viewport * 0.2 &&
      (!target || target === "heaven") &&
      (sprites.get("heaven") ?? []).every((element) => {
        const image = element as HTMLImageElement;
        return image.complete && image.naturalWidth > 0;
      })
    ) {
      root.dataset["heavenIlluminated"] = "true";
      introStart = now;
    }
    if (introStart === undefined) return false;
    const progress = clampAtmosphere((now - introStart) / durations.heaven);
    if (progress >= 1 || y >= first.top + viewport * 0.4) {
      introStart = undefined;
      return false;
    }
    heaven(progress, width, viewport);
    return true;
  }
  function phaseFor(
    station: AtmosphereStation,
    y: number,
    viewport: number,
    now: number,
    target: string | null,
  ) {
    const { id, top } = station,
      p = passageProgress(y, top, viewport);
    if ((target && target !== id) || p === null) {
      tails.delete(id);
      return null;
    }
    if (y < top - 2) {
      tails.delete(id);
      return p;
    }
    if (previousY !== undefined && previousY < top - 2 && y >= top - 2) tails.set(id, now);
    const start = tails.get(id);
    if (start === undefined) return y < top - 2 ? p : null;
    const tail = clampAtmosphere((now - start) / durations[id]);
    if (tail >= 1) {
      tails.delete(id);
      return null;
    }
    return 1 + tail;
  }
  function paintPassage(
    station: AtmosphereStation,
    phase: number,
    y: number,
    viewport: number,
    width: number,
  ) {
    visibleEffects.add(station.id);
    const boundary = Math.max(0, station.top - y);
    let poses: AtmosphericPose[];
    if (station.id === "sky") poses = birdPoses(phase, boundary, width, viewport);
    else if (station.id === "earth") poses = plantPoses(phase, boundary, width, viewport);
    else poses = wavePoses(phase, width, viewport);
    paintPoses(sprites.get(station.id) ?? [], poses);
  }
  function paint(
    stations: AtmosphereStation[],
    y: number,
    viewport: number,
    width: number,
    now: number,
  ) {
    if (!plate || !stations.length) return false;
    const first = stations[0]!,
      last = stations.at(-1)!;
    paintWorlds(stations, y, viewport);
    if (y + viewport <= first.top || y >= last.top + last.height) {
      hide();
      previousY = y;
      return false;
    }
    const target = getHubScrollSnapshot().target;
    for (const station of stations) {
      if (
        (!target || target === station.id) &&
        station.top < y + viewport * 1.65 &&
        station.top + station.height > y
      )
        warm(station.id);
    }
    visibleEffects.clear();
    let moving = paintIntro(first, y, viewport, width, now, target);
    for (const station of stations.slice(1)) {
      const phase = phaseFor(station, y, viewport, now, target);
      if (phase === null) continue;
      paintPassage(station, phase, y, viewport, width);
      moving = phase >= 1 || moving;
    }
    for (const [id, group] of groups)
      write(group, "visibility", visibleEffects.has(id as Level) ? "visible" : "hidden");
    previousY = y;
    if (plate.dataset["atmosphereMoving"] !== String(moving))
      plate.dataset["atmosphereMoving"] = String(moving);
    return moving;
  }
  const invalidate = () => {
    lastWorldY = NaN;
    lastViewport = NaN;
  };
  return { paint, hide, invalidate };
}
