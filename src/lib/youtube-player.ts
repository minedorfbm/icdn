export interface YouTubePlayer {
  destroy(): void;
}

export type YouTubeOptions = {
  host: string;
  videoId: string;
  width: string;
  height: string;
  playerVars: Record<string, string | number>;
  events: {
    onReady: (event: {
      target: {
        unMute(): void;
        setVolume(volume: number): void;
        playVideo(): void;
        getIframe(): HTMLIFrameElement;
      };
    }) => void;
    onStateChange: (event: { data: number }) => void;
    onError: () => void;
    onAutoplayBlocked: () => void;
  };
};

type PlayerConstructor = new (element: HTMLElement, options: YouTubeOptions) => YouTubePlayer;
type YouTubeWindow = Window & {
  YT?: { Player: PlayerConstructor };
  onYouTubeIframeAPIReady?: () => void;
};
let pending: Promise<PlayerConstructor> | undefined;

/** Download the official player API only after a visitor opens a film. */
export function loadYouTubePlayer(): Promise<PlayerConstructor> {
  const browser = window as YouTubeWindow;
  if (browser.YT?.Player) return Promise.resolve(browser.YT.Player);
  if (pending) return pending;
  pending = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const previous = browser.onYouTubeIframeAPIReady;
    const cleanup = () => {
      window.clearTimeout(timeout);
      if (browser.onYouTubeIframeAPIReady === ready) {
        if (previous) browser.onYouTubeIframeAPIReady = previous;
        else delete browser.onYouTubeIframeAPIReady;
      }
      script.onerror = null;
    };
    const fail = () => {
      cleanup();
      script.remove();
      pending = undefined;
      reject(new Error("YouTube player unavailable"));
    };
    const ready = () => {
      if (!browser.YT?.Player) return fail();
      cleanup();
      resolve(browser.YT.Player);
      previous?.();
    };
    const timeout = window.setTimeout(fail, 12_000);
    browser.onYouTubeIframeAPIReady = ready;
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = fail;
    document.head.append(script);
  });
  return pending;
}
