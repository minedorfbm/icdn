import type { Level } from "@/data/resort";
import { getHubScrollSnapshot } from "./scroll-to-hub-section";
import {
  atmosphereMix,
  birdPoses,
  clampAtmosphere,
  passageProgress,
  heavenEntryLead,
  settlePlantPoses,
  plantPoses,
  smoothAtmosphere,
  waveLayout,
  wavePoses,
  type AtmosphericPose,
  type WaveCardAnchor,
  type WaveEntryBounds,
} from "./atmosphere-motion";

export type AtmosphereStation = {
  id: Level;
  top: number;
  height: number;
  card?: WaveCardAnchor | undefined;
  waveEntry?: WaveEntryBounds | undefined;
};
const durations: Record<Level, number> = { heaven: 2100, sky: 950, earth: 750, sea: 850 };
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
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  const decorationsAllowed =
    !connection?.saveData && !["slow-2g", "2g"].includes(connection?.effectiveType ?? "");
  const warmed = new Set<Level>();
  const chapters = new Map(
    Array.from(root.querySelectorAll<HTMLElement>(".level-chapter"), (chapter) => [
      chapter.id,
      chapter,
    ]),
  );
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
  let scrollDirection = 0;
  let introComplete = false;
  let heavenVisible = false;
  let heavenFadeStart: number | undefined;
  let introRevision = getHubScrollSnapshot().revision;
  let introFrom = 0,
    introLast = 0;

  let earthPoses: AtmosphericPose[] | undefined;
  let earthFrame = 0;
  let earthWidth = 0;

  function warm(id: Level) {
    if (warmed.has(id)) return;
    // Clouds reuse an already requested hero file. New artwork yields to all
    // admitted high-priority front photos; image load/error wakes this clock.
    if (id !== "heaven") {
      const cover = chapters
        .get(id)
        ?.querySelector<HTMLImageElement>('.destination-panel[aria-hidden="false"] img');
      // IO/React may not yet have admitted the approaching level's photo on the
      // first scroll frame. Absence of an eager cover is not an idle network.
      if (
        !cover ||
        cover.getAttribute("fetchpriority") !== "high" ||
        !cover.complete ||
        (!cover.currentSrc && !cover.getAttribute("src"))
      )
        return;
      if (
        Array.from(
          root.querySelectorAll<HTMLImageElement>(
            '.destination-panel[aria-hidden="false"] img[fetchpriority="high"]',
          ),
        ).some((image) => !image.complete || (!image.currentSrc && !image.getAttribute("src")))
      )
        return;
    }
    for (const element of sprites.get(id) ?? []) {
      const image = element as HTMLImageElement;
      if (!image.hasAttribute("src") && image.dataset["src"]) image.src = image.dataset["src"];
    }
    warmed.add(id);
  }
  function resetIntro() {
    introStart = undefined;
    introLast = 0;
    introFrom = 0;
    introComplete = false;
  }
  function hide() {
    for (const group of groups.values()) write(group, "visibility", "hidden");
    tails.clear();
    heavenVisible = false;
    heavenFadeStart = undefined;
    write(groups.get("heaven"), "opacity", "0");
    earthPoses = undefined;
    resetIntro();
    if (plate) plate.dataset["atmosphereMoving"] = "false";
  }
  function heaven(progress: number, width: number, height: number, entry = 1) {
    const group = groups.get("heaven");
    visibleEffects.add("heaven");
    const appearance = smoothAtmosphere(entry / 0.12);
    const glow = Math.pow(Math.sin(progress * Math.PI), 1.1) * appearance;
    const halo = group?.querySelector<HTMLElement>(".atmosphere-halo"),
      rays = group?.querySelector<HTMLElement>(".atmosphere-rays");
    write(halo, "opacity", (glow * (width < 768 ? 0.55 : 0.8)).toFixed(3));
    write(halo, "transform", `translate3d(${(progress * width * 0.08).toFixed(2)}px,0,0)`);
    write(rays, "opacity", (glow * (width < 768 ? 0.4 : 0.65)).toFixed(3));
    write(rays, "transform", `rotate(${-8 + progress * 15}deg)`);
    paintPoses(
      sprites.get("heaven") ?? [],
      [0, 1].map((i) => ({
        x: (i ? 1 : -1) * progress * width * 0.17,
        y: -progress * Math.min(height * 0.06, 48),
        rotate: 0,
        scale: 1,
        opacity: (1 - progress) * 0.83 * appearance,
      })),
    );
  }
  function finishHeaven(now: number) {
    const group = groups.get("heaven");
    if (visibleEffects.has("heaven")) {
      heavenVisible = true;
      heavenFadeStart = undefined;
      write(group, "opacity", "1");
      return false;
    }
    if (!heavenVisible) return false;
    // Freeze the last entrance pose and dissolve it briefly instead of cutting
    // visibility. The existing clock stops again as soon as this fade completes.
    heavenFadeStart ??= now;
    const opacity = 1 - smoothAtmosphere((now - heavenFadeStart) / 180);
    write(group, "opacity", opacity.toFixed(3));
    if (opacity > 0) {
      visibleEffects.add("heaven");
      return true;
    }
    heavenVisible = false;
    heavenFadeStart = undefined;
    return false;
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
      y + viewport <= first.top - heavenEntryLead(viewport) ||
      y >= first.top + viewport * 0.75 ||
      (target && target !== "heaven")
    ) {
      resetIntro();
      return false;
    }
    // This is an arrival, never a departure overlay. Keep the direction across
    // stationary tail frames; an upward return is still an entrance to HEAVEN.
    if (y > first.top + 2 && scrollDirection >= 0) {
      introComplete = true;
      introStart = undefined;
      introLast = 0;
      return false;
    }
    if (introComplete) {
      const returning =
        y < first.top - 2 ||
        (previousY !== undefined && previousY > first.top + 24 && y < previousY);
      if (!returning) return false;
      resetIntro();
    }
    if (
      !(sprites.get("heaven") ?? []).every((element) => {
        const image = element as HTMLImageElement;
        return image.complete && image.naturalWidth > 0;
      })
    )
      return false;
    const lead = heavenEntryLead(viewport);
    const entry = clampAtmosphere((y + viewport - first.top + lead) / Math.max(1, viewport + lead));
    if (y < first.top - 2 || (y > first.top + 2 && introStart === undefined)) {
      // Both scroll directions announce HEAVEN, without consuming a stationary approach.
      const approach =
        y > first.top ? clampAtmosphere((first.top + viewport - y) / viewport) : entry;
      introStart = undefined;
      introLast = approach * 0.65;
      heaven(introLast, width, viewport, approach);
      return false;
    }
    if (introStart === undefined) {
      introStart = now;
      introFrom = introLast;
    }
    // A direct/cold arrival still gets a gentle full entrance; ordinary scrolling
    // has already played its approach and only needs the short finishing fade.
    const duration = introFrom > 0 ? 900 : durations.heaven;
    const tail = clampAtmosphere((now - introStart) / duration);
    if (tail >= 1) {
      introComplete = true;
      introStart = undefined;
      introLast = 0;
      return false;
    }
    heaven(introFrom + (1 - introFrom) * smoothAtmosphere(tail), width, viewport);
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
    now: number,
  ) {
    visibleEffects.add(station.id);
    let settling = false;
    const boundary = Math.max(0, station.top - y);
    let poses: AtmosphericPose[];
    if (station.id === "sky") poses = birdPoses(phase, boundary, width, viewport);
    else if (station.id === "earth") {
      const target = plantPoses(phase, boundary, width, viewport);
      // Snap distant navigation/resize, smooth only local decorative movement.
      const previous =
        earthWidth === width && previousY !== undefined && Math.abs(y - previousY) < viewport * 0.5
          ? earthPoses
          : undefined;
      const result = settlePlantPoses(
        previous,
        target,
        earthFrame ? now - earthFrame : 16.67,
        width < 768 ? 90 : 60,
      );
      earthWidth = width;
      earthPoses = poses = result.poses;
      earthFrame = result.moving ? now : 0;
      settling = result.moving;
    } else {
      const entry = station.waveEntry && {
        top: station.waveEntry.top - y,
        bottom: station.waveEntry.bottom - y,
      };
      const layout = waveLayout(width, viewport, station.card, boundary, entry);
      write(groups.get("sea"), "--atmosphere-wave-width", `${layout.width.toFixed(2)}px`);
      poses = wavePoses(phase, width, viewport, station.card, boundary, entry);
    }
    paintPoses(sprites.get(station.id) ?? [], poses);
    return settling;
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
    if (previousY !== undefined && y !== previousY) scrollDirection = y > previousY ? 1 : -1;
    paintWorlds(stations, y, viewport);
    write(container, "--atmosphere-entry-lead", heavenEntryLead(viewport).toFixed(2) + "px");
    if (
      !decorationsAllowed ||
      y + viewport <= first.top - heavenEntryLead(viewport) ||
      y >= last.top + last.height
    ) {
      hide();
      previousY = y;
      return false;
    }
    const navigation = getHubScrollSnapshot();
    const target = navigation.target;
    if (navigation.revision !== introRevision) {
      introRevision = navigation.revision;
      if (target === "heaven") resetIntro();
    }
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
      // Mobile browser chrome changes innerHeight during a gesture. The level's
      // stable layout height keeps foliage on one path while the toolbar moves.
      const sceneHeight = station.id === "earth" && width < 768 ? station.height : viewport;
      const phase = phaseFor(station, y, sceneHeight, now, target);
      if (phase === null) continue;
      const settling = paintPassage(station, phase, y, sceneHeight, width, now);
      moving = settling || phase >= 1 || moving;
    }
    moving = finishHeaven(now) || moving;
    for (const [id, group] of groups)
      write(group, "visibility", visibleEffects.has(id as Level) ? "visible" : "hidden");
    if (!visibleEffects.has("earth")) earthPoses = undefined;
    previousY = y;
    if (plate.dataset["atmosphereMoving"] !== String(moving))
      plate.dataset["atmosphereMoving"] = String(moving);
    return moving;
  }
  const invalidate = () => {
    // Mobile toolbar refreshes must not snap an in-flight foliage pose.
    // Width changes and distant navigation reset it in paintPassage instead.
    if (earthWidth >= 768) earthPoses = undefined;
    lastWorldY = NaN;
    lastViewport = NaN;
  };
  return { paint, hide, invalidate };
}
