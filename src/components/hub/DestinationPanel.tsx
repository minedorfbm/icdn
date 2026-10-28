import { useState } from "react";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import { useI18n } from "@/i18n";
import type { Destination } from "@/data/resort";
import { actionsFor, instagramUrl } from "@/lib/destination-actions";
import { ResortLink } from "./ResortBrowser";
import { responsiveImage, responsiveAvif } from "@/lib/responsive-image";

/** The single universal card used everywhere in the hub. */
export function DestinationPanel({
  dest,
  active,
  priority,
  near = true,
  imageSizes,
  onOpen,
  onImageSettled,
}: Readonly<{
  dest: Destination;
  active: boolean;
  priority: boolean;
  near?: boolean;
  imageSizes: string | undefined;
  onOpen: () => void;
  onImageSettled?: () => void;
}>) {
  const { lang, t, typeLabel, levelLabel, action, linkLabel, description } = useI18n();
  const actions = actionsFor(dest, 3, lang);
  const [loaded, setLoaded] = useState(false);
  const avif = near && imageSizes ? responsiveAvif(dest.image, imageSizes) : undefined;

  return (
    <article
      aria-hidden={!active}
      inert={!active}
      className="destination-panel relative h-full min-h-[inherit] w-full overflow-hidden rounded-[18px] border border-[#e5d3aa]/65 bg-[oklch(0.18_0.02_250)] shadow-[10px_24px_36px_-18px_rgba(0,0,0,0.7)]"
    >
      <picture className="contents">
        {avif && <source type="image/avif" srcSet={avif.srcSet} sizes={avif.sizes} />}
        <img
          {...(near && imageSizes ? responsiveImage(dest.image, imageSizes) : {})}
          alt={dest.name}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "low"}
          onLoad={() => {
            setLoaded(true);
            onImageSettled?.();
          }}
          onError={onImageSettled}
          ref={(el) => {
            if (el?.complete && el.naturalWidth > 0) {
              setLoaded(true);
              onImageSettled?.();
            }
          }}
          draggable={false}
          width={768}
          height={1152}
          style={{ objectPosition: dest.imagePosition }}
          className={`absolute inset-0 h-full w-full select-none object-cover transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            loaded ? "opacity-100" : "opacity-0"
          } ${active ? "scale-100" : "scale-[1.03] saturate-[0.9]"}`}
        />
      </picture>

      {/* readability gradient only at the bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[72%] bg-gradient-to-b from-black/75 via-black/30 to-transparent" />

      <div className="relative flex h-full min-h-[inherit] flex-col justify-between gap-6 touch-pan-y overflow-y-auto overscroll-y-contain px-4 py-5 sm:px-7 sm:py-9 text-[oklch(0.98_0.005_90)]">
        <div className="flex items-start justify-between gap-3">
          <p className="destination-panel-meta text-[length:var(--readable-9)] tracking-[0.18em] opacity-80">
            {levelLabel(dest.level)} / {typeLabel(dest.type)}
          </p>
          {dest.instagram_spot && (
            <span
              role="img"
              aria-label={t("instagram_spot")}
              className="grid size-7 shrink-0 place-items-center rounded-full border border-white/30 bg-black/30 text-white"
            >
              <InstagramIcon aria-hidden className="size-2.5" strokeWidth={1.6} />
            </span>
          )}
        </div>

        <div className="shrink-0">
          <h3 className="font-serif text-[clamp(26px,6.5vw,48px)] leading-[0.98] tracking-[0.01em]">
            {/* Stretch the native button over the card without nesting its separate links. */}
            <button
              type="button"
              onClick={(event) => {
                event.currentTarget.focus({ preventScroll: true });
                onOpen();
              }}
              tabIndex={active ? 0 : -1}
              className="text-left after:absolute after:inset-0 after:z-10 focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <span className="drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)]">{dest.name}</span>
            </button>
          </h3>
          <p className="destination-panel-summary mt-3 max-w-[30ch] font-serif text-[length:var(--readable-15)] italic leading-snug opacity-85">
            {description(dest.id, dest.short_description)}
          </p>
        </div>

        <div className="destination-panel-actions pointer-events-none relative z-20 mt-auto flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/25 pt-3">
          {actions.map((a, i) => (
            <ResortLink
              key={`${a.kind}-${i}`}
              href={a.url}
              pageTitle={`${dest.name} · ${a.label ? linkLabel(a.label) : action(a.kind)}`}
              tabIndex={active ? 0 : -1}
              className="pointer-events-auto inline-flex min-h-11 max-w-full items-center py-2 text-[length:var(--readable-10)] leading-relaxed tracking-[0.2em] text-white transition-colors hover:text-[#e5d3aa] focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {a.label ? linkLabel(a.label) : action(a.kind)}
            </ResortLink>
          ))}
          {instagramUrl(dest) && (
            <a
              href={instagramUrl(dest)}
              target="_blank"
              rel="noreferrer"
              aria-label={`${dest.name} on Instagram`}
              tabIndex={active ? 0 : -1}
              className="pointer-events-auto grid size-11 place-items-center rounded-full border border-background/25 bg-foreground/65 text-background shadow-md backdrop-blur-md transition-colors hover:bg-foreground/80"
            >
              <InstagramIcon className="size-3.5" strokeWidth={1.5} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
