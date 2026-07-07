"use client";

import { useEffect, useRef } from "react";

// Animated background network for the ecosystem section — a whisper, not a
// feature. Thin neural lines between slow-drifting particles, with an
// occasional connection flaring briefly brighter. The whole canvas renders
// at ~7% opacity: almost invisible until you notice it.
//
// Perf: draws only while in the viewport (IntersectionObserver), sizes to
// its container via ResizeObserver, respects prefers-reduced-motion by
// rendering a single static frame.

const COUNT = 44; // particles
const LINK_DIST = 150; // px — connect particles closer than this
const FLARE_EVERY = 2600; // ms between glowing connections
const FLARE_LIFE = 1300; // ms a flare takes to fade

type P = { x: number; y: number; vx: number; vy: number; r: number };

export default function EcoNetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    let particles: P[] = [];
    // active flare: indices of the glowing pair + its start time
    let flare: { a: number; b: number; at: number } | null = null;
    let lastFlare = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const seed = (n: number) => {
      // deterministic layout so hydration/re-mounts look identical
      const s = Math.sin(n * 127.1) * 43758.5453;
      return s - Math.floor(s);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length === 0) {
        particles = Array.from({ length: COUNT }, (_, i) => ({
          x: seed(i + 1) * w,
          y: seed(i + 101) * h,
          vx: (seed(i + 201) - 0.5) * 0.16,
          vy: (seed(i + 301) - 0.5) * 0.16,
          r: 0.8 + seed(i + 401) * 1.2,
        }));
      }
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);

      // move
      if (!reduced) {
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10;
          if (p.y > h + 10) p.y = -10;
        }
      }

      // schedule an occasional glowing connection between a close pair
      if (!reduced && now - lastFlare > FLARE_EVERY) {
        lastFlare = now;
        outer: for (let tries = 0; tries < 12; tries++) {
          const a = Math.floor(Math.random() * COUNT);
          for (let b = 0; b < COUNT; b++) {
            if (b === a) continue;
            const dx = particles[a].x - particles[b].x;
            const dy = particles[a].y - particles[b].y;
            if (dx * dx + dy * dy < LINK_DIST * LINK_DIST * 0.6) {
              flare = { a, b, at: now };
              break outer;
            }
          }
        }
      }

      // thin neural lines
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK_DIST * LINK_DIST) continue;
          const t = 1 - Math.sqrt(d2) / LINK_DIST;
          ctx.strokeStyle = `rgba(255, 138, 61, ${0.5 * t})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }

      // the occasional glowing connection
      if (flare) {
        const age = (now - flare.at) / FLARE_LIFE;
        if (age >= 1) {
          flare = null;
        } else {
          const glow = Math.sin(age * Math.PI); // rise then fade
          const A = particles[flare.a];
          const B = particles[flare.b];
          ctx.strokeStyle = `rgba(255, 178, 102, ${glow})`;
          ctx.lineWidth = 1.2;
          ctx.shadowColor = "rgba(255, 138, 61, 0.9)";
          ctx.shadowBlur = 8 * glow;
          ctx.beginPath();
          ctx.moveTo(A.x, A.y);
          ctx.lineTo(B.x, B.y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // tiny particles
      for (const p of particles) {
        ctx.fillStyle = "rgba(255, 170, 100, 0.9)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (now: number) => {
      draw(now);
      if (!reduced) raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // draw only while visible
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: "100px" },
    );
    io.observe(canvas);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full opacity-[0.07]"
    />
  );
}
