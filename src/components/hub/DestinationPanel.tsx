import { useState } from "react";
import { Instagram } from "lucide-react";
import { useI18n } from "@/i18n";
import type { Destination } from "@/data/resort";
import { actionsFor, instagramUrl } from "@/lib/destination-actions";

/** The single universal card used everywhere in the hub. */
export function DestinationPanel({
  dest,
  active,
  onOpen,
}: {
  dest: Destination;
  active: boolean;
  onOpen: () => void;
}) {
  const { t, typeLabel, action, description } = useI18n();
  const actions = actionsFor(dest, 3);
  const [loaded, setLoaded] = useState(false);

  return (
    <article
      aria-hidden={!active}
      className="relative h-full min-h-[inherit] w-full overflow-hidden rounded-[26px] bg-[oklch(0.18_0.02_250)] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.65)]"
    >
      <img
        src={dest.image}
        alt={dest.name}
        loading={active ? "eager" : "lazy"}
        decoding="async"
        {...(active ? { fetchPriority: "high" as const } : {})}
        onLoad={() => setLoaded(true)}
        ref={(el) => {
          if (el?.complete) setLoaded(true);
        }}
        draggable={false}
        width={768}
        height={1152}
        sizes="(max-width: 520px) 76vw, 400px"
        className={`absolute inset-0 h-full w-full select-none object-cover transition-[filter,transform,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          loaded ? "opacity-100" : "opacity-0"
        } ${active ? "scale-100" : "scale-[1.03] saturate-[0.9]"}`}
      />

      {/* readability gradient only at the bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28%] bg-gradient-to-b from-black/40 to-transparent" />

      <div className="relative flex h-full min-h-[inherit] flex-col justify-between gap-10 p-6 text-[oklch(0.98_0.005_90)]">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] tracking-[0.24em] opacity-80">{typeLabel(dest.type)}</p>
          {dest.instagram_spot && (
            <span className="flex items-center gap-1.5 rounded-full border border-background/30 bg-foreground/70 px-2.5 py-1 text-[8px] tracking-[0.26em] text-background shadow-md backdrop-blur-md">
              <Instagram className="size-2.5" strokeWidth={1.6} />
              {t("instagram_spot")}
            </span>
          )}
        </div>

        <div className={`transition-opacity duration-500 ${active ? "opacity-100" : "opacity-60"}`}>
          <h3 className="font-serif text-[clamp(28px,8.5vw,40px)] leading-[0.98] tracking-[0.01em] drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
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

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
            {actions.map((a, i) => (
              <a
                key={`${a.kind}-${i}`}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                tabIndex={active ? 0 : -1}
                className="inline-flex min-h-11 items-center rounded-full border border-background/25 bg-foreground/65 px-3 py-2 text-[11px] text-background shadow-md tracking-[0.3em] backdrop-blur-md transition-colors hover:bg-foreground/80"
              >
                {a.label ?? action(a.kind)}
              </a>
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
      </div>
    </article>
  );
}
