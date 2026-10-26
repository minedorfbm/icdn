import { afterEach, expect, test } from "bun:test";
import { loadYouTubePlayer } from "../src/lib/youtube-player";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
afterEach(() => {
  for (const [key, descriptor] of [
    ["window", originalWindow],
    ["document", originalDocument],
  ] as const) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

test("loads once for simultaneous opens and retries after a network failure", async () => {
  const scripts: Array<{
    src: string;
    async: boolean;
    onerror: (() => void) | null;
    remove(): void;
  }> = [];
  const browser: { YT?: { Player: typeof Player }; onYouTubeIframeAPIReady?: () => void } = {};
  class Player {
    destroy() {}
  }
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { ...browser, setTimeout, clearTimeout },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: () => ({ src: "", async: false, onerror: null, remove() {} }),
      head: { append: (script: (typeof scripts)[number]) => scripts.push(script) },
    },
  });
  const first = loadYouTubePlayer();
  expect(loadYouTubePlayer()).toBe(first);
  expect(scripts).toHaveLength(1);
  expect(scripts[0]!.src).toBe("https://www.youtube.com/iframe_api");
  scripts[0]!.onerror!();
  await expect(first).rejects.toThrow("YouTube player unavailable");
  const retry = loadYouTubePlayer();
  expect(scripts).toHaveLength(2);
  const current = window as unknown as typeof browser;
  current.YT = { Player };
  current.onYouTubeIframeAPIReady!();
  expect(await retry).toBe(Player);
  expect(current.onYouTubeIframeAPIReady).toBeUndefined();
  expect(await loadYouTubePlayer()).toBe(Player);
  expect(scripts).toHaveLength(2);
});
