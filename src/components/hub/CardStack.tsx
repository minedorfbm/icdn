import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { DestinationPanel } from "./DestinationPanel";
import { useDestinationNavigation } from "@/lib/use-destination-navigation";
import type { Destination } from "@/data/resort";
import { swipeStep } from "@/lib/card-swipe";
import {
  stackFrame,
  stackPhoto,
  STACK_ORIGIN,
  STACK_SETTLE,
  STACK_VISIBLE,
  type StackBox,
  type StackOrigin,
} from "@/lib/card-stack-motion";
import "./card-stack-motion.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n";
import { coverImageSizes } from "@/lib/responsive-image";
import { useCardImageReadiness } from "@/lib/use-card-image-readiness";
import { useCardImageSize } from "@/lib/use-card-image-size";
import { useCardStackTransition } from "@/lib/use-card-stack-transition";
import { useLocation } from "@tanstack/react-router";

/** A front-facing hero and two receding previews, all sharing one responsive stage. */

export function CardStack({
  items,
  near,
  index,
  onIndexChange,
  layout = "journey",
}: Readonly<{
  items: Destination[];
  near: boolean;
  layout?: "journey" | "discovery";
  index: number;
  onIndexChange: Dispatch<SetStateAction<number>>;
}>) {
  const [drag, setDrag] = useState(0); // px, negative = pulling next card in
  const [dragging, setDragging] = useState(false);
  const [reduced, setReduced] = useState(false);
  const metrics = useRef<StackBox>({ width: 0, height: 0, top: 0, stageHeight: 0 });
  const origin = useRef<StackOrigin>({ ...STACK_ORIGIN });
  const settling = useRef<{ index: number; position: number; x: number } | null>(null);
  const { stage, box } = useCardImageSize(items.length, layout);
  const { canLoad, onSettled } = useCardImageReadiness(items, index, near, Boolean(box));
  const { openDestination } = useDestinationNavigation();
  const pathname = useLocation({ select: (location) => location.pathname });
  const { t } = useI18n();
  const moved = useRef(false);
  const frame = useRef<number | null>(null);
  const pendingDrag = useRef(0);
  const travel = useRef(260);
  const cancelFrame = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  };
  const start = useRef<{
    x: number;
    y: number;
    pointerId: number;
    lastX: number;
    lastT: number;
    v: number;
    locked: null | boolean;
  } | null>(null);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    const element = stage.current;
    const card = element?.querySelector<HTMLElement>(".perspective-card");
    if (box && element && card)
      metrics.current = { ...box, top: card.offsetTop, stageHeight: element.clientHeight };
  }, [box, stage]);

  useLayoutEffect(() => {
    for (const element of stage.current?.querySelectorAll<HTMLElement>(".perspective-card") ?? []) {
      const photo = element.querySelector<HTMLImageElement>(".destination-panel > picture > img");
      if (!photo) continue;
      const offset = Number(element.dataset["cardOffset"]);
      const position =
        offset + (dragging && !reduced ? origin.current.position + drag / travel.current : 0);
      const photoMotion = stackPhoto(offset, position, metrics.current.width, reduced);
      const translate = `${photoMotion.photoX}px 0`,
        scale = String(photoMotion.photoScale);
      if (photo.style.translate !== translate) photo.style.translate = translate;
      if (photo.style.scale !== scale) photo.style.scale = scale;
    }
  }, [drag, dragging, index, items, box, reduced, stage]);

  const { select: selectCard, stop: stopNavigation } = useCardStackTransition(
    stage,
    metrics,
    index,
    items.length,
    reduced,
    onIndexChange,
  );

  useEffect(() => {
    stopNavigation();
    cancelFrame();
    start.current = null;
    pendingDrag.current = 0;
    origin.current = { ...STACK_ORIGIN };
    settling.current = null;
    setDragging(false);
    setDrag(0);
    return cancelFrame;
  }, [items, stopNavigation]);

  const panels = useMemo(
    () =>
      items.map((dest, i) => (
        <DestinationPanel
          key={dest.id}
          dest={dest}
          active={i === index}
          priority={near && i === index}
          prepareDetail={near && i === index && (pathname === "/" || pathname === "/surprise-me")}
          near={canLoad(dest)}
          onImageSettled={() => onSettled(dest)}
          imageSizes={box ? coverImageSizes(dest.image, box) : undefined}
          onOpen={() =>
            i === index
              ? openDestination(
                  dest.id,
                  items.map((item) => item.id),
                )
              : selectCard(i)
          }
        />
      )),
    [items, index, near, box, selectCard, openDestination, canLoad, onSettled, pathname],
  );

  if (items.length === 0) return null;

  const last = items.length - 1;
  const clamp = (i: number) => Math.min(last, Math.max(0, i));

  const captureOrigin = () => {
    const active = stage.current?.querySelector<HTMLElement>(
      '.destination-panel[aria-hidden="false"]',
    )?.parentElement;
    if (!active || reduced) {
      origin.current = { ...STACK_ORIGIN };
      return;
    }
    const matrix = new DOMMatrix(getComputedStyle(active).transform);
    const width = metrics.current.width;
    const x = matrix.m41 - (width * 4) / 75;
    const lastSettle = stage.current?.dataset["cardNavigation"] ? null : settling.current;
    const span = width * (x < 0 ? 92 / 75 : 18 / 75);
    const position =
      lastSettle?.index === index && Math.abs(lastSettle.x) > 0.01
        ? lastSettle.position * Math.min(1, Math.max(0, x / lastSettle.x))
        : x / Math.max(1, span);
    origin.current = {
      position: Math.min(1, Math.max(-1, position)),
      x,
      y: matrix.m42,
      tilt: (Math.atan2(matrix.m12, matrix.m22) * 180) / Math.PI,
      scale: Math.hypot(matrix.m12, matrix.m22),
      rotation: (Math.atan2(-matrix.m13, matrix.m11) * 180) / Math.PI,
    };
  };

  const onDown = (e: React.PointerEvent) => {
    if (!e.isPrimary || e.button !== 0 || start.current) return;
    travel.current = Math.max(1, e.currentTarget.getBoundingClientRect().width * 0.75);
    moved.current = false;
    start.current = {
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
      lastX: e.clientX,
      lastT: e.timeStamp,
      v: 0,
      locked: null,
    };
  };

  const onMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (s?.pointerId !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (s.locked === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      // only card navigation when horizontal clearly exceeds vertical
      s.locked = Math.abs(dx) > Math.abs(dy) * 1.2;
      if (s.locked) {
        captureOrigin();
        stopNavigation();
        setDragging(true);
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }
    }
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved.current = true;
    if (!s.locked) return;

    const dt = Math.max(1, e.timeStamp - s.lastT);
    s.v = (e.clientX - s.lastX) / dt; // px per ms
    s.lastX = e.clientX;
    s.lastT = e.timeStamp;

    // rubber band at both ends
    const atStart = index === 0 && dx > 0;
    const atEnd = index === last && dx < 0;
    pendingDrag.current =
      atStart || atEnd ? dx * 0.25 : Math.max(-travel.current, Math.min(travel.current, dx));
    frame.current ??= requestAnimationFrame(() => {
      frame.current = null;
      setDrag(pendingDrag.current);
    });
  };

  const finish = (e: React.PointerEvent, cancelled = false) => {
    const s = start.current;
    if (s?.pointerId !== e.pointerId) return;
    cancelFrame();
    start.current = null;
    setDragging(false);
    if (s.locked) {
      const step = cancelled
        ? 0
        : swipeStep(pendingDrag.current, travel.current, s.v, e.timeStamp - s.lastT);
      const target = clamp(index + step),
        offset = target - index;
      const from = stackFrame(
        offset,
        pendingDrag.current,
        travel.current,
        true,
        metrics.current,
        origin.current,
        reduced,
      );
      const active = stage.current?.querySelector<HTMLElement>(
        `.perspective-card[data-card-offset="${offset}"]`,
      );
      const fromX = active
        ? new DOMMatrix(getComputedStyle(active).transform).m41 - (metrics.current.width * 4) / 75
        : 0;
      settling.current = { index: target, position: from.position, x: fromX };
      origin.current = { ...STACK_ORIGIN };
      if (!cancelled) onIndexChange((i) => clamp(i + step));
    }
    if (cancelled) moved.current = true;
    pendingDrag.current = 0;
    setDrag(0);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className={`w-full select-none ${layout === "discovery" ? "discovery-stack" : ""}`}>
      {/* single shared stage */}
      <div
        ref={stage}
        data-card-dragging={dragging ? "true" : undefined}
        className="card-stack-stage relative grid w-full touch-pan-y overflow-hidden py-6"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={(e) => finish(e)}
        onPointerCancel={(e) => finish(e, true)}
        onLostPointerCapture={(e) => {
          // Touch starts with implicit capture on the child under the finger.
          // Its loss bubbles when capture transfers to this stage; the drag is still active.
          if (e.target === e.currentTarget) finish(e, true);
        }}
      >
        {items.map((dest, i) => {
          const offset = i - index;
          if (offset < -1 || offset > STACK_VISIBLE) return null;

          const pose = stackFrame(
            offset,
            drag,
            travel.current,
            dragging,
            metrics.current,
            origin.current,
            reduced,
          );
          const active = offset === 0;

          return (
            <div
              key={dest.id}
              data-destination-id={dest.id}
              data-card-offset={offset}
              className={`perspective-card relative col-start-1 row-start-1 h-[90svh] w-[75%] origin-left ${near ? "will-change-transform" : ""}`}
              style={{
                height: layout === "discovery" ? "var(--discovery-card-height)" : undefined,
                transform: pose.transform,
                zIndex: pose.zIndex,
                opacity: pose.opacity,
                pointerEvents: pose.opacity === 0 ? "none" : undefined,
                transition: dragging
                  ? "none"
                  : `transform ${STACK_SETTLE}, opacity ${STACK_SETTLE}`,
                cursor: "pointer",
              }}
              onClickCapture={(e) => {
                if (moved.current && e.detail > 0) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              {panels[i]}
              {!active && (
                <button
                  type="button"
                  aria-label={dest.name}
                  aria-hidden
                  tabIndex={-1}
                  className="absolute inset-0 rounded-[18px]"
                  onClick={() => selectCard(i)}
                />
              )}
              <div
                aria-hidden
                data-card-shade
                className="pointer-events-none absolute inset-0 rounded-[18px] bg-black"
                style={{
                  opacity: 1 - pose.brightness,
                  transition: dragging ? "none" : `opacity ${STACK_SETTLE}`,
                }}
              />
            </div>
          );
        })}
      </div>

      {layout === "journey" && (
        <div className="card-stack-pagination mx-auto mt-3 flex max-w-[740px] items-center gap-4 px-6">
          <span
            className="min-w-16 font-serif text-[24px] leading-none tabular-nums"
            aria-live="polite"
          >
            {String(index + 1).padStart(2, "0")}
            <span className="ml-1 text-[length:var(--readable-15)] opacity-50">
              / {String(items.length).padStart(2, "0")}
            </span>
          </span>
          <div className="h-px flex-1 bg-current/25" aria-hidden>
            <div
              data-card-progress
              className="h-px w-full origin-left bg-current"
              style={{
                transform: `scaleX(${Math.min(items.length, Math.max(1, index + 1 - (dragging && !reduced ? origin.current.position + drag / travel.current : 0))) / items.length})`,
                transition: dragging ? "none" : `transform ${STACK_SETTLE}`,
              }}
            />
          </div>
          <div className="chapter-deck-controls">
            <button
              type="button"
              aria-label={`${t("previous_discovery")} · ${items[index - 1]?.name ?? ""}`}
              disabled={index === 0}
              onClick={() => selectCard(index - 1)}
            >
              <ChevronLeft size={19} strokeWidth={1.4} aria-hidden />
            </button>
            <button
              type="button"
              aria-label={`${t("continue_journey")} · ${items[index + 1]?.name ?? ""}`}
              disabled={index === last}
              onClick={() => selectCard(index + 1)}
            >
              <ChevronRight size={19} strokeWidth={1.4} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
