import { isResortPdf } from "@/lib/resort-browser";

/** Stream only public PDF uploads from the resort's exact HTTPS hosts. */
export async function serveResortPdf(
  request: Request,
  fetchPdf: typeof fetch = fetch,
): Promise<Response> {
  const source = new URL(request.url).searchParams.get("url");
  if (!source || !isResortPdf(source)) return new Response(null, { status: 400 });

  const pdfUrl = new URL(source);
  pdfUrl.search = "";
  pdfUrl.hash = "";

  try {
    const upstream = await fetchPdf(pdfUrl, { redirect: "manual" });
    if (
      !upstream.ok ||
      !upstream.headers.get("content-type")?.toLowerCase().startsWith("application/pdf")
    ) {
      await upstream.body?.cancel();
      return new Response(null, { status: 502 });
    }

    return new Response(upstream.body, {
      headers: {
        "content-type": "application/pdf",
        "cache-control": "public, max-age=3600",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
