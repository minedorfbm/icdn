import { getResponseHeader, setResponseHeader } from "@tanstack/react-start/server";

type ReadSource = "cache" | "database" | "rpc" | "compatibility";

/** Request-local public diagnostics; never includes URLs, identifiers or credentials. */
export async function withPublicReadTiming<T>(
  name: "settings" | "catalogue",
  read: (markSource: (source: ReadSource) => void) => Promise<T>,
): Promise<T> {
  const started = performance.now();
  let source: ReadSource = "cache";
  let failed = false;
  try {
    return await read((next) => {
      source = next;
    });
  } catch (error) {
    failed = true;
    throw error;
  } finally {
    const duration = Math.max(0, performance.now() - started).toFixed(1);
    const metric = `${name};dur=${duration};desc="${source}${failed ? "-error" : ""}"`;
    const previous = getResponseHeader("server-timing");
    setResponseHeader("server-timing", previous ? `${previous}, ${metric}` : metric);
  }
}
