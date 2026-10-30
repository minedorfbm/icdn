export const clampAtmosphere = (value: number) => Math.min(1, Math.max(0, value));
export function smoothAtmosphere(value: number) {
  const x = clampAtmosphere(value);
  return x * x * (3 - 2 * x);
}

/** A whole-viewport dissolve, completed before the next station's arrival. */
export function atmosphereMix(y: number, tops: readonly number[], viewport: number) {
  for (let next = 1; next < tops.length; next++) {
    const top = tops[next]!;
    if (y >= top) continue;
    const span = Math.min(Math.max(1, top - tops[next - 1]!), Math.max(1, viewport));
    return {
      base: next - 1,
      next,
      blend: smoothAtmosphere((y - (top - span * 0.88)) / (span * 0.76)),
    };
  }
  const base = Math.max(0, tops.length - 1);
  return { base, next: base, blend: 0 };
}

/** Real geometry owns this phase. Clock time is used only for the short arrival tail. */
export function passageProgress(y: number, top: number, viewport: number) {
  const span = Math.max(1, viewport * 0.92);
  if (y < top - span || y > top + viewport * 0.2) return null;
  return clampAtmosphere((y - (top - span)) / span);
}

export type AtmosphericPose = {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
};
const pose = (
  x: number,
  y: number,
  rotate: number,
  scale: number,
  opacity: number,
): AtmosphericPose => ({ x, y, rotate, scale, opacity });

export function birdPoses(phase: number, boundary: number, width: number, height: number) {
  const p = clampAtmosphere(phase),
    tail = smoothAtmosphere(phase - 1);
  const mobile = width < 768,
    amplitude = Math.min(height, mobile ? 740 : 900);
  return [0.78, 0.67, 0.72].map((arrival, i) => {
    const delay = [0, 0.13, 0.26][i]!;
    const q =
      phase > 1
        ? arrival + (1 - arrival) * tail
        : smoothAtmosphere((p - delay) / (1 - delay)) * arrival;
    const opacity = smoothAtmosphere(q / 0.09) * (1 - smoothAtmosphere((q - 0.84) / 0.16));
    if (i === 0)
      return pose(
        -width * 0.15 + q * width * 1.4,
        boundary + amplitude * (0.12 - Math.sin(q * Math.PI) * 0.13 - q * 0.1),
        -12 + q * 12,
        0.92,
        opacity,
      );
    if (i === 1)
      return pose(
        width * 1.1 - q * width * 1.35,
        boundary + amplitude * (0.19 - Math.sin(q * Math.PI) * 0.12 - q * 0.15),
        14 - q * 20,
        0.74,
        opacity,
      );
    return pose(
      width * (mobile ? 0.78 + q * 0.12 : 0.17 + q * 0.66),
      boundary + amplitude * (mobile ? 0.13 - q * 0.24 : 0.26 - q * 0.4),
      9 - q * 25,
      0.49,
      opacity,
    );
  });
}

/** A short, bounded follow-through absorbs coarse wheel/touch scroll steps. */
export function settlePlantPoses(
  previous: AtmosphericPose[] | undefined,
  target: AtmosphericPose[],
  elapsed: number,
) {
  if (!previous) return { poses: target, moving: false };
  const alpha = 1 - Math.exp(-Math.min(32, Math.max(1, elapsed)) / 60);
  let moving = false;
  const poses = target.map((next, i) => {
    const old = previous[i] ?? next;
    const blend = (key: keyof AtmosphericPose, epsilon: number) => {
      const delta = next[key] - old[key];
      if (Math.abs(delta) < epsilon) return next[key];
      moving = true;
      return old[key] + delta * alpha;
    };
    return pose(
      blend("x", 0.1),
      blend("y", 0.1),
      blend("rotate", 0.02),
      next.scale,
      blend("opacity", 0.001),
    );
  });
  return { poses, moving };
}

export const heavenEntryLead = (viewport: number) => Math.min(64, Math.max(36, viewport * 0.06));

