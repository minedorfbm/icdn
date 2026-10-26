import { createContext, useContext } from "react";

/** A fresh document is visible immediately; later in-app navigation may animate. */
export const CardEntryContext = createContext(false);

export function useCardEntryMotion() {
  return useContext(CardEntryContext);
}
