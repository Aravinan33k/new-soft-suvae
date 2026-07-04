"use client";

import { useEffect } from "react";

// Global cursor parallax: any element with data-parallax="N" drifts up to
// N px toward the cursor (negative N drifts away — used on backgrounds so
// they separate from the content). One listener + one rAF loop for the
// whole page; positions are eased so motion stays soft. Renders nothing.
//
// Animates the standalone `translate` property, which composes with the
// transform-based float/reveal animations already on these elements.
// Don't tag elements that use Tailwind translate-* utilities.
export default function MouseParallax() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return; // touch

    const items = Array.from(
      document.querySelectorAll<HTMLElement>("[data-parallax]"),
    ).map((el) => ({
      el,
      strength: parseFloat(el.dataset.parallax || "3"),
      x: 0,
      y: 0,
    }));
    if (!items.length) return;

    let targetX = 0;
    let targetY = 0;
    let raf = 0;
    let running = false;

    const loop = () => {
      let settled = true;
      for (const it of items) {
        const gx = targetX * it.strength;
        const gy = targetY * it.strength;
        it.x += (gx - it.x) * 0.07;
        it.y += (gy - it.y) * 0.07;
        if (Math.abs(gx - it.x) > 0.02 || Math.abs(gy - it.y) > 0.02)
          settled = false;
        it.el.style.translate = `${it.x.toFixed(2)}px ${it.y.toFixed(2)}px`;
      }
      if (settled) {
        running = false;
      } else {
        raf = requestAnimationFrame(loop);
      }
    };

    const onMove = (e: MouseEvent) => {
      // -1..1 from viewport center
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
