import { isResortPdf } from "@/lib/resort-browser";

const MAX_BYTES = 32 * 1024 * 1024;
const TIMEOUT_MS = 30_000;

/** Stream bounded public PDFs from the resort's exact HTTPS hosts. No redirects. */
export async function serveResortPdf(
  request: Request,
  fetchPdf: typeof fetch = fetch,
): Promise<Response> {
  const source = new URL(request.url).searchParams.get("url");
  if (!source || !isResortPdf(source)) return new Response(null, { status: 400 });
  const pdfUrl = new URL(source);
  pdfUrl.search = "";
  pdfUrl.hash = "";
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(TIMEOUT_MS)]);

  try {
    const upstream = await fetchPdf(pdfUrl, { redirect: "manual", signal });
    if (
      !upstream.ok ||
      !upstream.headers.get("content-type")?.toLowerCase().startsWith("application/pdf") ||
      !upstream.body
    ) {
      await upstream.body?.cancel();
      return new Response(null, { status: 502 });
    }
    if (Number(upstream.headers.get("content-length")) > MAX_BYTES) {
      await upstream.body.cancel();
      return new Response(null, { status: 413 });
    }
    return new Response(boundedPdfBody(upstream.body, signal), {
      headers: {
        "content-type": "application/pdf",
        "cache-control": "public, max-age=3600",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: signal.aborted ? 504 : 502 });
  }
}

/** Enforce the cap even for chunked responses, and release upstream reads on close. */
function boundedPdfBody(body: ReadableStream<Uint8Array>, signal: AbortSignal) {
  const reader = body.getReader();
  let received = 0;
  let detach = () => {};
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const abort = () => {
        detach();
        controller.error(new Error("PDF download interrupted"));
        void reader.cancel().catch(() => {});
      };
      detach = () => signal.removeEventListener("abort", abort);
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    },
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (signal.aborted) return;
        if (done) {
          detach();
          controller.close();
          return;
        }
        received += value.byteLength;
        if (received > MAX_BYTES) throw new Error("PDF exceeds the download limit");
        controller.enqueue(value);
      } catch (error) {
        detach();
        controller.error(error);
        await reader.cancel().catch(() => {});
      }
    },
    async cancel() {
      detach();
      await reader.cancel();
    },
  });
}
