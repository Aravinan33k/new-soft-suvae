"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hub: boolean;
};

const PARTICLE_COUNT = 52;
const LINK_DIST = 150;
const HUB_RATIO = 0.12;

// Subtle "living" backdrop for the Services grid: a drifting constellation
// of nodes that link when close, plus a slow warm gradient wash underneath.
// Kept low-alpha throughout so it reads as ambient texture, not a focal point.
export default function ServicesNeuralBackground() {
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
    let raf = 0;

    function seed() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = Array.from({ length: PARTICLE_COUNT }, () => {
        const hub = Math.random() < HUB_RATIO;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: hub ? 2.2 + Math.random() * 1.4 : 0.9 + Math.random(),
          hub,
        };
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);

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
            ctx!.strokeStyle = `rgba(255,150,90,${(1 - dist / LINK_DIST) * 0.2})`;
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
        if (p.hub) {
          ctx!.shadowBlur = 9;
          ctx!.shadowColor = "rgba(255,138,61,0.55)";
          ctx!.fillStyle = "rgba(255,183,110,0.6)";
        } else {
          ctx!.shadowBlur = 0;
          ctx!.fillStyle = "rgba(255,220,180,0.32)";
        }
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.shadowBlur = 0;
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
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="neural-wash absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_25%_20%,rgba(255,138,61,0.10),transparent_60%),radial-gradient(ellipse_55%_45%_at_78%_82%,rgba(249,43,78,0.08),transparent_60%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
