import { afterAll, afterEach, expect, spyOn, test } from "bun:test";
import { readPublicCatalogue } from "../src/lib/public-catalogue.server";
import type { HubData } from "../src/lib/hub-schema";

const originalUrl = process.env["SUPABASE_URL"];
const originalKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
const fetchSpy = spyOn(globalThis, "fetch");
const data: HubData = {
  levels: [],
  destinations: [],
  links: [],
  events: [],
  settings: {},
  relations: [],
  mapPlaces: [],
  mapLinks: [],
  linkTranslations: [],
  siteLinkTranslations: [],
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

test("a complete anonymous catalogue uses one read-only request with the same publication shape", async () => {
  configure();
  fetchSpy.mockResolvedValue(Response.json(data));
  let legacy = 0;
  expect(
    await readPublicCatalogue(async () => {
      legacy++;
      return data;
    }),
  ).toEqual(data);
  expect(legacy).toBe(0);
  expect(fetchSpy).toHaveBeenCalledTimes(1);
  const [input, init] = fetchSpy.mock.calls[0]!;
  expect(new URL(String(input)).pathname).toBe("/rest/v1/rpc/published_hub_catalogue_v1");
  expect(init?.method).toBe("GET");
  expect(init?.signal).toBeInstanceOf(AbortSignal);
  const headers = new Headers(init?.headers);
  expect(headers.get("apikey")).toBe("sb_publishable_test");
  expect(headers.has("authorization")).toBe(false);
});

test("an environment awaiting the migration uses the existing validated reader", async () => {
  configure();
  fetchSpy.mockResolvedValue(Response.json({ code: "PGRST202" }, { status: 404 }));
  let legacy = 0;
  expect(
    await readPublicCatalogue(async () => {
      legacy++;
      return data;
    }),
  ).toEqual(data);
  expect(legacy).toBe(1);
  expect(fetchSpy).toHaveBeenCalledTimes(1);
});

test.each([
  { body: { code: "42501" }, status: 403 },
  { body: { code: "57014" }, status: 504 },
  { body: { code: "PGRST000" }, status: 503 },
  { body: [], status: 200 },
  { body: { ...data, links: null }, status: 200 },
  { body: { ...data, relations: undefined }, status: 200 },
  { body: { ...data, destinations: [{ id: "bad" }] }, status: 200 },
])(
  "a failure or invalid snapshot remains retryable without eleven fallback requests: %j",
  async ({ body, status }) => {
    configure();
    fetchSpy.mockResolvedValue(Response.json(body, { status }));
    let legacy = 0;
    await expect(
      readPublicCatalogue(async () => {
        legacy++;
        return data;
      }),
    ).rejects.toThrow("Catalogue temporarily unavailable");
    expect(legacy).toBe(0);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  },
);
