import { useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LEVELS, type Level } from "@/data/resort";
import { useI18n } from "@/i18n";
import tramIllustration from "@/assets/nam-tram-signature.webp";
import { NamTramCabin } from "./NamTramCabin";
import "./nam-tram.css";

interface Props {
  active: Level;
  progress: number;
  visible?: boolean;
  onJump: (level: Level) => void;
}

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
        className={`nam-tram fixed right-[env(safe-area-inset-right,0px)] top-1/2 z-40 -translate-y-1/2 select-none transition-[opacity,transform] duration-500 motion-reduce:transition-none ${
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
          >
            <span
              aria-hidden
              className="nam-tram-track pointer-events-none absolute inset-y-5 left-1/2 w-2 -translate-x-1/2"
            >
              {LEVELS.map((level, index) => (
                <span
                  key={level.id}
                  className="nam-tram-stop absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
                  data-active={level.id === active}
                  style={{ top: `${(index / (LEVELS.length - 1)) * 100}%` }}
                />
              ))}
              <span
                className="absolute inset-0 transition-transform duration-500 ease-out motion-reduce:transition-none"
                style={{ transform: `translate3d(0, ${cabinPct}%, 0)` }}
              >
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <NamTramCabin />
                </span>
              </span>
            </span>
          </button>
        </SheetTrigger>
      </nav>

      <SheetContent
        side="bottom"
        aria-describedby={undefined}
        closeLabel={t("close")}
        className="nam-tram nam-tram-panel max-h-[85svh] overflow-y-auto overscroll-contain rounded-t-[28px] px-6 pt-10 pb-[max(24px,env(safe-area-inset-bottom))] sm:mx-auto sm:max-w-md"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus({ preventScroll: true });
        }}
      >
        <div aria-hidden className="nam-tram-art">
          <img
            src={tramIllustration}
            alt=""
            width={640}
            height={482}
            loading="lazy"
            decoding="async"
          />
        </div>
        <SheetHeader className="nam-tram-heading">
          <SheetTitle className="font-serif text-[38px] leading-none font-normal tracking-[0.03em] text-current">
            Nam Tram
          </SheetTitle>
        </SheetHeader>
        <nav aria-label={t("resort_levels")} className="nam-tram-stations">
          {LEVELS.map((level) => (
            <button
              key={level.id}
              type="button"
              aria-current={level.id === active ? "location" : undefined}
              onClick={() => selectLevel(level.id)}
              className="nam-tram-station relative flex min-h-14 w-full items-center gap-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span aria-hidden className="nam-tram-station-marker">
                {level.id === active ? <NamTramCabin /> : <span className="nam-tram-stop" />}
              </span>
              <span className="font-serif text-[23px] tracking-[0.12em]">
                {levelLabel(level.id)}
              </span>
              <span aria-hidden className="nam-tram-station-end" />
            </button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
