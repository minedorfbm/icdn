import { useEffect, useRef, useState } from "react";
import { FullscreenDialog } from "@/components/ui/fullscreen-dialog";
import { X } from "lucide-react";
import type { DestinationPhoto } from "@/data/resort";

interface Props {
  photos: DestinationPhoto[];
  index: number;
  onClose: () => void;
}

/** Full-screen photo viewer: swipe left/right between photos, swipe down to close. */
export function PhotoLightbox({ photos, index, onClose }: Props) {
  const [current, setCurrent] = useState(index);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const start = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setCurrent((c) => Math.min(c + 1, photos.length - 1));
      if (e.key === "ArrowLeft") setCurrent((c) => Math.max(c - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photos.length]);

  // Preload the neighbouring photos so swiping never shows a blank frame
  useEffect(() => {
    for (const i of [current + 1, current - 1]) {
      const next = photos[i];
      if (!next) continue;
      const img = new Image();
      img.src = next.image;
    }
  }, [current, photos]);

  const photo = photos[current];
  if (!photo) return null;

  const down = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY };
  };
  const move = (e: React.PointerEvent) => {
    if (!start.current) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
  };
  const up = () => {
    if (!start.current) return;
    const { x, y } = drag;
    if (y > 110 && Math.abs(y) > Math.abs(x)) onClose();
    else if (x < -60) setCurrent((c) => Math.min(c + 1, photos.length - 1));
    else if (x > 60) setCurrent((c) => Math.max(c - 1, 0));
    start.current = null;
    setDrag({ x: 0, y: 0 });
  };

  return (
    <FullscreenDialog
      title={photo.caption ?? "Photo"}
      onClose={onClose}
      className="fixed inset-0 z-[120] flex touch-none flex-col justify-center bg-[oklch(0.09_0.015_250/0.97)] backdrop-blur-sm"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-5 top-6 z-10 grid size-9 place-items-center rounded-full border border-[oklch(0.86_0.1_85/0.25)] text-[oklch(0.9_0.05_85)] transition-opacity hover:opacity-60"
      >
        <X className="size-4" strokeWidth={1.5} />
      </button>

      <img
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          down(event);
        }}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => {
          start.current = null;
          setDrag({ x: 0, y: 0 });
        }}
        src={photo.image}
        alt={photo.caption ?? ""}
        decoding="async"
        fetchPriority="high"
        className="max-h-[78svh] w-full select-none object-contain"
        style={{
          transform: `translate3d(${drag.x}px, ${Math.max(drag.y, 0)}px, 0)`,
          transition: start.current ? "none" : "transform 320ms cubic-bezier(0.22,1,0.36,1)",
        }}
        draggable={false}
      />

      <div className="absolute inset-x-0 bottom-9 flex flex-col items-center gap-4 px-8 text-center">
        {photo.caption && (
          <p className="max-w-[34ch] font-serif text-[14px] italic leading-relaxed text-[oklch(0.95_0.005_90/0.8)]">
            {photo.caption}
          </p>
        )}
        <div className="flex items-center gap-2">
          {photos.map((_, i) => (
            <span
              key={i}
              className={`h-px transition-all duration-300 ${
                i === current ? "w-6 bg-[oklch(0.86_0.1_85)]" : "w-3 bg-[oklch(0.86_0.1_85/0.3)]"
              }`}
            />
          ))}
        </div>
      </div>
    </FullscreenDialog>
  );
}
