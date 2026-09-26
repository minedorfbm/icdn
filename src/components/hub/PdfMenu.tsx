import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { useI18n } from "@/i18n";
import { nextPdfZoom, pinchCenter, pinchDistance, type Point } from "@/lib/pdf-zoom";

type LoadedPdf = Readonly<{ document: PDFDocumentProxy; heightRatio: number }>;
type Pinch = {
  startDistance: number;
  startZoom: number;
  zoom: number;
  startCenter: Point;
  center: Point;
  pageNumber: number;
  pageX: number;
  pageY: number;
};

function touchPoint(touch: Touch): Point {
  return { x: touch.clientX, y: touch.clientY };
}

function pageAt(container: HTMLElement, y: number): HTMLElement | undefined {
  const pages = Array.from(container.querySelectorAll<HTMLElement>("[data-pdf-page]"));
  return pages.find((page) => page.getBoundingClientRect().bottom > y) ?? pages.at(-1);
}

export default function PdfMenu({ url, title }: Readonly<{ url: string; title: string }>) {
  const { t } = useI18n();
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const anchorPage = useRef(1);
  const pinchRef = useRef<Pinch | null>(null);
  const pendingPinchRef = useRef<Pinch | null>(null);
  const showError = useCallback(() => setError(true), []);

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
      .then(async (document) => {
        if (!active || !document) return;
        const firstPage = await document.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 });
        if (active) setPdf({ document, heightRatio: viewport.height / viewport.width });
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
      void loadingTask?.destroy();
    };
  }, [url]);

  const pageWidth = Math.min(Math.max(width - 32, 1), 900) * zoom;

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container || !pdf || !width) return;
    const pendingPinch = pendingPinchRef.current;
    if (pendingPinch) {
      pendingPinchRef.current = null;
      if (pagesRef.current) {
        pagesRef.current.style.transform = "";
        pagesRef.current.style.transformOrigin = "";
        pagesRef.current.style.willChange = "";
      }
      const page = container.querySelector<HTMLElement>(
        `[data-pdf-page="${pendingPinch.pageNumber}"]`,
      );
      if (page) {
        const bounds = page.getBoundingClientRect();
        container.scrollLeft +=
          bounds.left + bounds.width * pendingPinch.pageX - pendingPinch.center.x;
        container.scrollTop +=
          bounds.top + bounds.height * pendingPinch.pageY - pendingPinch.center.y;
      }
      return;
    }
    const page = container.querySelector<HTMLElement>(`[data-pdf-page="${anchorPage.current}"]`);
    if (page) {
      const top = page.getBoundingClientRect().top - container.getBoundingClientRect().top;
      container.scrollTop += top - 16;
    }
    container.scrollLeft = zoom > 1 ? (container.scrollWidth - container.clientWidth) / 2 : 0;
  }, [zoom, width, pdf]);

  useEffect(() => {
    const container = scrollRef.current;
    const pages = pagesRef.current;
    if (!container || !pages || !pdf) return;

    const clearPreview = () => {
      pages.style.transform = "";
      pages.style.transformOrigin = "";
      pages.style.willChange = "";
    };

    const startPinch = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      const first = touchPoint(event.touches[0]!);
      const second = touchPoint(event.touches[1]!);
      const center = pinchCenter(first, second);
      const page = pageAt(container, center.y);
      if (!page) return;
      const bounds = page.getBoundingClientRect();
      const contentBounds = pages.getBoundingClientRect();
      pinchRef.current = {
        startDistance: pinchDistance(first, second),
        startZoom: zoom,
        zoom,
        startCenter: center,
        center,
        pageNumber: Number(page.dataset["pdfPage"]),
        pageX: Math.min(1, Math.max(0, (center.x - bounds.left) / bounds.width)),
        pageY: Math.min(1, Math.max(0, (center.y - bounds.top) / bounds.height)),
      };
      pages.style.transformOrigin = `${center.x - contentBounds.left}px ${center.y - contentBounds.top}px`;
      pages.style.willChange = "transform";
      event.preventDefault();
    };

    const movePinch = (event: TouchEvent) => {
      const pinch = pinchRef.current;
      if (!pinch || event.touches.length < 2) return;
      const first = touchPoint(event.touches[0]!);
      const second = touchPoint(event.touches[1]!);
      pinch.zoom = nextPdfZoom(pinch.startZoom, pinch.startDistance, pinchDistance(first, second));
      pinch.center = pinchCenter(first, second);
      const shiftX = pinch.center.x - pinch.startCenter.x;
      const shiftY = pinch.center.y - pinch.startCenter.y;
      pages.style.transform = `translate(${shiftX}px, ${shiftY}px) scale(${pinch.zoom / pinch.startZoom})`;
      event.preventDefault();
    };

    const endPinch = (event: TouchEvent) => {
      const pinch = pinchRef.current;
      if (!pinch || event.touches.length >= 2) return;
      pinchRef.current = null;
      event.preventDefault();
      if (Math.abs(pinch.zoom - zoom) < 0.01) {
        clearPreview();
        return;
      }
      pendingPinchRef.current = pinch;
      setZoom(pinch.zoom);
    };

    const cancelPinch = () => {
      pinchRef.current = null;
      clearPreview();
    };

    container.addEventListener("touchstart", startPinch, { passive: false });
    container.addEventListener("touchmove", movePinch, { passive: false });
    container.addEventListener("touchend", endPinch, { passive: false });
    container.addEventListener("touchcancel", cancelPinch);
    return () => {
      container.removeEventListener("touchstart", startPinch);
      container.removeEventListener("touchmove", movePinch);
      container.removeEventListener("touchend", endPinch);
      container.removeEventListener("touchcancel", cancelPinch);
      clearPreview();
    };
  }, [pdf, zoom]);

  const toggleZoom = () => {
    const container = scrollRef.current;
    if (container) {
      const focus = container.getBoundingClientRect().top + container.clientHeight * 0.35;
      const current = pageAt(container, focus);
      if (current) anchorPage.current = Number(current.dataset["pdfPage"]);
    }
    setZoom((value) => (value > 1 ? 1 : 2));
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[oklch(0.92_0.015_85)] text-[oklch(0.17_0.008_155)]">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto overscroll-contain"
        aria-label={title}
        style={{ touchAction: "pan-x pan-y" }}
      >
        {error ? (
          <p className="mx-auto max-w-xs px-4 py-16 text-center text-sm">{t("pdf_error")}</p>
        ) : pdf && width ? (
          <div
            ref={pagesRef}
            className="flex min-w-full w-max flex-col items-center gap-6 p-4 pb-20"
          >
            {Array.from({ length: pdf.document.numPages }, (_, index) => (
              <figure key={index + 1} data-pdf-page={index + 1} style={{ width: pageWidth }}>
                <PdfPage
                  key={pageWidth}
                  document={pdf.document}
                  pageNumber={index + 1}
                  width={pageWidth}
                  estimatedHeight={pageWidth * pdf.heightRatio}
                  title={title}
                  scrollRef={scrollRef}
                  onError={showError}
                />
                <figcaption className="pt-3 text-center text-xs opacity-65">
                  {t("pdf_page")} {index + 1} / {pdf.document.numPages}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-sm">{t("page_loading")}</p>
        )}
      </div>
      {pdf && !error && (
        <button
          type="button"
          onClick={toggleZoom}
          aria-label={zoom > 1 ? t("pdf_zoom_out") : t("pdf_zoom_in")}
          className="absolute bottom-4 right-4 grid size-12 place-items-center rounded-full border border-black/20 bg-[oklch(0.96_0.01_85)] shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {zoom > 1 ? (
            <ZoomOut aria-hidden className="size-5" />
          ) : (
            <ZoomIn aria-hidden className="size-5" />
          )}
        </button>
      )}
    </div>
  );
}

