import { thumbnail } from "@/lib/responsive-image";
import { ArrowUpRight } from "lucide-react";
import { CataloguePending } from "./CataloguePending";
import { useCatalogueStatus } from "@/data/catalogue-status";
import { useHub } from "@/data/hub-context";
import { useI18n } from "@/i18n";
import { collectionCopy, type CollectionItem } from "@/lib/destination-collection";
import { useDestinationNavigation } from "@/lib/use-destination-navigation";
import "./destination-collection.css";

/** Curated, directional links are separate from the symmetric Related Place list. */
export function DestinationCollection({ items }: Readonly<{ items: CollectionItem[] }>) {
  const { destinations } = useHub();
  const { lang } = useI18n();
  const { openDestination } = useDestinationNavigation();
  const { ready } = useCatalogueStatus();
  if (!ready) return <CataloguePending />;
  return (
    <ol className="destination-collection">
      {items.map((item) => {
        const target = destinations.find(
          (destination) => destination.id === item.target_destination_id,
        );
        if (!target) return null;
        return (
          <li key={item.key}>
            <button
              type="button"
              aria-describedby={`collection-${item.destination_id}-${item.key}`}
              onClick={() => openDestination(target.id)}
            >
              {target.image && (
                <img
                  src={thumbnail(target.image)}
                  style={{ objectPosition: target.imagePosition }}
                  alt=""
                  width={88}
                  height={88}
                  loading="lazy"
                  decoding="async"
                />
              )}
              <span className="destination-collection-title">
                <span className="destination-collection-key" aria-hidden>
                  {item.key}
                </span>
                {collectionCopy(item, lang, "title")}
              </span>
              <ArrowUpRight size={20} strokeWidth={1.5} aria-hidden />
            </button>
            <p id={`collection-${item.destination_id}-${item.key}`}>
              {collectionCopy(item, lang, "description")}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
