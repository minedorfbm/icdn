import { useEffect, useMemo, useState } from "react";
import { groupPhotos, groupPosts, groupVideos } from "@/data/resort";
import type { DestinationMediaData } from "./hub.functions";
import { loadDestinationMedia, peekDestinationMedia } from "./hub-client";

/** Only an opened card requests its gallery and video metadata. */
export function useDestinationMedia(id: string) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ id: string; data: DestinationMediaData | null } | null>(
    null,
  );
  useEffect(() => {
    let current = true;
    const cached = peekDestinationMedia(id);
    setResult(cached ? { id, data: cached } : null);
    loadDestinationMedia(id, attempt > 0).then(
      (data) => {
        if (current) setResult({ id, data });
      },
      () => {
        if (current) setResult({ id, data: null });
      },
    );
    return () => {
      current = false;
    };
  }, [id, attempt]);
  const data = result?.id === id ? result.data : peekDestinationMedia(id);
  const media = useMemo(
    () => ({
      photos: groupPhotos(data?.photos ?? [])[id] ?? [],
      posts: groupPosts(data?.posts ?? [])[id] ?? [],
      videos: groupVideos(data?.videos ?? [])[id] ?? [],
      hours: data?.hours ?? [],
      notices: data?.notices ?? [],
      collection: data?.collection ?? [],
    }),
    [data, id],
  );
  return {
    media,
    pending: data === undefined,
    failed: data === null || (data !== undefined && Object.values(data).includes(null)),
    retry: () => setAttempt((value) => value + 1),
  };
}
