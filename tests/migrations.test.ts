import { test } from "bun:test";

test("catalogue migrations replay safely and preserve unrelated published content", async () => {
  // Execute the same PostgreSQL integration assertions as migrations:test so
  // their application-owned validation code is included in unit-suite coverage.
  await import("../scripts/test-migrations");
}, 30_000);
