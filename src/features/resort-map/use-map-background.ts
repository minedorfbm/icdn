import { useEffect, useState } from "react";
import { mapBackgroundSource } from "./map-background";

/** Upgrade only on close zoom, retaining the overview throughout download/decode. */
export function useMapBackground(closeZoom: boolean) {
  const [requested, setRequested] = useState(false);
  const [source, setSource] = useState(mapBackgroundSource);
  useEffect(() => {
    if (closeZoom) setRequested(true);
  }, [closeZoom]);
  useEffect(() => {
    if (!requested) return;
    let current = true;
    const image = new Image();
    image.fetchPriority = "low";
    image.onload = () => {
      void image.decode().then(
        () => {
          if (current) setSource(mapBackgroundSource(true));
        },
        () => {}, // A failed upgrade leaves the loaded overview and map controls usable.
      );
    };
    image.src = mapBackgroundSource(true);
    return () => {
      current = false;
      image.onload = null;
    };
  }, [requested]);
  return source;
}
