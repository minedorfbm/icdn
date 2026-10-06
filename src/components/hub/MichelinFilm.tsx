import { useEffect, useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { FullscreenDialog } from "@/components/ui/fullscreen-dialog";
import { useI18n } from "@/i18n";
import { loadYouTubePlayer, type YouTubePlayer } from "@/lib/youtube-player";

const FILM_ID = "dLBRyZ0SIdg";
const FILM_URL = `https://www.youtube.com/shorts/${FILM_ID}`;

// Mount inside the dialog portal: the player container must exist before its effect runs.
function MichelinPlayer({ onClose }: Readonly<{ onClose: () => void }>) {
  const { t } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let player: YouTubePlayer | undefined;
    const container = host.current;
    if (!container) return;
    const unavailable = () => {
      if (!cancelled) {
        setLoading(false);
        setFailed(true);
      }
    };
    const timeout = window.setTimeout(unavailable, 20_000);
    // The API replaces its mount element; keep React's container intact for reopen/cleanup.
    const mount = document.createElement("div");
    container.append(mount);
    loadYouTubePlayer()
      .then((Player) => {
        if (cancelled) return;
        player = new Player(mount, {
          host: "https://www.youtube-nocookie.com",
          videoId: FILM_ID,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            mute: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: ({ target }) => {
              if (cancelled) return;
              window.clearTimeout(timeout);
              target.getIframe().title = "One MICHELIN Key — InterContinental Danang";
              target.mute();
              target.playVideo();
              setLoading(false);
            },
            onStateChange: ({ data }) => {
              if (!cancelled && data === 0) onClose();
            },
            onError: () => {
              window.clearTimeout(timeout);
              unavailable();
            },
            onAutoplayBlocked: () => {
              // Keep YouTube's own play control usable when the browser refuses autoplay.
              window.clearTimeout(timeout);
              if (!cancelled) setLoading(false);
            },
          },
        });
      })
      .catch(() => {
        window.clearTimeout(timeout);
        unavailable();
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      player?.destroy();
      container.replaceChildren();
    };
  }, [onClose]);

  return (
    <div className="relative h-full w-full max-w-[calc(100dvh*9/16)]">
      <div ref={host} className="absolute inset-0 [&_iframe]:size-full [&_iframe]:border-0" />
      {loading && (
        <p
          role="status"
          className="pointer-events-none absolute inset-0 grid place-items-center text-sm"
        >
          {t("page_loading")}
        </p>
      )}
      {failed && (
        <a
          href={FILM_URL}
          target="_blank"
          rel="noreferrer"
          className="absolute inset-0 flex items-center justify-center gap-3 bg-black text-sm underline underline-offset-4"
        >
          {t("play_video")} <ExternalLink className="size-4" aria-hidden />
        </a>
      )}
    </div>
  );
}

export default function MichelinFilm({ onClose }: Readonly<{ onClose: () => void }>) {
  const { t } = useI18n();
  return (
    <FullscreenDialog
      title="One MICHELIN Key — InterContinental Danang"
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[109] bg-black"
      className="fixed inset-0 z-[110] flex h-[100dvh] items-center justify-center overflow-hidden bg-black text-white"
    >
      <MichelinPlayer onClose={onClose} />
      <button
        type="button"
        onClick={onClose}
        aria-label={t("close")}
        className="absolute right-4 top-[max(16px,env(safe-area-inset-top))] grid size-11 place-items-center rounded-full border border-white/30 bg-black/70 text-white focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <X className="size-5" strokeWidth={1.4} aria-hidden />
      </button>
    </FullscreenDialog>
  );
}
