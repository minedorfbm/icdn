import { afterEach, expect, test } from "bun:test";
import { runInNewContext } from "node:vm";
import { catalogueBootstrap, takeCatalogueRequest } from "../src/lib/catalogue-bootstrap";

afterEach(() => Reflect.deleteProperty(globalThis, "window"));

test("early loading runs once and safely embeds only the generated URL", async () => {
  const url = '/_serverFn/example?quote="</script>';
  const script = catalogueBootstrap(url);
  expect(script).not.toContain("</script>");
  let calls = 0;
  const page: Record<string, unknown> = {};
  const context = {
    window: page,
    Date,
    fetch: async (input: string, options: { priority: string }) => {
      calls++;
      expect(input).toBe(url);
      expect(options.priority).toBe("low");
      return Response.json({ published: true });
    },
  };
  runInNewContext(script, context);
  runInNewContext(script, context);
  expect(calls).toBe(1);
  Object.defineProperty(globalThis, "window", { configurable: true, value: page });
  const early = takeCatalogueRequest(url)!;
  expect(await (await early.response).json()).toEqual({ published: true });
  expect(takeCatalogueRequest(url)).toBeUndefined();
});

test("a late hydration, another URL or a reversed clock cannot reuse the bootstrap", () => {
  expect(takeCatalogueRequest("/_serverFn/catalogue")).toBeUndefined();
  for (const [url, age] of [
    ["/_serverFn/catalogue", 31_000],
    ["/different", 0],
    ["/_serverFn/catalogue", -60_000],
  ] as const) {
    const page = {
      __adjCatalogue: { url, started: Date.now() - age, response: Promise.resolve(new Response()) },
    };
    Object.defineProperty(globalThis, "window", { configurable: true, value: page });
    expect(takeCatalogueRequest("/_serverFn/catalogue")).toBeUndefined();
    expect(page).not.toHaveProperty("__adjCatalogue");
  }
});
