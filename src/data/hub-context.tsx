import { createContext, useContext, useMemo, type ReactNode } from "react";
import { CatalogueContext } from "./catalogue-status";
import { createHubValue, type HubValue } from "./hub-value";
import type { HubData } from "@/lib/hub.functions";

const noRetry = () => {
  /* Complete catalogues need no retry by default. */
};

const HubContext = createContext<HubValue | null>(null);

export function HubProvider({
  data,
  children,
  ready = true,
  failed = false,
  retry = noRetry,
}: Readonly<{
  data?: HubData;
  children: ReactNode;
  ready?: boolean;
  failed?: boolean;
  retry?: () => void;
}>) {
  const value = useMemo(() => createHubValue(data), [data]);
  const status = useMemo(() => ({ ready, failed, retry }), [ready, failed, retry]);
  return (
    <CatalogueContext.Provider value={status}>
      <HubContext.Provider value={value}>{children}</HubContext.Provider>
    </CatalogueContext.Provider>
  );
}

export function useHub() {
  const hub = useContext(HubContext);
  if (!hub) throw new Error("HubProvider is required");
  return hub;
}
