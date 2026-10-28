import { useEffect, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { FullscreenDialog } from "@/components/ui/fullscreen-dialog";
import { useI18n } from "@/i18n";
import { localizedBenefits, type BenefitContent } from "@/lib/accommodation-benefits";
import { getAccommodationBenefits } from "@/lib/accommodation-benefits.functions";
import type { Destination } from "@/data/resort";
import { useInteractiveReady } from "@/lib/use-interactive-ready";

function BenefitsContent({
  loading,
  items,
  onRetry,
}: Readonly<{ loading: boolean; items: readonly string[]; onRetry: () => void }>) {
  const { t } = useI18n();
  if (loading) return <output className="block">{t("page_loading")}</output>;
  if (!items.length) {
    return (
      <div>
        <output className="block">{t("content_unavailable")}</output>
        <button type="button" onClick={onRetry}>
          {t("retry")}
        </button>
      </div>
    );
  }
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function BenefitsDialog({
  id,
  dest,
  onClose,
}: Readonly<{
  id: string;
  dest: Destination;
  onClose: () => void;
}>) {
  const { lang, t, linkLabel } = useI18n();
  const [content, setContent] = useState<BenefitContent | null>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setContent(undefined);
    getAccommodationBenefits({ data: id }).then(
      (data) => {
        if (current) setContent(data);
      },
      () => {
        if (current) setContent(null);
      },
    );
    return () => {
      current = false;
    };
  }, [id, attempt]);
  const items = content ? localizedBenefits(content, lang) : [];
  return (
    <FullscreenDialog
      title={`${dest.name} · ${linkLabel("Benefits")}`}
      onClose={onClose}
      data-level={dest.level}
      overlayClassName="fixed inset-0 z-[119] bg-black/50"
      className="editorial-detail benefits-dialog fixed inset-0 z-[120]"
    >
      <header className="benefits-header">
        <div>
          <p>{dest.name}</p>
          <h2>{linkLabel("Benefits")}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label={t("close")}>
          <X aria-hidden />
        </button>
      </header>
      <div className="benefits-body" aria-busy={content === undefined}>
        <BenefitsContent
          loading={content === undefined}
          items={items}
          onRetry={() => setAttempt((value) => value + 1)}
        />
      </div>
    </FullscreenDialog>
  );
}

export function AccommodationBenefits({
  id,
  dest,
  className,
}: Readonly<{
  id: string;
  dest: Destination;
  className?: string | undefined;
}>) {
  const [open, setOpen] = useState(false);
  const { linkLabel } = useI18n();
  const interactive = useInteractiveReady();
  return (
    <>
      <button
        type="button"
        disabled={!interactive}
        className={className}
        onClick={(event) => {
          event.currentTarget.focus({ preventScroll: true });
          setOpen(true);
        }}
        aria-haspopup="dialog"
      >
        <span>{linkLabel("Benefits")}</span>
        <ArrowUpRight size={17} strokeWidth={1.4} aria-hidden />
      </button>
      {open && <BenefitsDialog id={id} dest={dest} onClose={() => setOpen(false)} />}
    </>
  );
}
