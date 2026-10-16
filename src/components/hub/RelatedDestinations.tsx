import { ArrowRight } from "lucide-react";
import { useHub } from "@/data/hub-context";
import { useI18n } from "@/i18n";
import { relatedDestinations } from "@/lib/destination-presentation";
import { useDestinationNavigation } from "@/lib/use-destination-navigation";
import "./related-destinations.css";

/** Resolve canonical relationships from the live catalogue. */
export function RelatedDestinations({ id }: Readonly<{ id: string }>) {
  const { destinations, relations } = useHub();
  const { openDestination } = useDestinationNavigation();
  const { t } = useI18n();
  const related = relatedDestinations(id, destinations, relations);
  if (related.length === 0) return null;

  return (
    <section className="destination-relations" aria-label={t("related_places")}>
      <h3>{t("related_places")}</h3>
      <div className="destination-related">
        {related.map((item) => (
          <button key={item.id} type="button" onClick={() => openDestination(item.id)}>
            <img
              src={item.image}
              style={{ objectPosition: item.imagePosition }}
              alt=""
              width={88}
              height={88}
              loading="lazy"
              decoding="async"
            />
            <span>{item.name}</span>
            <ArrowRight size={21} strokeWidth={1.4} aria-hidden />
          </button>
        ))}
      </div>
    </section>
  );
}
