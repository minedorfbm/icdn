import { X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { HubSearch } from "@/features/search/HubSearch";
import { ConciergeContact } from "@/components/hub/ConciergeContact";
import { CardStack } from "@/components/hub/CardStack";
import { FullscreenDialog } from "@/components/ui/fullscreen-dialog";
import type { Destination } from "@/data/resort";
import { useI18n } from "@/i18n";
import { discoveryCopy } from "./discovery-copy";

export function SurpriseDiscovery({
  items,
  index,
  onIndexChange,
  onClose,
}: Readonly<{
  items: Destination[];
  index: number;
  onIndexChange: Dispatch<SetStateAction<number>>;
  onClose: () => void;
}>) {
  const { lang, t } = useI18n();
  const copy = (key: Parameters<typeof discoveryCopy>[1]) => discoveryCopy(lang, key);
  return (
    <FullscreenDialog
      title={copy("surprise")}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[69] bg-black/40"
      className="surprise-discovery fixed inset-0 z-[70] h-dvh overflow-hidden"
    >
      <div className="surprise-tools">
        <HubSearch compact onNavigate={onClose} />
        <button type="button" onClick={onClose} aria-label={t("close")}>
          <X size={22} strokeWidth={1.4} />
        </button>
      </div>
      <ConciergeContact />
      <div data-surprise-content className="surprise-content">
        <header className="surprise-heading">
          <div>
            <p>{copy("kicker")}</p>
            <h2>{copy("surprise")}</h2>
          </div>
        </header>
        {items.length ? (
          <>
            <p className="surprise-hint">{copy("hint")}</p>
            <div className="surprise-deck">
              <CardStack
                items={items}
                near
                index={index}
                onIndexChange={onIndexChange}
                layout="discovery"
              />
            </div>
          </>
        ) : (
          <p className="surprise-empty">{copy("empty")}</p>
        )}
      </div>
    </FullscreenDialog>
  );
}
