import { afterEach, beforeEach, expect, test } from "bun:test";
import { afterDetailHero } from "../src/lib/after-detail-hero";

const originals = ["window", "document"].map(
  (key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const,
);
let events: EventTarget;
let timers: Map<number, () => void>;
let calls: number;
let photo: HTMLImageElement;

beforeEach(() => {
  events = new EventTarget();
  timers = new Map();
  calls = 0;
  photo = Object.assign(new EventTarget(), { complete: false }) as HTMLImageElement;
  Object.defineProperty(globalThis, "document", { configurable: true, value: events });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      setTimeout: (callback: () => void, delay: number) => {
        expect(delay).toBe(3000);
        timers.set(1, callback);
        return 1;
      },
      clearTimeout: (id: number) => timers.delete(id),
    },
  });
});
afterEach(() => {
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

test("cached photos and pages without a detail hero read immediately", () => {
  afterDetailHero(null, () => calls++)();
  Object.assign(photo, { complete: true });
  afterDetailHero(photo, () => calls++)();
  expect(calls).toBe(2);
  expect(timers.size).toBe(0);
});

for (const event of ["load", "error", "pointerdown", "keydown", "touchstart", "wheel"]) {
  test(`${event} releases the catalogue once and removes the timer`, () => {
    const cancel = afterDetailHero(photo, () => calls++);
    expect(calls).toBe(0);
    const target = event === "load" || event === "error" ? photo : events;
    target.dispatchEvent(new Event(event));
    target.dispatchEvent(new Event(event));
    photo.dispatchEvent(new Event("load"));
    expect(calls).toBe(1);
    expect(timers.size).toBe(0);
    cancel();
  });
}

test("a stalled image cannot indefinitely block the catalogue", () => {
  afterDetailHero(photo, () => calls++);
  const release = timers.get(1)!;
  release();
  release();
  expect(calls).toBe(1);
  expect(timers.size).toBe(0);
});

test("leaving the card cancels pending background work", () => {
  const cancel = afterDetailHero(photo, () => calls++);
  const release = timers.get(1)!;
  cancel();
  photo.dispatchEvent(new Event("load"));
  events.dispatchEvent(new Event("pointerdown"));
  release();
  expect(calls).toBe(0);
  expect(timers.size).toBe(0);
});
