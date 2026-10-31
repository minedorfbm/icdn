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
      selector === "[data-atmosphere-effect]" ? [heaven] : [],
  } as unknown as HTMLElement;
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: {} });
  try {
    return { controller: createJourneyAtmosphere(root), heaven };
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
