import { expect, test } from "bun:test";
import { destinationSlug, findPublicDestination } from "../src/lib/destination-route";

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

test("the auditorium uses its official slug without breaking the old URL", () => {
  const auditorium = { id: "summit-cinema", active: true };
  expect(destinationSlug(auditorium.id)).toBe("summit-auditorium");
  expect(findPublicDestination([auditorium], "summit-auditorium")).toBe(auditorium);
  expect(findPublicDestination([auditorium], "summit-cinema")).toBe(auditorium);
  expect(
    findPublicDestination([{ ...auditorium, active: false }], "summit-auditorium"),
  ).toBeUndefined();
});

test("the Nature card also answers the former guide URL", () => {
  const nature = { id: "nature-experiences", active: true };
  expect(findPublicDestination([nature], "nature-discovery-guide")).toBe(nature);
  expect(
    findPublicDestination([{ ...nature, active: false }], "nature-discovery-guide"),
  ).toBeUndefined();
});
