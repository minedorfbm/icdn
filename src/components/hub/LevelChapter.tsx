import { useEffect, useMemo, useRef, useState } from "react";
import { CardStack } from "./CardStack";
import { useHub } from "@/data/hub-context";
import { type Level } from "@/data/resort";
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
  const [near, setNear] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { destinations } = useHub();
  const { t, levelLine, cluster: clusterLabel } = useI18n();

  const all = useMemo(
    () =>
      destinations
        .filter((d) => d.active && d.level === id)
        .sort((a, b) => a.display_order - b.display_order),
    [destinations, id],
  );

  const list = useMemo(
    () => (clusters ? all.filter((d) => d.cluster === cluster) : all),
    [all, clusters, cluster],
  );

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

      <div className="relative">
        <header className="mx-auto max-w-[740px] px-6">
          <span className="block h-px w-10 bg-current/40" aria-hidden />
          <h2 className="mt-6 font-serif text-[clamp(56px,21vw,116px)] leading-[0.82] tracking-[-0.03em]">
            {title}
          </h2>
          <p className="mt-5 text-[12px] tracking-[0.24em] opacity-55">
            {levelLine(id, line).toUpperCase()}
          </p>
        </header>

        {clusters && (
          <div className="mx-auto mt-10 flex max-w-[740px] gap-6 px-6">
            {clusters.map((c) => (
              <button
                key={c}
                onClick={() => setCluster(c)}
                className={`border-b pb-1 text-[10px] tracking-[0.3em] transition-opacity ${
                  c === cluster ? "border-current opacity-100" : "border-transparent opacity-40"
                }`}
              >
                {clusterLabel(c)}
              </button>
            ))}
          </div>
        )}

        <p className="mx-auto mt-10 max-w-[740px] px-6 text-[9px] tracking-[0.34em] opacity-40">
          {list.length} {t("places")} · {t("swipe_hint")} · {t("tap_hint")}
        </p>

        <div className="mt-5 overflow-hidden">
          <CardStack items={list} near={near} />
        </div>
      </div>
    </section>
  );
}
