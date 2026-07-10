"use client";

import { useEffect, useRef } from "react";
import { observeReveal } from "@/lib/scrollReveal";

// A thread that literally bridges two sections. As the seam scrolls into view a
// glowing line draws downward and a bright node travels along it from the
// section above into the section below — the eye is carried across the gap
// instead of the next section simply appearing. Uses the same scroll-linked
// `--rv` signal as the reveals, so the whole page animates off one continuous
// scroll surface. Purely decorative (aria-hidden) and reduced-motion aware.
export default function SeamConnector({
  height = 128,
  className = "",
}: {
  /** pixel height of the connective thread */
  height?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--rv", "1");
      return;
    }
    return observeReveal(el, { start: 0.96, end: 0.52 });
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`seam ${className}`}
      style={{ height, ["--rv" as string]: "0" }}
    >
      <span className="seam-line" />
      <span className="seam-node" />
    </div>
  );
}
