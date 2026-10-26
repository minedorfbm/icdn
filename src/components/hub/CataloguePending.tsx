import { useCatalogueStatus } from "@/data/catalogue-status";
import { useI18n } from "@/i18n";

/** Reusable status for features that require every published place, with a real retry. */
export function CataloguePending() {
  const { failed, retry } = useCatalogueStatus();
  const { t } = useI18n();
  return (
    <div className="brand-ui grid place-content-center gap-4 p-8 text-center" aria-busy={!failed}>
      <output>{t(failed ? "content_unavailable" : "page_loading")}</output>
      {failed && (
        <button className="min-h-11 border-b" onClick={retry}>
          {t("retry")}
        </button>
      )}
    </div>
  );
}
