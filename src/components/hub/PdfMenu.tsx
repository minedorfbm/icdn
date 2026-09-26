import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { useI18n } from "@/i18n";

export default function PdfMenu({ url, title }: Readonly<{ url: string; title: string }>) {
  const { t } = useI18n();
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoomed, setZoomed] = useState(false);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => setWidth(container.clientWidth));
    observer.observe(container);
    setWidth(container.clientWidth);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    let loadingTask: ReturnType<(typeof import("pdfjs-dist/legacy/build/pdf.mjs"))["getDocument"]>;
    import("pdfjs-dist/legacy/build/pdf.mjs")
      .then((pdfjs) => {
        if (!active) return;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        loadingTask = pdfjs.getDocument({
          url: `/api/resort-pdf?url=${encodeURIComponent(url)}`,
          disableRange: true,
          disableStream: true,
        });
        return loadingTask.promise;
      })
      .then((pdf) => {
        if (active && pdf) setDocument(pdf);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
      void loadingTask?.destroy();
    };
  }, [url]);

  const changePage = (next: number) => {
    setPageNumber(next);
  };
  const pageWidth = Math.min(Math.max(width - 32, 1), 900) * (zoomed ? 2 : 1);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({
      left: zoomed ? (container.scrollWidth - container.clientWidth) / 2 : 0,
      top: 0,
    });
  }, [pageNumber, pageWidth, zoomed]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[oklch(0.92_0.015_85)] text-[oklch(0.17_0.008_155)]">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto overscroll-contain">
        <div className="flex min-h-full min-w-full w-max items-center justify-center p-4">
          {error ? (
            <p className="max-w-xs text-center text-sm">{t("pdf_error")}</p>
          ) : document && width ? (
            <div style={{ width: pageWidth }}>
              <PdfPage
                key={`${pageNumber}-${pageWidth}`}
                document={document}
                pageNumber={pageNumber}
                width={pageWidth}
                title={title}
                onError={() => setError(true)}
              />
            </div>
          ) : (
            <p className="text-sm">{t("page_loading")}</p>
          )}
        </div>
      </div>
      {document && !error && (
        <nav
          aria-label={title}
          className="flex min-h-16 shrink-0 items-center justify-center gap-3 border-t border-black/10 px-3"
        >
          <button
            type="button"
            onClick={() => changePage(pageNumber - 1)}
            disabled={pageNumber === 1}
            aria-label={t("pdf_previous")}
            className="grid size-11 place-items-center rounded-full border border-black/20 disabled:opacity-30"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <output className="min-w-20 text-center text-sm tabular-nums" aria-live="polite">
            {t("pdf_page")} {pageNumber} / {document.numPages}
          </output>
          <button
            type="button"
            onClick={() => changePage(pageNumber + 1)}
            disabled={pageNumber === document.numPages}
            aria-label={t("pdf_next")}
            className="grid size-11 place-items-center rounded-full border border-black/20 disabled:opacity-30"
          >
            <ChevronRight aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoomed(!zoomed);
            }}
            aria-label={zoomed ? t("pdf_zoom_out") : t("pdf_zoom_in")}
            className="ml-auto grid size-11 place-items-center rounded-full border border-black/20"
          >
            {zoomed ? (
              <ZoomOut aria-hidden className="size-5" />
            ) : (
              <ZoomIn aria-hidden className="size-5" />
            )}
          </button>
        </nav>
      )}
    </div>
  );
}

function PdfPage({
  document,
  pageNumber,
  width,
  title,
  onError,
}: Readonly<{
  document: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  title: string;
  onError: () => void;
}>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let active = true;
    let renderTask: ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]>;
    document
      .getPage(pageNumber)
      .then(async (page) => {
        const canvas = canvasRef.current;
        if (!active || !canvas) return;
        const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas context unavailable");
        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
        });
        await renderTask.promise;
      })
      .catch((cause: unknown) => {
        if (active && !(cause instanceof Error && cause.name === "RenderingCancelledException"))
          onError();
      });
    return () => {
      active = false;
      renderTask?.cancel();
    };
  }, [document, pageNumber, width, onError]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`${title} — ${pageNumber}`}
      className="block bg-white shadow-xl"
    />
  );
}
