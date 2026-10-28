import { createContext, useContext } from "react";
import type { SearchCollection } from "./search";
import type { Destination } from "@/data/resort";

export interface SearchSnapshot {
  query: string;
  collection: SearchCollection | "";
  scrollTop: number;
  selectedId?: string;
}

export const EMPTY_SEARCH: SearchSnapshot = { query: "", collection: "", scrollTop: 0 };
export type SearchOptions = {
  placesOnly?: boolean;
  onSelect?: (destination: Destination) => boolean;
};
export const SearchContext = createContext<
  ((onNavigate?: () => void, options?: SearchOptions) => void) | null
>(null);

export function useHubSearch() {
  const open = useContext(SearchContext);
  if (!open) throw new Error("Hub search requires its provider");
  return open;
}
