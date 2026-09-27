"use client";

import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type { MapPoint } from "./map.types";
import { MAP_SIZE } from "./map.geometry";

const { width: MAP_WIDTH, height: MAP_HEIGHT } = MAP_SIZE;
const MIN_SCALE = 1;
const MAX_SCALE = 4.2;
const HORIZONTAL_OVERSCAN = 460;
const VERTICAL_OVERSCAN = 180;

export type MapCamera = { x: number; y: number; scale: number };

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

type Viewport = { x: number; y: number; width: number; height: number };
const clampCamera = ({ x, y, scale }: MapCamera, viewport: Viewport): MapCamera => ({
  scale,
  x: clamp(
    x,
    viewport.x - MAP_WIDTH * scale + viewport.width * 0.25 - HORIZONTAL_OVERSCAN,
    viewport.x + viewport.width * 0.75 + HORIZONTAL_OVERSCAN,
  ),
  y: clamp(
    y,
    viewport.y - MAP_HEIGHT * scale + viewport.height * 0.2 - VERTICAL_OVERSCAN,
    viewport.y + viewport.height * 0.65 + VERTICAL_OVERSCAN,
  ),
});

const distance = (a: MapPoint, b: MapPoint) => Math.hypot(a.x - b.x, a.y - b.y);

const midpoint = (a: MapPoint, b: MapPoint): MapPoint => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

const eventPoint = (svg: SVGSVGElement, clientX: number, clientY: number): MapPoint => {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };
  const local = point.matrixTransform(matrix.inverse());
  return { x: local.x, y: local.y };
};

