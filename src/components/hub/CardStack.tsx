import { useEffect, useRef, useState } from "react";
import { DestinationPanel } from "./DestinationPanel";
import { DestinationDetail } from "./DestinationDetail";
import type { Destination } from "@/data/resort";

/**
 * Universal stacked card deck.
 * One hero card + strongly overlapping previews behind it.
 * All cards share the same stage and the same base dimensions —
 * depth comes purely from translateX + scale + brightness.
 */

// Slot geometry: [translateX (vw), scale, brightness, zIndex]
const SLOTS: Array<[number, number, number, number]> = [
  [4, 1, 1, 40], // active
  [46, 0.92, 0.72, 30], // second
  [65, 0.84, 0.52, 20], // third
  [79, 0.77, 0.38, 10], // fourth
];
const EXIT: [number, number, number, number] = [-84, 0.99, 0.9, 50]; // card swiping away, fully off-stage
const VISIBLE = SLOTS.length;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Interpolated transform for a continuous position `pos` (0 = active). */
function slotAt(pos: number): [number, number, number, number] {
  if (pos <= -1) return EXIT;
  if (pos < 0) {
    const t = pos + 1; // -1..0
    const a = SLOTS[0]!;
    return [
      lerp(EXIT[0], a[0], t),
      lerp(EXIT[1], a[1], t),
      lerp(EXIT[2], a[2], t),
      pos > -0.5 ? 50 : a[3],
    ];
  }
  if (pos >= VISIBLE - 1) return SLOTS[VISIBLE - 1]!;
  const i = Math.floor(pos);
  const t = pos - i;
  const a = SLOTS[i]!;
  const b = SLOTS[i + 1]!;
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), a[3]];
}

const TRAVEL = 260; // px of drag equal to one full card step

export function CardStack({ items }: { items: Destination[] }) {
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
    <div className="select-none">
      {/* single shared stage */}
      <div
        className="relative h-[64vh] w-full touch-pan-y overflow-hidden"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {items.map((dest, i) => {
          const offset = i - index;
          if (offset < -1 || offset >= VISIBLE) return null;

          // continuous position influenced by the in-flight drag
          const pos = offset - drag / TRAVEL;
          const [x, scale, bright, z] = slotAt(pos);
          const active = offset === 0;

          return (
            <div
              key={dest.id}
              className="absolute left-0 top-0 h-full w-[76vw] max-w-[400px] origin-center will-change-transform"
              style={{
                transform: `translate3d(${x}vw,0,0) scale(${scale})`,
                zIndex: z,
                filter: `brightness(${bright})${active ? "" : " saturate(0.85)"}`,
                opacity: pos > VISIBLE - 0.15 ? 0 : 1,
                transition: dragging
                  ? "none"
                  : "transform 600ms cubic-bezier(0.22,1,0.36,1), filter 600ms ease, opacity 420ms ease",
                cursor: "pointer",
              }}
              onClick={(e) => {
                if (moved.current) return;
                if ((e.target as HTMLElement).closest("a")) return;
                if (active) setOpen(dest);
                else setIndex(i);
              }}
            >
              <DestinationPanel dest={dest} active={active} />
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-1.5 px-6">
        {items.map((d, i) => (
          <button
            key={d.id}
            aria-label={d.name}
            onClick={() => setIndex(i)}
            className={`h-px transition-all duration-500 ${
              i === index ? "w-6 bg-current opacity-80" : "w-2 bg-current opacity-25"
            }`}
          />
        ))}
      </div>

      {open && <DestinationDetail dest={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
