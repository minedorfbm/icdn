import { useState } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import type { DestinationVideo } from "@/data/resort";
import { videoEmbedUrl } from "@/lib/video-links";
import { useI18n } from "@/i18n";

function DestinationVideoPlayer({
  video,
  poster,
}: Readonly<{ video: DestinationVideo; poster: string }>) {
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
        {playing ? (
          <iframe
            className="absolute inset-0 size-full"
            src={videoEmbedUrl(video)}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            aria-label={label}
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 size-full text-white focus-visible:outline-2 focus-visible:outline-offset-[-4px]"
          >
            <img
              src={
                video.provider === "youtube"
                  ? `https://i.ytimg.com/vi/${video.video_id}/hqdefault.jpg`
                  : poster
              }
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
      <h4 className="mt-3 font-serif text-[18px] leading-snug">{title}</h4>
      {video.provider === "facebook" && (
        <a
          href={video.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-[10px] tracking-[0.16em] opacity-70 hover:opacity-100"
        >
          {t("view_on_facebook")}
          <ArrowUpRight className="size-4 shrink-0" strokeWidth={1.3} aria-hidden />
        </a>
      )}
    </article>
  );
}

export function DestinationVideos({
  videos,
  poster,
}: Readonly<{ videos: DestinationVideo[]; poster: string }>) {
  const { t } = useI18n();
  if (videos.length === 0) return null;

  return (
    <section className="mt-12">
      <h3 className="text-[9px] tracking-[0.42em] opacity-50">{t("videos")}</h3>
      <div className="-mx-7 mt-5 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-7 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {videos.map((video) => (
          <DestinationVideoPlayer
            key={`${video.provider}:${video.video_id}`}
            video={video}
            poster={poster}
          />
        ))}
      </div>
    </section>
  );
}
