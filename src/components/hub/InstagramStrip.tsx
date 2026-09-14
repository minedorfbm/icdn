import { useState } from "react";
import type { DestinationPhoto } from "@/data/resort";
import { PhotoLightbox } from "./PhotoLightbox";

interface Props {
  photos: DestinationPhoto[];
  /** Instagram account or post URL, used only for the discreet handle label. */
  instagramUrl?: string;
  label: string;
}

/** Derives "@account" from an Instagram profile URL; returns null for post links. */
function handleOf(url?: string): string | null {
  if (!url) return null;
  const m = /instagram\.com\/([A-Za-z0-9._]+)\/?(?:$|\?)/.exec(url);
  if (!m || !m[1] || m[1] === "p" || m[1] === "reel") return null;
  return `@${m[1]}`;
}

/** Horizontal editorial photo strip shown inside a destination detail sheet. */
export function InstagramStrip({ photos, instagramUrl, label }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  if (photos.length === 0) return null;
  const handle = handleOf(instagramUrl);

  return (
    <section className="mt-12">
      <p className="px-0 text-[9px] tracking-[0.38em] opacity-45">
        {label}
        {handle && <span className="ml-2 opacity-80">· {handle}</span>}
      </p>

      <div className="-mx-7 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-7 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {photos.map((photo, i) => (
          <button
            key={`${photo.image}-${i}`}
            onClick={() => setOpen(i)}
            className="relative aspect-[3/4] w-[58vw] max-w-[260px] shrink-0 snap-start overflow-hidden bg-[oklch(0.18_0.02_250)] transition-opacity active:opacity-80"
          >
            <img
              src={photo.image}
              alt={photo.caption ?? ""}
              loading="lazy"
              decoding="async"
              width={520}
              height={693}
              sizes="(max-width: 520px) 58vw, 260px"
              className="h-full w-full object-cover"
            />
            {photo.caption && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-[10px] tracking-[0.16em] text-white/85">
                {photo.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      {open !== null && (
        <PhotoLightbox photos={photos} index={open} onClose={() => setOpen(null)} />
      )}
    </section>
  );
}
