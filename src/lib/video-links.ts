export interface VideoSource {
  provider: "youtube" | "facebook";
  video_id: string;
  video_url: string;
  format: "video" | "short";
}

/** Accept only video IDs from known YouTube URL formats before building an embed URL. */
export function youtubeVideoId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    let id: string | null = null;
    if (host === "youtu.be") {
      id = url.pathname.slice(1);
    } else if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else {
        const match = url.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)\/?$/);
        id = match?.[1] ?? null;
      }
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Only explicit HTTPS video links from supported hosts reach an iframe. */
export function parseVideoSource(value: string): VideoSource | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    const youtubeId = youtubeVideoId(value);
    if (youtubeId)
      return {
        provider: "youtube",
        video_id: youtubeId,
        video_url: `https://www.youtube.com/watch?v=${youtubeId}`,
        format: url.pathname.startsWith("/shorts/") ? "short" : "video",
      };
    if (!["facebook.com", "www.facebook.com", "m.facebook.com"].includes(url.hostname)) return null;
    const match = url.pathname.match(/^\/(?:reel|(?:[A-Za-z0-9._-]+\/)?videos)\/([0-9]+)\/?$/);
    const id =
      match?.[1] ??
      (url.pathname === "/watch/" || url.pathname === "/watch" ? url.searchParams.get("v") : null);
    if (!id || !/^[0-9]{5,30}$/.test(id)) return null;
    return {
      provider: "facebook",
      video_id: id,
      video_url: `https://www.facebook.com/watch/?v=${id}`,
      format: url.pathname.startsWith("/reel/") ? "short" : "video",
    };
  } catch {
    return null;
  }
}

export function videoEmbedUrl(video: VideoSource): string {
  if (video.provider === "youtube")
    return `https://www.youtube-nocookie.com/embed/${video.video_id}?autoplay=1`;
  const params = new URLSearchParams({
    href: video.video_url,
    show_text: "false",
    autoplay: "true",
    width: video.format === "short" ? "320" : "560",
  });
  return `https://www.facebook.com/plugins/video.php?${params}`;
}
