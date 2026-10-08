"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Text whose letters scatter away from the cursor. A <ScatterArea> is the boundary: while the
// cursor is inside it, every <Letters> letter near the cursor is pushed away and fades; when the
// cursor leaves the boundary, all letters glide back. Listens on the window, so the area can
// stay `pointer-events: none` (the Home robot keeps tracking the cursor through the text).

const RADIUS = 90; // px around the cursor that letters flee from
const PUSH = 0.7; // how far a letter is pushed, relative to how deep the cursor is

interface LetterState {
  el: HTMLElement;
  x: number; // resting centre, page coordinates
  y: number;
}

export function ScatterArea({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const area = ref.current;
    if (!area) return;
    // Touch screens have no hover, so the effect never shows - and measuring every letter on
    // each pointer event is exactly the work a phone can least afford.
    const skip =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (skip) return;

    let letters: LetterState[] = [];
    let inside = false;
    let frame = 0;

    // Measure resting positions (transforms cleared first, so moved letters measure true).
    const measure = () => {
      const els = [...area.querySelectorAll<HTMLElement>("[data-letter]")];
      els.forEach((el) => (el.style.transform = ""));
      letters = els.map((el) => {
        const r = el.getBoundingClientRect();
        return { el, x: r.left + r.width / 2 + window.scrollX, y: r.top + r.height / 2 + window.scrollY };
      });
    };

    const reset = () => {
      letters.forEach(({ el }) => {
        el.style.transform = "";
        el.style.opacity = "";
      });
    };

    const update = (px: number, py: number) => {
      letters.forEach(({ el, x, y }) => {
        const dx = x - px;
        const dy = y - py;
        const d = Math.hypot(dx, dy);
        if (d >= RADIUS) {
          el.style.transform = "";
          el.style.opacity = "";
          return;
        }
        const depth = (RADIUS - d) / RADIUS;
        const ux = d ? dx / d : 0;
        const uy = d ? dy / d : -1;
        const push = RADIUS * depth * PUSH;
        el.style.transform = `translate(${(ux * push).toFixed(1)}px, ${(uy * push).toFixed(1)}px) rotate(${(ux * depth * 40).toFixed(1)}deg)`;
        el.style.opacity = (1 - depth * 0.9).toFixed(2);
      });
    };

    const onMove = (event: PointerEvent) => {
      const r = area.getBoundingClientRect();
      const nowInside =
        event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
      if (nowInside && !inside) measure();
      inside = nowInside;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        inside ? update(event.clientX + window.scrollX, event.clientY + window.scrollY) : reset(),
      );
    };
    const onLeaveWindow = () => {
      inside = false;
      reset();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeaveWindow);
    window.addEventListener("resize", onLeaveWindow);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeaveWindow);
      window.removeEventListener("resize", onLeaveWindow);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Splits text into letters for <ScatterArea>. Words stay unbroken so lines wrap normally. */
export function Letters({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className} aria-label={text} role="text">
      {text.split(" ").map((word, w, words) => (
        <span key={w} className="inline-block whitespace-nowrap" aria-hidden>
          {[...word].map((char, c) => (
            <span
              key={c}
              data-letter
              className={cn("inline-block transition-[transform,opacity] duration-500 ease-out will-change-transform")}
            >
              {char}
            </span>
          ))}
          {w < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}
