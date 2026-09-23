import { LEVELS, type Level } from "@/data/resort";
import { useI18n } from "@/i18n";

interface Props {
  active: Level;
  progress: number; // 0..1 across the whole descent
  visible?: boolean;
  onJump: (level: Level) => void;
}

const GOLD = "oklch(0.78 0.11 85)";
const NEUTRAL = "oklch(0.62 0.02 80)";

/**
 * Nam Tram — the global spatial navigation thread of the Digital Hub.
 * A slim fixed rail on the right edge: four stations (HEAVEN → SEA),
 * a gold progress line that fills with the descent, and a tiny
 * stylized cabin marker travelling along it.
 */
export function NamTramRail({ active, progress, visible = true, onJump }: Props) {
  const { t } = useI18n();
  const activeIndex = Math.max(
    0,
    LEVELS.findIndex((l) => l.id === active),
  );

  // 4 station centers, as % of the rail height (stations list is flex-col with fixed gaps)
  const stations = [6, 36.5, 67, 97.5];
  const stationPct = (progress * 100) / 100; // continuous 0..1
  const cabinPct =
    stations[0]! +
    (stations[stations.length - 1]! - stations[0]!) * Math.min(1, Math.max(0, stationPct));

  return (
    <nav
      aria-label={t("resort_levels")}
      aria-hidden={!visible}
      className={`fixed right-3 top-1/2 z-40 -translate-y-1/2 select-none transition-all duration-700 ease-out max-[360px]:right-2 ${
        visible ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-3 opacity-0"
      }`}
    >
      <div className="relative flex flex-col items-end gap-10 py-1">
        {/* rail line — neutral base */}
        <span
          aria-hidden
          className="absolute right-[4px] top-0 bottom-0 w-px"
          style={{ backgroundColor: `color-mix(in oklch, ${NEUTRAL} 35%, transparent)` }}
        />
        {/* travelled line — gold, fills continuously with scroll progress */}
        <span
          aria-hidden
          className="absolute right-[4px] top-0 w-px transition-[height] duration-300 ease-out"
          style={{
            height: `${Math.min(100, Math.max(0, progress * 100))}%`,
            backgroundColor: GOLD,
            opacity: 0.85,
          }}
        />
        {/* Nam Tram cabin marker — tiny, rides the rail */}
        <span
          aria-hidden
          className="absolute right-[1.5px] h-[12px] w-[6px] rounded-[1.5px] transition-[top] duration-300 ease-out"
          style={{
            top: `calc(${cabinPct}% - 6px)`,
            border: `1px solid ${GOLD}`,
            backgroundColor: `color-mix(in oklch, ${GOLD} 25%, transparent)`,
          }}
        />
        {LEVELS.map((l, i) => {
          const isActive = l.id === active;
          const passed = i < activeIndex;
          return (
            <button
              key={l.id}
              onClick={() => onJump(l.id)}
              aria-current={isActive ? "true" : undefined}
              tabIndex={visible ? 0 : -1}
              className="group flex items-center gap-2.5"
              style={{ minHeight: 28 }}
            >
              <span
                className="text-[8px] tracking-[0.34em] transition-all duration-300 max-[360px]:text-[7px]"
                style={{
                  color: isActive ? GOLD : NEUTRAL,
                  opacity: isActive ? 1 : passed ? 0.75 : 0.5,
                  fontWeight: isActive ? 500 : 300,
                }}
              >
                {l.title}
              </span>
              <span
                aria-hidden
                className="relative block h-[9px] w-[9px] rounded-full transition-all duration-300"
                style={{
                  border: `1px solid ${isActive || passed ? GOLD : NEUTRAL}`,
                  backgroundColor: isActive ? GOLD : "transparent",
                  opacity: isActive ? 1 : passed ? 0.8 : 0.45,
                  boxShadow: isActive
                    ? `0 0 8px color-mix(in oklch, ${GOLD} 60%, transparent)`
                    : "none",
                }}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
