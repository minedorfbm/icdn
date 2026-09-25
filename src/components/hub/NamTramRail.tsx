import { useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LEVELS, type Level } from "@/data/resort";
import { useI18n } from "@/i18n";

interface Props {
  active: Level;
  progress: number;
  visible?: boolean;
  onJump: (level: Level) => void;
}

const GOLD = "oklch(0.78 0.11 85)";

/** A compact journey rail; station names appear only when its selector is opened. */
export function NamTramRail({ active, progress, visible = true, onJump }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { t, levelLabel } = useI18n();
  const cabinPct = Math.min(100, Math.max(0, progress * 100));

  const selectLevel = (level: Level) => {
    setOpen(false);
    onJump(level);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <nav
        aria-label={t("resort_levels")}
        aria-hidden={!visible}
        className={`fixed right-[env(safe-area-inset-right,0px)] top-1/2 z-40 -translate-y-1/2 select-none transition-[opacity,transform] duration-500 motion-reduce:transition-none ${
          visible ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-3 opacity-0"
        }`}
      >
        <SheetTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            aria-label={`${t("resort_levels")} · ${levelLabel(active)}`}
            tabIndex={visible ? 0 : -1}
            className="relative block h-[min(240px,40svh)] w-11 touch-manipulation rounded-full focus-visible:outline-2 focus-visible:outline-offset-[-4px]"
            style={{ color: GOLD }}
          >
            <span aria-hidden className="pointer-events-none absolute inset-y-5 left-1/2 w-px">
              <span className="absolute inset-0 bg-current opacity-30" />
              <span
                className="absolute inset-x-0 top-0 bg-current opacity-85 transition-[height] duration-300 motion-reduce:transition-none"
                style={{ height: `${cabinPct}%` }}
              />
              {LEVELS.map((level, index) => (
                <span
                  key={level.id}
                  className={`absolute left-1/2 size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-current ${
                    level.id === active ? "bg-current opacity-100" : "opacity-55"
                  }`}
                  style={{ top: `${(index / (LEVELS.length - 1)) * 100}%` }}
                />
              ))}
              <span
                className="absolute left-1/2 h-3 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-[1.5px] border border-current bg-current/25 transition-[top] duration-300 motion-reduce:transition-none"
                style={{ top: `${cabinPct}%` }}
              />
            </span>
          </button>
        </SheetTrigger>
      </nav>

      <SheetContent
        side="bottom"
        data-level={active}
        aria-describedby={undefined}
        className="level max-h-[85svh] overflow-y-auto overscroll-contain rounded-t-[28px] border-current/20 px-6 pt-9 pb-[max(24px,env(safe-area-inset-bottom))]"
        style={{ backgroundColor: "var(--level-bg)", color: "var(--level-fg)" }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus({ preventScroll: true });
        }}
      >
        <SheetHeader className="mb-5 text-left">
          <SheetTitle className="font-serif text-[34px] font-normal text-current">
            Nam Tram
          </SheetTitle>
        </SheetHeader>
        <nav aria-label={t("resort_levels")} className="relative">
          <span aria-hidden className="absolute top-7 bottom-7 left-[4px] w-px bg-current/25" />
          {LEVELS.map((level) => (
            <button
              key={level.id}
              type="button"
              aria-current={level.id === active ? "location" : undefined}
              onClick={() => selectLevel(level.id)}
              className="relative flex min-h-14 w-full items-center gap-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span
                aria-hidden
                className={`size-[9px] shrink-0 rounded-full border border-current ${
                  level.id === active ? "bg-current" : "opacity-50"
                }`}
              />
              <span
                className={`text-[13px] tracking-[0.24em] ${level.id === active ? "font-medium" : "opacity-65"}`}
              >
                {levelLabel(level.id)}
              </span>
            </button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