export function plantPoses(phase: number, boundary: number, width: number, height: number) {
  const p = clampAtmosphere(phase),
    t = clampAtmosphere(phase - 1),
    r = p + smoothAtmosphere(t) * 0.16;
  const edge = Math.min(1, width / 1024),
    h = Math.min(height, 900),
    mobile = width < 768;
  const positions = [
    [
      -65 * edge - r * 85 * edge,
      boundary + h * ((mobile ? -0.13 : 0.055) - r * 0.085),
      -8 - r * 13,
    ],
    [
      width - 150 * edge + r * 90 * edge,
      boundary + h * ((mobile ? -0.12 : 0.03) - r * 0.065),
      4 + r * 12,
    ],
    [
      width - 45 * edge + r * 10 * edge,
      boundary - h * (0.145 + r * 0.065),
      Math.sin(r * Math.PI) * 7,
    ],
    [-85 * edge - r * 80 * edge, boundary + h * (0.38 - r * 0.13), -10 + r * 22],
    [mobile ? -12 + r * 5 : width * (0.025 + r * 0.045), boundary + h * (0.04 + r * 0.17), r * 120],
    [width * (0.94 - r * 0.025), boundary + h * (0.12 + r * 0.12), -r * 100],
    [
      mobile ? -14 + r * 4 : width * (0.035 + r * 0.04),
      boundary + h * (0.26 + r * 0.16),
      35 + r * 160,
    ],
  ];
  return positions.map(([x, y, angle], i) => {
    const delay = [0, 0.08, 0.16, 0.2, 0.32, 0.4, 0.5][i]!;
    const opacity =
      smoothAtmosphere((p - delay) / 0.23) *
      (i < 4 ? 1 - 0.65 * smoothAtmosphere((p - 0.65) / 0.35) : 0.8) *
      (1 - smoothAtmosphere(t));
    return pose(x!, y!, angle!, 1, opacity);
  });
}

export type WaveCardAnchor = { left: number; width: number; centerY: number; height?: number };

/** Four sizes share one vector; rows span the section entrance to the card's upper quarter. */
export function waveLayout(width: number, height: number, card?: WaveCardAnchor, boundary = 0) {
  const anchor = card ?? { left: width * 0.12, width: width * 0.76, centerY: height * 0.55 };
  const waveWidth = Math.min(width * 0.42, anchor.width * 0.5, 220);
  const cardHeight = anchor.height ?? height * 0.66;
  const halfWaveHeight = (waveWidth * (130 / 360)) / 2;
  const top = boundary + 10 + halfWaveHeight;
  const bottom = Math.max(top, anchor.centerY - cardHeight * 0.25 - 10 - halfWaveHeight);
  return {
    width: waveWidth,
    left: Math.max(-waveWidth, anchor.left - waveWidth * 1.1),
    top,
    height: bottom - top,
  };
}

export function wavePoses(
  phase: number,
  width: number,
  height: number,
  card?: WaveCardAnchor,
  boundary = 0,
) {
  const p = clampAtmosphere(phase),
    t = clampAtmosphere(phase - 1);
  const layout = waveLayout(width, height, card, boundary);
  return [0.78, 0.66, 0.7, 0.62].map((arrival, index) => {
    const delay = [0, 0.08, 0.16, 0.24][index]!;
    const q =
      phase > 1
        ? arrival + (1 - arrival) * smoothAtmosphere(t)
        : smoothAtmosphere((p - delay) / (1 - delay)) * arrival;
    const opacity = smoothAtmosphere(q / 0.12) * (1 - smoothAtmosphere((q - 0.78) / 0.22));
    return pose(
      width + layout.width * 0.2 + (layout.left - width - layout.width * 0.2) * q,
      layout.top + [0, 0.33, 0.66, 1][index]! * layout.height - (layout.width * (130 / 360)) / 2,
      0,
      [0.48, 1, 0.67, 0.83][index]!,
      opacity * [0.65, 0.8, 0.65, 0.7][index]!,
    );
  });
}
