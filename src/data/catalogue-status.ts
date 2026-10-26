import { createContext, useContext } from "react";
export const CatalogueContext = createContext({ ready: true, failed: false, retry: () => {} });

export function useCatalogueStatus() {
  return useContext(CatalogueContext);
}
