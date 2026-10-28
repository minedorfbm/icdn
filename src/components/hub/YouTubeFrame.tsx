import { useEffect, useRef, useState } from "react";
import { mediaPlayback } from "@/lib/media-playback";
import { observeMediaFrameFocus } from "@/lib/media-frame-focus";
import { loadYouTubePlayer, type YouTubePlayer } from "@/lib/youtube-player";

/** The native iframe loads immediately; the control API never gates the first click. */
export function YouTubeFrame({ videoId, title }: Readonly<{ videoId: string; title: string }>) {
  const host = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const latestTitle = useRef(title);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    latestTitle.current = title;
    if (iframe.current) iframe.current.title = title;
  }, [title]);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let cancelled = false;
    let player: YouTubePlayer | undefined;
    let ready = false;
    let mayHavePlayed = false;
    const frame = document.createElement("iframe");
    iframe.current = frame;
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=0&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
    frame.title = latestTitle.current;
    frame.className = "size-full border-0";
    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.allowFullscreen = true;
    container.append(frame);

    const pause = (reason: "handoff" | "document") => {
      if (cancelled) return;
      if (ready && player) {
        try {
          player.pauseVideo();
          return;
        } catch {
          // A detached/unavailable provider must not leave audio behind.
        }
      }
      // Also stop a native player if its optional API is slow or blocked.
      if (reason === "document" || mayHavePlayed) setAttempt((value) => value + 1);
    };
    const participant = mediaPlayback.register(pause);
    const anotherFrameHasFocus = () =>
      document.activeElement instanceof HTMLIFrameElement && document.activeElement !== frame;
    const unobserve = observeMediaFrameFocus(frame, () => {
      mayHavePlayed = true;
      participant.activate();
    });
    void loadYouTubePlayer()
      .then((Player) => {
        if (cancelled) return;
        player = new Player(frame, {
          host: "https://www.youtube-nocookie.com",
          events: {
            onReady: ({ target }) => {
              if (cancelled) return;
              ready = true;
              if (mediaPlayback.isSuspended() || anotherFrameHasFocus()) target.pauseVideo();
            },
            onStateChange: ({ data }) => {
              if (!cancelled && data === 1) {
                mayHavePlayed = true;
                // An older provider can deliver PLAYING after the visitor has
                // already moved to Instagram. It must not steal playback back.
                if (anotherFrameHasFocus()) pause("handoff");
                else participant.activate();
              }
            },
          },
        });
      })
      .catch(() => {
        // The native controls remain usable; interruption falls back to remounting.
      });
    return () => {
      cancelled = true;
      unobserve();
      participant.unregister();
      player?.destroy();
      frame.remove();
      if (iframe.current === frame) iframe.current = null;
    };
  }, [videoId, attempt]);

  return <div ref={host} className="size-full" />;
}
