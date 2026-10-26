import { ExternalLink, X } from "lucide-react";
import { FullscreenDialog } from "@/components/ui/fullscreen-dialog";
import { useI18n } from "@/i18n";
import { useYouTubePlayback } from "@/lib/use-youtube-playback";

const FILM_ID = "dLBRyZ0SIdg";
const FILM_URL = `https://www.youtube.com/shorts/${FILM_ID}`;

// Mount inside the dialog portal: the player container must exist before its effect runs.
function MichelinPlayer({ onClose }: Readonly<{ onClose: () => void }>) {
  const { t } = useI18n();
  const { host, loading, failed, retry } = useYouTubePlayback({
    videoId: FILM_ID,
    title: "One MICHELIN Key — InterContinental Danang",
    volume: 20,
    onEnded: onClose,
  });

  return (
    <div className="relative h-full w-full max-w-[calc(100dvh*9/16)]">
      <div ref={host} className="absolute inset-0 [&_iframe]:size-full [&_iframe]:border-0" />
      {loading && (
        <output className="pointer-events-none absolute inset-0 grid place-items-center text-sm">
          {t("page_loading")}
        </output>
      )}
      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black p-6 text-sm">
          <button
            type="button"
            onClick={retry}
            className="min-h-11 rounded-full border border-white/50 px-6 py-3 focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {t("retry")}
          </button>
          <a
            href={FILM_URL}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center gap-3 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {t("play_video")} <ExternalLink className="size-4" aria-hidden />
          </a>
        </div>
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
