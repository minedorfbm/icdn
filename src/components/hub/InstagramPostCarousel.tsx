import { useCallback, useRef, useState } from "react";
import type { DestinationPost } from "@/data/resort";
import { useI18n } from "@/i18n";
import { InstagramPostEmbed } from "./InstagramPostEmbed";

/**
 * Horizontal, snap-scrolled carousel of up to 5 official Instagram post embeds.
 * A single post renders exactly like before (no dots, no scrolling).
 */
export function InstagramPostCarousel({ posts }: { posts: DestinationPost[] }) {
  const { t } = useI18n();
  const items = posts.slice(0, 5);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = useCallback(() => {
    const node = track.current;
    if (!node) return;
    const slide = node.clientWidth || 1;
    setIndex(Math.round(node.scrollLeft / slide));
  }, []);

  if (items.length === 0) return null;
  if (items.length === 1 && items[0]) return <InstagramPostEmbed post={items[0]} />;

  return (
    <section className="mt-12">
      <p className="text-[9px] tracking-[0.38em] opacity-45">{t("latest_posts")}</p>

      <div
        ref={track}
        onScroll={onScroll}
        className="hide-scrollbar -mx-6 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((post) => (
          <div key={post.post_url} className="w-full shrink-0 snap-center">
            <InstagramPostEmbed post={post} bare />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {items.map((post, i) => (
          <button
            key={post.post_url}
            type="button"
            aria-label={`${i + 1} / ${items.length}`}
            onClick={() => {
              const node = track.current;
              if (!node) return;
              node.scrollTo({ left: i * node.clientWidth, behavior: "smooth" });
            }}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-5 bg-current opacity-70" : "w-1.5 bg-current opacity-25"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
