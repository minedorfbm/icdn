import { describe, expect, test } from "bun:test";
import {
  readDiscovery,
  restoreDiscovery,
  shuffledIds,
} from "../src/features/discovery/surprise-order";
import { discoveryCopy, type DiscoveryCopyKey } from "../src/features/discovery/discovery-copy";
import { destination } from "./fixtures/destination";
import { type Destination } from "../src/data/resort";
import { LANGUAGES } from "../src/i18n/dictionary";

const cards: Destination[] = ["a", "b", "c"].map((id) => ({
  ...destination,
  id,
  active: true,
}));
describe("Surprise discovery", () => {
  test("each published card appears exactly once, while hidden cards never enter the deck", () => {
    const input = [...cards, cards[0]!, { ...cards[0]!, id: "hidden", active: false }];
    const order = shuffledIds(input, () => 0);
    expect(order).toEqual(["b", "c", "a"]);
    expect(new Set(order).size).toBe(3);
    expect(input[0]?.id).toBe("a");
  });
  test("returning to the visit keeps previous and next cards while adopting publication changes", () => {
    const saved = readDiscovery(
      JSON.stringify({ order: ["c", "a", "b", "removed"], currentId: "a" }),
    );
    const live = [
      cards[0]!,
      { ...cards[1]!, active: false },
      cards[2]!,
      { ...cards[0]!, id: "new" },
    ];
    const restored = restoreDiscovery(saved, live, () => 0);
    expect(restored.order).toEqual(["c", "a", "new"]);
    expect(restored.index).toBe(1);
    expect(restored.order[restored.index - 1]).toBe("c");
    expect(restored.order[restored.index + 1]).toBe("new");
  });
  test("bad session data and an empty catalogue do not revive old cards", () => {
    for (const raw of [null, "invalid", "null", "[]", '{"order":[42]}'])
      expect(readDiscovery(raw)).toBeNull();
    expect(restoreDiscovery({ order: ["a"], currentId: "a" }, [])).toEqual({ order: [], index: 0 });
    expect(restoreDiscovery({ order: ["removed"], currentId: "removed" }, [cards[0]!])).toEqual({
      order: ["a"],
      index: 0,
    });
  });
  test("all supported languages cover discovery choices and controls", () => {
    const keys: DiscoveryCopyKey[] = [
      "kicker",
      "title",
      "journey",
      "journeyNote",
      "map",
      "mapNote",
      "surprise",
      "surpriseNote",
      "hint",
      "previous",
      "next",
      "again",
      "empty",
    ];
    for (const { code } of LANGUAGES)
      for (const key of keys) expect(discoveryCopy(code, key).trim().length).toBeGreaterThan(0);
  });
});
