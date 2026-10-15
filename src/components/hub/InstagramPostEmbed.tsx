import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Instagram } from "lucide-react";
import type { DestinationPost } from "@/data/resort";
import { useI18n } from "@/i18n";
import { instagramEmbedUrl, instagramLink } from "@/lib/external-url";
import "./instagram-post.css";

const SCRIPT_SRC = "https://www.instagram.com/embed.js";
// At Instagram's 326px layout width, keep the media, controls and beginning of
// the caption. Long captions must not make the entire post tiny.
const CAPTION_PREVIEW_HEIGHT = 740;

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

let embedScript: Promise<void> | undefined;

/** All embeds wait for the same load, with a bounded wait on slow networks. */
function loadEmbedScript(): Promise<void> {
  if (typeof document === "undefined" || window.instgrm) return Promise.resolve();
  if (embedScript) return embedScript;
  embedScript = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement("script");
    const cleanup = () => {
      clearTimeout(timeout);
      script.removeEventListener("load", loaded);
      script.removeEventListener("error", failed);
    };
    const loaded = () => {
      cleanup();
      if (window.instgrm) resolve();
      else failed();
    };
    const failed = () => {
      cleanup();
      script.remove();
      embedScript = undefined;
      reject(new Error("Instagram embed script unavailable"));
    };
    const timeout = setTimeout(failed, 12000);
    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", failed, { once: true });
    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });
  return embedScript;
}

let processing: Promise<void> | undefined;

/** Neighbouring posts share one Instagram processing pass per frame. */
function processEmbeds(): Promise<void> {
  if (processing) return processing;
  processing = new Promise((resolve, reject) => {
    requestAnimationFrame(() => {
      try {
        window.instgrm?.Embeds.process();
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        processing = undefined;
      }
    });
  });
  return processing;
}

/** Official embed with the shared caption preview and an offline fallback. */
export function InstagramPostEmbed({ post }: Readonly<{ post: DestinationPost }>) {
  const { t } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const bounds = useRef<HTMLDivElement>(null);
  // Only single posts/reels can be embedded; account links show the post card.
  const permalink = instagramEmbedUrl(post.post_url);
  const embeddable = !!permalink;
  const [failed, setFailed] = useState(!embeddable);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [fit, setFit] = useState({ width: 326, height: 0, scale: 1, clipped: false });

  useEffect(() => {
    setFailed(!embeddable);
    setReady(false);
    const node = host.current;
    if (!node || !embeddable) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    let frame: HTMLIFrameElement | null = null;
    let displayed = false;
    const sizes = new ResizeObserver(() => rendered());
    // Instagram inserts a zero-height iframe before its content is ready. Keep
    // the skeleton until its resize message gives the player a usable height.
    const rendered = () => {
      if (cancelled) return;
      const next = node.querySelector("iframe");
      if (next !== frame) {
        if (frame) sizes.unobserve(frame);
        frame = next;
        if (frame) sizes.observe(frame);
      }
      // Measure before the transform: measuring the painted rectangle would
      // repeatedly shrink an already scaled iframe after each resize message.
      if (!frame || frame.offsetHeight < 100) return;
      if (!bounds.current) return;
      const limit = bounds.current.getBoundingClientRect();
      if (!frame.offsetWidth || !limit.width || !limit.height) return;
      const previewHeight = Math.min(frame.offsetHeight, CAPTION_PREVIEW_HEIGHT);
      const scale = Math.min(1, limit.width / frame.offsetWidth, limit.height / previewHeight);
      const nextFit = {
        width: frame.offsetWidth * scale,
        height: previewHeight * scale,
        scale,
        clipped: frame.offsetHeight > previewHeight,
      };
      setFit((previous) =>
        previous.width === nextFit.width &&
        previous.height === nextFit.height &&
        previous.scale === nextFit.scale &&
        previous.clipped === nextFit.clipped
          ? previous
          : nextFit,
      );
      displayed = true;
      if (timer) clearTimeout(timer);
      setReady(true);
      setFailed(false);
    };
    const mutations = new MutationObserver(rendered);
    if (bounds.current) sizes.observe(bounds.current);
    mutations.observe(node, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "height"],
    });
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        void loadEmbedScript()
          .then(processEmbeds)
          .then(
            () => {
              if (cancelled) return;
              try {
                rendered();
                timer = setTimeout(() => {
                  if (!cancelled && !displayed) setFailed(true);
                }, 12000);
              } catch {
                setFailed(true);
              }
            },
            () => {
              if (!cancelled) setFailed(true);
            },
          );
      },
      { rootMargin: "600px" },
    );
    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
      mutations.disconnect();
      sizes.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [post.post_url, embeddable, attempt]);

  const handle = post.account ? `@${post.account.replace(/^@/, "")}` : null;

  return (
    <div
      ref={host}
      data-fit-to-screen
      className="instagram-post"
      style={ready && !failed ? { width: fit.width } : undefined}
    >
      <div ref={bounds} className="instagram-post-bounds" aria-hidden />
      {embeddable && (
        <div
          data-caption-preview={(ready && fit.clipped) || undefined}
          className={`instagram-post-viewport overflow-hidden rounded-[18px] bg-white transition-opacity [&_blockquote]:invisible ${
            ready ? "opacity-100" : "opacity-0"
          }`}
          style={
            ready ? { width: fit.width, height: fit.height } : { height: 1, pointerEvents: "none" }
          }
        >
          <div
            // Instagram marks processed placeholders and inserts its own player.
            // A retry needs fresh markup; process() ignores a stalled, already processed post.
            key={`${post.post_url}:${attempt}`}
            className="instagram-post-content"
            style={{ transform: `scale(${fit.scale})` }}
          >
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={permalink}
              data-instgrm-version="14"
              data-instgrm-captioned=""
              style={{ margin: 0, width: "100%", minWidth: "unset" }}
            >
              <a href={permalink} target="_blank" rel="noreferrer">
                {post.post_url}
              </a>
            </blockquote>
          </div>
        </div>
      )}

      {failed && (
        <>
          <PostCard post={post} handle={handle} />
          {embeddable && (
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="mt-3 min-h-11 rounded-full border border-current/20 px-4 text-xs"
            >
              {t("retry")}
            </button>
          )}
        </>
      )}
      {!failed && !ready && <PostSkeleton />}
    </div>
  );
}

/** Published preview and safe Instagram link when the embed cannot render. */
function PostCard({ post, handle }: Readonly<{ post: DestinationPost; handle: string | null }>) {
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
        href={instagramLink(post.post_url)}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between px-4 pb-4 pt-3 text-[10px] tracking-[0.3em] opacity-70 transition-opacity hover:opacity-100"
      >
        {t("view_on_instagram")}
        <ArrowUpRight className="size-4 shrink-0 opacity-50" strokeWidth={1.3} aria-hidden />
      </a>
    </article>
  );
}

function PostSkeleton() {
  return (
    <div
      data-instagram-loading
      className="animate-pulse overflow-hidden rounded-[18px] border border-current/12 bg-current/[0.04]"
    >
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
