import { ArrowUpRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Destination, Level } from "@/data/resort";
import { useI18n } from "@/i18n";

interface Group {
  key: string;
  items: Destination[];
}

export function DestinationIndex({
  open,
  onOpenChange,
  level,
  title,
  groups,
  onSelect,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: Level;
  title: string;
  groups: Group[];
  onSelect: (destination: Destination) => void;
}>) {
  const { t, cluster, typeLabel } = useI18n();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        data-level={level}
        className="level max-h-[85svh] overflow-y-auto overscroll-contain rounded-t-[28px] border-current/20 px-6 pb-10 pt-9"
        style={{ backgroundColor: "var(--level-bg)", color: "var(--level-fg)" }}
      >
        <SheetHeader className="mb-8 text-left">
          <p className="text-[10px] tracking-[0.3em] opacity-55">{title}</p>
          <SheetTitle className="font-serif text-[42px] font-normal leading-none text-current">
            {t("all_places")}
          </SheetTitle>
        </SheetHeader>

        {groups.map((group) => (
          <section key={group.key || level} className="mt-7">
            {group.key && (
              <h3 className="mb-3 border-b border-current/25 pb-3 text-[10px] tracking-[0.28em]">
                {cluster(group.key)} <span className="ml-2 opacity-50">{group.items.length}</span>
              </h3>
            )}
            <div className="divide-y divide-current/15">
              {group.items.map((destination) => (
                <button
                  key={destination.id}
                  type="button"
                  onClick={() => onSelect(destination)}
                  className="flex min-h-20 w-full items-center gap-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <img
                    src={destination.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={64}
                    height={76}
                    className="h-[64px] w-[54px] shrink-0 rounded-md object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-[22px] leading-tight">
                      {destination.name}
                    </span>
                    <span className="mt-1 block text-[9px] tracking-[0.18em] opacity-60">
                      {typeLabel(destination.type)}
                    </span>
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 opacity-50" strokeWidth={1.3} />
                </button>
              ))}
            </div>
          </section>
        ))}
      </SheetContent>
    </Sheet>
  );
}
