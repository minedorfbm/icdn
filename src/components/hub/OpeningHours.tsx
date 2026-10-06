import { Clock3 } from "lucide-react";
import { useI18n } from "@/i18n";
import { hoursDays, hoursTime, type OpeningHours as Hours } from "@/lib/opening-hours";

export function OpeningHours({ hours }: Readonly<{ hours: Hours[] }>) {
  const { lang, t } = useI18n();
  if (!hours.length) return null;
  return (
    <section
      className="mt-8 rounded-[18px] border border-current/15 px-5 py-5"
      aria-label={t("opening_hours")}
    >
      <h3 className="flex items-center gap-2 text-[10px] tracking-[0.2em]">
        <Clock3 size={15} strokeWidth={1.4} aria-hidden />
        {t("opening_hours")}
      </h3>
      <ul className="mt-4 divide-y divide-current/10">
        {hours.map((row) => (
          <li key={row.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[13px]">
              <span>{t(`hours_${row.service}`)}</span>
              <span className="tabular-nums">
                {row.opens_minutes === 0 && row.closes_minutes === 1440
                  ? t("hours_24")
                  : `${hoursTime(row.opens_minutes)} – ${hoursTime(row.closes_minutes)}`}
              </span>
            </div>
            <p className="mt-1 text-[11px] opacity-65">
              {hoursDays(row.days, lang, t("hours_daily"))}
            </p>
            {row.last_order_minutes !== null && (
              <p className="mt-1 text-[11px] opacity-65">
                {t("hours_last_order")} {hoursTime(row.last_order_minutes)}
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[10px] opacity-60">{t("hours_local")}</p>
    </section>
  );
}
