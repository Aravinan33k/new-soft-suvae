"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { observeReveal } from "@/lib/scrollReveal";

// Reveals its children as they scroll into view. The motion is tied
// CONTINUOUSLY to scroll position (via the shared `--rv` controller and the
// `.rv-item` CSS below in globals.css) — the stack rises, fades and de-blurs in
// lock-step with the scroll rather than popping on at a threshold, so sections
// hand off to one another. `delay` nudges the reveal window a touch later so a
// row of cards fans in. Respects prefers-reduced-motion (shows instantly).
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  /** ms-style stagger; mapped to a small offset in the scroll reveal window */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.style.setProperty("--rv", "1");
      return;
    }
    // Later items start (and finish) a little further up the viewport so a row
    // fans in instead of arriving all at once. Capped so it stays subtle.
    const off = Math.min(delay, 400) / 4000; // 0–0.1 vh
    return observeReveal(el, { start: 0.9 - off, end: 0.58 - off });
  }, [reduced, delay]);

  return (
    <div
      ref={ref}
      className={`rv-item ${className}`}
      style={{ ["--rv" as string]: "0" }}
    >
      {children}
    </div>
  );
}
