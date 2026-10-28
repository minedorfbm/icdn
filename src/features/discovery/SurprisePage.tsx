import { useEffect, useMemo, useRef, useState } from "react";
import { useHub } from "@/data/hub-context";
import { useCatalogueStatus } from "@/data/catalogue-status";
import { useHubScreenNavigation } from "@/lib/use-hub-screen-navigation";
import { readDiscovery, restoreDiscovery, type SavedDiscovery } from "./surprise-order";
import { SurpriseDiscovery } from "./SurpriseDiscovery";
import "./discovery.css";

const STORAGE_KEY = "adj-discovery-v1";
export function SurprisePage() {
  const { destinations } = useHub();
  const { ready } = useCatalogueStatus();
  const { closeScreen } = useHubScreenNavigation();
  const initialized = useRef(false);
  const [order, setOrder] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const items = useMemo(() => {
    const live = new Map(destinations.filter((d) => d.active).map((d) => [d.id, d]));
    return order.flatMap((id) => live.get(id) ?? []);
  }, [destinations, order]);
  const activeIndex = Math.min(index, Math.max(0, items.length - 1));
  useEffect(() => {
    if (!ready || initialized.current) return;
    initialized.current = true;
    let saved: SavedDiscovery | null = null;
    try {
      saved = readDiscovery(sessionStorage.getItem(STORAGE_KEY));
    } catch {
      /* Optional storage. */
    }
    const restored = restoreDiscovery(saved, destinations);
    setOrder(restored.order);
    setIndex(restored.index);
    setLoaded(true);
  }, [ready, destinations]);
  useEffect(() => {
    if (!loaded) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ order, currentId: items[activeIndex]?.id }),
      );
    } catch {
      /* Continue in memory when storage is unavailable. */
    }
  }, [loaded, order, items, activeIndex]);
  return (
    <SurpriseDiscovery
      items={items}
      index={activeIndex}
      onIndexChange={setIndex}
      pending={!ready || !loaded}
      onClose={closeScreen}
    />
  );
}
