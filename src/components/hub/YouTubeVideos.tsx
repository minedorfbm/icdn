import { useEffect, useRef, useState } from "react";
import type { DestinationVideo } from "@/data/resort";
import { useI18n } from "@/i18n";
import { imageSource } from "@/lib/image-source";
import { YouTubeFrame } from "./YouTubeFrame";

function YouTubeVideo({
  video,
  showTitle,
}: Readonly<{ video: DestinationVideo; showTitle: boolean }>) {
  const { lang } = useI18n();
  const isShort = video.format === "short";
  const title = video.title_translations[lang] || video.title;
  return (
    <article
      className={`shrink-0 snap-center ${isShort ? "w-[min(80vw,320px)] min-w-[200px]" : "w-full"}`}
    >
      <div
        className={`relative overflow-hidden rounded-[18px] bg-black ${isShort ? "aspect-[9/16]" : "aspect-video"}`}
      >
        <DeferredYouTubePlayer video={video} title={title} />
      </div>
      {showTitle && (
        <h4 className="mt-3 font-serif text-[length:var(--readable-18)] leading-snug">{title}</h4>
      )}
    </article>
  );
}

export function YouTubeVideos({ videos }: Readonly<{ videos: DestinationVideo[] }>) {
  if (videos.length === 0) return null;
  return (
    <div className="editorial-media-track flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {videos.map((video) => (
        <YouTubeVideo key={video.video_id} video={video} showTitle={videos.length > 1} />
      ))}
    </div>
  );
}

/** Prepare nearby players without starting playback; the native button receives the click. */
function DeferredYouTubePlayer({
  video,
  title,
}: Readonly<{ video: DestinationVideo; title: string }>) {
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
    <div ref={container} className="absolute inset-0" data-youtube-player>
      {nearby ? (
        <YouTubeFrame videoId={video.video_id} title={title} />
      ) : (
        <img
          src={imageSource(`https://i.ytimg.com/vi/${video.video_id}/hqdefault.jpg`)}
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
