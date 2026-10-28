/** One foreground media session. Suspending a document never resumes an old player. */
export function createMediaPlayback() {
  const players = new Map<symbol, (reason: "handoff" | "document") => void>();
  const blockers = new Set<symbol>();
  const listeners = new Set<() => void>();
  let active: symbol | undefined;

  const pauseAll = () => {
    active = undefined;
    // Include a provider that started just before its cross-origin focus signal.
    for (const pause of [...players.values()]) pause("document");
  };

  return {
    register(pause: (reason: "handoff" | "document") => void) {
      const id = Symbol("media");
      players.set(id, pause);
      return {
        activate() {
          if (!players.has(id)) return false;
          if (blockers.size) {
            pause("document");
            return false;
          }
          if (active === id) return true;
          active = id;
          for (const [other, stop] of [...players]) {
            if (other !== id) stop("handoff");
          }
          return true;
        },
        unregister() {
          players.delete(id);
          if (active === id) active = undefined;
        },
      };
    },
    pauseAll,
    isSuspended: () => blockers.size > 0,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    suspend() {
      const wasSuspended = blockers.size > 0;
      const id = Symbol("document");
      blockers.add(id);
      pauseAll();
      if (!wasSuspended) for (const listener of [...listeners]) listener();
      return () => {
        if (blockers.delete(id) && !blockers.size) {
          for (const listener of [...listeners]) listener();
        }
      };
    },
  };
}

export const mediaPlayback = createMediaPlayback();
