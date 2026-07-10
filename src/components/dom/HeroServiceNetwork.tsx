"use client";

import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  TbRobot,
  TbBolt,
  TbCode,
  TbDeviceMobile,
  TbBuildingSkyscraper,
  TbMessageChatbot,
} from "react-icons/tb";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Interactive AI SERVICE NETWORK laid over the hero globe. Six labelled
// service nodes ride an orbit just outside the globe rim; a canvas layer wires
// them into the globe's core and to each other, drifts free-floating AI
// particles that thread back into the globe, sweeps a scanning light beam
// across the disc every few seconds, and reacts to the cursor — links near the
// pointer brighten, particles are gently pushed, and the nearest service node
// lifts. The globe (a separate <canvas> beneath) still communicates reach;
// this layer communicates WHAT we build. Everything here is pointer-events
// transparent so the globe's own drag/rotate still works underneath.

type Service = { label: string; icon: IconType };

// order maps 1:1 to the node ring, starting at the top and going clockwise
const SERVICES: Service[] = [
  { label: "AI Agents", icon: TbRobot },
  { label: "Automation", icon: TbBolt },
  { label: "Custom Software", icon: TbCode },
  { label: "Mobile Apps", icon: TbDeviceMobile },
  { label: "Enterprise AI", icon: TbBuildingSkyscraper },
  { label: "AI Chatbots", icon: TbMessageChatbot },
];

// node ring radius as a fraction of the (square) container
const RING_FR = 0.455;
const N = SERVICES.length;

// screen angle for node i — start at the top (-90°), go clockwise
const angleOf = (i: number) => (-90 + i * (360 / N)) * (Math.PI / 180);

