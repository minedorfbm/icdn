import { expect, test } from "bun:test";
import { getResponseHeader, requestHandler, setResponseHeader } from "@tanstack/react-start/server";
import { withPublicReadTiming } from "../src/lib/public-read-timing.server";

test("overlapping requests keep their own public timings and preserve existing metrics", async () => {
  let release!: () => void;
  let entered!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const handle = requestHandler(async (request) => {
    setResponseHeader("server-timing", "edge;dur=4");
    await Promise.all([
      withPublicReadTiming("settings", async (markSource) => {
        markSource("database");
        return null;
      }),
      withPublicReadTiming("catalogue", async (markSource) => {
        if (new URL(request.url).pathname === "/cold") {
          markSource("rpc");
          entered();
          await gate;
        }
        return "catalogue";
      }),
    ]);
    return new Response("ok");
  });
  const pending = handle(new Request("https://example.test/cold"), {});
  await started;
  const warm = await handle(new Request("https://example.test/warm"), {});
  release();
  const cold = await pending;
  expect(warm.headers.get("server-timing")).toMatch(/catalogue;dur=\d+(?:\.\d+)?;desc="cache"/);
  expect(cold.headers.get("server-timing")).toMatch(/catalogue;dur=\d+(?:\.\d+)?;desc="rpc"/);
  for (const response of [warm, cold]) {
    expect(response.headers.get("server-timing")).toContain("edge;dur=4");
    expect(response.headers.get("server-timing")).toMatch(
      /settings;dur=\d+(?:\.\d+)?;desc="database"/,
    );
    expect(await response.text()).toBe("ok");
  }
});

test("a failed read preserves its error and records only its public failure source", async () => {
  const failure = new Error("private upstream diagnostic");
  let caught: unknown;
  let timing: string | undefined;
  const handle = requestHandler(async () => {
    try {
      await withPublicReadTiming("catalogue", async (markSource) => {
        markSource("compatibility");
        throw failure;
      });
    } catch (error) {
      caught = error;
      timing = getResponseHeader("server-timing");
    }
    return new Response("unavailable", { status: 503 });
  });
  const response = await handle(new Request("https://example.test/"), {});
  expect(caught).toBe(failure);
  expect(response.status).toBe(503);
  expect(timing).toMatch(/catalogue;dur=\d+(?:\.\d+)?;desc="compatibility-error"/);
  expect(timing).not.toContain("private");
});
