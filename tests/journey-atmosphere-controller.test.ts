import { expect, test } from "bun:test";
import { createJourneyAtmosphere } from "../src/lib/journey-atmosphere";

function scene() {
  const element = () => {
    const values = new Map<string, string>();
    return {
      dataset: {} as Record<string, string>,
      style: {
        getPropertyValue: (key: string) => values.get(key) ?? "",
        setProperty: (key: string, value: string) => values.set(key, value),
      },
    };
  };
  const clouds = [0, 1].map(() => ({
    ...element(),
    complete: true,
    naturalWidth: 1,
    hasAttribute: () => true,
  }));
  const plants = Array.from({ length: 7 }, element);
  const earth = {
    ...element(),
    dataset: { atmosphereEffect: "earth" },
    querySelectorAll: () => plants,
  };
  const halo = element(),
    rays = element(),
    plate = element(),
    container = element();
  const heaven = {
    ...element(),
    dataset: { atmosphereEffect: "heaven" },
    querySelectorAll: () => clouds,
    querySelector: (selector: string) => (selector === ".atmosphere-halo" ? halo : rays),
  };
  const root = {
    querySelector: (selector: string) => (selector === ".journey-atmosphere" ? plate : container),
    querySelectorAll: (selector: string) =>
      selector === "[data-atmosphere-effect]" ? [heaven, earth] : [],
  } as unknown as HTMLElement;
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: {} });
  try {
    return { controller: createJourneyAtmosphere(root), heaven, earth, plants };
  } finally {
    if (navigatorDescriptor) Object.defineProperty(globalThis, "navigator", navigatorDescriptor);
    else Reflect.deleteProperty(globalThis, "navigator");
  }
}

for (const width of [390, 1440]) {
  test(`Heaven dissolves its last entrance pose, cancels on return and stops its clock at ${width}px`, () => {
    const { controller, heaven } = scene();
    const stations = [{ id: "heaven" as const, top: 1000, height: 900 }];
    const paint = (y: number, now: number) => controller.paint(stations, y, 900, width, now);
    const opacity = () => Number(heaven.style.getPropertyValue("opacity"));
    paint(600, 0);
    paint(1000, 16);
    expect(paint(1040, 32)).toBe(true);
    expect(opacity()).toBe(1);
    expect(paint(1040, 122)).toBe(true);
    expect(opacity()).toBeCloseTo(0.5);
    expect(heaven.style.getPropertyValue("visibility")).toBe("visible");
    expect(paint(1040, 212)).toBe(false);
    expect(opacity()).toBe(0);
    expect(heaven.style.getPropertyValue("visibility")).toBe("hidden");
    expect(paint(1040, 228)).toBe(false);
    paint(980, 244);
    paint(1040, 260);
    paint(1040, 350);
    expect(opacity()).toBeCloseTo(0.5);
    // Reversing during the fade restores the current entry rather than hiding it later.
    expect(paint(980, 366)).toBe(false);
    expect(opacity()).toBe(1);
    expect(heaven.style.getPropertyValue("visibility")).toBe("visible");
    controller.hide();
    expect(opacity()).toBe(0);
    expect(heaven.style.getPropertyValue("visibility")).toBe("hidden");
  });
}

test("mobile Earth returns from a completed entrance without an opacity pop", () => {
  const { controller, earth, plants } = scene();
  const stations = [
    { id: "heaven" as const, top: 1000, height: 900 },
    { id: "earth" as const, top: 3000, height: 900 },
  ];
  const paint = (y: number, now: number) => controller.paint(stations, y, 844, 390, now);
  const opacity = () => Number(plants[0]!.style.getPropertyValue("opacity"));
  paint(2900, 0);
  paint(3000, 16);
  for (let now = 32; now <= 1600; now += 16) paint(3000, now);
  expect(earth.style.getPropertyValue("visibility")).toBe("hidden");
  paint(2988, 1616);
  const first = opacity();
  expect(earth.style.getPropertyValue("visibility")).toBe("visible");
  for (let now = 1632; now <= 2600; now += 16) paint(2988, now);
  expect(first).toBeGreaterThan(0);
  expect(first).toBeLessThan(opacity() * 0.5);
  expect(opacity()).toBeGreaterThan(0.3);
  expect(paint(2988, 2616)).toBe(false);
});

test("Earth dissolves local exits, reverses continuously and stops offscreen", () => {
  const { controller, earth, plants } = scene();
  const stations = [
    { id: "heaven" as const, top: 1000, height: 900 },
    { id: "earth" as const, top: 3000, height: 900 },
    { id: "sea" as const, top: 3900, height: 900 },
  ];
  const paint = (y: number, now: number) => controller.paint(stations, y, 844, 390, now);
  const opacity = () => Number(plants[0]!.style.getPropertyValue("opacity"));
  paint(2980, 0);
  for (let now = 16; now < 800; now += 16) paint(2980, now);
  const before = opacity();
  // Cross the back edge of the entrance window without a distant navigation.
  expect(paint(3190, 800)).toBe(true);
  expect(earth.style.getPropertyValue("visibility")).toBe("visible");
  expect(opacity()).toBeGreaterThan(before * 0.5);
  expect(opacity()).toBeLessThan(before);
  const fading = opacity();
  paint(2980, 816);
  expect(opacity()).toBeGreaterThan(fading);
  expect(opacity()).toBeLessThan(before);
  paint(3190, 832);
  for (let now = 848; now < 2000; now += 16) paint(3190, now);
  expect(earth.style.getPropertyValue("visibility")).toBe("hidden");
  expect(paint(3190, 2016)).toBe(false);
  paint(2980, 2032);
  paint(4800, 2048);
  expect(earth.style.getPropertyValue("visibility")).toBe("hidden");
});
