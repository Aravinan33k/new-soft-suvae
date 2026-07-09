"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Animated statistic: counts 0 → target with ease-out once the element
// scrolls into view. Takes the display string as-is ("50+", "99.9%",
// "24/7") and animates the leading number while preserving the rest,
// so the data arrays in page.tsx stay plain strings.
export default function CountUp({
  value,
  duration = 2000,
}: {
  value: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const match = value.match(/^(\d+(?:\.\d+)?)(.*)$/);
  const target = match ? parseFloat(match[1]) : null;
  const suffix = match ? match[2] : "";
  const decimals = match && match[1].includes(".") ? match[1].split(".")[1].length : 0;
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(target === null ? value : "0" + suffix);

  useEffect(() => {
    if (target === null || reduced) return; // reduced-motion shows final below
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
          setDisplay((target * eased).toFixed(decimals) + suffix);
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // reduced-motion: show the final value straight away (derived in render)
  const shown = reduced && target !== null ? value : display;
  return <span ref={ref}>{shown}</span>;
}
