import { isResortPdf } from "@/lib/resort-browser";

const MAX_BYTES = 32 * 1024 * 1024;
const TIMEOUT_MS = 30_000;
type PdfRange = Readonly<{ start: number; end: number }>;
type PdfMetadata = Readonly<{
  status: 200 | 206;
  length: number | undefined;
  contentRange?: string;
  acceptsRanges: boolean;
}>;

/** PDF.js requests one closed byte range. Reject multipart/unbounded amplification. */
function requestedPdfRange(value: string | null): PdfRange | undefined {
  const match = value?.match(/^bytes=(\d+)-(\d+)$/);
  if (!match) return undefined;
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || end >= MAX_BYTES)
    return undefined;
  return { start, end };
}

function partialPdfMetadata(upstream: Response, range?: PdfRange): PdfMetadata | undefined {
  const match = upstream.headers.get("content-range")?.match(/^bytes (\d+)-(\d+)\/(\d+)$/);
  if (!match || !range) return undefined;
  const [start, end, total] = match.slice(1).map(Number) as [number, number, number];
  if (
    !Number.isSafeInteger(total) ||
    total <= 0 ||
    total > MAX_BYTES ||
    start !== range.start ||
    end !== Math.min(range.end, total - 1) ||
    end < start
  )
    return undefined;
  const length = end - start + 1;
  const declared = upstream.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) !== length))
    return undefined;
  return {
    status: 206,
    length,
    contentRange: `bytes ${start}-${end}/${total}`,
    acceptsRanges: true,
  };
}

function pdfMetadata(upstream: Response, range?: PdfRange): PdfMetadata | undefined {
  const encoding = upstream.headers.get("content-encoding");
  const identity = !encoding || encoding === "identity";
  if (upstream.status === 206) return identity ? partialPdfMetadata(upstream, range) : undefined;
  const declared = upstream.headers.get("content-length");
  const length =
    identity && declared !== null && /^\d+$/.test(declared) ? Number(declared) : undefined;
  return {
    status: 200,
    length,
    acceptsRanges: length !== undefined && upstream.headers.get("accept-ranges") === "bytes",
  };
}

/** Workers need a fixed-length stream to keep Content-Length on streaming responses. */
function fixedPdfBody(body: ReadableStream<Uint8Array>, length?: number) {
  const FixedLengthStream = (
    globalThis as typeof globalThis & {
      FixedLengthStream?: new (length: number) => {
        readable: ReadableStream<Uint8Array>;
        writable: WritableStream<Uint8Array>;
      };
    }
  ).FixedLengthStream;
  if (length === undefined || !FixedLengthStream) return body;
  const fixed = new FixedLengthStream(length);
  // Cancellation/errors propagate through pipeTo to the bounded upstream reader.
  void body.pipeTo(fixed.writable).catch(() => {});
  return fixed.readable;
}

function pdfHeaders(metadata: PdfMetadata) {
  const headers = new Headers({
    "content-type": "application/pdf",
    "cache-control": "public, max-age=3600",
    "x-content-type-options": "nosniff",
  });
  if (metadata.length !== undefined) headers.set("content-length", String(metadata.length));
  if (metadata.acceptsRanges) headers.set("accept-ranges", "bytes");
  if (metadata.contentRange) headers.set("content-range", metadata.contentRange);
  return headers;
}

/** Stream bounded public PDFs from the resort's exact HTTPS hosts. No redirects. */
export async function serveResortPdf(
  request: Request,
  fetchPdf: typeof fetch = fetch,
): Promise<Response> {
  const source = new URL(request.url).searchParams.get("url");
  if (!source || !isResortPdf(source)) return new Response(null, { status: 400 });
  const rangeHeader = request.headers.get("range");
  const range = requestedPdfRange(rangeHeader);
  if (rangeHeader !== null && !range) return new Response(null, { status: 416 });
  const pdfUrl = new URL(source);
  pdfUrl.search = "";
  pdfUrl.hash = "";
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(TIMEOUT_MS)]);

  try {
    const upstream = await fetchPdf(pdfUrl, {
      redirect: "manual",
      signal,
      ...(range ? { headers: { Range: `bytes=${range.start}-${range.end}` } } : {}),
    });
    if (
      (upstream.status !== 200 && upstream.status !== 206) ||
      upstream.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !==
        "application/pdf" ||
      !upstream.body
    ) {
      await upstream.body?.cancel();
      return new Response(null, { status: 502 });
    }
    if (Number(upstream.headers.get("content-length")) > MAX_BYTES) {
      await upstream.body.cancel();
      return new Response(null, { status: 413 });
    }
    const metadata = pdfMetadata(upstream, range);
    if (!metadata) {
      await upstream.body.cancel();
      return new Response(null, { status: 502 });
    }
    return new Response(
      fixedPdfBody(boundedPdfBody(upstream.body, signal, metadata.length), metadata.length),
      {
        status: metadata.status,
        headers: pdfHeaders(metadata),
      },
    );
  } catch {
    return new Response(null, { status: signal.aborted ? 504 : 502 });
  }
}

/** Enforce the cap even for chunked responses, and release upstream reads on close. */
function boundedPdfBody(body: ReadableStream<Uint8Array>, signal: AbortSignal, length?: number) {
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
          if (length !== undefined && received !== length)
            throw new Error("Incomplete PDF download");
          detach();
          controller.close();
          return;
        }
        received += value.byteLength;
        if (received > (length ?? MAX_BYTES)) throw new Error("PDF exceeds the download limit");
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
