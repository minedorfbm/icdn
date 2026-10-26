import { afterAll, afterEach, expect, spyOn, test } from "bun:test";
import { publicReader } from "../src/lib/public-collection.server";
import { destinationRow, photoRow } from "../src/lib/hub-schema";

const originalUrl = process.env["SUPABASE_URL"];
const originalKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
const fetchSpy = spyOn(globalThis, "fetch");
afterAll(() => fetchSpy.mockRestore());
afterEach(() => {
  fetchSpy.mockReset();
  if (originalUrl === undefined) delete process.env["SUPABASE_URL"];
  else process.env["SUPABASE_URL"] = originalUrl;
  if (originalKey === undefined) delete process.env["SUPABASE_PUBLISHABLE_KEY"];
  else process.env["SUPABASE_PUBLISHABLE_KEY"] = originalKey;
});
function reader() {
  process.env["SUPABASE_URL"] = "https://test.supabase.co";
  process.env["SUPABASE_PUBLISHABLE_KEY"] = "sb_publishable_test";
  return publicReader();
}

test("a database outage returns control after one attempt instead of accumulating retries", async () => {
  fetchSpy.mockResolvedValue(Response.json({ message: "unavailable" }, { status: 503 }));
  expect(
    await reader()("destination_photos", photoRow, "active", "display_order", "citron"),
  ).toBeNull();
  expect(fetchSpy).toHaveBeenCalledTimes(1);
  const [input, init] = fetchSpy.mock.calls[0]!;
  const url = new URL(String(input));
  expect(url.searchParams.get("destination_id")).toBe("eq.citron");
  expect(url.searchParams.get("active")).toBe("eq.true");
  expect(init?.signal).toBeInstanceOf(AbortSignal);
});

test("a truncated gallery is not presented as a complete publication", async () => {
  fetchSpy.mockResolvedValue(Response.json([], { headers: { "content-range": "0-0/10" } }));
  expect(
    await reader()("destination_photos", photoRow, "active", "display_order", "citron"),
  ).toBeNull();
});

test("a missing presentation column is reported without retrying an obsolete catalogue", async () => {
  fetchSpy.mockResolvedValue(
    Response.json(
      { code: "42703", message: "column links_heading does not exist" },
      { status: 400 },
    ),
  );
  expect(
    await reader()("destinations", destinationRow, "active", "display_order", "citron", "id"),
  ).toBeNull();
  expect(fetchSpy).toHaveBeenCalledTimes(1);
  const url = new URL(String(fetchSpy.mock.calls[0]![0]));
  expect(url.searchParams.get("select")).toContain("links_heading");
  expect(url.searchParams.get("active")).toBe("eq.true");
  expect(url.searchParams.get("id")).toBe("eq.citron");
});
