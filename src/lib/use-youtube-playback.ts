import { useEffect, useRef, useState } from "react";
import { loadYouTubePlayer, type YouTubePlayer } from "./youtube-player";
import { mediaPlayback } from "./media-playback";

/** Start a visitor-opened film and cancel late autoplay when another surface takes over. */
export function useYouTubePlayback({
  videoId,
  title,
  volume,
  onEnded,
}: Readonly<{
  videoId: string;
  title: string;
  volume?: number;
  onEnded?: () => void;
}>) {
  const host = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let player: YouTubePlayer | undefined;
    const container = host.current;
    if (!container) return;
    let allowAutoplay = true;
    const participant = mediaPlayback.register(() => {
      allowAutoplay = false;
      player?.pauseVideo?.();
    });
    if (!participant.activate()) allowAutoplay = false;
    setLoading(true);
    setFailed(false);
    const unavailable = () => {
      if (!cancelled) {
        setLoading(false);
        setFailed(true);
      }
    };
    const timeout = window.setTimeout(unavailable, 20_000);
    const mount = document.createElement("div");
    container.append(mount);
    const ready = () => {
      window.clearTimeout(timeout);
      if (!cancelled) {
        setFailed(false);
        setLoading(false);
      }
    };
    loadYouTubePlayer()
      .then((Player) => {
        if (cancelled) return;
        player = new Player(mount, {
          host: "https://www.youtube-nocookie.com",
          videoId,
          width: "100%",
          height: "100%",
          playerVars: { autoplay: 0, playsinline: 1, rel: 0, origin: window.location.origin },
          events: {
            onReady: ({ target }) => {
              if (cancelled) return;
              ready();
              target.getIframe().title = title;
              if (volume !== undefined) {
                target.setVolume(volume);
                target.unMute();
              }
              if (allowAutoplay && participant.activate()) target.playVideo();
              else target.pauseVideo();
            },
            onStateChange: ({ data }) => {
              if (!cancelled && data === 1) participant.activate();
              if (!cancelled && data === 0) onEnded?.();
            },
            onError: () => {
              window.clearTimeout(timeout);
              unavailable();
            },
            // A browser may refuse autoplay; leave the provider's play control usable.
            onAutoplayBlocked: ready,
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
      participant.unregister();
      player?.destroy();
      container.replaceChildren();
    };
  }, [videoId, title, volume, onEnded, attempt]);

  return { host, loading, failed, retry: () => setAttempt((previous) => previous + 1) };
}
