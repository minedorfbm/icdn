import { useState } from "react";
import { preload } from "react-dom";
import { DestinationCollection } from "./DestinationCollection";
import { ArrowLeft, ArrowUpRight, ChevronDown, MapPin } from "lucide-react";
import { FullscreenDialog } from "@/components/ui/fullscreen-dialog";
import type { Destination } from "@/data/resort";
import { useI18n } from "@/i18n";
import { useDestinationMedia } from "@/lib/use-destination-media";
import { useDestinationSwipe } from "@/lib/use-destination-swipe";
import { detailActions, detailHeading } from "@/lib/destination-presentation";
import { instagramUrl } from "@/lib/destination-actions";
import { useResortMap } from "@/features/resort-map/map-context";
import { mapCopy } from "@/features/resort-map/map-copy";
import { HubSearch } from "@/features/search/HubSearch";
import { AccommodationBenefits } from "./AccommodationBenefits";
import { ResortLink } from "./ResortBrowser";
import { ConciergeContact } from "./ConciergeContact";
import { DestinationNotices } from "./DestinationNotices";
import { OpeningHours } from "./OpeningHours";
import { YouTubeVideos } from "./YouTubeVideos";
import { InstagramPostCarousel } from "./InstagramPostCarousel";
import { InstagramStrip } from "./InstagramStrip";
import { RelatedDestinations } from "./RelatedDestinations";
import { DestinationJourneyNavigation } from "./DestinationJourneyNavigation";
import { ResortLogo } from "./ResortLogo";
import { ResortLevelIcon } from "./ResortLevelIcon";
import "./editorial-detail.css";

function SectionHeading({ label, title }: Readonly<{ label: string; title?: string | undefined }>) {
  return (
    <header className="editorial-section-heading">
      <p>{label}</p>
      {title && <h3>{title}</h3>}
    </header>
  );
}

function DestinationMeta({ dest, className }: Readonly<{ dest: Destination; className: string }>) {
  const { levelLabel, typeLabel } = useI18n();
  return (
    <p className={className}>
      <ResortLevelIcon level={dest.level} />
      <span>{levelLabel(dest.level)}</span>
      <span aria-hidden>·</span>
      <span>{typeLabel(dest.type)}</span>
    </p>
  );
}

