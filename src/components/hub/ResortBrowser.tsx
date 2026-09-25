import {
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cross-origin frames do not reliably report failures. Never leave an endless loader;
    // the original-page link remains available whether the embedded page loads or not.
    const timer = window.setTimeout(() => setLoading(false), 12_000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <FullscreenDialog
      title={page.title}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[99] bg-black/40"
      className="fixed inset-0 z-[100] flex h-[100dvh] flex-col overflow-hidden overscroll-none bg-[oklch(0.17_0.008_155)] text-[oklch(0.93_0.025_85)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <header className="shrink-0 border-b border-[oklch(0.79_0.066_83/0.3)] px-3 pt-[max(8px,env(safe-area-inset-top))]">
        <div className="flex min-h-12 items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="grid size-11 shrink-0 place-items-center rounded-full border border-current/20 text-[oklch(0.79_0.066_83)] focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <X className="size-5" strokeWidth={1.4} />
          </button>
          <p className="min-w-0 flex-1 truncate font-serif text-[21px]" title={page.title}>
            {page.title}
          </p>
        </div>
        <div className="flex min-h-10 items-center justify-between gap-3 pl-1">
          <span role="status" className="text-[11px] opacity-65">
            {loading ? t("page_loading") : ""}
          </span>
          <a
            href={page.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 text-right text-[12px] text-[oklch(0.79_0.066_83)] underline-offset-4 hover:underline focus-visible:outline-2"
          >
            {t("open_browser")}
            <ExternalLink aria-hidden className="size-3.5 shrink-0" strokeWidth={1.5} />
          </a>
        </div>
      </header>
      <iframe
        src={page.url}
        title={page.title}
        className="min-h-0 w-full flex-1 border-0 bg-white"
        referrerPolicy="strict-origin-when-cross-origin"
        // Native PDF viewers are blocked by iframe sandboxing. Limit this exception to
        // HTTPS PDF files in the resort's public uploads directory.
        sandbox={
          isResortPdf(page.url)
            ? undefined
            : "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
        }
        allow="fullscreen"
        onLoad={() => setLoading(false)}
      />
    </FullscreenDialog>
  );
}
