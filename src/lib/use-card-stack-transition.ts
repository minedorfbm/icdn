import {
  useCallback,
  useLayoutEffect,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import {
  STACK_DURATION,
  STACK_EASING,
  stackNavigationFrame,
  type StackBox,
} from "./card-stack-motion";

type Snapshot = {
  transform: string;
  opacity: string;
  translate: string;
  scale: string;
  shade: string;
};
type Pending = { from: number; to: number; cards: Map<string, Snapshot> };

const options = { duration: STACK_DURATION, easing: STACK_EASING };

function animateCard(card: HTMLElement, transition: Pending, index: number, box: StackBox) {
  const animations: Animation[] = [];
  const offset = Number(card.dataset["cardOffset"]),
    delta = index - transition.from;
  const snapshot = transition.cards.get(card.dataset["destinationId"]!);
  const poses = [0, 0.2, 0.45, 0.7, 1].map((progress) => ({
    offset: progress,
    ...stackNavigationFrame(offset + delta, delta, progress, box),
  }));
  const frames = poses.map((pose) => ({
    offset: pose.offset,
    transform: pose.transform,
    opacity: pose.opacity,
  }));
  if (snapshot)
    frames[0] = { offset: 0, transform: snapshot.transform, opacity: Number(snapshot.opacity) };
  animations.push(card.animate(frames, options));
  const photo = card.querySelector(".destination-panel > picture > img");
  if (photo) {
    const frames = poses.map((pose) => ({
      offset: pose.offset,
      translate: `${pose.photoX}px 0`,
      scale: String(pose.photoScale),
    }));
    if (snapshot) frames[0] = { offset: 0, translate: snapshot.translate, scale: snapshot.scale };
    animations.push(photo.animate(frames, options));
  }
  const shade = card.querySelector("[data-card-shade]");
  if (shade) {
    const frames = poses.map((pose) => ({ offset: pose.offset, opacity: 1 - pose.brightness }));
    if (snapshot) frames[0] = { offset: 0, opacity: Number(snapshot.shade) };
    animations.push(shade.animate(frames, options));
  }
  return animations;
}

/** Clicks run a short native timeline; React and layout do not update on each frame. */
export function useCardStackTransition(
  stage: RefObject<HTMLDivElement | null>,
  metrics: RefObject<StackBox>,
  index: number,
  count: number,
  reduced: boolean,
  onIndexChange: Dispatch<SetStateAction<number>>,
) {
  const pending = useRef<Pending | null>(null);
  const playing = useRef<Animation[]>([]);
  const stop = useCallback(() => {
    for (const animation of playing.current) animation.cancel();
    playing.current = [];
    if (stage.current) delete stage.current.dataset["cardNavigation"];
  }, [stage]);

  const select = useCallback(
    (requested: number) => {
      const target = Math.min(count - 1, Math.max(0, requested));
      if (target === index) return;
      const cards = new Map<string, Snapshot>();
      if (!reduced)
        for (const card of stage.current?.querySelectorAll<HTMLElement>(".perspective-card") ??
          []) {
          const photo = card.querySelector(".destination-panel > picture > img");
          const shade = card.querySelector("[data-card-shade]");
          if (!photo || !shade) continue;
          const style = getComputedStyle(card),
            image = getComputedStyle(photo);
          cards.set(card.dataset["destinationId"]!, {
            transform: style.transform,
            opacity: style.opacity,
            translate: image.translate,
            scale: image.scale,
            shade: getComputedStyle(shade).opacity,
          });
        }
      stop();
      pending.current = reduced ? null : { from: index, to: target, cards };
      onIndexChange(target);
    },
    [count, index, onIndexChange, reduced, stage, stop],
  );

  useLayoutEffect(() => {
    const transition = pending.current;
    pending.current = null;
    if (reduced) {
      stop();
      return;
    }
    if (!transition || transition.to !== index || !stage.current) return;
    const animations: Animation[] = [];
    for (const card of stage.current.querySelectorAll<HTMLElement>(".perspective-card"))
      animations.push(...animateCard(card, transition, index, metrics.current));
    playing.current = animations;
    stage.current.dataset["cardNavigation"] = "true";
    // A browser may cancel an individual photo effect. Still release this
    // transition after the remaining effects finish; never stop its successor.
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (playing.current === animations) stop();
    });
  }, [index, metrics, reduced, stage, stop]);

  useLayoutEffect(() => stop, [stop]);
  return { select, stop };
}
