import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import type { NativeInstagramPost } from "@/data/native-instagram-posts";
import { instagramLink } from "@/lib/external-url";
import { useI18n } from "@/i18n";
import { responsiveImage } from "@/lib/responsive-image";

/** Hosted photographs preserve the original carousel without a login-dependent iframe. */
export function NativeInstagramPostCard({
  post,
  url,
}: Readonly<{ post: NativeInstagramPost; url: string }>) {
  const { lang, t } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const caption = post.captions[lang];
  return (
    <article
      data-native-instagram
      className="instagram-post overflow-hidden rounded-[18px] border border-current/12 bg-current/[0.04]"
      data-fit-to-screen
    >
      <header className="flex items-center gap-3 px-4 py-3">
        <InstagramIcon className="size-5 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm">@{post.account}</p>
          <time dateTime={post.date} className="text-xs opacity-65">
            {new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeZone: "UTC" }).format(
              new Date(post.date),
            )}
          </time>
        </div>
      </header>
      <div
        ref={track}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]"
        onScroll={() => {
          const node = track.current;
          if (node?.clientWidth) setIndex(Math.round(node.scrollLeft / node.clientWidth));
        }}
      >
        {post.images.map((image, i) => (
          <img
            key={image}
            {...responsiveImage(image, "(min-width: 768px) 520px, 100vw")}
            alt={`${t("photo")} ${i + 1} / ${post.images.length} — @${post.account}`}
            loading="lazy"
            decoding="async"
            className="aspect-[4/5] w-full shrink-0 snap-center object-contain bg-black/5"
          />
        ))}
      </div>
      <div className="flex justify-center" aria-label={t("photo")}>
        {post.images.map((image, i) => (
          <button
            key={image}
            type="button"
            aria-label={`${t("photo")} ${i + 1} / ${post.images.length}`}
            aria-current={index === i ? "true" : undefined}
            className="grid size-11 place-items-center"
            onClick={() => {
              const node = track.current;
              node?.scrollTo({ left: i * node.clientWidth, behavior: "smooth" });
            }}
          >
            <span
              className={`size-1.5 rounded-full bg-current ${index === i ? "opacity-100" : "opacity-25"}`}
            />
          </button>
        ))}
      </div>
      <p className="px-4 text-sm leading-relaxed">{caption}</p>
      <a
        href={instagramLink(url)}
        target="_blank"
        rel="noreferrer"
        className="flex min-h-11 items-center justify-between gap-3 px-4 py-4 text-xs"
      >
        {t("view_on_instagram")}
        <ArrowUpRight className="size-4 shrink-0" aria-hidden />
      </a>
    </article>
  );
}
