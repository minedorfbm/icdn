import { fromCrossJSON, toCrossJSON } from "seroval";
import { expect, test, type Page, type Locator } from "./fixtures";

// Mock only provider documents/APIs. All focus transitions, dialogs, coordinator,
// native iframe creation, pause commands and Instagram remounts are production code.
const playerApi = `
window.YT = { Player: class {
  constructor(frame, options) {
    this.frame = frame;
    this.listener = event => {
      if (event.origin !== 'https://www.youtube-nocookie.com' || event.source !== frame.contentWindow) return;
      if (event.data?.event === 'test-state') options.events.onStateChange?.({ data: event.data.state });
    };
    window.addEventListener('message', this.listener);
    frame.dataset.controlReady = 'true';
    setTimeout(() => options.events.onReady?.({ target: this }), 0);
  }
  pauseVideo() { this.frame.contentWindow.postMessage('pause', 'https://www.youtube-nocookie.com'); }
  destroy() { window.removeEventListener('message', this.listener); this.frame.remove(); }
}};
window.onYouTubeIframeAPIReady();`;

const youtubeHtml = `<!doctype html><html><body data-playing="false" data-position="0">
<button onclick="play()">YouTube Play</button>
<script>
document.body.dataset.instance = crypto.randomUUID();
function play() {
 document.body.dataset.playing = 'true'; document.body.dataset.position = '42';
 parent.postMessage({event:'test-state',state:1}, 'http://127.0.0.1:4173');
}
addEventListener('message', event => {
 if(event.source === parent && event.origin === 'http://127.0.0.1:4173' && event.data === 'pause') {
  document.body.dataset.playing = 'false';
  parent.postMessage({event:'test-state',state:2}, event.origin);
 }
});
</script></body></html>`;

const instagramScript = `window.instgrm = { Embeds: { process() {
 document.querySelectorAll('blockquote.instagram-media').forEach(post => {
  const url = new URL(post.dataset.instgrmPermalink);
  const frame = document.createElement('iframe');
  frame.src = url.origin + url.pathname + 'embed/captioned/';
  frame.title = 'Instagram ' + url.pathname.split('/')[2];
  frame.style.cssText = 'height:500px;width:326px;border:0';
  post.replaceWith(frame);
 });
}}};`;
const instagramHtml = `<!doctype html><html><body data-playing="false">
<button onclick="document.body.dataset.playing='true'">Instagram Play</button>
<script>document.body.dataset.instance = crypto.randomUUID();</script>
</body></html>`;

