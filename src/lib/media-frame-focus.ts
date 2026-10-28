// Cross-origin clicks do not bubble into the hub. Observe focus entering known
// player frames, including keyboard/touch activation, without adding a click layer.
const frames = new Map<HTMLIFrameElement, () => void>();
let pending: ReturnType<typeof setTimeout> | undefined;
let interval: ReturnType<typeof setInterval> | undefined;
let focused: Element | null = null;

function inspectFocus() {
  if (!document.hasFocus()) return;
  const active = document.activeElement;
  if (active === focused) return;
  focused = active;
  if (active instanceof HTMLIFrameElement) frames.get(active)?.();
}

function afterBlur() {
  if (pending) clearTimeout(pending);
  pending = setTimeout(() => {
    pending = undefined;
    inspectFocus();
  }, 0);
}

export function observeMediaFrameFocus(frame: HTMLIFrameElement, activate: () => void) {
  if (!frames.size) {
    window.addEventListener("blur", afterBlur);
    document.addEventListener("focusin", inspectFocus);
    // Safari does not emit another parent blur when focus moves between two
    // cross-origin frames. One cheap activeElement check covers that transition;
    // it runs only while a card has embedded players, never on the idle home page.
    interval = setInterval(inspectFocus, 100);
  }
  frames.set(frame, activate);
  const onFocus = () => {
    focused = frame;
    activate();
  };
  frame.addEventListener("focus", onFocus);
  if (document.activeElement === frame) {
    focused = null;
    inspectFocus();
  }
  return () => {
    frame.removeEventListener("focus", onFocus);
    frames.delete(frame);
    if (!frames.size) {
      window.removeEventListener("blur", afterBlur);
      document.removeEventListener("focusin", inspectFocus);
      if (pending) clearTimeout(pending);
      pending = undefined;
      if (interval) clearInterval(interval);
      interval = undefined;
      focused = null;
    }
  };
}
