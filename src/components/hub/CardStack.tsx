import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { DestinationPanel } from "./DestinationPanel";
import { DestinationDetail } from "./DestinationDetail";
import type { Destination } from "@/data/resort";
import { cardPosition, swipeStep } from "@/lib/card-swipe";

/** A front-facing hero and two receding previews, all sharing one responsive stage. */
// Slot geometry: [horizontal offset, scale, brightness, stacking order, rotation Y].
type Slot = [number, number, number, number, number];
const SLOTS: Slot[] = [
  [4, 1, 1, 40, 0],
  [22, 0.88, 0.65, 30, -16],
  [38, 0.76, 0.43, 20, -24],
];
const EXIT: Slot = [-88, 0.94, 0.8, 50, 12];
const VISIBLE = SLOTS.length;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Interpolated transform for a continuous position `pos` (0 = active). */
function slotAt(pos: number): Slot {
  if (pos <= -1) return EXIT;
  if (pos < 0) {
    const t = pos + 1; // -1..0
    const a = SLOTS[0]!;
    return [
      lerp(EXIT[0], a[0], t),
      lerp(EXIT[1], a[1], t),
      lerp(EXIT[2], a[2], t),
      EXIT[3],
      lerp(EXIT[4], a[4], t),
    ];
  }
  if (pos >= VISIBLE - 1) return SLOTS[VISIBLE - 1]!;
  const i = Math.floor(pos);
  const t = pos - i;
  const a = SLOTS[i]!;
  const b = SLOTS[i + 1]!;
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), a[3], lerp(a[4], b[4], t)];
}

const SETTLE = "360ms cubic-bezier(0.22,1,0.36,1)";

export function CardStack({
  items,
  near,
  index,
  onIndexChange,
}: Readonly<{
  items: Destination[];
  near: boolean;
  index: number;
  onIndexChange: Dispatch<SetStateAction<number>>;
}>) {
  const [drag, setDrag] = useState(0); // px, negative = pulling next card in
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState<Destination | null>(null);
  const moved = useRef(false);
  const frame = useRef<number | null>(null);
  const pendingDrag = useRef(0);
  const travel = useRef(260);
  const cancelFrame = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  };
  const start = useRef<{
    x: number;
    y: number;
    pointerId: number;
    lastX: number;
    lastT: number;
    v: number;
    locked: null | boolean;
  } | null>(null);

  useEffect(() => {
    cancelFrame();
    start.current = null;
    pendingDrag.current = 0;
    setDragging(false);
    setDrag(0);
    return cancelFrame;
  }, [items]);

  // Keep images, text and links out of the per-frame drag renders.
  const panels = useMemo(
    () =>
      items.map((dest, i) => (
        <DestinationPanel
          key={dest.id}
          dest={dest}
          active={i === index}
          priority={near && i === index}
          onOpen={() => (i === index ? setOpen(dest) : onIndexChange(i))}
        />
      )),
    [items, index, near, onIndexChange],
  );

  if (items.length === 0) return null;

  const last = items.length - 1;
  const clamp = (i: number) => Math.min(last, Math.max(0, i));

  const onDown = (e: React.PointerEvent) => {
    if (!e.isPrimary || e.button !== 0 || start.current) return;
    travel.current = Math.max(1, e.currentTarget.getBoundingClientRect().width * 0.75);
    moved.current = false;
    start.current = {
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
      lastX: e.clientX,
      lastT: e.timeStamp,
      v: 0,
      locked: null,
    };
  };

  const onMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s || s.pointerId !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (s.locked === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      // only card navigation when horizontal clearly exceeds vertical
      s.locked = Math.abs(dx) > Math.abs(dy) * 1.2;
      if (s.locked) {
        setDragging(true);
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }
    }
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved.current = true;
    if (!s.locked) return;

    const dt = Math.max(1, e.timeStamp - s.lastT);
    s.v = (e.clientX - s.lastX) / dt; // px per ms
    s.lastX = e.clientX;
    s.lastT = e.timeStamp;

    // rubber band at both ends
    const atStart = index === 0 && dx > 0;
    const atEnd = index === last && dx < 0;
    pendingDrag.current =
      atStart || atEnd ? dx * 0.25 : Math.max(-travel.current, Math.min(travel.current, dx));
    if (frame.current === null) {
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        setDrag(pendingDrag.current);
      });
    }
  };

  const finish = (e: React.PointerEvent, cancelled = false) => {
    const s = start.current;
    if (!s || s.pointerId !== e.pointerId) return;
    cancelFrame();
    start.current = null;
    setDragging(false);
    if (s.locked && !cancelled) {
      const step = swipeStep(pendingDrag.current, travel.current, s.v, e.timeStamp - s.lastT);
      onIndexChange((i) => clamp(i + step));
    }
    if (cancelled) moved.current = true;
    pendingDrag.current = 0;
    setDrag(0);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="w-full select-none">
      {/* single shared stage */}
      <div
        className="relative grid w-full touch-pan-y overflow-hidden py-6"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={(e) => finish(e)}
        onPointerCancel={(e) => finish(e, true)}
        onLostPointerCapture={(e) => {
          // Touch starts with implicit capture on the child under the finger.
          // Its loss bubbles when capture transfers to this stage; the drag is still active.
          if (e.target === e.currentTarget) finish(e, true);
        }}
      >
        {items.map((dest, i) => {
          const offset = i - index;
          if (offset < -1 || offset > VISIBLE) return null;

          // continuous position influenced by the in-flight drag
          const pos = cardPosition(offset, drag, travel.current);
          const [x, scale, bright, z, rotation] = slotAt(pos);
          const active = offset === 0;

          return (
            <div
              key={dest.id}
              data-destination-id={dest.id}
              className={`perspective-card relative col-start-1 row-start-1 h-[90svh] w-[75%] origin-left ${near ? "will-change-transform" : ""}`}
              style={{
                transform: `translate3d(${(x / 75) * 100}%,0,0) perspective(1200px) rotateY(${rotation}deg) scale(${scale})`,
                zIndex: z,
                opacity: Math.max(0, Math.min(1, VISIBLE - pos)),
                transition: dragging ? "none" : `transform ${SETTLE}, opacity ${SETTLE}`,
                cursor: "pointer",
              }}
              onClickCapture={(e) => {
                if (moved.current && e.detail > 0) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onClick={(e) => {
                if (moved.current) return;
                if ((e.target as HTMLElement).closest("a, button")) return;
                if (active) {
                  e.currentTarget
                    .querySelector<HTMLButtonElement>("h3 button")
                    ?.focus({ preventScroll: true });
                  setOpen(dest);
                } else onIndexChange(i);
              }}
            >
              {panels[i]}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[18px] bg-black"
                style={{ opacity: 1 - bright, transition: dragging ? "none" : `opacity ${SETTLE}` }}
              />
            </div>
          );
        })}
      </div>

      <div className="mx-auto mt-3 flex max-w-[740px] items-center gap-4 px-6">
        <span
          className="min-w-16 font-serif text-[24px] leading-none tabular-nums"
          aria-live="polite"
        >
          {String(index + 1).padStart(2, "0")}
          <span className="ml-1 text-[15px] opacity-50">
            / {String(items.length).padStart(2, "0")}
          </span>
        </span>
        <div className="h-px flex-1 bg-current/25" aria-hidden>
          <div
            className="h-px bg-current transition-[width] duration-300"
            style={{ width: `${((index + 1) / items.length) * 100}%` }}
          />
        </div>
      </div>

      {open && <DestinationDetail dest={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
