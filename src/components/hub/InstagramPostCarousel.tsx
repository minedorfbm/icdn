import { useCallback, useEffect, useRef, useState } from "react";
import type { DestinationPost } from "@/data/resort";
import { InstagramPostEmbed } from "./InstagramPostEmbed";

/**
 * Horizontal, snap-scrolled carousel of up to 5 official Instagram post embeds.
 * A single post renders exactly like before (no dots, no scrolling).
 */
export function InstagramPostCarousel({ posts }: Readonly<{ posts: DestinationPost[] }>) {
  const items = posts.slice(0, 5);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [height, setHeight] = useState<number>();
  const [visited, setVisited] = useState<string[]>([]);
  // Only expose the current and next placeholders to Instagram's global process().
  // Keep visited players mounted so returning to a post never restarts it.
  const current = items[index]?.post_url;
  const next = items[index + 1]?.post_url;
  useEffect(() => {
    setVisited((previous) =>
      Array.from(new Set([...previous, current, next].filter((url): url is string => !!url))),
    );
  }, [current, next]);

  useEffect(() => {
    const node = track.current;
    const slide = node?.children[index]?.firstElementChild;
    if (!slide) return;
    const measure = () => {
      const next = Math.ceil(slide.getBoundingClientRect().height);
      if (next > 0) setHeight(next);
    };
    // Instagram changes iframe height after loading, videos and caption expansion.
    // Measure the content, not the flex item that used to stretch to the tallest post.
    const observer = new ResizeObserver(measure);
    observer.observe(slide);
    measure();
    return () => observer.disconnect();
  }, [index, posts]);

  const onScroll = useCallback(() => {
    const node = track.current;
    if (!node) return;
    // Focus/resize can scroll the hidden vertical axis and crop the post header.
    // This carousel scrolls horizontally only; keep its visible content top-aligned.
    if (node.scrollTop !== 0) node.scrollTop = 0;
    const center = node.getBoundingClientRect().left + node.clientWidth / 2;
    const distances = Array.from(node.children, (slide) => {
      const rect = slide.getBoundingClientRect();
      return Math.abs(rect.left + rect.width / 2 - center);
    });
    setIndex(distances.indexOf(Math.min(...distances)));
  }, []);

  if (items.length === 0) return null;
  if (items.length === 1 && items[0]) return <InstagramPostEmbed post={items[0]} />;

  return (
    <div>
      <div
        ref={track}
        onScroll={onScroll}
        data-instagram-track
        className="editorial-media-track flex items-start snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", height }}
      >
        {items.map((post) => (
          <div key={post.post_url} className="shrink-0 snap-center">
            <InstagramPostEmbed
              post={post}
              enabled={
                post.post_url === current ||
                post.post_url === next ||
                visited.includes(post.post_url)
              }
            />
          </div>
        ))}
      </div>

      <div data-instagram-pagination className="mt-2 flex items-center justify-center gap-2">
        {items.map((post, i) => (
          <button
            key={post.post_url}
            type="button"
            aria-label={`${i + 1} / ${items.length}`}
            onClick={() => {
              const node = track.current;
              if (!node) return;
              const slide = node.children[i];
              if (!slide) return;
              const rect = slide.getBoundingClientRect();
              const left =
                node.scrollLeft +
                rect.left -
                node.getBoundingClientRect().left -
                (node.clientWidth - rect.width) / 2;
              node.scrollTo({
                left,
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "auto"
                  : "smooth",
              });
            }}
            aria-current={i === index ? "true" : undefined}
            className="grid size-11 place-items-center rounded focus-visible:outline-2"
          >
            <span
              aria-hidden
              className={`h-1.5 rounded-full bg-current transition-all ${i === index ? "w-5 opacity-70" : "w-1.5 opacity-40"}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
