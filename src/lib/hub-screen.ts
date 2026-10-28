import type { HubData } from "./hub-schema";

export const HUB_SCREENS = ["/map", "/search", "/surprise-me"] as const;
export type HubScreen = (typeof HUB_SCREENS)[number];
export function isHubScreen(pathname: string): pathname is HubScreen {
  return HUB_SCREENS.some((path) => path === pathname);
}
export function isDestinationPath(pathname: string) {
  return pathname !== "/" && !isHubScreen(pathname);
}

/** UI shell only. Never publish or cache this as a complete catalogue. */
export const EMPTY_HUB_SHELL: HubData = {
  levels: [],
  destinations: [],
  links: [],
  events: [],
  settings: {},
  mapPlaces: [],
  mapLinks: [],
  relations: [],
};
