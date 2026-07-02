"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState } from "@/lib/scrollState";

// Lenis smooths the raw wheel input, GSAP's ticker drives it, and one
// ScrollTrigger maps whole-page progress (0..1) into scrollState for the
// canvas to consume. No React state — nothing re-renders on scroll.
export default function ScrollAnimation() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const trigger = ScrollTrigger.create({
      start: 0,
      end: () => document.documentElement.scrollHeight - window.innerHeight,
      onUpdate: (self) => {
        scrollState.progress = self.progress;
      },
    });

    return () => {
      trigger.kill();
      gsap.ticker.remove(tick);
      lenis.destroy();
      scrollState.progress = 0;
    };
  }, []);

  return null;
}