export default function HeroServiceNetwork({
  active = true,
}: {
  // HeroGlobe flips this the moment the live globe starts its reveal, so the
  // network always enters AFTER the planet — however long its warm-up took
  active?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
  // the icon + label inside each chip — tinted toward gold on proximity
  // instead of the chip growing a bright border/glow box
  const chipIconRefs = useRef<(HTMLElement | null)[]>([]);
  const chipLabelRefs = useRef<(HTMLElement | null)[]>([]);
  const reduced = useReducedMotion();
  // STAGED HERO LOAD: this whole layer (connectors, particles, chips) holds
  // back until the text has landed and the globe has begun fading in, then
  // draws in last — so the hero builds text → globe → network instead of
  // everything fighting for the main thread on first paint.
  const [delayDone, setDelayDone] = useState(false);

  useEffect(() => {
    if (!active) return;
    // enter mid-way through the globe's 1s fade — a build, not a pile-up
    const t = window.setTimeout(() => setDelayDone(true), 450);
    return () => window.clearTimeout(t);
  }, [active]);
  // reduced motion skips the choreography and shows the layer at once
  const on = reduced || delayDone;

  useEffect(() => {
    if (!on) return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const mouse = { x: 0, y: 0, active: false };

    // free-floating particles (in fractional 0..1 space so a resize keeps them
    // in place). vx/vy are per-second fractional velocities.
    const rand = (() => {
      let a = 0x9e3779b9;
      return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    })();
    const isMobile = window.innerWidth < 768;
    const P = reduced ? 0 : isMobile ? 16 : 34;
    const particles = Array.from({ length: P }, () => ({
      x: rand(),
      y: rand(),
      vx: (rand() - 0.5) * 0.012,
      vy: (rand() - 0.5) * 0.012,
      r: 0.6 + rand() * 1.4,
      tw: rand() * Math.PI * 2, // twinkle phase
    }));

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const onMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active =
        mouse.x >= -60 &&
        mouse.x <= w + 60 &&
        mouse.y >= -60 &&
        mouse.y <= h + 60;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    // pause when off-screen
    let inView = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && !reduced) loop(performance.now());
      },
      { rootMargin: "80px" },
    );
    io.observe(wrap);

    let raf = 0;
    let last = performance.now();

    const nodeAt = (i: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const rr = Math.min(w, h) * RING_FR;
      const a = angleOf(i);
      return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr };
    };

    const draw = (dt: number, t: number) => {
      ctx.clearRect(0, 0, w, h);
      const nodes = SERVICES.map((_, i) => nodeAt(i));

      // (ALL straight line-work removed per design feedback — the chip→globe
      // connectors + their traveling pips and the chip-to-chip hexagon links
      // were reading as clutter over the planet. The curved 3D arcs +
      // orbital rings in GlobeScene are the only line elements; this layer
      // keeps the node glows, chips, and ambient particles.)

      // ── floating particles: drift, thread into the globe, react to cursor ──
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        // wrap around the edges
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;
        if (p.y < -0.05) p.y = 1.05;
        if (p.y > 1.05) p.y = -0.05;

        const sx = p.x * w;
        const sy = p.y * h;

        // cursor push
        if (mouse.active) {
          const dx = sx - mouse.x;
          const dy = sy - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < 120 && d > 0.01) {
            const f = ((120 - d) / 120) * 0.00035;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        // mild damping so pushes settle
        p.vx *= 0.994;
        p.vy *= 0.994;

        const tw = 0.5 + 0.5 * Math.sin(t * 2 + p.tw);

        // (the faint particle→globe threads and particle-to-particle web
        // lines were removed per design feedback — they read as stray "nerve
        // lines" over the planet. The particles now just drift + twinkle.)
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,206,138,${0.25 + tw * 0.5})`;
        ctx.arc(sx, sy, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── node glow dots + cursor-driven chip lift ──
      for (let i = 0; i < N; i++) {
        const n = nodes[i];
        let boost = 0;
        if (mouse.active) {
          const md = Math.hypot(mouse.x - n.x, mouse.y - n.y);
          boost = Math.max(0, 1 - md / 150);
        }
        const rg = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 16 + boost * 10);
        rg.addColorStop(0, `rgba(255,200,120,${0.5 + boost * 0.4})`);
        rg.addColorStop(1, "rgba(255,160,70,0)");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 16 + boost * 10, 0, Math.PI * 2);
        ctx.fill();

        // matching HTML chip: a light gold tint on the icon + label plus a
        // small zoom on approach — no bright border box, no outer glow
        const chip = chipRefs.current[i];
        if (chip) {
          const lift = boost;
          chip.style.transform = `translate(-50%, -50%) scale(${1 + lift * 0.045})`;
          const icon = chipIconRefs.current[i];
          const label = chipLabelRefs.current[i];
          if (icon) {
            icon.style.color = `color-mix(in srgb, #FFD37A ${lift * 70}%, var(--brand-orange))`;
          }
          if (label) {
            label.style.color = `color-mix(in srgb, #FFD37A ${lift * 55}%, var(--heading))`;
          }
        }
      }
    };

    const loop = (now: number) => {
      if (!inView || reduced) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(dt, now / 1000);
      raf = requestAnimationFrame(loop);
    };

    if (reduced) {
      // static single frame
      last = performance.now();
      draw(0, 0);
    } else {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
    };
  }, [reduced, on]);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute inset-0 z-2"
      style={{
        opacity: on ? 1 : 0,
        transition: reduced ? undefined : "opacity 900ms ease",
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* labelled service nodes — crisp HTML text riding the orbit ring */}
      {SERVICES.map((s, i) => {
        const a = angleOf(i);
        const left = 50 + Math.cos(a) * RING_FR * 100;
        const top = 50 + Math.sin(a) * RING_FR * 100;
        return (
          <div
            key={s.label}
            ref={(el) => {
              chipRefs.current[i] = el;
            }}
            className="chip-float absolute flex items-center gap-1.5 rounded-full border border-(--brand-orange)/20 bg-black/30 px-2.5 py-1 backdrop-blur-sm transition-none"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              transform: "translate(-50%, -50%)",
              animationDelay: `-${i * 0.9}s`,
            }}
          >
            <span
              ref={(el) => {
                chipIconRefs.current[i] = el;
              }}
              className="flex shrink-0 text-(--brand-orange) transition-colors duration-300"
            >
              <s.icon className="h-3.5 w-3.5" />
            </span>
            <span
              ref={(el) => {
                chipLabelRefs.current[i] = el;
              }}
              className="whitespace-nowrap text-[11px] font-medium tracking-tight text-(--heading) [text-shadow:0_1px_8px_rgba(0,0,0,0.6)] transition-colors duration-300"
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
