import { createFileRoute } from "@tanstack/react-router";
import { serveResortPdf } from "@/lib/resort-pdf.server";

/** Same-origin delivery lets the mobile PDF reader access official resort menus. */
export const Route = createFileRoute("/api/resort-pdf")({
  server: {
    handlers: {
      GET: ({ request }) => serveResortPdf(request),
    },
  },
});
