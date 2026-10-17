import { expect, test } from "./fixtures";

const api = `
window.YT = { Player: class {
  constructor(mount, options) {
    this.frame = document.createElement('iframe');
    this.frame.src = 'https://www.youtube-nocookie.com/embed/' + options.videoId;
    this.frame.dataset.autoplay = String(options.playerVars.autoplay);
    mount.replaceWith(this.frame);
    setTimeout(() => options.events.onReady({ target: this }), 0);
  }
  getIframe() { return this.frame; }
  playVideo() { this.frame.dataset.programmaticPlay = 'true'; }
  destroy() { document.body.dataset.playerDestroyed = 'true'; this.frame.remove(); }
}};
window.onYouTubeIframeAPIReady();`;

// Stub only the provider boundary: real autoplay policies are checked on actual devices.
const playerHtml = `<button onclick="document.body.dataset.playing='true'">YouTube Play</button>`;

test("La Maison prepares one player near the viewport without autoplay or an extra hub play button", async ({
  page,
}, testInfo) => {
  let scripts = 0;
  await page.route("https://www.youtube.com/iframe_api", (route) => {
    scripts++;
    return route.fulfill({ contentType: "application/javascript", body: api });
  });
  await page.route("https://www.youtube-nocookie.com/embed/**", (route) =>
    route.fulfill({ contentType: "text/html", body: playerHtml }),
  );
  await page.goto("/la-maison-1888");
  const card = page.getByRole("dialog", { name: "La Maison 1888", exact: true });
  const pilot = card.locator("[data-youtube-pilot]");
  await expect(pilot).toHaveCount(1);
  expect(scripts).toBe(0);
  await expect(pilot.locator("iframe")).toHaveCount(0);
  await pilot.scrollIntoViewIfNeeded();
  const frame = pilot.locator("iframe");
  await expect(frame).toHaveAttribute("title", "Resort video");
  await expect(frame).toHaveAttribute("data-autoplay", "0");
  await expect(frame).not.toHaveAttribute("data-programmatic-play");
  await expect(pilot.getByRole("button")).toHaveCount(0);
  const provider = page.frameLocator('iframe[title="Resort video"]');
  await provider.getByRole("button", { name: "YouTube Play", exact: true }).click();
  await expect(provider.locator("body")).toHaveAttribute("data-playing", "true");
  await expect(pilot.getByRole("status")).toHaveCount(0);
  expect(scripts).toBe(1);
  await page.screenshot({ path: testInfo.outputPath("prepared-player.png") });
  await card.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(card).toHaveCount(0);
  await expect(page.locator("body")).toHaveAttribute("data-player-destroyed", "true");
});

test("the prepared player can retry after a provider load failure and still waits for a click", async ({
  page,
}) => {
  let attempts = 0;
  await page.route("https://www.youtube.com/iframe_api", (route) =>
    ++attempts === 1
      ? route.abort()
      : route.fulfill({ contentType: "application/javascript", body: api }),
  );
  await page.route("https://www.youtube-nocookie.com/embed/**", (route) =>
    route.fulfill({ contentType: "text/html", body: playerHtml }),
  );
  await page.goto("/la-maison-1888");
  const pilot = page.locator("[data-youtube-pilot]");
  await pilot.scrollIntoViewIfNeeded();
  await expect(
    pilot.getByRole("link", { name: "Play video · YouTube", exact: true }),
  ).toBeVisible();
  await pilot.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(pilot.locator("iframe")).toHaveAttribute("title", "Resort video");
  await expect(pilot.locator("iframe")).not.toHaveAttribute("data-programmatic-play");
  await expect(pilot.getByRole("link")).toHaveCount(0);
  expect(attempts).toBe(2);
});
