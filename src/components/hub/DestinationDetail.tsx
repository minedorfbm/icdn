import { useEffect } from "react";
import { ArrowLeft, Instagram } from "lucide-react";
import type { Destination } from "@/data/resort";
import { actionHref, actionsFor, instagramUrl } from "./DestinationPanel";
import { InstagramStrip } from "./InstagramStrip";
import { InstagramPostEmbed } from "./InstagramPostEmbed";
import { useI18n } from "@/i18n";

/** Full-screen editorial detail view for one destination. */
export function DestinationDetail({ dest, onClose }: { dest: Destination; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const { t, typeLabel, levelLabel, cluster, action, description } = useI18n();
  const actions = actionsFor(dest);
  const events = dest.events ?? [];
  const instagram = instagramUrl(dest);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={dest.name}
      data-level={dest.level}
      className="level detail-enter fixed inset-0 z-[80] overflow-y-auto overscroll-contain"
    >
      <div className="relative h-[62svh] w-full overflow-hidden">
        <img
          src={dest.image}
          alt={dest.name}
          className="h-full w-full object-cover"
          width={900}
          height={1400}
          fetchPriority="high"
          decoding="async"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
          style={{
            background:
              "linear-gradient(to top, var(--level-bg) 0%, color-mix(in oklab, var(--level-bg) 45%, transparent) 55%, transparent 100%)",
          }}
        />

        <button
          onClick={onClose}
          className="absolute left-5 top-6 flex items-center gap-2 rounded-full border border-foreground/15 bg-background/90 px-4 py-2 text-[9px] text-foreground shadow-lg tracking-[0.32em] backdrop-blur-md transition-colors hover:bg-background"
        >
          <ArrowLeft className="size-3" strokeWidth={1.5} />
          {t("back")}
        </button>

        <div className="absolute inset-x-0 bottom-0 px-7 pb-8">
          <p className="text-[9px] tracking-[0.42em] opacity-70">
            {levelLabel(dest.level)} · {typeLabel(dest.type)}
          </p>
          {dest.instagram_spot && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-current/30 px-3 py-1 text-[8px] tracking-[0.26em] opacity-80">
              <Instagram className="size-2.5" strokeWidth={1.6} />
              {t("instagram_spot")}
            </span>
          )}
          <h2 className="mt-4 font-serif text-[clamp(34px,10vw,52px)] leading-[0.95] tracking-[-0.01em]">
            {dest.name}
          </h2>
        </div>
      </div>

      <div className="px-7 pb-24 pt-8">
        <p className="max-w-[38ch] font-serif text-[18px] italic leading-relaxed opacity-85">
          {description(dest.id, dest.short_description)}
        </p>

        <span className="mt-8 block h-px w-10 bg-current/30" aria-hidden />

        <dl className="mt-8 divide-y divide-current/10 border-y border-current/10 text-[10px] tracking-[0.24em]">
          <div className="flex justify-between py-3">
            <dt className="opacity-45">{t("level")}</dt>
            <dd>{levelLabel(dest.level)}</dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="opacity-45">{t("category")}</dt>
            <dd>{typeLabel(dest.type)}</dd>
          </div>
          {dest.cluster && (
            <div className="flex justify-between py-3">
              <dt className="opacity-45">{t("area")}</dt>
              <dd>{cluster(dest.cluster)}</dd>
            </div>
          )}
        </dl>

        {events.length > 0 && (
          <section className="mt-12">
            <h3 className="text-[9px] tracking-[0.42em] opacity-50">{t("events")}</h3>
            <div className="mt-5 flex flex-col gap-4">
              {events.map((ev) => (
                <article
                  key={ev.title}
                  className="rounded-[18px] border border-current/12 bg-current/[0.04] px-5 py-6"
                >
                  <p className="text-[9px] leading-relaxed tracking-[0.3em] opacity-55">
                    {ev.schedule.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                  <h4 className="mt-4 font-serif text-[22px] leading-tight">{ev.title}</h4>
                  <span className="mt-3 block h-px w-8 bg-current/35" aria-hidden />
                  <p className="mt-4 max-w-[42ch] text-[13px] leading-relaxed opacity-75">
                    {ev.description}
                  </p>
                  {ev.url && (
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex items-center gap-2 text-[10px] tracking-[0.3em] opacity-80 transition-opacity hover:opacity-50"
                    >
                      {t("explore_more")}
                      <span className="opacity-50">↗</span>
                    </a>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {dest.posts?.[0] && <InstagramPostEmbed post={dest.posts[0]} />}

        {dest.photos && dest.photos.length > 0 && (
          <InstagramStrip
            photos={dest.photos}
            {...(instagram ? { instagramUrl: instagram } : {})}
            label={t("instagram")}
          />
        )}

        <div className="mt-10 flex flex-col gap-3">
          {actions.map((a) => (
            <a
              key={a}
              href={actionHref(a, dest)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between border-b border-current/20 pb-3 text-[11px] tracking-[0.3em] transition-opacity hover:opacity-60"
            >
              {action(a)}
              <span className="opacity-40">↗</span>
            </a>
          ))}
          {instagram && (
            <a
              href={instagram}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-3 text-[10px] tracking-[0.3em] opacity-75 transition-opacity hover:opacity-50"
            >
              <span className="grid size-8 place-items-center rounded-full border border-current/30">
                <Instagram className="size-3.5" strokeWidth={1.5} />
              </span>
              {t("instagram")}
            </a>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-14 text-[10px] tracking-[0.32em] opacity-55 transition-opacity hover:opacity-90"
        >
          ← {t("back_journey")}
        </button>
      </div>
    </div>
  );
}