function DestinationHero({ dest, onClose }: Readonly<{ dest: Destination; onClose: () => void }>) {
  const { t } = useI18n();
  const [selected, setSelected] = useState(0);
  const images = Array.from(new Set([dest.detailImage, dest.image]));
  // React does not automatically preload images inside a picture element.
  preload(dest.detailImage, { as: "image", fetchPriority: "high" });
  return (
    <div className="editorial-hero">
      <picture>
        <source media="(min-width: 768px)" srcSet={images[selected]} />
        <img
          src={dest.detailImage}
          alt={dest.name}
          width={900}
          height={1400}
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <div className="editorial-gradient" />
      <button type="button" onClick={onClose} className="editorial-back">
        <ArrowLeft size={17} strokeWidth={1.5} aria-hidden />
        {t("back")}
      </button>
      <DestinationMeta dest={dest} className="editorial-meta" />
      {images.length > 1 && (
        <div className="editorial-photo-picker" data-destination-swipe-ignore>
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              aria-label={`${t("photo")} ${index + 1}`}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              style={{ backgroundImage: `url(${JSON.stringify(image)})` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const destinationMapModes: Record<string, "tour" | "photos"> = {
  "bensley-package": "tour",
  "instagram-spots": "photos",
};

function collectionLabel(destination: Destination) {
  if (destination.type === "spa") return "spa_collection";
  if (destination.cluster === "DINING") return "dining_collection";
  if (destination.cluster === "WELLNESS") return "wellness_collection";
  return "links_collection";
}

function EditorialInstagram({
  dest,
  media,
}: Readonly<{ dest: Destination; media: ReturnType<typeof useDestinationMedia>["media"] }>) {
  const { t, lang } = useI18n();
  if (media.posts.length > 0) {
    return (
      <section
        className="editorial-section editorial-instagram-section"
        aria-label={t("from_our_world")}
      >
        <SectionHeading
          label={t("from_our_world")}
          title={detailHeading(dest, "instagram", lang)}
        />
        <InstagramPostCarousel posts={media.posts} />
      </section>
    );
  }
  if (media.photos.length === 0) return null;
  const profile = instagramUrl(dest);
  return (
    <InstagramStrip
      photos={media.photos}
      {...(profile ? { instagramUrl: profile } : {})}
      label={t("from_our_world")}
    />
  );
}

/** The same template serves every destination; all content comes from the catalogue. */
export function DestinationDetail({
  dest,
  onClose,
  aboveMap = false,
  portalled = true,
}: Readonly<{ dest: Destination; onClose: () => void; aboveMap?: boolean; portalled?: boolean }>) {
  const { media, pending, failed, retry } = useDestinationMedia(dest.id);
  const { ref: swipeRef, ...journey } = useDestinationSwipe(dest.id);
  const { lang, t, action, linkLabel, description, detailDescription, event } = useI18n();
  const { openMap, locate } = useResortMap();
  const placeId = locate(dest.id);
  const mapMode = destinationMapModes[dest.id];
  const { primary, secondary } = detailActions(dest, lang);
  const events = (dest.events ?? []).map((item) => event(item));
  const collection = collectionLabel(dest);
  const label = (item: NonNullable<typeof primary>) => {
    if (item.label) return linkLabel(item.label);
    return action(item.kind === "WEBSITE" ? "DISCOVER" : item.kind);
  };

  return (
    <FullscreenDialog
      title={dest.name}
      onClose={onClose}
      portalled={portalled}
      data-level={dest.level}
      overlayClassName={`fixed inset-0 ${aboveMap ? "z-[94]" : "z-[79]"} bg-black/30`}
      className={`editorial-detail fixed inset-0 ${aboveMap ? "z-[95]" : "z-[80]"} overflow-hidden`}
    >
      <header className="editorial-large-toolbar">
        <button type="button" onClick={onClose} className="editorial-back">
          <ArrowLeft size={17} strokeWidth={1.5} aria-hidden />
          {t("back")}
        </button>
        <ResortLogo tone={dest.level === "sky" || dest.level === "earth" ? "light" : "dark"} />
      </header>
      <div className="fixed right-5 top-[max(24px,env(safe-area-inset-top))] z-10">
        <HubSearch compact />
      </div>
      <ConciergeContact />
      <div
        ref={swipeRef}
        data-destination-scroll
        className="h-full overflow-x-hidden overflow-y-auto overscroll-x-none overscroll-y-contain"
      >
        <article className="editorial-page detail-enter" data-destination-id={dest.id}>
          <DestinationHero key={dest.id} dest={dest} onClose={onClose} />
          <div className="editorial-body">
            <div className="editorial-intro">
              <DestinationMeta dest={dest} className="editorial-large-meta" />
              <h2 className="editorial-title">{dest.name}</h2>
              <p className="editorial-description">
                {dest.detail_description
                  ? detailDescription(dest.id, dest.detail_description)
                  : description(dest.id, dest.short_description)}
              </p>
              <DestinationNotices notices={media.notices} />
              {primary &&
                (primary.benefitsId ? (
                  <AccommodationBenefits
                    id={primary.benefitsId}
                    dest={dest}
                    className="editorial-primary"
                  />
                ) : (
                  <ResortLink
                    href={primary.url}
                    pageTitle={`${dest.name} · ${label(primary)}`}
                    className="editorial-primary"
                  >
                    <span>{label(primary)}</span>
                    <ArrowUpRight size={25} strokeWidth={1.5} aria-hidden />
                  </ResortLink>
                ))}

              {(media.hours.length > 0 || placeId || mapMode) && (
                <section className="editorial-practical" aria-label={t("practical_information")}>
                  <OpeningHours hours={media.hours} />
                  {(placeId || mapMode) && (
                    <button
                      type="button"
                      className="editorial-map"
                      onClick={() =>
                        openMap({
                          ...(placeId ? { placeId } : {}),
                          ...(mapMode ? { mode: mapMode } : {}),
                        })
                      }
                    >
                      <MapPin size={18} strokeWidth={1.5} aria-hidden />
                      <span>{mapCopy(lang, placeId ? "locate" : "open")}</span>
                      <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden />
                    </button>
                  )}
                </section>
              )}

              {(pending || failed) && (
                <div className="editorial-loading" aria-busy={pending}>
                  <output>{t(failed ? "content_unavailable" : "page_loading")}</output>
                  {failed && (
                    <button type="button" onClick={retry}>
                      {t("retry")}
                    </button>
                  )}
                </div>
              )}
            </div>

            {(secondary.length > 0 || media.collection.length > 0) && (
              <section
                className="editorial-section editorial-collection"
                aria-label={t(collection)}
              >
                <SectionHeading label={t(collection)} title={detailHeading(dest, "links", lang)} />
                {media.collection.length > 0 && <DestinationCollection items={media.collection} />}
                <div className="editorial-links">
                  {secondary.map((item, index) =>
                    item.benefitsId ? (
                      <AccommodationBenefits
                        key={item.id ?? `${item.kind}-${index}`}
                        id={item.benefitsId}
                        dest={dest}
                      />
                    ) : (
                      <ResortLink
                        key={item.id ?? `${item.kind}-${index}`}
                        href={item.url}
                        pageTitle={`${dest.name} · ${label(item)}`}
                        className={label(item).length > 28 ? "editorial-link-wide" : undefined}
                      >
                        <span>{label(item)}</span>
                        <ArrowUpRight size={17} strokeWidth={1.4} aria-hidden />
                      </ResortLink>
                    ),
                  )}
                </div>
              </section>
            )}

            {events.length > 0 && (
              <section className="editorial-section" aria-label={t("events")}>
                <SectionHeading label={t("events")} />
                <div className="editorial-events">
                  {events.map((item, index) => (
                    <details key={item.id ?? `${item.title}-${index}`}>
                      <summary>
                        <span>
                          <strong>{item.title}</strong>
                          {item.schedule.length > 0 && (
                            <span className="editorial-event-schedule">
                              {item.schedule.map((line) => (
                                <span key={line}>{line}</span>
                              ))}
                            </span>
                          )}
                        </span>
                        <ChevronDown size={19} strokeWidth={1.5} aria-hidden />
                      </summary>
                      <div className="editorial-event-content">
                        <p>{item.description}</p>
                        {item.url && (
                          <ResortLink href={item.url} pageTitle={item.title}>
                            {t("explore_more")}
                            <ArrowUpRight size={17} strokeWidth={1.5} aria-hidden />
                          </ResortLink>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            <div
              className="editorial-media-row"
              data-media-pair={
                media.videos.length > 0 && (media.posts.length > 0 || media.photos.length > 0)
              }
            >
              {media.videos.length > 0 && (
                <section
                  className="editorial-section editorial-video-section"
                  aria-label={t("in_motion")}
                >
                  <SectionHeading
                    label={t("in_motion")}
                    title={detailHeading(dest, "video", lang)}
                  />
                  <YouTubeVideos videos={media.videos} />
                </section>
              )}
              <EditorialInstagram dest={dest} media={media} />
            </div>

            <RelatedDestinations id={dest.id} />
            <DestinationJourneyNavigation {...journey} />
          </div>
        </article>
      </div>
    </FullscreenDialog>
  );
}
