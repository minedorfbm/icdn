import { useEffect, useRef, useState } from "react";
import { Instagram } from "lucide-react";
import type { DestinationPost } from "@/data/resort";
import { useI18n } from "@/i18n";

const SCRIPT_SRC = "https://www.instagram.com/embed.js";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

/** Loads Instagram's embed script once for the whole page. */
function loadEmbedScript(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (window.instgrm) {
    window.instgrm.Embeds.process();
    return Promise.resolve();
  }
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  if (existing) return Promise.resolve();
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
}

/**
 * Renders a real Instagram post (photo, account, full caption) via Instagram's
 * official embed. If the embed does not render — offline preview, private post,
 * blocked script — a matching in-house post card is shown instead.
 */
export function InstagramPostEmbed({
  post,
  bare = false,
}: {
  post: DestinationPost;
  /** Hides the section wrapper/label so a carousel can own the heading. */
  bare?: boolean;
}) {
  const { t } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  // Only single posts/reels can be embedded; account links show the post card.
  const embeddable = /instagram\.com\/(p|reel|reels)\//.test(post.post_url);
  const [failed, setFailed] = useState(!embeddable);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = host.current;
    if (!node || !embeddable) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        void loadEmbedScript().then(() => {
          if (cancelled) return;
          window.instgrm?.Embeds.process();
          timer = setTimeout(() => {
            if (cancelled) return;
            const iframe = node.querySelector("iframe");
            if (iframe) setReady(true);
            else setFailed(true);
          }, 2600);
        });
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [post.post_url]);

  const handle = post.account ? `@${post.account.replace(/^@/, "")}` : null;

  return (
    <section className="mt-12">
      <p className="text-[9px] tracking-[0.38em] opacity-45">
        {t("latest_post")}
        {handle && <span className="ml-2 opacity-80">· {handle}</span>}
      </p>

      <div ref={host} className="mt-5">
        {!failed && (
          <div
            className={`overflow-hidden rounded-[18px] bg-white transition-opacity ${
              ready ? "opacity-100" : "opacity-0"
            }`}
            style={ready ? undefined : { height: 1, pointerEvents: "none" }}
          >
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={post.post_url}
              data-instgrm-version="14"
              data-instgrm-captioned=""
              style={{ margin: 0, width: "100%", minWidth: "unset" }}
            >
              <a href={post.post_url} target="_blank" rel="noreferrer">
                {post.post_url}
              </a>
            </blockquote>
          </div>
        )}

        {failed && <PostCard post={post} handle={handle} />}
        {!failed && !ready && <PostSkeleton />}
      </div>
    </section>
  );
}

/** In-house replica of an Instagram post, used when the embed cannot render. */
function PostCard({ post, handle }: { post: DestinationPost; handle: string | null }) {
  const { t } = useI18n();
  return (
    <article className="overflow-hidden rounded-[18px] border border-current/12 bg-current/[0.04]">
      <header className="flex items-center gap-3 px-4 py-3.5">
        <span className="grid size-8 place-items-center rounded-full border border-current/25">
          <Instagram className="size-3.5" strokeWidth={1.5} />
        </span>
        <span className="text-[11px] tracking-[0.18em] opacity-85">{handle ?? "instagram"}</span>
      </header>
      {post.image && (
        <img
          src={post.image}
          alt={post.caption ?? ""}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full object-cover"
        />
      )}
      {post.caption && (
        <p className="px-4 pb-2 pt-4 text-[13px] leading-relaxed opacity-80">
          {handle && <span className="mr-1.5 opacity-100">{handle}</span>}
          {post.caption}
        </p>
      )}
      <a
        href={post.post_url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between px-4 pb-4 pt-3 text-[10px] tracking-[0.3em] opacity-70 transition-opacity hover:opacity-100"
      >
        {t("view_on_instagram")}
        <span className="opacity-50">↗</span>
      </a>
    </article>
  );
}

function PostSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[18px] border border-current/12 bg-current/[0.04]">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="size-8 rounded-full bg-current/10" />
        <span className="h-2 w-28 rounded bg-current/10" />
      </div>
      <div className="aspect-square w-full bg-current/[0.07]" />
      <div className="space-y-2 px-4 py-4">
        <span className="block h-2 w-full rounded bg-current/10" />
        <span className="block h-2 w-2/3 rounded bg-current/10" />
      </div>
    </div>
  );
}
