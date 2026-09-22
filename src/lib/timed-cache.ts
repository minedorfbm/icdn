interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Deduplicates concurrent reads and keeps a short-lived value inside a Worker isolate.
 * When a refresh is incomplete, the last complete value remains available.
 */
export function createTimedCache<T>(ttlMs: number, isComplete: (value: T) => boolean) {
  let cached: CacheEntry<T> | undefined;
  let pending: Promise<T> | undefined;

  return async (load: () => Promise<T>, now = Date.now()): Promise<T> => {
    if (cached && cached.expiresAt > now) return cached.value;
    if (pending) return pending;

    pending = load()
      .then((value) => {
        if (isComplete(value)) {
          cached = { value, expiresAt: now + ttlMs };
          return value;
        }
        return cached?.value ?? value;
      })
      .catch((error) => {
        if (cached) return cached.value;
        throw error;
      })
      .finally(() => {
        pending = undefined;
      });

    return pending;
  };
}
