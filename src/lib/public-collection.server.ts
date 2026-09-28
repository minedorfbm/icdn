import { createClient } from "@supabase/supabase-js";
import { readRows } from "./hub-schema";

/** One validated anonymous reader shared by the three public loading stages. */
export function publicReader() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Supabase configuration missing");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, {
          ...init,
          headers: h,
          signal: init?.signal ?? AbortSignal.timeout(8000),
        });
      },
    },
  });

  return async <T extends import("zod").z.ZodRawShape>(
    table: string,
    schema: import("zod").z.ZodObject<T>,
    filter?: "active" | "published",
    order?: string,
    destinationId?: string,
    idColumn: "destination_id" | "id" = "destination_id",
  ) => {
    let query = supabase.from(table).select(schema.keyof().options.join(","), { count: "exact" });
    if (filter) query = query.eq(filter, true);
    if (destinationId) query = query.eq(idColumn, destinationId);
    if (order) query = query.order(order);
    // Avoid multiplying an outage by the SDK's automatic GET retries.
    // The UI owns retry; this deadline covers the whole collection read.
    const result = await query.retry(false).abortSignal(AbortSignal.timeout(8000));
    // PostgREST may cap responses. A truncated catalogue must not look like a valid publication.
    if (result.error || (result.count != null && result.count > (result.data?.length ?? 0))) {
      console.error("[hub] Collection unavailable or truncated", { table });
      return null;
    }
    return readRows(result, schema);
  };
}
