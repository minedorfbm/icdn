import {
  lazy,
  Suspense,
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { ExternalLink, X } from "lucide-react";
import { FullscreenDialog } from "@/components/ui/fullscreen-dialog";
import { safeExternalUrl } from "@/lib/external-url";
import { embeddedResortUrl, isResortPdf, resortLinkTarget } from "@/lib/resort-browser";
import { useI18n } from "@/i18n";
import { HubSearch } from "@/features/search/HubSearch";
import { ConciergeContact } from "./ConciergeContact";
import { mediaPlayback } from "@/lib/media-playback";

type ResortPage = Readonly<{ url: string; title: string }>;
const OpenResortPage = createContext<((page: ResortPage) => void) | null>(null);
const preparePdfMenu = () => import("./PdfMenu");
const PdfMenu = lazy(preparePdfMenu);

/** One on-demand browser, outside the swipe deck and above any open destination detail. */
export function ResortBrowserProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [page, setPage] = useState<ResortPage | null>(null);
  const releasePlayback = useRef<(() => void) | undefined>(undefined);
  const openPage = useCallback((next: ResortPage) => {
    releasePlayback.current ??= mediaPlayback.suspend();
    setPage(next);
  }, []);
  const closePage = useCallback(() => {
    setPage(null);
    releasePlayback.current?.();
    releasePlayback.current = undefined;
  }, []);
  useEffect(() => () => releasePlayback.current?.(), []);
  return (
    <OpenResortPage.Provider value={openPage}>
      {children}
      {page && <ResortPageDialog key={page.url} page={page} onClose={closePage} />}
    </OpenResortPage.Provider>
  );
}

export function ResortLink({
  href,
  pageTitle,
  children,
  onClick,
  onPointerEnter,
  onFocus,
  ...props
}: Readonly<ComponentPropsWithoutRef<"a"> & { href: string; pageTitle: string }>) {
  const openPage = useContext(OpenResortPage);
  const embeddedUrl = embeddedResortUrl(href);
  return (
    <a
      target={resortLinkTarget(href)}
      rel="noreferrer"
      {...props}
      href={safeExternalUrl(embeddedUrl ?? href)}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (event.pointerType === "mouse" && isResortPdf(href))
          void preparePdfMenu().catch(() => {});
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (isResortPdf(href)) void preparePdfMenu().catch(() => {});
      }}
      onClick={(event) => {
        onClick?.(event);
        // Preserve copy-link, middle-click and the browser's modifier-key shortcuts.
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          !embeddedUrl ||
          !openPage
        )
          return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        openPage({ url: embeddedUrl, title: pageTitle });
      }}
    >
      {children}
    </a>
  );
}

function ResortPageDialog({ page, onClose }: Readonly<{ page: ResortPage; onClose: () => void }>) {
  const { t } = useI18n();
  const pdf = isResortPdf(page.url);
  const [loading, setLoading] = useState(true);
  const loaded = useCallback(() => setLoading(false), []);

  useEffect(() => {
    // Cross-origin frames do not reliably report failures. Never leave an endless loader;
    // the original-page link remains available whether the embedded page loads or not.
    if (pdf) return;
    const timer = window.setTimeout(() => setLoading(false), 12_000);
    return () => window.clearTimeout(timer);
  }, [pdf]);

  return (
    <FullscreenDialog
      title={page.title}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[99] bg-black/40"
      className="fixed inset-0 z-[100] flex h-[100dvh] flex-col overflow-hidden overscroll-none brand-ui brand-surface pb-[env(safe-area-inset-bottom,0px)]"
    >
      <header className="relative shrink-0 border-b brand-header px-3 pt-[env(safe-area-inset-top)]">
        <div className="grid min-h-14 grid-cols-[44px_minmax(0,1fr)_44px_44px_44px] items-center gap-1">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="grid size-11 place-items-center rounded-full text-[var(--brand-ink)] transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 active:bg-black/10"
          >
            <X aria-hidden className="size-5" strokeWidth={1.4} />
          </button>
          <p
            className="min-w-0 truncate text-center font-serif text-[length:var(--readable-16)] tracking-[0.025em]"
            title={page.title}
          >
            {page.title}
          </p>
          <HubSearch compact onNavigate={onClose} />
          <ConciergeContact className="relative" />
          <a
            href={page.url}
            target="_blank"
            rel="noreferrer"
            aria-label={t("open_browser")}
            title={t("open_browser")}
            className="grid size-11 place-items-center rounded-full text-[var(--brand-ink)] transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 active:bg-black/10"
          >
            <ExternalLink aria-hidden className="size-[19px]" strokeWidth={1.5} />
          </a>
        </div>
      </header>
      <div className="relative flex min-h-0 flex-1 flex-col">
        {pdf ? (
          <Suspense fallback={null}>
            <PdfMenu url={page.url} title={page.title} onReady={loaded} />
          </Suspense>
        ) : (
          <iframe
            src={page.url}
            title={page.title}
            className="min-h-0 w-full flex-1 border-0 bg-white"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
            allow="fullscreen"
            onLoad={loaded}
          />
        )}
        {loading && (
          <div
            role="status"
            className={`absolute inset-0 z-10 grid place-items-center${pdf ? "" : " pointer-events-none"}`}
          >
            <p className="rounded-full brand-floating px-6 py-3 text-center text-sm">
              {t("page_loading")}
            </p>
          </div>
        )}
      </div>
    </FullscreenDialog>
  );
}
