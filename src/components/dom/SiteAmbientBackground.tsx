"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

type Star = {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  amp: number;
};

const PARTICLE_COUNT = 40;
const STAR_COUNT = 90;
const LINK_DIST = 140;

// Persistent whole-site backdrop — fixed to the viewport so it stays put
// while every section scrolls over it, giving the page one continuous
// "living" identity instead of flat black between the hero/services'
// own richer local backgrounds. Layered very low-alpha, back to front:
// gradient wash, glow orbs, an aurora-like color sweep, a twinkling
// starfield + drifting connected particles, and film-grain noise on top.
export default function SiteAmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let stars: Star[] = [];
    let raf = 0;

    function seed() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: 0.7 + Math.random(),
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

    function draw() {
      const now = performance.now() * 0.001;
      ctx!.clearRect(0, 0, width, height);

      for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(now * s.speed + s.phase);
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(255,240,220,${(0.1 + tw * s.amp) * 0.4})`;
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            ctx!.strokeStyle = `rgba(255,150,90,${(1 - dist / LINK_DIST) * 0.08})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx!.beginPath();
        ctx!.fillStyle = "rgba(255,220,180,0.18)";
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function loop() {
      draw();
      if (!reduceMotion) raf = requestAnimationFrame(loop);
    }

    seed();
    loop();

    const onResize = () => seed();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-30 overflow-hidden bg-[#0a0a0c]">
      {/* Layer 1: broad gradient wash */}
      <div className="site-wash absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_15%,rgba(255,138,61,0.10),transparent_65%),radial-gradient(ellipse_55%_45%_at_85%_85%,rgba(249,43,78,0.08),transparent_65%)]" />

      {/* Layer 5: soft glow orbs, offset so they drift out of phase with the wash */}
      <div className="site-wash absolute inset-0 [animation-delay:-11s] bg-[radial-gradient(circle_at_75%_20%,rgba(255,183,110,0.10),transparent_35%),radial-gradient(circle_at_15%_80%,rgba(255,106,61,0.08),transparent_30%)] blur-2xl" />

      {/* Layer 6: slow aurora-like color sweep, warm-toned to stay on-brand */}
      <div
        className="site-aurora absolute -inset-x-1/4 top-[-10%] h-[70%] blur-3xl"
        style={{
          background:
            "linear-gradient(100deg, transparent 10%, rgba(255,138,61,0.10) 35%, rgba(249,43,78,0.08) 55%, rgba(255,209,102,0.08) 70%, transparent 90%)",
        }}
      />

      {/* Layers 3 + 4: twinkling starfield + drifting connected particles */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Layer 2: film-grain noise, on top so it reads across everything else */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "140px 140px",
        }}
      />
    </div>
  );
}
