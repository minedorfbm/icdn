import { afterAll, afterEach, expect, spyOn, test } from "bun:test";
import { createHubValue } from "../src/data/hub-value";
import { completeCatalogue } from "../src/lib/hub-data-completeness";
import { readPublicDestinationCard } from "../src/lib/public-destination-card.server";
import {
  cardHubData,
  focusDestinationCard,
  type DestinationCardData,
} from "../src/lib/destination-card";
const originalUrl = process.env["SUPABASE_URL"],
  originalKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
const fetchSpy = spyOn(globalThis, "fetch");
const card: DestinationCardData = {
  destination: {
    id: "citron",
    name: "Citron",
    level_id: "heaven",
    cluster: "DINING",
    type: "restaurant",
    short_description: "Above the bay",
    image_key: "citron.webp",
    display_order: 0,
    active: true,
  },
  links: [],
  events: [],
  mapPlaces: [],
  mapLinks: [],
  linkTranslations: [],
  editorial: { descriptions: [], events: [] },
};
const hour = {
  id: "breakfast",
  destination_id: "citron",
  service: "breakfast" as const,
  days: [1, 2, 3, 4, 5, 6, 7],
  opens_minutes: 390,
  closes_minutes: 630,
  last_order_minutes: null,
  display_order: 0,
};
afterAll(() => fetchSpy.mockRestore());
afterEach(() => {
  fetchSpy.mockReset();
  if (originalUrl === undefined) delete process.env["SUPABASE_URL"];
  else process.env["SUPABASE_URL"] = originalUrl;
  if (originalKey === undefined) delete process.env["SUPABASE_PUBLISHABLE_KEY"];
  else process.env["SUPABASE_PUBLISHABLE_KEY"] = originalKey;
});
function configure() {
  process.env["SUPABASE_URL"] = "https://test.supabase.co";
  process.env["SUPABASE_PUBLISHABLE_KEY"] = "sb_publishable_test";
}
test("the first card uses one anonymous GET and its focused payload never claims to be a complete catalogue", async () => {
  configure();
  fetchSpy.mockResolvedValue(Response.json(card));
  expect(
    await readPublicDestinationCard("citron", async () => {
      throw Error("unexpected");
    }),
  ).toEqual(card);
  const [input, init] = fetchSpy.mock.calls[0]!;
  const url = new URL(String(input));
  expect(url.pathname).toBe("/rest/v1/rpc/published_hub_destination_card_v1");
  expect(url.searchParams.get("requested_destination_id")).toBe("citron");
  expect(init?.method).toBe("GET");
  expect(init?.signal).toBeInstanceOf(AbortSignal);
  expect(new Headers(init?.headers).get("apikey")).toBe("sb_publishable_test");
  expect(new Headers(init?.headers).has("authorization")).toBe(false);
  expect(completeCatalogue(cardHubData(card))).toBe(false);
  expect(focusDestinationCard(cardHubData(card), "citron")).toEqual(card);
  expect(focusDestinationCard(cardHubData(card), "unknown")).toBeNull();
});
function fullCatalogue() {
  const { scope: _scope, ...data } = cardHubData(card);
  return data;
}
test("an unpublished card returns null without reading a catalogue", async () => {
  configure();
  fetchSpy.mockResolvedValue(Response.json(null));
  expect(
    await readPublicDestinationCard("citron", async () => {
      throw Error("unexpected");
    }),
  ).toBeNull();
  expect(fetchSpy).toHaveBeenCalledTimes(1);
});
test("a missing card function reads a fresh catalogue instead of resetting a cached snapshot's deadline", async () => {
  configure();
  const missing = () => Response.json({ code: "PGRST202" }, { status: 404 });
  let compatibility = 0;
  const legacy = async () => {
    throw Error("unexpected legacy tables");
  };
  fetchSpy.mockResolvedValueOnce(missing()).mockResolvedValueOnce(Response.json(fullCatalogue()));
  expect(await readPublicDestinationCard("citron", legacy, () => compatibility++)).toEqual(card);
  // Even after an earlier successful compatibility read, publication is read fresh.
  const unpublished = fullCatalogue();
  unpublished.destinations = [{ ...card.destination, active: false }];
  fetchSpy.mockResolvedValueOnce(missing()).mockResolvedValueOnce(Response.json(unpublished));
  expect(await readPublicDestinationCard("citron", legacy)).toBeNull();
  expect(compatibility).toBe(1);
  expect(fetchSpy.mock.calls.map(([url]) => new URL(String(url)).pathname)).toEqual([
    "/rest/v1/rpc/published_hub_destination_card_v1",
    "/rest/v1/rpc/published_hub_catalogue_v1",
    "/rest/v1/rpc/published_hub_destination_card_v1",
    "/rest/v1/rpc/published_hub_catalogue_v1",
  ]);
});
test("only two absent functions reach the fresh legacy table reader, and partial data cannot become a card", async () => {
  configure();
  fetchSpy.mockImplementation(async () => Response.json({ code: "PGRST202" }, { status: 404 }));
  expect(await readPublicDestinationCard("citron", async () => fullCatalogue())).toEqual(card);
  await expect(
    readPublicDestinationCard("citron", async () => ({ ...fullCatalogue(), links: null })),
  ).rejects.toThrow("Card temporarily unavailable");
});

test.each([
  { body: { code: "42501" }, status: 403 },
  { body: { code: "57014" }, status: 504 },
  { body: { code: "PGRST000" }, status: 503 },
  { body: [], status: 200 },
  { body: { ...card, links: null }, status: 200 },
  { body: { ...card, hours: [{ ...hour, destination_id: "other" }] }, status: 200 },
  { body: { ...card, hours: null }, status: 200 },
  { body: { ...card, destination: { ...card.destination, active: false } }, status: 200 },
  { body: { ...card, destination: { ...card.destination, id: "other" } }, status: 200 },
  {
    body: {
      ...card,
      editorial: {
        ...card.editorial,
        descriptions: [
          { destination_id: "other", locale: "fr", description: "x", source_description: "x" },
        ],
      },
    },
    status: 200,
  },
  {
    body: {
      ...card,
      linkTranslations: [{ link_id: "foreign", locale: "fr", url: "x", source_url: "x" }],
    },
    status: 200,
  },
])(
  "outage or foreign/private content fails closed without a catalogue fallback: %j",
  async ({ body, status }) => {
    configure();
    fetchSpy.mockResolvedValue(Response.json(body, { status }));
    await expect(
      readPublicDestinationCard("citron", async () => {
        throw Error("unexpected fallback");
      }),
    ).rejects.toThrow("Card temporarily unavailable");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  },
);

test("published hours arrive with the focused snapshot and stay scoped through catalogue projection", async () => {
  configure();
  const withHours = { ...card, hours: [hour] };
  fetchSpy.mockResolvedValue(Response.json(withHours));
  expect(
    await readPublicDestinationCard("citron", async () => {
      throw Error("unexpected fallback");
    }),
  ).toEqual(withHours);
  expect(fetchSpy).toHaveBeenCalledTimes(1);
  const full = {
    ...fullCatalogue(),
    openingHours: [hour, { ...hour, id: "other", destination_id: "other" }],
  };
  expect(focusDestinationCard(full, "citron")!.hours).toEqual([hour]);
  expect(createHubValue(cardHubData(withHours)).destinations[0]!.initialHours).toEqual([hour]);
  expect(createHubValue(cardHubData(card)).destinations[0]!.initialHours).toBeUndefined();
  expect(createHubValue(cardHubData({ ...card, hours: [] })).destinations[0]!.initialHours).toEqual(
    [],
  );
});
