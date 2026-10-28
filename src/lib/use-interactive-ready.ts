import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const client = () => true;
const server = () => false;

/** Keep SSR controls visible, but do not accept clicks before handlers attach. */
export function useInteractiveReady() {
  return useSyncExternalStore(subscribe, client, server);
}
