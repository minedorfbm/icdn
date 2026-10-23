import { useEffect, useId, useRef, type CSSProperties } from "react";
import type { Level } from "@/data/resort";
import "./atmospheric-transitions.css";

export function AtmosphericTransition({ from, to }: Readonly<{ from: Level; to: Level }>) {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const id = useId().replaceAll(":", "");

  useEffect(() => {
    const element = ref.current;
    const canvas = canvasRef.current;
    if (!element || !canvas || !("IntersectionObserver" in window) || !("ResizeObserver" in window))
      return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let visible = false;
    let loading = false;
    let failed = false;
    let frame = 0;
    let renderer: ReturnType<
      typeof import("@/lib/atmospheric-renderer").createAtmosphericRenderer
    > = null;
    const fallback = () => {
      renderer?.dispose();
      renderer = null;
      element.dataset["renderer"] = "fallback";
    };
    const paint = () => {
      frame = 0;
      if (disposed || !visible || document.hidden || motion.matches || !renderer) return;
      const bounds = element.getBoundingClientRect();
      const progress = Math.max(
        0,
        Math.min(1, (innerHeight - bounds.top) / (innerHeight + bounds.height)),
      );
      renderer.draw(progress);
      element.dataset["renderer"] = "webgl";
    };
    const schedule = () => {
      if (!frame && visible && !motion.matches && !document.hidden)
        frame = requestAnimationFrame(paint);
    };
    const activate = async () => {
      if (disposed || motion.matches || failed || loading || renderer || !visible) return;
      loading = true;
      try {
        const { createAtmosphericRenderer } = await import("@/lib/atmospheric-renderer");
        if (disposed || motion.matches) return;
        renderer = createAtmosphericRenderer(
          canvas,
          from === "heaven" ? 0 : from === "sky" ? 1 : 2,
        );
        failed = !renderer;
        schedule();
      } catch {
        failed = true;
        fallback();
      } finally {
        loading = false;
      }
    };
    const preferenceChanged = () => {
      if (motion.matches) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        fallback();
      } else void activate();
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      failed = true;
      fallback();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible) {
        void activate();
        schedule();
      }
    });
    observer.observe(element);
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    motion.addEventListener("change", preferenceChanged);
    canvas.addEventListener("webglcontextlost", contextLost);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      motion.removeEventListener("change", preferenceChanged);
      canvas.removeEventListener("webglcontextlost", contextLost);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      fallback();
    };
  }, [from]);

  return (
    <div
      ref={ref}
      className="chapter-gradient"
      data-atmosphere={from}
      data-renderer="fallback"
      aria-hidden="true"
      style={
        {
          "--chapter-from": `var(--world-${from})`,
          "--chapter-to": `var(--world-${to})`,
        } as CSSProperties
      }
    >
      <svg className="chapter-fluid-fallback" viewBox="0 0 1440 240" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`${id}-base`} x2="0" y2="1">
            <stop stopColor="var(--chapter-from)" />
            <stop offset="1" stopColor="var(--chapter-to)" />
          </linearGradient>
          <linearGradient id={`${id}-veil`} x2="0" y2="1">
            <stop stopColor="var(--chapter-from)" />
            <stop offset="1" stopColor="var(--chapter-to)" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path fill={`url(#${id}-base)`} d="M0 0H1440V240H0Z" />
        <path fill={`url(#${id}-veil)`} d="M0 0H1440V80C1150 220 1000 20 740 112S240 175 0 52Z" />
        <path
          fill="none"
          stroke="var(--world-sea)"
          strokeOpacity="0.35"
          d="M0 94C240 206 520 24 740 130S1200 180 1440 97"
        />
      </svg>
      <canvas ref={canvasRef} className="chapter-fluid-canvas" />
    </div>
  );
}
