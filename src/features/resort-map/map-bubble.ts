import { clamp, type MapRect } from "./map-camera";
import type { MapPoint } from "./map.types";

/** Screen-space bubble placement. Map coordinates and the selected pin never move. */
export function placeMapBubble(
  anchor: MapPoint,
  size: { width: number; height: number },
  frame: MapRect,
) {
  const gap = 62;
  const right = frame.x + frame.width;
  const bottom = frame.y + frame.height;
  const left = clamp(anchor.x - size.width / 2, frame.x, Math.max(frame.x, right - size.width));
  const top = clamp(anchor.y - size.height / 2, frame.y, Math.max(frame.y, bottom - size.height));
  const candidates = [
    { x: left, y: anchor.y + gap, side: "top" },
    { x: left, y: anchor.y - gap - size.height, side: "bottom" },
    { x: anchor.x + gap, y: top, side: "left" },
    { x: anchor.x - gap - size.width, y: top, side: "right" },
  ];
  const position = candidates.find(
    (p) =>
      p.x >= frame.x && p.y >= frame.y && p.x + size.width <= right && p.y + size.height <= bottom,
  );
  if (
    !position ||
    anchor.x < frame.x ||
    anchor.x > right ||
    anchor.y < frame.y ||
    anchor.y > bottom
  )
    return { x: left, y: top, side: "none", tail: 0 };
  const vertical = position.side === "top" || position.side === "bottom";
  const tail = clamp(
    vertical ? anchor.x - position.x : anchor.y - position.y,
    22,
    Math.max(22, (vertical ? size.width : size.height) - 22),
  );
  return { ...position, tail };
}
