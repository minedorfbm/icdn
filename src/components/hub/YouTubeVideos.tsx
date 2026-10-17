import { useEffect, useRef, useState } from "react";
import { Play, ExternalLink } from "lucide-react";
import type { DestinationVideo } from "@/data/resort";
import { useI18n } from "@/i18n";

function YouTubeVideo({
  video,
  showTitle = true,
  prepareOnApproach = false,
}: Readonly<{ video: DestinationVideo; showTitle?: boolean; prepareOnApproach?: boolean }>) {
  const { t, lang } = useI18n();
  const [playing, setPlaying] = useState(false);
  const isShort = video.format === "short";
  const title = video.title_translations[lang] || video.title;
  const label = `${t("play_video")}: ${title}`;

  return (
    <article
      className={`shrink-0 snap-center ${isShort ? "w-[min(80vw,320px)] min-w-[200px]" : "w-full"}`}
    >
      <div
        className={`relative overflow-hidden rounded-[18px] bg-black ${isShort ? "aspect-[9/16]" : "aspect-video"}`}
      >
        {prepareOnApproach ? (
          <PreparedCardVideo video={video} title={title} />
        ) : playing ? (
          <CardVideoPlayer video={video} title={title} autoplay />
        ) : (
          <button
            type="button"
            aria-label={label}
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 size-full text-white focus-visible:outline-2 focus-visible:outline-offset-[-4px]"
          >
            <img
              src={`https://i.ytimg.com/vi/${video.video_id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              decoding="async"
              width={480}
              height={360}
              className="size-full object-cover"
            />
            <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/35" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-16 place-items-center rounded-full border border-white/70 bg-black/40 backdrop-blur-sm">
                <Play className="size-6 fill-current" aria-hidden />
              </span>
            </span>
          </button>
        )}
      </div>
      {(prepareOnApproach || playing) && (
        <a
          href={`https://www.youtube.com/watch?v=${video.video_id}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex min-h-11 items-center gap-2 text-sm underline underline-offset-4 focus-visible:outline-2"
        >
          {t("play_video")} · YouTube <ExternalLink className="size-4" aria-hidden />
        </a>
      )}
      {showTitle && <h4 className="mt-3 font-serif text-[18px] leading-snug">{title}</h4>}
    </article>
  );
}

export function YouTubeVideos({
  videos,
  destinationId,
}: Readonly<{ videos: DestinationVideo[]; destinationId?: string }>) {
  if (videos.length === 0) return null;
  return (
    <div className="editorial-media-track flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {videos.map((video, index) => (
        <YouTubeVideo
          key={video.video_id}
          video={video}
          showTitle={videos.length > 1}
          prepareOnApproach={destinationId === "la-maison-1888" && index === 0}
        />
      ))}
    </div>
  );
}

/** One-card pilot: expose YouTube's own play control before the visitor clicks. */
function PreparedCardVideo({ video, title }: Readonly<{ video: DestinationVideo; title: string }>) {
  const container = useRef<HTMLDivElement>(null);
  const [nearby, setNearby] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    if (!("IntersectionObserver" in window)) {
      setNearby(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearby(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={container} className="absolute inset-0" data-youtube-pilot>
      {nearby ? (
        <CardVideoPlayer video={video} title={title} autoplay={false} />
      ) : (
        <img
          src={`https://i.ytimg.com/vi/${video.video_id}/hqdefault.jpg`}
          alt=""
          width={480}
          height={360}
          loading="lazy"
          className="size-full object-cover"
        />
      )}
    </div>
  );
}

function CardVideoPlayer({
  video,
  title,
  autoplay,
}: Readonly<{
  video: DestinationVideo;
  title: string;
  autoplay: boolean;
}>) {
  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${video.video_id}?autoplay=${autoplay ? 1 : 0}&playsinline=1&rel=0`}
      title={title}
      className="size-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}
