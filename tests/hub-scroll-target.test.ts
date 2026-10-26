import { afterEach, beforeEach, expect, test } from "bun:test";
import {
  getHubScrollSnapshot,
  scrollToHubSection,
  subscribeHubScrollTarget,
} from "../src/lib/scroll-to-hub-section";

const getHubScrollTarget = () => getHubScrollSnapshot().target;

const originals = ["window", "document"].map(
  (key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const,
);
let events: EventTarget;
let timers: Map<number, () => void>;
let moves: ScrollIntoViewOptions[];
let reduced: boolean;

beforeEach(() => {
  events = new EventTarget();
  timers = new Map();
  moves = [];
  reduced = false;
  let sequence = 0;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
      matchMedia: () => ({ matches: reduced }),
      getComputedStyle: () => ({ scrollMarginTop: "0" }),
      setTimeout: (callback: () => void) => {
        timers.set(++sequence, callback);
        return sequence;
      },
      clearTimeout: (id: number) => {
        timers.delete(id);
      },
    },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      getElementById: (id: string) =>
        id === "missing"
          ? null
          : {
              scrollIntoView: (options: ScrollIntoViewOptions) => moves.push(options),
              getBoundingClientRect: () => ({ top: 0 }),
            },
    },
  });
});
afterEach(() => {
  events.dispatchEvent(new Event("scrollend"));
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

test("jump priority ends on arrival and does not change missing destinations", () => {
  const seen: (string | null)[] = [];
  const unsubscribe = subscribeHubScrollTarget(() => seen.push(getHubScrollTarget()));
  scrollToHubSection("sea");
  expect(getHubScrollTarget()).toBe("sea");
  expect(moves).toEqual([{ behavior: "smooth", block: "start" }]);
  scrollToHubSection("missing");
  expect(getHubScrollTarget()).toBe("sea");
  events.dispatchEvent(new Event("scrollend"));
  expect(getHubScrollTarget()).toBeNull();
  expect(timers.size).toBe(0);
  unsubscribe();
  scrollToHubSection("earth");
  expect(seen).toEqual(["sea", null]);
});

test("a replacement jump cancels the previous timeout; reduced motion remains instant", () => {
  scrollToHubSection("sky");
  reduced = true;
  scrollToHubSection("sea");
  expect(timers.size).toBe(1);
  expect(getHubScrollTarget()).toBe("sea");
  expect(moves.at(-1)?.behavior).toBe("instant");
  // No scrollend is emitted when the selected chapter is already centred.
  Array.from(timers.values())[0]!();
  expect(getHubScrollTarget()).toBeNull();
  expect(timers.size).toBe(0);
});

for (const event of ["wheel", "pointerdown", "touchstart", "keydown"]) {
  test(`manual ${event} returns priority to the visible chapter`, () => {
    scrollToHubSection("sea");
    events.dispatchEvent(new Event(event));
    expect(getHubScrollTarget()).toBeNull();
    expect(timers.size).toBe(0);
  });
}
