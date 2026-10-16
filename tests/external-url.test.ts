import { describe, expect, test } from "bun:test";
import { groupPosts, youtubeVideoId } from "../src/data/resort";
import {
  httpsUrl,
  instagramEmbedUrl,
  instagramLink,
  safeExternalUrl,
} from "../src/lib/external-url";

describe("external content boundaries", () => {
  test("preserves booking parameters, email subjects and formatted telephone numbers", () => {
    for (const url of [
      "https://www.tablecheck.com/en/intercontinental-danang-la-maison/reserve?menu=123",
      "mailto:reservations@example.com?subject=Spa%20booking",
      "tel:+84 (236) 393-8888",
    ])
      expect(safeExternalUrl(url)).toBe(url);
  });

  test("rejects active protocols, credential tricks and URL parser normalization tricks", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,test",
      "//example.com/",
      "http://example.com/",
      "https://trusted.com@evil.example/",
      "https://user:pass@example.com/",
      "https://exam\nple.com/",
      "https://example.com/\u0000",
      " https://example.com/",
      "https:\\example.com/",
    ])
      expect(safeExternalUrl(url)).toBeUndefined();
  });

  test("exact integration hosts reject subdomain impersonation and alternate ports", () => {
    for (const url of [
      "https://www.instagram.com.evil.test/p/Abc123/",
      "https://evil.test/?next=https://www.instagram.com/p/Abc123/",
      "https://www.instagram.com:444/p/Abc123/",
      "https://www.instagram.com@evil.test/p/Abc123/",
    ]) {
      expect(instagramLink(url)).toBeUndefined();
      expect(instagramEmbedUrl(url)).toBeUndefined();
    }
    expect(httpsUrl("https://wa.me:444/123", ["wa.me"])).toBeUndefined();
    expect(youtubeVideoId("https://user@www.youtube.com/watch?v=qY8aV6q1sjk")).toBeNull();
    expect(youtubeVideoId("https://www.youtube.com:444/watch?v=qY8aV6q1sjk")).toBeNull();
  });

  test("keeps posts, reels, older TV links and profile fallback links distinct", () => {
    for (const kind of ["p", "reel", "reels", "tv"]) {
      const url = `https://www.instagram.com/${kind}/Abc_123-/?img_index=2`;
      expect(instagramEmbedUrl(url)).toBe(url);
    }
    const profile = "https://www.instagram.com/intercontinentaldanang/";
    expect(instagramLink(profile)).toBe(profile);
    expect(instagramEmbedUrl(profile)).toBeUndefined();
    expect(instagramEmbedUrl("https://instagram.com/p/Abc123/extra")).toBeUndefined();
  });

  test("explicit direct links survive grouping while older rows still use embeds", () => {
    const common = {
      destination_id: "citron",
      account: null,
      caption: null,
      image_url: null,
      posted_at: null,
    };
    const posts = groupPosts([
      { ...common, post_url: "https://www.instagram.com/p/Embed/", display_order: 0 },
      {
        ...common,
        post_url: "https://www.instagram.com/p/Direct/",
        display_order: 1,
        embed_mode: "link",
      },
    ])["citron"]!;
    expect(posts[0]!.embed_mode).toBeUndefined();
    expect(posts[1]!.embed_mode).toBe("link");
  });

  test("bad published post links are omitted without losing valid posts or their order", () => {
    const rows = [
      { post_url: "https://www.instagram.com/reel/Abc123/", display_order: 2 },
      { post_url: "data:text/html,untrusted", display_order: 0 },
      { post_url: "https://www.instagram.com/p/Def456/", display_order: 1 },
    ].map((row) => ({
      ...row,
      destination_id: "citron",
      account: null,
      caption: null,
      image_url: null,
      posted_at: null,
    }));
    expect(groupPosts(rows)["citron"]?.map((post) => post.post_url)).toEqual([
      "https://www.instagram.com/p/Def456/",
      "https://www.instagram.com/reel/Abc123/",
    ]);
  });
});
