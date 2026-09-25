import { useEffect, useMemo, useRef, useState } from "react";
import { CardStack } from "./CardStack";
import { DestinationIndex } from "./DestinationIndex";
import { useHub } from "@/data/hub-context";
import { type Destination, type Level } from "@/data/resort";
import { useI18n } from "@/i18n";

interface Props {
  id: Level;
  title: string;
  line: string;
  image: string;
  clusters?: string[];
}

export function LevelChapter({ id, title, line, image, clusters }: Props) {
  const [cluster, setCluster] = useState(clusters?.[0]);
  const [cardIndex, setCardIndex] = useState(0);
  const [indexOpen, setIndexOpen] = useState(false);
  const [near, setNear] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const { destinations } = useHub();
  const { t, levelLine, cluster: clusterLabel } = useI18n();

  const all = useMemo(
    () =>
      destinations
        .filter((d) => d.active && d.level === id)
        .sort((a, b) => a.display_order - b.display_order),
    [destinations, id],
  );

  const groups = useMemo(() => {
    if (!clusters?.length) return [];
    const configured = clusters
      .map((key) => ({ key, items: all.filter((dest) => dest.cluster === key) }))
      .filter((group) => group.items.length > 0);
    const ungrouped = all.filter((dest) => !dest.cluster || !clusters.includes(dest.cluster));
    if (ungrouped.length > 0) configured.push({ key: "OTHER", items: ungrouped });
    return configured;
  }, [all, clusters]);
  const activeCluster = groups.some((group) => group.key === cluster) ? cluster : groups[0]?.key;
  const compactCollections = groups.length <= 3;
  const list = groups.find((group) => group.key === activeCluster)?.items ?? all;
  const activeIndex = Math.min(cardIndex, Math.max(0, list.length - 1));

  const selectCluster = (key: string) => {
    setCluster(key);
    setCardIndex(0);
  };

  const selectDestination = (destination: Destination) => {
    const group = groups.find((entry) => entry.items.some((item) => item.id === destination.id));
    if (group) setCluster(group.key);
    setCardIndex((group?.items ?? all).findIndex((item) => item.id === destination.id));
    setIndexOpen(false);
    requestAnimationFrame(() => cardsRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || near) return;
    if (!("IntersectionObserver" in window)) {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [near]);

  return (
    <section
      ref={sectionRef}
      id={id}
      data-level={id}
      data-cluster={activeCluster}
      className="level relative min-h-[100svh] py-24"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src={image}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          width={900}
          height={1400}
          className="level-bg h-full w-full object-cover"
        />
        <div className="level-veil absolute inset-0" />
      </div>

      <div className="relative pr-[var(--hub-rail-gutter)]">
        <header className="mx-auto max-w-[740px] px-6">
          <span className="block h-px w-10 bg-current/40" aria-hidden />
          <h2 className="mt-6 font-serif text-[clamp(56px,21vw,116px)] leading-[0.82] tracking-[-0.03em]">
            {title}
          </h2>
          <p className="mt-5 text-[12px] tracking-[0.24em] opacity-55">
            {levelLine(id, line).toUpperCase()}
          </p>
        </header>

        {groups.length > 0 && (
          <nav
            aria-label={`${title} ${t("collections")}`}
            className="mx-auto mt-10 max-w-[740px] border-y border-current/20"
          >
            <div
              className={
                compactCollections
                  ? "grid gap-1.5 px-6"
                  : "flex snap-x snap-mandatory scroll-px-6 gap-2 overflow-x-auto px-6 pr-14 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              }
              style={
                compactCollections
                  ? { gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }
                  : undefined
              }
            >
              {groups.map((group) => (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => selectCluster(group.key)}
                  aria-current={group.key === activeCluster ? "true" : undefined}
                  className={`relative flex min-h-20 ${compactCollections ? "min-w-0" : "min-w-[116px] snap-start"} flex-col items-start justify-center text-left transition-opacity ${
                    group.key === activeCluster ? "opacity-100" : "opacity-45"
                  }`}
                >
                  <span
                    className={`font-serif leading-tight tracking-tight ${compactCollections ? "max-w-full text-[clamp(12px,3.6vw,23px)] [overflow-wrap:anywhere]" : "text-[23px]"}`}
                  >
                    {clusterLabel(group.key)}
                  </span>
                  {group.key === activeCluster && (
                    <span className="absolute inset-x-0 bottom-0 h-[2px] bg-current" aria-hidden />
                  )}
                </button>
              ))}
            </div>
          </nav>
        )}

        <div className="mx-auto mt-8 max-w-[740px] px-6">
          <button
            type="button"
            onClick={() => setIndexOpen(true)}
            className="min-h-11 border-b border-current/45 text-[11px] tracking-[0.12em] focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {t("all_places")}
          </button>
        </div>

        <div
          key={activeCluster ?? "all"}
          ref={cardsRef}
          className="group-enter mt-5 w-[calc(100%+var(--hub-rail-gutter))] overflow-hidden [clip-path:inset(0_var(--hub-rail-gutter)_0_0)]"
        >
          <CardStack items={list} near={near} index={activeIndex} onIndexChange={setCardIndex} />
        </div>
      </div>
      <DestinationIndex
        open={indexOpen}
        onOpenChange={setIndexOpen}
        level={id}
        title={title}
        groups={groups.length > 0 ? groups : [{ key: "", items: all }]}
        onSelect={selectDestination}
      />
    </section>
  );
}
