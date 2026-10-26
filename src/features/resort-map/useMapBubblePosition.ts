import { useLayoutEffect, type RefObject } from "react";
import { placeMapBubble } from "./map-bubble";
import type { MapCamera } from "./map-camera";
import type { MapPoint } from "./map.types";

export function useMapBubblePosition(
  ref: RefObject<HTMLElement | null>,
  point: MapPoint,
  camera: MapCamera,
) {
  useLayoutEffect(() => {
    const node = ref.current;
    const atlas = node?.closest<HTMLElement>(".hub-atlas");
    const svg = atlas?.querySelector<SVGSVGElement>(".resort-art");
    const scene = svg?.querySelector<SVGGElement>(".map-scene");
    if (!node || !atlas || !svg || !scene) return;
    const update = () => {
      const matrix = scene.getScreenCTM();
      if (!matrix) return;
      const local = svg.createSVGPoint();
      local.x = point.x;
      local.y = point.y;
      const screen = local.matrixTransform(matrix);
      const bounds = atlas.getBoundingClientRect();
      const header = atlas.querySelector(".atlas-header")?.getBoundingClientRect();
      const dock = atlas.querySelector(".atlas-bottom")?.getBoundingClientRect();
      const top = (header ? header.bottom - bounds.top : 56) + 12;
      const bottom = (dock ? dock.top - bounds.top : bounds.height) - 12;
      const placement = placeMapBubble(
        { x: screen.x - bounds.left, y: screen.y - bounds.top },
        { width: node.offsetWidth, height: node.offsetHeight },
        { x: 12, y: top, width: bounds.width - 24, height: Math.max(1, bottom - top) },
      );
      node.style.left = `${placement.x}px`;
      node.style.top = `${placement.y}px`;
      node.style.setProperty("--atlas-tail", `${placement.tail}px`);
      node.dataset["side"] = placement.side;
    };
    update();
    const observer = new ResizeObserver(update);
    [node, atlas, atlas.querySelector(".atlas-bottom")].forEach((element) => {
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [ref, point.x, point.y, camera.x, camera.y, camera.scale]);
}
