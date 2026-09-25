import { useState } from "react";
import { Instagram } from "lucide-react";
import { useI18n } from "@/i18n";
import type { Destination } from "@/data/resort";
import { actionsFor, instagramUrl } from "@/lib/destination-actions";
import { ResortLink } from "./ResortBrowser";

/** The single universal card used everywhere in the hub. */
export function DestinationPanel({
  dest,
  active,
  priority,
  onOpen,
}: Readonly<{
  dest: Destination;
  active: boolean;
  priority: boolean;
  onOpen: () => void;
}>) {
  const { t, typeLabel, levelLabel, action, description } = useI18n();
  const actions = actionsFor(dest, 3);
  const [loaded, setLoaded] = useState(false);

  return (
    <article
      aria-hidden={!active}
      inert={!active}
      className="relative h-full min-h-[inherit] w-full overflow-hidden rounded-[18px] border border-[#e5d3aa]/65 bg-[oklch(0.18_0.02_250)] shadow-[10px_24px_36px_-18px_rgba(0,0,0,0.7)]"
    >
      <img
        src={dest.image}
        alt={dest.name}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...(priority ? { fetchPriority: "high" as const } : {})}
        onLoad={() => setLoaded(true)}
        ref={(el) => {
          if (el?.complete) setLoaded(true);
        }}
        draggable={false}
        width={768}
        height={1152}
        sizes="75vw"
        className={`absolute inset-0 h-full w-full select-none object-cover transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          loaded ? "opacity-100" : "opacity-0"
        } ${active ? "scale-100" : "scale-[1.03] saturate-[0.9]"}`}
      />

      {/* readability gradient only at the bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[72%] bg-gradient-to-b from-black/75 via-black/30 to-transparent" />

      <div className="relative flex h-full min-h-[inherit] flex-col justify-between gap-6 touch-pan-y overflow-y-auto overscroll-y-contain px-4 py-5 sm:px-7 sm:py-9 text-[oklch(0.98_0.005_90)]">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[9px] tracking-[0.18em] opacity-80">
            {levelLabel(dest.level)} / {typeLabel(dest.type)}
          </p>
          {dest.instagram_spot && (
            <span
              aria-label={t("instagram_spot")}
              className="grid size-7 shrink-0 place-items-center rounded-full border border-white/30 bg-black/30 text-white"
            >
              <Instagram className="size-2.5" strokeWidth={1.6} />
            </span>
          )}
        </div>

        <div className="shrink-0">
          <h3 className="font-serif text-[clamp(26px,6.5vw,48px)] leading-[0.98] tracking-[0.01em] drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
            <button
              type="button"
              onClick={onOpen}
              tabIndex={active ? 0 : -1}
              className="text-left focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {dest.name}
            </button>
          </h3>
          <p className="mt-3 max-w-[30ch] font-serif text-[15px] italic leading-snug opacity-85">
            {description(dest.id, dest.short_description)}
          </p>
        </div>

        <div className="mt-auto flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/25 pt-3">
          {actions.map((a, i) => (
            <ResortLink
              key={`${a.kind}-${i}`}
              href={a.url}
              pageTitle={`${dest.name} · ${a.label ?? action(a.kind)}`}
              tabIndex={active ? 0 : -1}
              className="inline-flex min-h-11 max-w-full items-center py-2 text-[10px] leading-relaxed tracking-[0.2em] text-white transition-colors hover:text-[#e5d3aa] focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {a.label ?? action(a.kind)}
            </ResortLink>
          ))}
          {instagramUrl(dest) && (
            <a
              href={instagramUrl(dest)}
              target="_blank"
              rel="noreferrer"
              aria-label={`${dest.name} on Instagram`}
              tabIndex={active ? 0 : -1}
              className="grid size-11 place-items-center rounded-full border border-background/25 bg-foreground/65 text-background shadow-md backdrop-blur-md transition-colors hover:bg-foreground/80"
            >
              <Instagram className="size-3.5" strokeWidth={1.5} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
