import { Info } from "lucide-react";
import { useI18n } from "@/i18n";
import { currentNotices, noticeCopy, type DestinationNotice } from "@/lib/destination-notices";

export function DestinationNotices({ notices }: Readonly<{ notices: DestinationNotice[] }>) {
  const { lang, t } = useI18n();
  const current = currentNotices(notices);
  if (!current.length) return null;
  return (
    <section className="mt-6 space-y-3" aria-label={t("destination_updates")}>
      {current.map((notice) => {
        const copy = noticeCopy(notice, lang);
        return (
          <article
            key={notice.id}
            className="rounded-[18px] border border-current/20 bg-current/[0.03] px-5 py-4"
          >
            <h3 className="flex items-start gap-2 text-[13px] font-medium">
              <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden />
              {copy.title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed opacity-80">{copy.body}</p>
          </article>
        );
      })}
    </section>
  );
}
