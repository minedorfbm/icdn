import { useCallback, useEffect, useState } from "react";
import type { Destination } from "@/data/resort";

const photoKey = (item: Destination) => `${item.id}:${item.image}`;

/** Admit the front photo first, then the visible perspective neighbours.
 * Already admitted photos retain their sources when scrolling away or swiping back. */
export function useCardImageReadiness(
  items: Destination[],
  index: number,
  near: boolean,
  measured: boolean,
) {
  const [prepared, setPrepared] = useState<Set<string>>(() => new Set());
  const [settled, setSettled] = useState<Set<string>>(() => new Set());
  const activeKey = items[index] ? photoKey(items[index]) : undefined;
  const activeSettled = activeKey !== undefined && settled.has(activeKey);
  const onSettled = useCallback((item: Destination) => {
    const key = photoKey(item);
    setSettled((previous) => (previous.has(key) ? previous : new Set([...previous, key])));
  }, []);

  useEffect(() => {
    if (!near || !measured || !activeKey) return;
    setPrepared((previous) =>
      previous.has(activeKey) ? previous : new Set([...previous, activeKey]),
    );
    // A failed or slow front photo must never hold the neighbours indefinitely.
    const timer = window.setTimeout(
      () => {
        const neighbours = [items[index - 1], items[index + 1], items[index + 2]]
          .filter((item): item is Destination => Boolean(item))
          .map(photoKey);
        setPrepared((previous) =>
          neighbours.every((key) => previous.has(key))
            ? previous
            : new Set([...previous, ...neighbours]),
        );
      },
      activeSettled ? 0 : 350,
    );
    return () => window.clearTimeout(timer);
  }, [items, index, near, measured, activeKey, activeSettled]);

  const canLoad = useCallback(
    (item: Destination) =>
      measured && (prepared.has(photoKey(item)) || (near && photoKey(item) === activeKey)),
    [measured, prepared, near, activeKey],
  );
  return { canLoad, onSettled };
}
