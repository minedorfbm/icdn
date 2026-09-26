import {
  lazy,
  Suspense,
  createContext,
  useContext,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { ExternalLink, X } from "lucide-react";
import { FullscreenDialog } from "@/components/ui/fullscreen-dialog";
import { safeExternalUrl } from "@/lib/destination-actions";
import { embeddedResortUrl, isResortPdf } from "@/lib/resort-browser";
import { useI18n } from "@/i18n";

type ResortPage = Readonly<{ url: string; title: string }>;
const OpenResortPage = createContext<((page: ResortPage) => void) | null>(null);
const PdfMenu = lazy(() => import("./PdfMenu"));

/** One on-demand browser, outside the swipe deck and above any open destination detail. */
export function ResortBrowserProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [page, setPage] = useState<ResortPage | null>(null);
  return (
    <OpenResortPage.Provider value={setPage}>
      {children}
      {page && <ResortPageDialog key={page.url} page={page} onClose={() => setPage(null)} />}
    </OpenResortPage.Provider>
  );
}

export function ResortLink({
  href,
  pageTitle,
  children,
  onClick,
  ...props
}: Readonly<ComponentPropsWithoutRef<"a"> & { href: string; pageTitle: string }>) {
  const openPage = useContext(OpenResortPage);
  const embeddedUrl = embeddedResortUrl(href);
  return (
    <a
      target="_blank"
      rel="noreferrer"
      {...props}
      href={safeExternalUrl(href)}
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
  const [loading, setLoading] = useState(!pdf);

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
      className="fixed inset-0 z-[100] flex h-[100dvh] flex-col overflow-hidden overscroll-none bg-[oklch(0.92_0.015_85)] text-[oklch(0.20_0.02_155)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <header className="relative shrink-0 border-b border-[oklch(0.67_0.055_83/0.4)] bg-[oklch(0.965_0.012_85)] px-3 pt-[env(safe-area-inset-top)]">
        <div className="grid min-h-14 grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="grid size-11 place-items-center rounded-full text-[oklch(0.42_0.035_78)] transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 active:bg-black/10"
          >
            <X aria-hidden className="size-5" strokeWidth={1.4} />
          </button>
          <p
            className="min-w-0 truncate text-center font-serif text-[16px] tracking-[0.025em]"
            title={page.title}
          >
            {page.title}
          </p>
          <a
            href={page.url}
            target="_blank"
            rel="noreferrer"
            aria-label={t("open_browser")}
            title={t("open_browser")}
            className="grid size-11 place-items-center rounded-full text-[oklch(0.42_0.035_78)] transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 active:bg-black/10"
          >
            <ExternalLink aria-hidden className="size-[19px]" strokeWidth={1.5} />
          </a>
        </div>
        <output className="sr-only">{loading ? t("page_loading") : ""}</output>
        {loading && (
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-px w-1/3 animate-pulse bg-[oklch(0.67_0.08_83)]"
          />
        )}
      </header>
      {pdf ? (
        <Suspense fallback={<p className="p-4 text-sm">{t("page_loading")}</p>}>
          <PdfMenu url={page.url} title={page.title} />
        </Suspense>
      ) : (
        <iframe
          src={page.url}
          title={page.title}
          className="min-h-0 w-full flex-1 border-0 bg-white"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
          allow="fullscreen"
          onLoad={() => setLoading(false)}
        />
      )}
    </FullscreenDialog>
  );
}
