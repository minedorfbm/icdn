import { afterEach, expect, test } from "bun:test";
import { deferGoogleAnalytics } from "../src/lib/defer-google-analytics";

function photo(
  options: {
    lazy?: boolean;
    pending?: boolean;
    hidden?: boolean;
    offscreen?: boolean;
    source?: boolean;
    broken?: boolean;
  } = {},
) {
  return {
    currentSrc: options.source === false ? "" : "/photo.avif",
    loading: options.lazy ? "lazy" : "eager",
    complete: !options.pending,
    getAttribute: () => (options.source === false ? null : "/photo.avif"),
    parentElement: { querySelector: () => null },
    getBoundingClientRect: () => ({
      width: options.hidden ? 0 : 100,
      height: 100,
      top: options.offscreen ? 2000 : 0,
      bottom: options.offscreen ? 2100 : 100,
      left: 0,
      right: 100,
    }),
    decode: () => (options.broken ? Promise.reject(new Error("Invalid image")) : Promise.resolve()),
  };
}
function browser() {
  let id = 0;
  const timers = new Map<number, () => void>();
  const frames = new Map<number, () => void>();
  const idles = new Map<number, () => void>();
  const events = new Map<string, () => void>();
  const scripts: Record<string, unknown>[] = [];
  let changed = () => {};
  const window = {
    __adjGoogleTag: true,
    innerHeight: 844,
    innerWidth: 390,
    setTimeout: (run: () => void) => {
      timers.set(++id, run);
      return id;
    },
    clearTimeout: (key: number) => timers.delete(key),
    requestAnimationFrame: (run: () => void) => {
      frames.set(++id, run);
      return id;
    },
    cancelAnimationFrame: (key: number) => frames.delete(key),
    requestIdleCallback: (run: () => void) => {
      idles.set(++id, run);
      return id;
    },
    cancelIdleCallback: (key: number) => idles.delete(key),
    addEventListener: (event: string, run: () => void) => events.set("window:" + event, run),
    removeEventListener: (event: string) => events.delete("window:" + event),
  };
  let journey = true;
  const document = {
    images: [photo()],
    body: {},
    readyState: "complete",
    visibilityState: "visible",
    getElementById: (key: string) => scripts.find((script) => script["id"] === key),
    querySelector: () => (journey ? {} : null),
    createElement: () => ({}),
    head: { appendChild: (script: Record<string, unknown>) => scripts.push(script) },
    addEventListener: (event: string, run: () => void) => events.set(event, run),
    removeEventListener: (event: string) => events.delete(event),
  };
  class Observer {
    constructor(run: () => void) {
      changed = run;
    }
    observe() {}
    disconnect() {
      changed = () => {};
    }
  }
  for (const [name, value] of Object.entries({ window, document, MutationObserver: Observer })) {
    Object.defineProperty(globalThis, name, { configurable: true, value });
  }
  const flush = (queue: Map<number, () => void>) => {
    const calls = [...queue.values()];
    queue.clear();
    calls.forEach((run) => run());
  };
  async function quiet() {
    flush(timers);
    // Let decode()/allSettled settle before the paint and idle stages.
    for (let i = 0; i < 4; i++) await Promise.resolve();
    flush(frames);
    flush(idles);
  }
  return {
    window,
    document,
    scripts,
    timers,
    frames,
    idles,
    events,
    quiet,
    change: () => changed(),
    journey: (value: boolean) => {
      journey = value;
    },
  };
}

afterEach(() => {
  for (const name of ["window", "document", "MutationObserver"])
    Reflect.deleteProperty(globalThis, name);
});

test("Google waits for journey content and pending card photos, then loads once at low priority", async () => {
  const b = browser();
  b.journey(false);
  b.document.images[0]!.complete = false;
  deferGoogleAnalytics(true);
  await b.quiet();
  expect(b.scripts).toHaveLength(0);
  b.journey(true);
  b.change();
  await b.quiet();
  expect(b.scripts).toHaveLength(0);
  b.document.images[0]!.complete = true;
  b.events.get("load")!();
  await b.quiet();
  expect(b.scripts).toEqual([
    {
      id: "adj-google-analytics",
      async: true,
      fetchPriority: "low",
      src: "https://www.googletagmanager.com/gtag/js?id=G-8R7L6LCJVX",
    },
  ]);
  expect(b.events.size).toBe(0);
  deferGoogleAnalytics(true);
  await b.quiet();
  expect(b.scripts).toHaveLength(1);
});

test("a route change or interaction invalidates an older decode and cancels queued work", async () => {
  const b = browser();
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  b.document.images[0]!.decode = () => pending;
  const dispose = deferGoogleAnalytics(false);
  await b.quiet();
  expect(b.scripts).toHaveLength(0);
  b.events.get("pointerdown")!();
  release();
  for (let i = 0; i < 4; i++) await Promise.resolve();
  expect(b.frames.size).toBe(0);
  dispose();
  await b.quiet();
  expect(b.scripts).toHaveLength(0);
  expect(b.events.size).toBe(0);
});

test("offscreen lazy, hidden, source-free and failed photos cannot hold the tag forever", async () => {
  const b = browser();
  b.document.images = [
    photo({ lazy: true, offscreen: true, pending: true }),
    photo({ hidden: true, pending: true }),
    photo({ source: false, pending: true }),
    photo({ broken: true }),
  ];
  Reflect.deleteProperty(b.window, "requestIdleCallback");
  deferGoogleAnalytics(false);
  await b.quiet();
  expect(b.scripts).toHaveLength(1);
});

test("eager photos, page load and background-tab waits remain ahead of Analytics", async () => {
  const b = browser();
  b.document.readyState = "loading";
  deferGoogleAnalytics(false);
  await b.quiet();
  expect(b.scripts).toHaveLength(0);
  b.document.readyState = "complete";
  b.document.visibilityState = "hidden";
  b.events.get("window:load")!();
  await b.quiet();
  expect(b.scripts).toHaveLength(0);
  b.document.visibilityState = "visible";
  b.document.images = [photo({ offscreen: true, pending: true })];
  b.events.get("visibilitychange")!();
  await b.quiet();
  expect(b.scripts).toHaveLength(0);
  b.document.images[0]!.complete = true;
  b.events.get("error")!();
  await b.quiet();
  expect(b.scripts).toHaveLength(1);
});

test("preview visits install no observer or task, and idle work is cancelled on departure", async () => {
  const b = browser();
  b.window.__adjGoogleTag = false;
  deferGoogleAnalytics(false);
  expect(b.timers.size).toBe(0);
  b.window.__adjGoogleTag = true;
  const dispose = deferGoogleAnalytics(false);
  // Let decode finish while keeping the next paint/idle callbacks pending.
  const timer = [...b.timers.values()][0]!;
  b.timers.clear();
  timer();
  for (let i = 0; i < 4; i++) await Promise.resolve();
  const frame = [...b.frames.values()][0]!;
  b.frames.clear();
  frame();
  expect(b.idles.size).toBe(1);
  dispose();
  expect(b.idles.size).toBe(0);
  await b.quiet();
  expect(b.scripts).toHaveLength(0);
});
