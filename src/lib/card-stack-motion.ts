import { cardPosition } from "./card-swipe";

// Original resting slots: horizontal offset, scale, brightness, z-order and Y rotation.
type Slot = [number, number, number, number, number];
const slots: Slot[] = [
  [4, 1, 1, 40, 0],
  [22, 0.88, 0.65, 30, -16],
  [38, 0.76, 0.43, 20, -24],
];
const exit: Slot = [-88, 0.94, 0.8, 50, 12];
export const STACK_VISIBLE = slots.length;
export const STACK_DURATION = 650;
export const STACK_EASING = "cubic-bezier(0.25,0.65,0.25,1)";
export const STACK_SETTLE = `${STACK_DURATION}ms ${STACK_EASING}`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (x: number, min = 0, max = 1) => Math.min(max, Math.max(min, x));

export type StackBox = { width: number; height: number; top: number; stageHeight: number };
export type StackOrigin = {
  position: number;
  x: number;
  y: number;
  tilt: number;
  scale: number;
  rotation: number;
};
export const STACK_ORIGIN: StackOrigin = {
  position: 0,
  x: 0,
  y: 0,
  tilt: 0,
  scale: 1,
  rotation: 0,
};

export function stackSlot(pos: number): Slot {
  if (pos <= -1) return exit;
  if (pos < 0) {
    const t = pos + 1;
    return [
      lerp(exit[0], slots[0]![0], t),
      lerp(exit[1], 1, t),
      lerp(exit[2], 1, t),
      exit[3],
      lerp(exit[4], 0, t),
    ];
  }
  if (pos >= STACK_VISIBLE - 1) return slots[STACK_VISIBLE - 1]!;
  const index = Math.floor(pos),
    t = pos - index;
  const a = slots[index]!,
    b = slots[index + 1]!;
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), a[3], lerp(a[4], b[4], t)];
}

/** Project four corners around the existing left/center origin; no DOM reads during a drag. */
export function stackVerticalBounds(box: StackBox, scale: number, rotation: number, tilt: number) {
  const rz = (tilt * Math.PI) / 180,
    ry = (rotation * Math.PI) / 180;
  const cz = Math.cos(rz),
    sz = Math.sin(rz),
    sy = Math.sin(ry);
  let min = Infinity,
    max = -Infinity;
  for (let ix = 0; ix < 2; ix++)
    for (let iy = 0; iy < 2; iy++) {
      const x = ix * box.width,
        y = (iy - 0.5) * box.height;
      const rx = scale * (cz * x - sz * y);
      const value = box.top + box.height / 2 + (scale * (sz * x + cz * y)) / (1 + (sy * rx) / 1200);
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  return { min, max };
}

function fit(box: StackBox, scale: number, rotation: number, tilt: number, desiredY: number) {
  if (!box.height || !box.stageHeight) return { scale, y: 0 };
  for (let i = 0; i < 3; i++) {
    const bounds = stackVerticalBounds(box, scale, rotation, tilt);
    const span = bounds.max - bounds.min;
    if (span <= box.stageHeight - 0.5) break;
    scale *= (box.stageHeight - 0.5) / span;
  }
  const bounds = stackVerticalBounds(box, scale, rotation, tilt);
  return { scale, y: clamp(desiredY, -bounds.min, box.stageHeight - bounds.max) };
}

export function stackFrame(
  offset: number,
  distance: number,
  travel: number,
  dragging: boolean,
  box: StackBox,
  origin = STACK_ORIGIN,
  reduced = false,
  followPointer = true,
) {
  const moving = dragging && !reduced;
  const position = offset + (moving ? origin.position + cardPosition(0, distance, travel) : 0);
  const [x, restingScale, brightness, zIndex, restingRotation] = stackSlot(position);
  const amount = clamp(Math.abs(distance / travel));
  const active = offset === 0 && moving;
  let scale = restingScale,
    rotation = restingRotation,
    tilt = 0,
    y = 0;
  if (!reduced && position < 0) {
    tilt = 6 * clamp(position, -1, 0);
    rotation = 5 * Math.sin(Math.PI * clamp(-position));
  }
  if (active) {
    tilt = followPointer
      ? clamp(origin.tilt + (6 * distance) / (travel * 0.45), -6, 6)
      : Math.sign(distance) * 6 * Math.sin(Math.PI * amount);
    rotation = followPointer
      ? origin.rotation * (1 - amount) + (distance < 0 ? 5 : -5) * Math.sin(Math.PI * amount)
      : restingRotation + Math.sign(distance) * 3 * Math.sin(Math.PI * amount);
    scale = lerp(origin.scale, distance < 0 ? 0.94 : 0.88, amount);
    y = origin.y * (1 - amount) - Math.sin(Math.PI * amount) * Math.min(8, box.top);
  }
  if (moving && tilt !== 0 && (active || position > -1))
    ({ scale, y } = fit(box, scale, rotation, tilt, y));
  const fade = clamp((-position - 0.7) / 0.3);
  const opacity = position < 0 ? 1 - fade * fade * (3 - 2 * fade) : clamp(STACK_VISIBLE - position);
  const translateX =
    active && followPointer
      ? `calc(${(4 / 75) * 100}% + ${origin.x + distance}px)`
      : `${(x / 75) * 100}%`;
  const photo = stackPhoto(offset, position, box.width, reduced);
  return {
    position,
    scale,
    rotation,
    tilt,
    y,
    opacity,
    zIndex,
    brightness,
    ...photo,
    transform: `translate3d(${translateX},${y}px,0) perspective(1200px) rotateY(${rotation}deg) rotateZ(${tilt}deg) scale(${scale})`,
  };
}

/** Tiny overscan covers the displacement; resting image framing is unchanged. */
export function stackPhoto(offset: number, position: number, width: number, reduced: boolean) {
  const photoX =
    (!reduced && position > -1 && position < 1
      ? -Math.sin(Math.PI * position) * Math.min(6, width * 0.014)
      : 0) || 0;
  return {
    photoX,
    photoScale: (offset === 0 ? 1 : 1.03) * (1 + (2 * Math.abs(photoX)) / Math.max(1, width)),
  };
}

/** Native click keyframes use the same suspended pose and land exactly on the target slot. */
export function stackNavigationFrame(
  offset: number,
  delta: number,
  progress: number,
  box: StackBox,
) {
  const pose = stackFrame(
    offset,
    -delta * box.width * progress,
    Math.max(1, box.width),
    true,
    box,
    STACK_ORIGIN,
    false,
    false,
  );
  if (progress === 1) return stackFrame(offset - delta, 0, 1, false, box);
  const from = offset === 0 ? 1 : 1.03,
    to = offset - delta === 0 ? 1 : 1.03;
  return { ...pose, photoScale: (pose.photoScale / from) * lerp(from, to, progress) };
}
