import { expect, test } from "./fixtures";

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

test("an unavailable YouTube API shows the original link and can retry inside the dialog", async ({
  page,
}) => {
  let downloads = 0;
  await page.route("https://www.youtube.com/iframe_api", (route) => {
    downloads++;
    return downloads === 1
      ? route.abort()
      : route.fulfill({ contentType: "application/javascript", body: api });
  });
  await page.route("https://www.youtube-nocookie.com/embed/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<p>Official film player</p>" }),
  );
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
  await dialog.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(dialog.locator("iframe")).toHaveAttribute("data-playing", "true");
  await expect(dialog.getByRole("link", { name: "Play video", exact: true })).toHaveCount(0);
  expect(downloads).toBe(2);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toHaveCount(0);
});

const delayedApi = api
  .replace(
    "setTimeout(() => options.events.onReady({ target: this }), 0);",
    `const attempt = window.filmAttempts = (window.filmAttempts || 0) + 1;
  this.frame.dataset.attempt = String(attempt);
  this.ready = event => {
    if (event.source === this.frame.contentWindow && event.data === 'film-ready') {
      options.events.onReady({ target: this });
    }
    if (event.source === this.frame.contentWindow && event.data === 'film-autoplay-blocked') {
      options.events.onAutoplayBlocked();
    }
  };
  window.addEventListener('message', this.ready);
  if (attempt > 1) setTimeout(() => options.events.onReady({ target: this }), 0);`,
  )
  .replace("destroy() {", "destroy() { window.removeEventListener('message', this.ready);");

for (const recovery of ["late response", "autoplay blocked", "retry"] as const) {
  test(`a stalled Michelin player recovers after ${recovery} without leaving a blocking fallback`, async ({
    page,
  }) => {
    let downloads = 0;
    await page.clock.install();
    await page.route("https://www.youtube.com/iframe_api", (route) => {
      downloads++;
      return route.fulfill({ contentType: "application/javascript", body: delayedApi });
    });
    await page.route("https://www.youtube-nocookie.com/embed/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<button onclick="parent.postMessage('film-ready','*')">Deliver ready</button><button onclick="parent.postMessage('film-autoplay-blocked','*')">Block autoplay</button>`,
      }),
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Play video: One MICHELIN Key", exact: true }).click();
    const dialog = page.getByRole("dialog", {
      name: "One MICHELIN Key — InterContinental Danang",
      exact: true,
    });
    await expect(dialog.locator("iframe")).toHaveAttribute("data-attempt", "1");
    await page.clock.fastForward(21_000);
    const fallback = dialog.getByRole("link", { name: "Play video", exact: true });
    await expect(fallback).toBeVisible();
    if (recovery === "late response") {
      // Deliver the provider's ready event even while the fallback covers the player.
      await page
        .frameLocator("iframe")
        .getByRole("button", { name: "Deliver ready" })
        .dispatchEvent("click");
    } else if (recovery === "autoplay blocked") {
      await page
        .frameLocator("iframe")
        .getByRole("button", { name: "Block autoplay" })
        .dispatchEvent("click");
      await expect(fallback).toHaveCount(0);
      await expect(dialog.getByRole("status")).toHaveCount(0);
      await page.frameLocator("iframe").getByRole("button", { name: "Deliver ready" }).click();
    } else {
      await dialog.getByRole("button", { name: "Try again", exact: true }).click();
    }
    const frame = dialog.locator("iframe");
    await expect(frame).toHaveAttribute("data-playing", "true");
    await expect(frame).toHaveAttribute("data-attempt", recovery === "retry" ? "2" : "1");
    await expect(frame).toHaveCount(1);
    await expect(fallback).toHaveCount(0);
    await expect(dialog.getByRole("status")).toHaveCount(0);
    expect(downloads).toBe(1);
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });
}
