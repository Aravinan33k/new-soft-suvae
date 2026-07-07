"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Footer finale — the logo IS a particle system. No logo image is rendered
// anywhere: free-floating glowing particles drift, connect into a neural
// network, and organize themselves into the Soft Suave mark (positions
// sampled from the brand SVG's path data offscreen). Once formed, the mark
// keeps living — shimmering particles, pulsing links, the odd particle
// detaching and rejoining. The wordmark text fades in after the mark forms.
// Replays on re-entering the viewport; prefers-reduced-motion shows the
// formed state immediately.
const LogoParticles = dynamic(
  () => import("@/components/canvas/LogoParticles"),
  { ssr: false, loading: () => null },
);

export default function SiteFooter() {
  const wrapRef = useRef<HTMLElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [formed, setFormed] = useState(false);
  const [center, setCenter] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // where the mark should form: the slot's centre, relative to the footer
  useEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      const slot = slotRef.current;
      if (!wrap || !slot) return;
      const wr = wrap.getBoundingClientRect();
      const sr = slot.getBoundingClientRect();
      setCenter({
        x: sr.left - wr.left + sr.width / 2,
        y: sr.top - wr.top + sr.height / 2,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.25 },
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, []);

  // wordmark appears when the swarm reports the mark has assembled — driven
  // by the animation clock (onFormed), not wall-clock, so it can't desync
  // when rendering is throttled
  const onFormed = useCallback(() => setFormed(true), []);
  useEffect(() => {
    if (reduced) setFormed(true);
    else if (!active) setFormed(false);
  }, [active, reduced]);

  return (
    <footer
      ref={wrapRef}
      className="relative z-10 mt-24 overflow-hidden border-t border-white/[0.08]"
    >
      {/* the particle system covers the footer; the mark forms in the slot */}
      <div className="pointer-events-none absolute inset-0">
        <LogoParticles
          active={active}
          reduced={reduced}
          center={center}
          onFormed={onFormed}
        />
      </div>

      <div className="relative mx-auto flex max-w-[85rem] flex-col items-center px-6 py-24 text-center">
        {/* empty slot the particles assemble into — never an image */}
        <div ref={slotRef} aria-label="Soft Suave" role="img" className="h-40 w-40" />

        {/* Company wordmark — fades in once the mark has formed, then remains */}
        <p
          className="mt-5 text-2xl font-bold tracking-tight text-white transition-all duration-700"
          style={{
            opacity: formed ? 1 : 0,
            transform: formed ? "translateY(0)" : "translateY(8px)",
          }}
        >
          Soft Suave
        </p>
        <p className="mt-8 text-sm">
          <a
            href="mailto:softsuave.ai@gmail.com"
            className="text-[#FF8A3D] transition-colors hover:text-[#FFB057]"
          >
            softsuave.ai@gmail.com
          </a>
        </p>
        <p className="mt-3 text-xs text-zinc-600">
          © 2026 Soft Suave. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
