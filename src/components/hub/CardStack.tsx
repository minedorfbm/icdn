import { useEffect, useRef, useState } from "react";
import { DestinationPanel } from "./DestinationPanel";
import { DestinationDetail } from "./DestinationDetail";
import type { Destination } from "@/data/resort";

/** A front-facing hero and two receding previews, all sharing one responsive stage. */
// Slot geometry: [horizontal offset, scale, brightness, stacking order, rotation Y].
type Slot = [number, number, number, number, number];
const SLOTS: Slot[] = [
  [4, 1, 1, 40, 0],
  [23, 0.88, 0.65, 30, -16],
  [39, 0.76, 0.43, 20, -24],
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
      pos > -0.5 ? 50 : a[3],
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

const TRAVEL = 260; // px of drag equal to one full card step

export function CardStack({ items }: Readonly<{ items: Destination[] }>) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0); // px, negative = pulling next card in
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState<Destination | null>(null);
  const moved = useRef(false);
  const start = useRef<{
    x: number;
    y: number;
    t: number;
    lastX: number;
    lastT: number;
    v: number;
    locked: null | boolean;
  } | null>(null);

  useEffect(() => {
    setIndex(0);
    setDrag(0);
  }, [items]);

  if (items.length === 0) return null;

  const last = items.length - 1;
  const clamp = (i: number) => Math.min(last, Math.max(0, i));

  const onDown = (e: React.PointerEvent) => {
    moved.current = false;
    start.current = {
      x: e.clientX,
      y: e.clientY,
      t: e.timeStamp,
      lastX: e.clientX,
      lastT: e.timeStamp,
      v: 0,
      locked: null,
    };
  };

  const onMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (s.locked === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      // only card navigation when horizontal clearly exceeds vertical
      s.locked = Math.abs(dx) > Math.abs(dy) * 0.9;
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
    setDrag(atStart || atEnd ? dx * 0.3 : dx);
  };

  const onUp = () => {
    const s = start.current;
    start.current = null;
    setDragging(false);
    if (s?.locked) {
      const v = s.v;
      const flick = Math.abs(v) > 0.3;
      const passed = Math.abs(drag) > TRAVEL * 0.28;
      if (flick || passed) {
        const dir = (flick ? v : drag) < 0 ? 1 : -1;
        setIndex((i) => clamp(i + dir));
      }
    }
    setDrag(0);
  };

  return (
    <div className="mx-auto max-w-[740px] select-none [--deck-spread:1] sm:[--deck-spread:1.8]">
      {/* single shared stage */}
      <div
        className="relative grid w-full touch-pan-y overflow-hidden py-6"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => {
          start.current = null;
          setDragging(false);
          setDrag(0);
          moved.current = true;
        }}
      >
        {items.map((dest, i) => {
          const offset = i - index;
          if (offset < -1 || offset >= VISIBLE) return null;

          // continuous position influenced by the in-flight drag
          const pos = offset - drag / TRAVEL;
          const [x, scale, bright, z, rotation] = slotAt(pos);
          const active = offset === 0;

          return (
            <div
              key={dest.id}
              className="perspective-card relative col-start-1 row-start-1 min-h-[max(480px,64svh)] w-[80%] max-w-[440px] origin-left will-change-transform"
              style={{
                transform: `translate3d(calc(${(x / 80) * 100}% * var(--deck-spread)),0,0) perspective(1200px) rotateY(${rotation}deg) scale(${scale})`,
                zIndex: z,
                filter: `brightness(${bright})${active ? "" : " saturate(0.85)"}`,
                opacity: pos > VISIBLE - 0.15 ? 0 : 1,
                transition: dragging
                  ? "none"
                  : "transform 600ms cubic-bezier(0.22,1,0.36,1), filter 600ms ease, opacity 420ms ease",
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
                } else setIndex(i);
              }}
            >
              <DestinationPanel
                dest={dest}
                active={active}
                onOpen={() => (active ? setOpen(dest) : setIndex(i))}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center px-4">
        {items.map((d, i) => (
          <button
            key={d.id}
            aria-label={d.name}
            onClick={() => setIndex(i)}
            aria-current={i === index ? "true" : undefined}
            className="grid size-11 place-items-center rounded focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <span
              aria-hidden
              className={`h-px bg-current transition-all duration-300 ${i === index ? "w-6 opacity-80" : "w-2 opacity-40"}`}
            />
          </button>
        ))}
      </div>

      {open && <DestinationDetail dest={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
