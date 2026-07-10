"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Momentum smooth-scroll for the whole page. Native scrolling jumps a fixed
// distance per wheel notch, so each section arrives as a discrete step — a big
// part of why the page read "section by section". Lenis interpolates the scroll
// position every frame, so the page glides as one continuous surface and the
// scroll-linked reveals / seam connectors have a smooth signal to animate to.
//
// Lenis is driven from GSAP's ticker (autoRaf off) and pushes each scroll into
// ScrollTrigger.update, so every existing ScrollTrigger animation (the
// ExperienceStage card expand, TransformationJourney, …) stays perfectly in
// sync with the smoothed scroll instead of fighting a second rAF loop.
export default function SmoothScroll() {
  useEffect(() => {
    // Honour reduced-motion: fall back to the browser's native scrolling.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      lerp: 0.09, // lower = smoother/heavier glide; 0.09 ≈ premium keynote feel
      smoothWheel: true,
      // In-page #anchor clicks (navbar, "Explore Our Solutions") animate through
      // Lenis; offset clears the fixed navbar so headings aren't tucked under it.
      anchors: { offset: -84, duration: 1.15 },
    });

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // The preloader locks <html> overflow for ~2s; once it releases (and fonts
    // settle) recompute Lenis dimensions + ScrollTrigger positions.
    const settle = window.setTimeout(() => {
      lenis.resize();
      ScrollTrigger.refresh();
    }, 2900);

    return () => {
      window.clearTimeout(settle);
      gsap.ticker.remove(onTick);
      lenis.off("scroll", ScrollTrigger.update);
      lenis.destroy();
    };
  }, []);

  return null;
}
