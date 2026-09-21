import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createHubValue, FALLBACK } from "./hub-value";
import type { HubData } from "@/lib/hub.functions";

const HubContext = createContext(FALLBACK);

export function HubProvider({ data, children }: { data?: HubData; children: ReactNode }) {
  const value = useMemo(() => createHubValue(data), [data]);
  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}

export function useHub() {
  return useContext(HubContext);
}
