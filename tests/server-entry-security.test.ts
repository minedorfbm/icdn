import { afterAll, expect, mock, spyOn, test } from "bun:test";
import { renderErrorPage } from "../src/lib/error-page";

type Options = { context?: { nonce?: string }; onEarlyHints?: unknown };
let upstream: (options: Options) => Response = () => new Response("ready");
mock.module("@tanstack/react-start/server-entry", () => ({
  default: { fetch: async (_request: Request, options: Options) => upstream(options) },
}));
const server = (await import("../src/server")).default;
const loggedError = spyOn(console, "error").mockImplementation(() => {});
afterAll(() => loggedError.mockRestore());

function authorizedNonce(response: Response) {
  const policy = response.headers.get("content-security-policy")!;
  const nonce = /'nonce-([^']+)'/.exec(policy)?.[1];
  expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  return nonce!;
}

test("the server entry replaces caller-supplied nonces and preserves other Start request options", async () => {
  const onEarlyHints = () => {};
  upstream = (options) => {
    expect(options.context?.nonce).not.toBe("untrusted");
    expect(options.onEarlyHints).toBe(onEarlyHints);
    return new Response(renderErrorPage("en", options.context?.nonce), {
      headers: { "content-type": "text/html" },
    });
  };
  const response = await server.fetch(new Request("https://icdn.artdigitaljourney.com/"), {
    context: { nonce: "untrusted" },
    onEarlyHints,
  });
  expect(await response.text()).toContain(`<script nonce="${authorizedNonce(response)}">`);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.has("x-frame-options")).toBe(false);
});

test("an unexpected handler rejection keeps the translated fallback script authorized", async () => {
  upstream = () => {
    throw new Error("Controlled handler rejection");
  };
  const response = await server.fetch(
    new Request("https://icdn.artdigitaljourney.com/", {
      headers: { "accept-language": "ja-JP" },
    }),
  );
  expect(response.status).toBe(500);
  const html = await response.text();
  expect(html).toContain('<html lang="ja">');
  expect(html).toContain(`<script nonce="${authorizedNonce(response)}">`);
  expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
});

test("an H3-swallowed SSR error uses the same response nonce on its recovery page", async () => {
  upstream = () => Response.json({ unhandled: true, message: "HTTPError" }, { status: 500 });
  const response = await server.fetch(new Request("https://icdn.artdigitaljourney.com/citron"));
  expect(response.status).toBe(500);
  expect(response.headers.get("content-type")).toContain("text/html");
  expect(await response.text()).toContain(`<script nonce="${authorizedNonce(response)}">`);
});

test.each([
  { status: 200, type: "text/plain", body: "ready" },
  { status: 503, type: "text/html", body: "<p>Existing error</p>" },
  { status: 500, type: "application/json", body: '{"unhandled":false,"message":"HTTPError"}' },
  { status: 500, type: "application/json", body: '{"unhandled":true,"message":"Other"}' },
  { status: 500, type: "application/json", body: "invalid JSON" },
])(
  "unrelated responses remain intact under the stricter policy: %j",
  async ({ status, type, body }) => {
    upstream = () => new Response(body, { status, headers: { "content-type": type } });
    const response = await server.fetch(new Request("https://icdn.artdigitaljourney.com/citron"));
    expect(response.status).toBe(status);
    expect(response.headers.get("content-type")).toBe(type);
    expect(await response.text()).toBe(body);
    authorizedNonce(response);
  },
);
