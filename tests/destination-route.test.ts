import { expect, test } from "bun:test";
import { findPublicDestination } from "../src/lib/destination-route";

test("direct URLs expose only the exact active destination, never hidden cards", () => {
  const destinations = [
    { id: "tingara", active: true, name: "Tingara" },
    { id: "suite", active: false, name: "Suite" },
  ];
  expect(findPublicDestination(destinations, "tingara")).toBe(destinations[0]);
  for (const id of ["suite", "unknown", "Tingara", "", "../tingara"]) {
    expect(findPublicDestination(destinations, id)).toBeUndefined();
  }
  expect(findPublicDestination([], "tingara")).toBeUndefined();
});
