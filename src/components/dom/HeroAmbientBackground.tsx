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

const PARTICLE_COUNT = 34;
const STAR_COUNT = 70;
const LINK_DIST = 130;

// Faint engineering-grid + drifting particle texture behind the hero copy
// and brain. Deliberately sparser and lower-alpha than the Services mesh —
// the brain is the focal visual here, this just adds ambient depth.
export default function HeroAmbientBackground() {
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
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 0.8 + Math.random(),
      }));

      // Tiny static stars that gently twinkle
      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.4 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.6,
        amp: 0.25 + Math.random() * 0.55,
      }));
    }

    function draw() {
      const now = performance.now() * 0.001;
      ctx!.clearRect(0, 0, width, height);

      // palette follows the active theme (light ivory vs dark navy)
      const darkTheme =
        document.documentElement.getAttribute("data-theme") === "dark";
      // dark (warm-black) = cream/orange particles; default (light) = warm
      // stone specks + orange links + a sparing blue dot on the paper base
      const starRgb = darkTheme ? "255,240,220" : "120,113,108";
      const starScale = darkTheme ? 0.5 : 0.24;
      const linkRgb = darkTheme ? "255,150,90" : "234,88,12";
      const linkScale = darkTheme ? 0.1 : 0.06;
      const particleFill = darkTheme
        ? "rgba(255,220,180,0.22)"
        : "rgba(37,99,235,0.12)";

      // twinkling starfield (behind the particle web)
      for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(now * s.speed + s.phase);
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(${starRgb},${(0.12 + tw * s.amp) * starScale})`;
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
            ctx!.strokeStyle = `rgba(${linkRgb},${(1 - dist / LINK_DIST) * linkScale})`;
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
        ctx!.fillStyle = particleFill;
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

    // reduced-motion renders one static frame — repaint on theme toggle
    const mo = new MutationObserver(() => {
      if (reduceMotion) draw();
    });
    mo.observe(document.documentElement, { attributeFilter: ["data-theme"] });

    const onResize = () => seed();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-20 overflow-hidden"
      data-parallax="-5"
      style={{
        // ONE shared edge fade for the whole ambient stack (grid + particle
        // canvas + drifting wash + noise). Only the grid layer used to carry
        // its own mask; the particle canvas drew stars/links uniformly right
        // up to its hard rectangular edge with no fade, so where it met the
        // page's own continuous background the density drop-off read as a
        // faint box outline around the hero copy. Masking the whole group
        // here makes every layer dissolve together at the same soft edge.
        maskImage:
          "radial-gradient(ellipse 85% 78% at 50% 32%, black, transparent 78%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 85% 78% at 50% 32%, black, transparent 78%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Slowly drifting warm gradient — theme-tinted, barely perceptible */}
      <div
        className="hero-gradient-drift absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 28% 35%, var(--wash-warm), transparent 65%)",
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* Subtle film-grain noise texture */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "140px 140px",
        }}
      />
    </div>
  );
}
