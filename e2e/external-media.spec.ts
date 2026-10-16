import { expect, test } from "./fixtures";

test("Instagram loads the current and next post, retains visited players and skips direct links", async ({
  page,
}) => {
  let scripts = 0;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("https://www.instagram.com/embed.js", (route) => {
    scripts++;
    return route.fulfill({
      contentType: "application/javascript",
      body: `
      const attempts = new Map();
      window.instgrm = { Embeds: { process() {
        document.querySelectorAll('blockquote.instagram-media').forEach(post => {
          const url = post.dataset.instgrmPermalink;
          const attempt = (attempts.get(url) || 0) + 1;
          attempts.set(url, attempt);
          const frame = document.createElement('iframe');
          frame.title = url;
          frame.dataset.attempt = String(attempt);
          frame.style.cssText = 'display:block;width:100%;border:0;height:500px';
          frame.srcdoc = '<p>Instagram post</p>';
          post.replaceWith(frame);
        });
      } } };`,
    });
  });
  await page.goto("/tingara");
  const card = page.getByRole("dialog", { name: "TINGARA", exact: true });
  const track = card.locator("[data-instagram-track]");
  await track.scrollIntoViewIfNeeded();
  await expect(track.locator("iframe")).toHaveCount(2);
  await expect(track.locator('iframe[title$="/WINDOW0/"]')).toHaveCount(1);
  await expect(track.locator('iframe[title$="/WINDOW1/"]')).toHaveCount(1);
  await card.getByRole("button", { name: "2 / 5", exact: true }).click();
  await expect(track.locator("iframe")).toHaveCount(3);
  await card.getByRole("button", { name: "4 / 5", exact: true }).click();
  const direct = track.locator(".instagram-post").nth(3);
  await expect(direct.getByRole("link", { name: "VIEW ON INSTAGRAM", exact: true })).toBeVisible();
  await expect(direct.locator("iframe, blockquote")).toHaveCount(0);
  await expect(direct.getByRole("button", { name: "Try again", exact: true })).toHaveCount(0);
  await expect(track.locator("iframe")).toHaveCount(4);
  await card.getByRole("button", { name: "1 / 5", exact: true }).click();
  await expect(track.locator('iframe[title$="/WINDOW0/"]')).toHaveAttribute("data-attempt", "1");
  expect(scripts).toBe(1);
});

test("a card loads YouTube on demand, offers recovery after a player error and cleans up on close", async ({
  page,
}) => {
  let scripts = 0;
  await page.route("https://www.youtube.com/iframe_api", (route) => {
    scripts++;
    return route.fulfill({
      contentType: "application/javascript",
      body: `
      let attempts = 0;
      window.YT = { Player: class {
        constructor(mount, options) {
          this.frame = document.createElement('iframe');
          this.frame.src = 'https://www.youtube-nocookie.com/embed/' + options.videoId;
          mount.replaceWith(this.frame);
          const attempt = ++attempts;
          this.frame.dataset.attempt = String(attempt);
          setTimeout(() => attempt === 1 ? options.events.onError() : options.events.onReady({ target: this }), 0);
        }
        getIframe() { return this.frame; }
        playVideo() { this.frame.dataset.playing = 'true'; }
        destroy() { document.body.dataset.cardVideoDestroyed = String(Number(document.body.dataset.cardVideoDestroyed || 0) + 1); this.frame.remove(); }
      }};
      window.onYouTubeIframeAPIReady();`,
    });
  });
  await page.route("https://www.youtube-nocookie.com/embed/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<p>YouTube player</p>" }),
  );
  await page.goto("/citron");
  const card = page.getByRole("dialog", { name: "Citron", exact: true });
  await expect(
    card.getByRole("button", { name: "Play video: Test video", exact: true }),
  ).toBeAttached();
  expect(scripts).toBe(0);
  await card.getByRole("button", { name: "Play video: Test video", exact: true }).click();
  const fallback = card.getByRole("link", { name: "Play video · YouTube", exact: true });
  await expect(fallback).toHaveAttribute("href", "https://www.youtube.com/watch?v=PVN005yvGpY");
  await card.getByRole("button", { name: "Try again", exact: true }).click();
  const frame = card.locator('iframe[src*="youtube-nocookie"]');
  await expect(frame).toHaveAttribute("data-playing", "true");
  await expect(frame).toHaveAttribute("title", "Test video");
  await expect(frame).toHaveAttribute("data-attempt", "2");
  await expect(fallback).toHaveCount(0);
  expect(scripts).toBe(1);
  await card.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(card).toHaveCount(0);
  await expect(page.locator("body")).toHaveAttribute("data-card-video-destroyed", "2");
});
