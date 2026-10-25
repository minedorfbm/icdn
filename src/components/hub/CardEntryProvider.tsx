import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { CardEntryContext } from "@/lib/card-entry-context";

/** Keep the first SSR/hydrated view visible and retain motion for every later route entry. */
export function CardEntryProvider({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const initialPath = useRef(pathname).current;
  const [hasNavigated, setHasNavigated] = useState(false);
  const awayFromInitialPath = pathname !== initialPath;
  useEffect(() => {
    if (awayFromInitialPath) setHasNavigated(true);
  }, [awayFromInitialPath]);
  return (
    <CardEntryContext.Provider value={hasNavigated || awayFromInitialPath}>
      {children}
    </CardEntryContext.Provider>
  );
}
