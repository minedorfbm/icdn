import { afterAll, afterEach, expect, spyOn, test } from "bun:test";
import { completeCatalogue } from "../src/lib/hub-data-completeness";
import { readPublicDestinationCard } from "../src/lib/public-destination-card.server";
import {
  cardHubData,
  focusDestinationCard,
  type DestinationCardData,
} from "../src/lib/destination-card-schema";
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
  expect(focusDestinationCard(cardHubData(card), "unknown")).toBe(null);
});
test("an unpublished card returns null and only a missing migration invokes compatibility", async () => {
  configure();
  fetchSpy.mockResolvedValue(Response.json(null));
  expect(
    await readPublicDestinationCard("citron", async () => {
      throw Error("unexpected");
    }),
  ).toBe(null);
  fetchSpy.mockResolvedValue(Response.json({ code: "PGRST202" }, { status: 404 }));
  expect(await readPublicDestinationCard("citron", async () => card)).toEqual(card);
});
test.each([
  { body: { code: "42501" }, status: 403 },
  { body: { code: "57014" }, status: 504 },
  { body: { code: "PGRST000" }, status: 503 },
  { body: [], status: 200 },
  { body: { ...card, links: null }, status: 200 },
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
