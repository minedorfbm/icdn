import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createHubValue, type HubValue } from "./hub-value";
import type { HubData } from "@/lib/hub.functions";

const HubContext = createContext<HubValue | null>(null);

export function HubProvider({ data, children }: { data?: HubData; children: ReactNode }) {
  const value = useMemo(() => createHubValue(data), [data]);
  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}

export function useHub() {
  const hub = useContext(HubContext);
  if (!hub) throw new Error("HubProvider is required");
  return hub;
}
