/** A short-lived, bounded cache. Failed/partial reads are never retained. */
export function createRequestCache<T>(
  complete: (value: T) => boolean,
  ttl = 30_000,
  now: () => number = Date.now,
  limit = 64,
) {
  type Entry = { expires: number; value?: T; pending?: Promise<T> };
  const entries = new Map<string, Entry>();
  const peek = (key: string): T | undefined => {
    const entry = entries.get(key);
    if (!entry || entry.expires <= now()) return undefined;
    return entry.value;
  };
  return {
    peek,
    read(key: string, load: () => Promise<T>, refresh = false, startedAt = now()): Promise<T> {
      const previous = entries.get(key);
      if (!refresh && previous && previous.expires > now()) {
        if (previous.pending) return previous.pending;
        if (previous.value !== undefined) return Promise.resolve(previous.value);
      }
      // An early request's freshness starts when it was issued, not when its
      // response is handed to the application after hydration.
      const entry: Entry = { expires: Math.min(now(), startedAt) + ttl };
      entries.delete(key);
      entries.set(key, entry);
      while (entries.size > limit) entries.delete(entries.keys().next().value!);
      entry.pending = Promise.resolve()
        .then(load)
        .then(
          (value) => {
            if (entries.get(key) === entry) {
              if (complete(value) && entry.expires > now()) {
                entry.value = value;
                delete entry.pending;
              } else entries.delete(key);
            }
            return value;
          },
          (error: unknown) => {
            if (entries.get(key) === entry) entries.delete(key);
            throw error;
          },
        );
      return entry.pending;
    },
  };
}
