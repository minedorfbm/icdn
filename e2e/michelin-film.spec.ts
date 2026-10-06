import { expect, test } from "@playwright/test";

const api = `
window.YT = { Player: class {
  constructor(mount, options) {
    this.frame = document.createElement('iframe');
    this.frame.src = 'https://www.youtube-nocookie.com/embed/' + options.videoId;
    mount.replaceWith(this.frame);
    this.ended = event => {
      if (event.source === this.frame.contentWindow && event.data === 'film-ended') {
        options.events.onStateChange({ data: 0 });
      }
    };
    window.addEventListener('message', this.ended);
    setTimeout(() => options.events.onReady({ target: this }), 0);
  }
  getIframe() { return this.frame; }
  unMute() { this.frame.dataset.muted = 'false'; }
  setVolume(value) { this.frame.dataset.volume = String(value); }
  playVideo() { this.frame.dataset.playing = 'true'; }
  destroy() { window.removeEventListener('message', this.ended); this.frame.remove(); }
}};
window.onYouTubeIframeAPIReady();
`;

test("first Michelin opening starts after the portal mounts; manual and ended closure allow reopening", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://www.youtube.com/iframe_api", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({ contentType: "application/javascript", body: api });
  });
  await page.route("https://www.youtube-nocookie.com/embed/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<button onclick="parent.postMessage('film-ended','*')">Finish film</button>`,
    }),
  );
  await page.goto("/");
  const key = page.getByRole("button", { name: "Play video: One MICHELIN Key", exact: true });
  const dialog = page.getByRole("dialog", {
    name: "One MICHELIN Key — InterContinental Danang",
    exact: true,
  });
  await key.click();
  const frame = dialog.locator("iframe");
  await expect(frame).toBeVisible();
  await expect(frame).toHaveAttribute("data-playing", "true");
  await expect(frame).toHaveAttribute("data-muted", "false");
  await expect(frame).toHaveAttribute("data-volume", "20");
  await expect(dialog.getByRole("status")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(key).toBeFocused();
  await key.click();
  await expect(frame).toBeVisible();
  await page
    .frameLocator('iframe[title="One MICHELIN Key — InterContinental Danang"]')
    .getByRole("button", { name: "Finish film" })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(key).toBeFocused();
  expect(errors).toEqual([]);
});

test("an unavailable YouTube API shows the original video link instead of indefinite loading", async ({
  page,
}) => {
  await page.route("https://www.youtube.com/iframe_api", (route) => route.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "Play video: One MICHELIN Key", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "One MICHELIN Key — InterContinental Danang",
    exact: true,
  });
  await expect(dialog.getByRole("link", { name: "Play video", exact: true })).toHaveAttribute(
    "href",
    "https://www.youtube.com/shorts/dLBRyZ0SIdg",
  );
  await expect(dialog.getByRole("status")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toHaveCount(0);
});