function PdfPage({
  document,
  pageNumber,
  width,
  estimatedHeight,
  title,
  scrollRef,
  onError,
}: Readonly<{
  document: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  estimatedHeight: number;
  title: string;
  scrollRef: RefObject<HTMLDivElement | null>;
  onError: () => void;
}>) {
  const slotRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [height, setHeight] = useState(estimatedHeight);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? false),
      {
        root: scrollRef.current,
        rootMargin: "600px 0px",
      },
    );
    observer.observe(slot);
    return () => observer.disconnect();
  }, [scrollRef]);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    let renderTask: ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]>;
    const canvas = canvasRef.current;
    document
      .getPage(pageNumber)
      .then(async (page) => {
        if (!active || !canvas) return;
        const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
        const ratio = Math.min(window.devicePixelRatio || 1, 2, 2048 / viewport.width);
        canvas.width = Math.max(1, Math.floor(viewport.width * ratio));
        canvas.height = Math.max(1, Math.floor(viewport.height * ratio));
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        setHeight(viewport.height);
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
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
    };
  }, [visible, document, pageNumber, width, onError]);

  return (
    <div ref={slotRef} style={{ height }} className="bg-white shadow-xl">
      {visible && (
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`${title} — ${pageNumber}`}
          className="block"
        />
      )}
    </div>
  );
}
