"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Reveals its children when scrolled into view: the child stack fades +
// rises + de-blurs (see .reveal-card in globals.css). `delay` staggers a
// row of cards; the effect fires once, then the observer disconnects.
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // reduced-motion shows immediately via `show` below — no observer needed
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  // reduced-motion: appear instantly (derived, not set in the effect)
  const show = visible || reduced;

  return (
    <div
      ref={ref}
      className={`reveal-card ${show ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: show ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
