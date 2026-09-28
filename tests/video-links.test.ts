import { expect, test } from "bun:test";
import { parseVideoSource, videoEmbedUrl } from "../src/lib/video-links";
import { groupVideos } from "../src/data/resort";

test("Facebook page videos, watch links and reels use safe canonical URLs", () => {
  for (const path of [
    "InterContinentalDanang/videos/2019955602291134/",
    "watch/?v=2019955602291134",
    "reel/2019955602291134/",
  ]) {
    const video = parseVideoSource(`https://www.facebook.com/${path}`);
    expect(video?.provider).toBe("facebook");
    expect(video?.video_id).toBe("2019955602291134");
    expect(video?.format).toBe(path.startsWith("reel/") ? "short" : "video");
    expect(video?.video_url).toBe("https://www.facebook.com/watch/?v=2019955602291134");
    expect(videoEmbedUrl(video!)).toBeUndefined();
  }
});

test("unsupported URLs and spoofed providers cannot create embeds", () => {
  for (const value of [
    "javascript:alert(1)",
    "https://facebook.com.evil.test/reel/2019955602291134/",
    "http://facebook.com/reel/2019955602291134/",
    "https://facebook.com/share/v/abc/",
    "https://facebook.com/InterContinentalDanang/",
    "https://facebook.com/reel/not-a-video/",
    "https://user:password@facebook.com/reel/2019955602291134/",
    "https://facebook.com:8443/reel/2019955602291134/",
    "https://facebook.com/watch/?v=123%26redirect=evil",
  ])
    expect(parseVideoSource(value)).toBeNull();
});

test("Facebook belongs only to its destination and preserves title translations", () => {
  const videos = groupVideos([
    {
      destination_id: "terra-mare",
      video_url: "https://www.facebook.com/reel/2019955602291134/",
      title: "Terra Mare",
      title_translations: { zh: "Terra Mare" },
      display_order: 0,
    },
  ]);
  expect(videos["citron"]).toBeUndefined();
  expect(videos["terra-mare"][0]).toMatchObject({
    provider: "facebook",
    format: "short",
    title: "Terra Mare",
    title_translations: { zh: "Terra Mare" },
  });
  const youtube = parseVideoSource("https://youtube.com/shorts/7Iw_hUG-pD0")!;
  expect(youtube.format).toBe("short");
  expect(videoEmbedUrl(youtube)).toBe(
    "https://www.youtube-nocookie.com/embed/7Iw_hUG-pD0?autoplay=1",
  );
});