export function useMapCamera() {
  const [camera, updateCamera] = useState<MapCamera>({ x: 0, y: 0, scale: 1 });
  const pointers = useRef(new Map<number, MapPoint>());
  const lastMidpoint = useRef<MapPoint | null>(null);
  const lastDistance = useRef<number | null>(null);
  const moved = useRef(false);
  const viewport = useRef<Viewport>({ x: 0, y: 0, ...MAP_SIZE });
  const initialView = useRef(true);
  const onViewportChange = useCallback(
    (next: Viewport) => {
      const previous = viewport.current;
      viewport.current = next;
      if (initialView.current && typeof window !== "undefined" && window.innerWidth <= 600) {
        // Start close enough to read the resort on a phone; the overview control
        // still restores the full plan. This changes only the camera, not geography.
        updateCamera({
          scale: 1.5,
          x: next.x + next.width * 0.5 - 800 * 1.5,
          y: next.y + next.height * 0.46 - 450 * 1.5,
        });
      }
      if (!initialView.current) {
        // Preserve the visible map center when rotating or resizing the viewport.
        updateCamera((current) =>
          clampCamera(
            {
              ...current,
              x: current.x + next.x + next.width / 2 - previous.x - previous.width / 2,
              y: current.y + next.y + next.height * 0.34 - previous.y - previous.height * 0.34,
            },
            next,
          ),
        );
      }
      initialView.current = false;
    },
    [updateCamera],
  );
  const constrain = useCallback((next: MapCamera) => clampCamera(next, viewport.current), []);

  const zoomAt = useCallback(
    (nextScale: number, anchor: MapPoint) => {
      updateCamera((current) => {
        const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
        const ratio = scale / current.scale;
        return constrain({
          scale,
          x: anchor.x - (anchor.x - current.x) * ratio,
          y: anchor.y - (anchor.y - current.y) * ratio,
        });
      });
    },
    [constrain, updateCamera],
  );

  const zoomBy = useCallback(
    (amount: number) => {
      updateCamera((current) => {
        const scale = clamp(current.scale + amount, MIN_SCALE, MAX_SCALE);
        const ratio = scale / current.scale;
        const anchor = { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
        return constrain({
          scale,
          x: anchor.x - (anchor.x - current.x) * ratio,
          y: anchor.y - (anchor.y - current.y) * ratio,
        });
      });
    },
    [constrain, updateCamera],
  );

  const fit = useCallback(() => {
    updateCamera({ x: 0, y: 0, scale: 1 });
  }, [updateCamera]);

  const focusOn = useCallback(
    (point: MapPoint, scale = 1.8) => {
      const compact = typeof window !== "undefined" && window.innerWidth <= 820;
      const nextScale = clamp(scale * (compact ? 1.45 : 1), MIN_SCALE, MAX_SCALE);
      updateCamera(
        constrain({
          scale: nextScale,
          x:
            viewport.current.x +
            viewport.current.width * (compact ? 0.5 : 0.43) -
            point.x * nextScale,
          y:
            viewport.current.y +
            viewport.current.height * (compact ? 0.34 : 0.46) -
            point.y * nextScale,
        }),
      );
    },
    [constrain, updateCamera],
  );

  const onWheel = useCallback(
    (event: ReactWheelEvent<SVGSVGElement>) => {
      const point = eventPoint(event.currentTarget, event.clientX, event.clientY);
      updateCamera((current) => {
        const scale = clamp(current.scale * Math.exp(-event.deltaY * 0.0014), MIN_SCALE, MAX_SCALE);
        const ratio = scale / current.scale;
        return constrain({
          scale,
          x: point.x - (point.x - current.x) * ratio,
          y: point.y - (point.y - current.y) * ratio,
        });
      });
    },
    [constrain, updateCamera],
  );

  const onPointerDown = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    // Preserve the original hotspot as the click target on a tap. Capture a
    // hotspot pointer only when it becomes a drag; background pans capture now.
    const onHotspot = event.target instanceof Element && event.target.closest('[role="button"]');
    if (!onHotspot) event.currentTarget.setPointerCapture(event.pointerId);
    const point = eventPoint(event.currentTarget, event.clientX, event.clientY);
    pointers.current.set(event.pointerId, point);
    if (pointers.current.size === 1) moved.current = false;

    const active = [...pointers.current.values()];
    if (active.length === 1) {
      lastMidpoint.current = active[0]!;
      lastDistance.current = null;
    } else if (active.length === 2) {
      lastMidpoint.current = midpoint(active[0]!, active[1]!);
      lastDistance.current = distance(active[0]!, active[1]!);
    }
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (!pointers.current.has(event.pointerId)) return;
      const point = eventPoint(event.currentTarget, event.clientX, event.clientY);
      pointers.current.set(event.pointerId, point);
      const active = [...pointers.current.values()];

      if (active.length === 1 && lastMidpoint.current) {
        const previous = lastMidpoint.current;
        const dx = active[0]!.x - previous.x;
        const dy = active[0]!.y - previous.y;
        if (Math.abs(dx) + Math.abs(dy) > 1.5) {
          moved.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        updateCamera((current) =>
          constrain({
            ...current,
            x: current.x + dx,
            y: current.y + dy,
          }),
        );
        lastMidpoint.current = active[0]!;
        return;
      }

      if (active.length === 2 && lastMidpoint.current && lastDistance.current) {
        const nextMidpoint = midpoint(active[0]!, active[1]!);
        const nextDistance = distance(active[0]!, active[1]!);
        const previousMidpoint = lastMidpoint.current;
        const previousDistance = lastDistance.current;
        moved.current = true;
        updateCamera((current) => {
          const scale = clamp(
            current.scale * (nextDistance / previousDistance),
            MIN_SCALE,
            MAX_SCALE,
          );
          const ratio = scale / current.scale;
          return constrain({
            scale,
            x: nextMidpoint.x - (previousMidpoint.x - current.x) * ratio,
            y: nextMidpoint.y - (previousMidpoint.y - current.y) * ratio,
          });
        });
        lastMidpoint.current = nextMidpoint;
        lastDistance.current = nextDistance;
      }
    },
    [constrain, updateCamera],
  );

  const onPointerUp = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    pointers.current.delete(event.pointerId);
    const active = [...pointers.current.values()];
    lastMidpoint.current = active[0]! ?? null;
    lastDistance.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<SVGSVGElement>) => {
      const panStep = 42;
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomBy(0.24);
      } else if (event.key === "-") {
        event.preventDefault();
        zoomBy(-0.24);
      } else if (event.key === "Home" || event.key === "0") {
        event.preventDefault();
        fit();
      } else if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        updateCamera((current) =>
          constrain({
            ...current,
            x:
              current.x +
              (event.key === "ArrowLeft" ? panStep : event.key === "ArrowRight" ? -panStep : 0),
            y:
              current.y +
              (event.key === "ArrowUp" ? panStep : event.key === "ArrowDown" ? -panStep : 0),
          }),
        );
      }
    },
    [constrain, fit, zoomBy, updateCamera],
  );

  const allowPlaceClick = useCallback(() => {
    const allowed = !moved.current;
    moved.current = false;
    return allowed;
  }, []);

  return {
    camera,
    onViewportChange,
    fit,
    focusOn,
    zoomAt,
    zoomBy,
    allowPlaceClick,
    handlers: {
      onWheel,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onKeyDown,
    },
  };
}
