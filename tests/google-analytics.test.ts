import { expect, test } from "bun:test";
import { runInNewContext } from "node:vm";
import { googleAnalyticsBootstrap, GOOGLE_ANALYTICS_ID } from "../src/lib/google-analytics";
import { withSecurityHeaders } from "../src/lib/security-headers";

function browser(hostname = "icdn.artdigitaljourney.com", pathname = "/", complete = false) {
  const scripts: Array<{ src?: string; async?: boolean }> = [];
  const events = new Map<string, () => void>();
  const tasks: Array<() => void> = [];
  const window = {
    location: { hostname, pathname },
    dataLayer: [] as IArguments[],
    requestIdleCallback: (run: () => void) => tasks.push(run),
    setTimeout: (run: () => void) => tasks.push(run),
    addEventListener: (name: string, run: () => void) => events.set(name, run),
  };
  const document = {
    readyState: complete ? "complete" : "loading",
    head: { appendChild: (script: (typeof scripts)[number]) => scripts.push(script) },
    createElement: () => ({}),
  };
  const run = () => runInNewContext(googleAnalyticsBootstrap(), { window, document, Date });
  return { window, scripts, events, tasks, run };
}

test("the supplied Google tag is queued once and downloaded only after load and idle", () => {
  const b = browser();
  b.run();
  b.run();
  expect(b.scripts).toHaveLength(0);
  expect(b.tasks).toHaveLength(0);
  expect(b.window.dataLayer.map((args) => Array.from(args))).toEqual([
    ["js", expect.any(Date)],
    ["config", GOOGLE_ANALYTICS_ID],
  ]);
  b.events.get("load")!();
  expect(b.scripts).toHaveLength(0);
  b.tasks[0]!();
  expect(b.scripts).toEqual([
    { async: true, src: `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}` },
  ]);
});

test("already loaded pages and browsers without idle callbacks still load asynchronously", () => {
  const b = browser(undefined, undefined, true);
  Reflect.deleteProperty(b.window, "requestIdleCallback");
  b.run();
  expect(b.scripts).toHaveLength(0);
  expect(b.events.size).toBe(0);
  expect(b.tasks).toHaveLength(1);
  b.tasks[0]!();
  expect(b.scripts).toHaveLength(1);
});

test.each([
  ["127.0.0.1", "/"],
  ["codex-preview-icdnd.white-cake-711b.workers.dev", "/citron"],
  ["icdn.artdigitaljourney.com", "/admin"],
  ["icdn.artdigitaljourney.com", "/admin/destinations"],
])("test and admin pages do not initialize Analytics: %s%s", (host, path) => {
  const b = browser(host, path, true);
  b.run();
  expect(b.window.dataLayer).toHaveLength(0);
  expect(b.scripts).toHaveLength(0);
  expect(b.tasks).toHaveLength(0);
});

test("Analytics endpoints are authorized without opening inline scripts or evaluation", () => {
  const policy = withSecurityHeaders(new Response("ok")).headers.get("content-security-policy")!;
  const scripts = policy.split(";").find((value) => value.trim().startsWith("script-src "))!;
  const connections = policy.split(";").find((value) => value.trim().startsWith("connect-src "))!;
  expect(scripts).toContain("https://www.googletagmanager.com");
  expect(connections).toContain("https://*.google-analytics.com");
  expect(connections).toContain("https://*.analytics.google.com");
  expect(connections).toContain("https://www.google.com");
  expect(scripts).not.toContain("'unsafe-inline'");
  expect(policy).not.toContain("'unsafe-eval'");
  expect(policy).toContain("script-src-attr 'none'");
});
