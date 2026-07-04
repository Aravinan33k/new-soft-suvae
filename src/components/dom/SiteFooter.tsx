"use client";

import { useEffect, useRef } from "react";

type Node = {
  hx: number; // scattered "home" x, normalized 0..1
  hy: number;
  ca: number; // angle in the collapsed cluster
  cr: number; // radius in the collapsed cluster (px)
  r: number; // dot radius
};
type Star = {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  amp: number;
};

const NODE_COUNT = 46;
const STAR_COUNT = 72;
const LINK_DIST = 122;

// Sequenced timeline (seconds after the footer scrolls into view):
const COLLAPSE_END = 2.0; // particles → network collapses into the logo
const PULSE_END = 2.7; // logo forms → a glow pulse + shockwave ring
const FADE_END = 3.9; // everything (network + stars) fades except the logo
//                       → logo + company name then simply remain, held.

// Footer finale. A scattered node field collapses inward into the logo,
// the logo "forms" and fires a single glow pulse, then the whole network
// and starfield fade away — leaving only the glowing logo and the
// "Soft Suave" wordmark held on screen so the brand is the last thing
// the viewer sees. The timeline restarts when scrolled away and back;
// prefers-reduced-motion jumps straight to the held end state.
export default function SiteFooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLParagraphElement>(null);
  const wrapRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const wrap = wrapRef.current;
    if (!canvas || !ctx || !wrap) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let targetX = 0;
    let targetY = 0;
    let nodes: Node[] = [];
    let stars: Star[] = [];
    let raf = 0;
    // T = seconds elapsed inside the viewport; large value = held end state
    let T = reduceMotion ? 999 : 0;
    let inView = false;
    let last = performance.now();
    let starClock = 0;

    function seed() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // collapse target = the logo's real center relative to the canvas
      targetX = width / 2;
      targetY = height * 0.34;
      const lr = logoRef.current?.getBoundingClientRect();
      if (lr) {
        targetX = lr.left - rect.left + lr.width / 2;
        targetY = lr.top - rect.top + lr.height / 2;
      }

      nodes = Array.from({ length: NODE_COUNT }, () => ({
        hx: Math.random(),
        hy: Math.random(),
        ca: Math.random() * Math.PI * 2,
        cr: 6 + Math.random() * 48,
        r: 0.8 + Math.random() * 1.4,
      }));

      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.4 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.4,
        amp: 0.2 + Math.random() * 0.5,
      }));
    }

    const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
    const easeInOut = (t: number) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const px: number[] = [];
    const py: number[] = [];
    function positions(e: number) {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const sx = n.hx * width;
        const sy = n.hy * height;
        const clx = targetX + Math.cos(n.ca) * n.cr;
        const cly = targetY + Math.sin(n.ca) * n.cr;
        px[i] = sx + (clx - sx) * e;
        py[i] = sy + (cly - sy) * e;
      }
    }

    function draw(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!reduceMotion) {
        if (inView) T += dt;
        else T = 0; // reset so it replays fresh next time it enters view
      }

      // ── derive the phase values from the single timeline T ──────────
      const pCollapse = clamp01(T / COLLAPSE_END); // 0→1 collapse, then holds
      const e = easeInOut(pCollapse);
      // single glow pulse right as the logo "forms"
      const pulse =
        T > COLLAPSE_END && T < PULSE_END
          ? Math.sin(((T - COLLAPSE_END) / (PULSE_END - COLLAPSE_END)) * Math.PI)
          : 0;
      // network + stars fade out after the pulse, revealing just the logo
      const netAlpha = 1 - clamp01((T - PULSE_END) / (FADE_END - PULSE_END));
      // company name fades in as the network clears, then remains
      const nameAmt = clamp01((T - (PULSE_END - 0.1)) / 0.7);
      const glow = pCollapse; // logo stays lit once formed
      const logoGlow = Math.min(1, glow + pulse * 0.9);

      starClock += dt * (1 - 0.92 * pCollapse); // stars slow as we collapse

      ctx!.clearRect(0, 0, width, height);

      // twinkling starfield — slows, then fades with the network
      for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(starClock * s.speed + s.phase);
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(255,240,220,${(0.1 + tw * s.amp) * 0.4 * netAlpha})`;
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      positions(e);

      // links — tighten and brighten as they collapse, then fade out
      const lineAlpha = (0.06 + 0.24 * pCollapse) * netAlpha;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = px[i] - px[j];
          const dy = py[i] - py[j];
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            ctx!.strokeStyle = `rgba(255,150,90,${(1 - dist / LINK_DIST) * lineAlpha})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(px[i], py[i]);
            ctx!.lineTo(px[j], py[j]);
            ctx!.stroke();
          }
        }
      }

      // nodes — warm toward white as they cluster, then fade out
      const nodeAlpha = (0.22 + 0.68 * pCollapse) * netAlpha;
      for (let i = 0; i < nodes.length; i++) {
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(255,${Math.round(180 + 55 * pCollapse)},${Math.round(120 + 90 * pCollapse)},${nodeAlpha})`;
        ctx!.arc(px[i], py[i], nodes[i].r * (1 + 0.6 * pCollapse), 0, Math.PI * 2);
        ctx!.fill();
      }

      // shockwave ring on the glow pulse
      if (pulse > 0.001) {
        const rp = (T - COLLAPSE_END) / (PULSE_END - COLLAPSE_END); // 0→1
        const radius = 18 + rp * 150;
        ctx!.beginPath();
        ctx!.strokeStyle = `rgba(255,138,61,${(1 - rp) * 0.45})`;
        ctx!.lineWidth = 2;
        ctx!.arc(targetX, targetY, radius, 0, Math.PI * 2);
        ctx!.stroke();
      }

      // drive the DOM logo glow / halo / wordmark from the timeline
      if (logoRef.current) {
        logoRef.current.style.filter = `drop-shadow(0 0 ${8 + 28 * logoGlow}px rgba(255,106,61,${0.28 + 0.55 * logoGlow}))`;
        logoRef.current.style.transform = `scale(${1 + 0.05 * glow + 0.07 * pulse})`;
      }
      if (glowRef.current) {
        glowRef.current.style.opacity = String(0.12 + 0.6 * glow + 0.35 * pulse);
        glowRef.current.style.transform = `translate(-50%, -50%) scale(${1 + 0.35 * pulse})`;
      }
      if (nameRef.current) {
        nameRef.current.style.opacity = String(nameAmt);
        nameRef.current.style.transform = `translateY(${(1 - nameAmt) * 8}px)`;
      }

      if (!reduceMotion) raf = requestAnimationFrame(draw);
    }

    seed();
    // re-measure once layout settles, then start
    requestAnimationFrame(() => {
      seed();
      draw(performance.now());
    });

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { threshold: 0.25 }
    );
    io.observe(wrap);

    const onResize = () => seed();
    window.addEventListener("resize", onResize);
    return () => {
      io.disconnect();
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <footer
      ref={wrapRef}
      className="relative z-10 mt-24 overflow-hidden border-t border-white/[0.08]"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center">
        <div className="relative">
          <div
            ref={glowRef}
            className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(255,106,61,0.55),transparent_70%)] blur-2xl"
            style={{ opacity: 0.12, transform: "translate(-50%, -50%)" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={logoRef}
            src="/softsuave-mark.svg"
            alt="Soft Suave"
            className="relative h-16 w-auto"
          />
        </div>
        {/* Company wordmark — fades in as the network clears, then remains */}
        <p
          ref={nameRef}
          className="mt-5 text-2xl font-bold tracking-tight text-white"
          style={{ opacity: 0 }}
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
