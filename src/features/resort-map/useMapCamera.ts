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

import {
  clamp,
  constrainMapCamera,
  fitMapCamera,
  focusMapCamera,
  overviewScale,
  MAX_MAP_SCALE,
  type MapCamera,
  type MapViewport,
} from "./map-camera";
export type { MapCamera } from "./map-camera";

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
  const [camera, setCamera] = useState<MapCamera>({ x: 0, y: 0, scale: 1 });
  const pointers = useRef(new Map<number, MapPoint>());
  const lastMidpoint = useRef<MapPoint | null>(null);
  const lastDistance = useRef<number | null>(null);
  const moved = useRef(false);
  const viewport = useRef<MapViewport>({
    x: 0,
    y: 0,
    ...MAP_SIZE,
    frame: { x: 0, y: 0, ...MAP_SIZE },
  });
  const viewMode = useRef<"overview" | "focus" | "manual">("overview");
  const focused = useRef<{ point: MapPoint; scale: number } | null>(null);
  const onViewportChange = useCallback((next: MapViewport) => {
    const previous = viewport.current;
    viewport.current = next;
    if (viewMode.current === "overview") setCamera(fitMapCamera(next));
    else if (viewMode.current === "focus" && focused.current) {
      setCamera(focusMapCamera(focused.current.point, focused.current.scale, next));
    } else {
      setCamera((current) =>
        constrainMapCamera(
          {
            ...current,
            x:
              current.x +
              next.frame.x +
              next.frame.width / 2 -
              previous.frame.x -
              previous.frame.width / 2,
            y:
              current.y +
              next.frame.y +
              next.frame.height / 2 -
              previous.frame.y -
              previous.frame.height / 2,
          },
          next,
        ),
      );
    }
  }, []);
  const constrain = useCallback(
    (next: MapCamera) => constrainMapCamera(next, viewport.current),
    [],
  );

  const zoomAt = useCallback(
    (nextScale: number, anchor: MapPoint) => {
      viewMode.current = "manual";
      setCamera((current) => {
        const scale = clamp(nextScale, overviewScale(viewport.current), MAX_MAP_SCALE);
        const ratio = scale / current.scale;
        return constrain({
          scale,
          x: anchor.x - (anchor.x - current.x) * ratio,
          y: anchor.y - (anchor.y - current.y) * ratio,
        });
      });
    },
    [constrain, setCamera],
  );

  const zoomBy = useCallback(
    (amount: number) => {
      viewMode.current = "manual";
      setCamera((current) => {
        const scale = clamp(current.scale + amount, overviewScale(viewport.current), MAX_MAP_SCALE);
        const ratio = scale / current.scale;
        const anchor = {
          x: viewport.current.frame.x + viewport.current.frame.width / 2,
          y: viewport.current.frame.y + viewport.current.frame.height / 2,
        };
        return constrain({
          scale,
          x: anchor.x - (anchor.x - current.x) * ratio,
          y: anchor.y - (anchor.y - current.y) * ratio,
        });
      });
    },
    [constrain, setCamera],
  );

  const fit = useCallback(() => {
    viewMode.current = "overview";
    setCamera(fitMapCamera(viewport.current));
  }, []);

  const focusOn = useCallback((point: MapPoint, scale = 1.8) => {
    const compact = typeof window !== "undefined" && window.innerWidth <= 820;
    const nextScale = clamp(
      scale * (compact ? 1.45 : 1),
      overviewScale(viewport.current),
      MAX_MAP_SCALE,
    );
    viewMode.current = "focus";
    focused.current = { point, scale: nextScale };
    setCamera(focusMapCamera(point, nextScale, viewport.current));
  }, []);

  const onWheel = useCallback(
    (event: ReactWheelEvent<SVGSVGElement>) => {
      viewMode.current = "manual";
      const point = eventPoint(event.currentTarget, event.clientX, event.clientY);
      setCamera((current) => {
        const scale = clamp(
          current.scale * Math.exp(-event.deltaY * 0.0014),
          overviewScale(viewport.current),
          MAX_MAP_SCALE,
        );
        const ratio = scale / current.scale;
        return constrain({
          scale,
          x: point.x - (point.x - current.x) * ratio,
          y: point.y - (point.y - current.y) * ratio,
        });
      });
    },
    [constrain, setCamera],
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
      viewMode.current = "manual";
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
        setCamera((current) =>
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
        setCamera((current) => {
          const scale = clamp(
            current.scale * (nextDistance / previousDistance),
            overviewScale(viewport.current),
            MAX_MAP_SCALE,
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
    [constrain, setCamera],
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
      const offsets: Record<string, MapPoint> = {
        ArrowLeft: { x: panStep, y: 0 },
        ArrowRight: { x: -panStep, y: 0 },
        ArrowUp: { x: 0, y: panStep },
        ArrowDown: { x: 0, y: -panStep },
      };
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
        viewMode.current = "manual";
        setCamera((current) =>
          constrain({
            ...current,
            x: current.x + (offsets[event.key]?.x ?? 0),
            y: current.y + (offsets[event.key]?.y ?? 0),
          }),
        );
      }
    },
    [constrain, fit, zoomBy, setCamera],
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
