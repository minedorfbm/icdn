import { createContext, useContext, useMemo, type ReactNode } from "react";
import { CatalogueContext } from "./catalogue-status";
import { createHubValue, type HubValue } from "./hub-value";
import type { HubData } from "@/lib/hub.functions";

const HubContext = createContext<HubValue | null>(null);

export function HubProvider({
  data,
  children,
  ready = true,
  failed = false,
  retry = () => {},
}: Readonly<{
  data?: HubData;
  children: ReactNode;
  ready?: boolean;
  failed?: boolean;
  retry?: () => void;
}>) {
  const value = useMemo(() => createHubValue(data), [data]);
  return (
    <CatalogueContext.Provider value={{ ready, failed, retry }}>
      <HubContext.Provider value={value}>{children}</HubContext.Provider>
    </CatalogueContext.Provider>
  );
}

export function useHub() {
  const hub = useContext(HubContext);
  if (!hub) throw new Error("HubProvider is required");
  return hub;
}
