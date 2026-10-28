import { Fragment, useRef, type CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { useChapterDocking } from "@/lib/use-chapter-docking";
import { scrollToHubSection } from "@/lib/scroll-to-hub-section";
import { useJourneyMotion } from "@/lib/use-journey-motion";
import { localizedLinkUrl } from "@/lib/localized-links";
import { HubSearch } from "@/features/search/HubSearch";
import { DiscoveryPaths } from "@/features/discovery/DiscoveryPaths";
import { useResortMap } from "@/features/resort-map/map-context";
import { mapCopy } from "@/features/resort-map/map-copy";
import { useHub } from "@/data/hub-context";
import { type Level } from "@/data/resort";
import { useI18n } from "@/i18n";
import { ResortLogo } from "./ResortLogo";
import { ResortLink } from "./ResortBrowser";
import { ConciergeContact } from "./ConciergeContact";
import { LevelChapter } from "./LevelChapter";
import { NamTramRail } from "./NamTramRail";

export default function HubJourney() {
  const { openMap } = useResortMap();
  const hubRef = useRef<HTMLDivElement>(null);
  const { levels, links } = useHub();
  const { active, visible } = useJourneyMotion(hubRef, levels);
  useChapterDocking(hubRef);
  const { lang, t, linkLabel } = useI18n();

  const scrollTo = scrollToHubSection;

  return (
    <div ref={hubRef} className="bg-background text-foreground">
      <div className="hub-search-tool">
        <HubSearch compact />
      </div>
      <NamTramRail active={active} visible={visible} onJump={(level: Level) => scrollTo(level)} />

      <DiscoveryPaths onJourney={() => scrollTo(levels[0]?.id ?? "heaven")} />

      {/* THE DESCENT */}
      <div>
        {levels.map((l, index) => (
          <Fragment key={l.id}>
            <LevelChapter {...l} />
            {levels[index + 1] && (
              <div
                className="chapter-gradient"
                data-from={l.id}
                aria-hidden
                style={
                  {
                    "--chapter-from": `var(--world-${l.id})`,
                    "--chapter-to": `var(--world-${levels[index + 1]!.id})`,
                  } as CSSProperties
                }
              />
            )}
          </Fragment>
        ))}
      </div>

      {/* END OF JOURNEY */}
      <section className="brand-ui sea-footer px-6 py-24">
        <h2 aria-label={t("footer_title")}>
          <ResortLogo className="footer-resort-logo" loading="lazy" />
        </h2>
        <ul className="mt-8 flex flex-col divide-y divide-current/10 border-y border-current/10">
          {links.map(({ label, url, translations }) => (
            <li key={label}>
              {label === "Resort Map" ? (
                <button
                  type="button"
                  onClick={() => openMap()}
                  className="flex w-full items-center justify-between py-3 text-[11px] tracking-[0.22em]"
                >
                  {mapCopy(lang, "open").toUpperCase()}
                  <ArrowUpRight aria-hidden className="size-4 shrink-0" strokeWidth={1.3} />
                </button>
              ) : (
                <ResortLink
                  href={localizedLinkUrl(
                    label === "Website" ? "WEBSITE" : label,
                    url,
                    translations,
                    lang,
                  )}
                  pageTitle={linkLabel(label)}
                  target={label === "Contact" ? undefined : "_blank"}
                  rel={label === "Contact" ? undefined : "noreferrer"}
                  className="flex items-center justify-between py-3 text-[11px] tracking-[0.22em]"
                >
                  {linkLabel(label).toUpperCase()}
                  <ArrowUpRight aria-hidden className="size-4 shrink-0" strokeWidth={1.3} />
                </ResortLink>
              )}
            </li>
          ))}
        </ul>

        <p className="mt-16 text-[9px] tracking-[0.3em] opacity-70">{t("footer_credit")}</p>
      </section>

      {/* FIXED CONCIERGE BUTTON */}
      <div className="hub-contact-tool">
        <ConciergeContact />
      </div>
    </div>
  );
}
