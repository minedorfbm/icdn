import { useEffect, useMemo, useState } from "react";
import { groupPhotos, groupPosts, groupVideos } from "@/data/resort";
import type { OpeningHours } from "./opening-hours";
import type { DestinationMediaData } from "./hub.functions";
import { loadDestinationMedia, peekDestinationMedia } from "./hub-client";

/** Only an opened card requests its gallery and video metadata. */
export function useDestinationMedia(id: string, initialHours?: OpeningHours[]) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    id: string;
    data: DestinationMediaData | null | undefined;
    hours: OpeningHours[] | undefined;
  } | null>(null);
  useEffect(() => {
    let current = true;
    const cached = peekDestinationMedia(id);
    function save(data: DestinationMediaData | null | undefined) {
      setResult((previous) => ({
        id,
        data,
        // Keep an authoritative empty list through a retry; never resurrect SSR hours.
        hours: data?.hours ?? (previous?.id === id ? previous.hours : undefined),
      }));
    }
    save(cached);
    loadDestinationMedia(id, attempt > 0).then(
      (data) => {
        if (current) save(data);
      },
      () => {
        if (current) save(null);
      },
    );
    return () => {
      current = false;
    };
  }, [id, attempt]);
  const data = result?.id === id ? result.data : peekDestinationMedia(id);
  const knownHours = result?.id === id ? result.hours : undefined;
  const media = useMemo(
    () => ({
      photos: groupPhotos(data?.photos ?? [])[id] ?? [],
      posts: groupPosts(data?.posts ?? [])[id] ?? [],
      videos: groupVideos(data?.videos ?? [])[id] ?? [],
      hours: data?.hours ?? knownHours ?? initialHours ?? [],
      notices: data?.notices ?? [],
      collection: data?.collection ?? [],
    }),
    [data, id, knownHours, initialHours],
  );
  return {
    media,
    pending: data === undefined,
    failed: data === null || (data !== undefined && Object.values(data).includes(null)),
    retry: () => setAttempt((value) => value + 1),
  };
}