async function preparePlayers(page: Page, apiAvailable = true) {
  await page.route("https://www.youtube.com/iframe_api", (route) =>
    apiAvailable
      ? route.fulfill({ contentType: "application/javascript", body: playerApi })
      : route.abort(),
  );
  await page.route("https://www.youtube-nocookie.com/embed/**", (route) =>
    route.fulfill({ contentType: "text/html", body: youtubeHtml }),
  );
  await page.route("https://www.instagram.com/embed.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: instagramScript }),
  );
  await page.route("https://www.instagram.com/p/*/embed/**", (route) =>
    route.fulfill({ contentType: "text/html", body: instagramHtml }),
  );
  await page.route("**/_serverFn/**", async (route) => {
    const response = await route.fetch();
    if (!response.headers()["server-timing"]?.includes("media;")) {
      await route.fulfill({ response });
      return;
    }
    const envelope = fromCrossJSON(await response.json(), {}) as {
      result: { posts: unknown[] };
    };
    envelope.result.posts = ["TESTPOST", "SECONDPOST"].map((code, display_order) => ({
      destination_id: "citron",
      post_url: `https://www.instagram.com/p/${code}/`,
      account: "intercontinentaldanang",
      caption: null,
      image_url: null,
      posted_at: null,
      display_order,
    }));
    await route.fulfill({ response, body: JSON.stringify(toCrossJSON(envelope)) });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/citron");
  return page.getByRole("dialog", { name: "Citron", exact: true });
}

for (const mobile of [true, false]) {
  test.describe(mobile ? "touch media handoff" : "desktop media handoff", () => {
    test.use({
      isMobile: mobile,
      hasTouch: mobile,
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    });
    const activate = (locator: Locator) => (mobile ? locator.tap() : locator.click());

    test("only the activated video plays across YouTube and Instagram in both directions", async ({
      page,
    }) => {
      const card = await preparePlayers(page);
      const players = card.locator("[data-youtube-player]");
      await players.first().scrollIntoViewIfNeeded();
      const firstFrame = players.first().locator("iframe");
      await expect(firstFrame).toHaveAttribute("data-control-ready", "true");
      const first = page.frameLocator('iframe[title="Test video"]');
      await activate(first.getByRole("button", { name: "YouTube Play" }));
      await expect(first.locator("body")).toHaveAttribute("data-playing", "true");
      const firstInstance = await first.locator("body").getAttribute("data-instance");

      // Merely loading another player must not interrupt the active one.
      await players.nth(1).scrollIntoViewIfNeeded();
      const second = page.frameLocator('iframe[title="Carousel video 2"]');
      await expect(players.nth(1).locator("iframe")).toHaveAttribute("data-control-ready", "true");
      await expect(first.locator("body")).toHaveAttribute("data-playing", "true");
      await activate(second.getByRole("button", { name: "YouTube Play" }));
      await expect(second.locator("body")).toHaveAttribute("data-playing", "true");
      await expect(first.locator("body")).toHaveAttribute("data-playing", "false");
      await expect(first.locator("body")).toHaveAttribute("data-position", "42");
      await expect(first.locator("body")).toHaveAttribute("data-instance", firstInstance!);

      const posts = card.locator(".instagram-post");
      await posts.first().scrollIntoViewIfNeeded();
      const instagram = page.frameLocator('iframe[title="Instagram TESTPOST"]');
      await expect(instagram.getByRole("button", { name: "Instagram Play" })).toBeVisible();
      await expect(second.locator("body")).toHaveAttribute("data-playing", "true");
      await activate(instagram.getByRole("button", { name: "Instagram Play" }));
      await expect(instagram.locator("body")).toHaveAttribute("data-playing", "true");
      await expect(second.locator("body")).toHaveAttribute("data-playing", "false");
      const instagramInstance = await instagram.locator("body").getAttribute("data-instance");

      await players.first().scrollIntoViewIfNeeded();
      await activate(first.getByRole("button", { name: "YouTube Play" }));
      await expect(first.locator("body")).toHaveAttribute("data-playing", "true");
      await expect(instagram.locator("body")).not.toHaveAttribute(
        "data-instance",
        instagramInstance!,
      );
      await expect(instagram.locator("body")).toHaveAttribute("data-playing", "false");

      await posts.first().scrollIntoViewIfNeeded();
      await activate(instagram.getByRole("button", { name: "Instagram Play" }));
      await expect(first.locator("body")).toHaveAttribute("data-playing", "false");
      const activePost = await instagram.locator("body").getAttribute("data-instance");
      await activate(
        card
          .locator("[data-instagram-pagination]")
          .getByRole("button", { name: "2 / 2", exact: true }),
      );
      const otherInstagram = page.frameLocator('iframe[title="Instagram SECONDPOST"]');
      await activate(otherInstagram.getByRole("button", { name: "Instagram Play" }));
      await expect(otherInstagram.locator("body")).toHaveAttribute("data-playing", "true");
      await expect(instagram.locator("body")).not.toHaveAttribute("data-instance", activePost!);
      await expect(instagram.locator("body")).toHaveAttribute("data-playing", "false");
    });

    test("opening a PDF pauses media immediately and closing it never resumes playback", async ({
      page,
    }) => {
      const card = await preparePlayers(page);
      await page.route("**/api/resort-pdf?*", (route) =>
        route.fulfill({ status: 503, body: "offline" }),
      );
      const players = card.locator("[data-youtube-player]");
      await players.first().scrollIntoViewIfNeeded();
      await expect(players.first().locator("iframe")).toHaveAttribute("data-control-ready", "true");
      const youtube = page.frameLocator('iframe[title="Test video"]');
      await activate(youtube.getByRole("button", { name: "YouTube Play" }));
      await expect(youtube.locator("body")).toHaveAttribute("data-playing", "true");
      const menu = card.getByRole("link", { name: "Test menu", exact: true });
      await activate(menu);
      const viewer = page.getByRole("dialog", { name: /Test menu/ });
      await expect(viewer).toBeVisible();
      await expect(youtube.locator("body")).toHaveAttribute("data-playing", "false");
      await expect(youtube.locator("body")).toHaveAttribute("data-position", "42");
      // A late provider play notification must not restart audio behind the PDF.
      await youtube
        .getByRole("button", { name: "YouTube Play" })
        .evaluate((button) => button.click());
      await expect(youtube.locator("body")).toHaveAttribute("data-playing", "false");
      await activate(viewer.getByRole("button", { name: "Close", exact: true }));
      await expect(viewer).toHaveCount(0);
      await expect(youtube.locator("body")).toHaveAttribute("data-playing", "false");
      await players.first().scrollIntoViewIfNeeded();
      await activate(youtube.getByRole("button", { name: "YouTube Play" }));
      await expect(youtube.locator("body")).toHaveAttribute("data-playing", "true");

      const post = card.locator(".instagram-post").first();
      await post.scrollIntoViewIfNeeded();
      const instagram = page.frameLocator('iframe[title="Instagram TESTPOST"]');
      await activate(instagram.getByRole("button", { name: "Instagram Play" }));
      const instance = await instagram.locator("body").getAttribute("data-instance");
      await activate(menu);
      await expect(viewer).toBeVisible();
      await expect(card.locator(".instagram-post iframe")).toHaveCount(0);
      await activate(viewer.getByRole("button", { name: "Close", exact: true }));
      await expect(instagram.locator("body")).not.toHaveAttribute("data-instance", instance!);
      await expect(instagram.locator("body")).toHaveAttribute("data-playing", "false");
    });
  });
}

test("a native YouTube video still stops for a PDF when its control API is unavailable", async ({
  page,
}) => {
  const card = await preparePlayers(page, false);
  await page.route("**/api/resort-pdf?*", (route) =>
    route.fulfill({ status: 503, body: "offline" }),
  );
  await card.locator("[data-youtube-player]").first().scrollIntoViewIfNeeded();
  const youtube = page.frameLocator('iframe[title="Test video"]');
  await youtube.getByRole("button", { name: "YouTube Play" }).click();
  await expect(youtube.locator("body")).toHaveAttribute("data-playing", "true");
  const instance = await youtube.locator("body").getAttribute("data-instance");
  await card.getByRole("link", { name: "Test menu", exact: true }).click();
  await expect(page.getByRole("dialog", { name: /Test menu/ })).toBeVisible();
  await expect(youtube.locator("body")).not.toHaveAttribute("data-instance", instance!);
  await expect(youtube.locator("body")).toHaveAttribute("data-playing", "false");
});

test("the shared frame observer is removed when leaving the expanded card", async ({ page }) => {
  await page.addInitScript(() => {
    const active = new Set<number>();
    const originalSet = window.setInterval.bind(window);
    const originalClear = window.clearInterval.bind(window);
    window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      const id = originalSet(handler, timeout, ...args);
      active.add(id);
      return id;
    }) as typeof window.setInterval;
    window.clearInterval = (id) => {
      if (id !== undefined) active.delete(id);
      originalClear(id);
    };
    (window as Window & { activeMediaIntervals?: () => number }).activeMediaIntervals = () =>
      active.size;
  });
  const activeIntervals = () =>
    page.evaluate(() =>
      (window as Window & { activeMediaIntervals?: () => number }).activeMediaIntervals?.(),
    );
  const card = await preparePlayers(page);
  expect(await activeIntervals()).toBe(0);
  await card.locator("[data-youtube-player]").first().scrollIntoViewIfNeeded();
  await expect.poll(activeIntervals).toBe(1);
  await card.locator(".instagram-post").first().scrollIntoViewIfNeeded();
  await expect(card.locator(".instagram-post iframe").first()).toBeVisible();
  expect(await activeIntervals()).toBe(1);
  await card.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(card).toHaveCount(0);
  await expect.poll(activeIntervals).toBe(0);
});
