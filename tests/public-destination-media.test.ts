import { afterAll, afterEach, expect, spyOn, test } from "bun:test";
import { readPublicDestinationMedia } from "../src/lib/public-destination-media.server";
import type { DestinationMediaData } from "../src/lib/destination-media-schema";

const originalUrl = process.env["SUPABASE_URL"];
const originalKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
const fetchSpy = spyOn(globalThis, "fetch");
const empty: DestinationMediaData = {
  photos: [],
  posts: [],
  videos: [],
  hours: [],
  notices: [],
  collection: [],
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
test("opened-card metadata uses one anonymous GET scoped to its destination", async () => {
  configure();
  const data = {
    ...empty,
    photos: [
      {
        destination_id: "citron",
        image_url: "https://example.com/photo.webp",
        caption: null,
        post_url: null,
        display_order: 0,
      },
    ],
  };
  fetchSpy.mockResolvedValue(Response.json(data));
  let legacy = 0;
  expect(
    await readPublicDestinationMedia("citron", async () => {
      legacy++;
      return empty;
    }),
  ).toEqual(data);
  expect(legacy).toBe(0);
  expect(fetchSpy).toHaveBeenCalledTimes(1);
  const [input, init] = fetchSpy.mock.calls[0]!;
  const url = new URL(String(input));
  expect(url.pathname).toBe("/rest/v1/rpc/published_hub_destination_media_v1");
  expect(url.searchParams.get("requested_destination_id")).toBe("citron");
  expect(init?.method).toBe("GET");
  expect(init?.signal).toBeInstanceOf(AbortSignal);
  const headers = new Headers(init?.headers);
  expect(headers.get("apikey")).toBe("sb_publishable_test");
  expect(headers.has("authorization")).toBe(false);
});
test("missing migration alone uses the legacy reader, including its partial failure state", async () => {
  configure();
  fetchSpy.mockResolvedValue(Response.json({ code: "PGRST202" }, { status: 404 }));
  let calls = 0;
  const partial = { ...empty, photos: null };
  expect(
    await readPublicDestinationMedia("citron", async () => {
      calls++;
      return partial;
    }),
  ).toEqual(partial);
  expect(calls).toBe(1);
});
test("an unpublished or empty destination stays empty without extra requests", async () => {
  configure();
  fetchSpy.mockResolvedValue(Response.json(empty));
  expect(
    await readPublicDestinationMedia("unpublished", async () => {
      throw Error("unexpected fallback");
    }),
  ).toEqual(empty);
  expect(fetchSpy).toHaveBeenCalledTimes(1);
});
test.each([
  { body: { code: "42501" }, status: 403 },
  { body: { code: "57014" }, status: 504 },
  { body: { code: "PGRST000" }, status: 503 },
  { body: [], status: 200 },
  { body: { ...empty, photos: null }, status: 200 },
  { body: { ...empty, hours: undefined }, status: 200 },
  { body: { ...empty, posts: [{ destination_id: "citron" }] }, status: 200 },
  {
    body: {
      ...empty,
      photos: [
        {
          destination_id: "other",
          image_url: "https://example.com/photo.webp",
          caption: null,
          post_url: null,
          display_order: 0,
        },
      ],
    },
    status: 200,
  },
])(
  "failed or mismatched media remains retryable without a seven-read fallback: %j",
  async ({ body, status }) => {
    configure();
    fetchSpy.mockResolvedValue(Response.json(body, { status }));
    let legacy = 0;
    await expect(
      readPublicDestinationMedia("citron", async () => {
        legacy++;
        return empty;
      }),
    ).rejects.toThrow("Media temporarily unavailable");
    expect(legacy).toBe(0);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  },
);
