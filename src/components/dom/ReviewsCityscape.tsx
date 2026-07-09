"use client";

import { useEffect, useRef } from "react";

// A fully coded, on-brand animated backdrop for the reviews section — a
// twilight city skyline seen "through the office window": layered building
// silhouettes with softly twinkling windows, a warm horizon glow, slow
// drifting clouds, and gold embers rising. Everything is drawn on a single
// 2D canvas (no video, ~a few KB of JS), so it's light and never judders.
//
// It reads the site's theme tokens (--background, brand orange) so it adapts
// to light/dark, only animates while on screen, and renders a single static
// frame for visitors who prefer reduced motion.

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Win = { x: number; y: number; w: number; h: number; phase: number; spd: number; base: number };
type Building = { x: number; y: number; w: number; h: number; tone: string; wins: Win[] };
type Cloud = { x: number; y: number; r: number; spd: number; a: number };
type Ember = { x: number; y: number; r: number; spd: number; sway: number; ph: number; a: number };

type Palette = {
  isDark: boolean;
  skyTop: string;
  skyMid: string;
  horizon: string;
  glow: string;
  far: string;
  near: string;
  win: string; // "r,g,b"
  ember: string; // "r,g,b"
  cloud: string; // "r,g,b"
};

export default function ReviewsCityscape() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const readPalette = (): Palette => {
      const cs = getComputedStyle(document.documentElement);
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      const bg =
        cs.getPropertyValue("--background").trim() ||
        (isDark ? "#0a0a0c" : "#faf9f7");
      return isDark
        ? {
            isDark: true,
            skyTop: bg,
            skyMid: "#180d0a",
            horizon: "#7d3114",
            glow: "rgba(255,138,61,0.55)",
            far: "#0e0a0d",
            near: "#070406",
            win: "255,190,120",
            ember: "255,180,90",
            cloud: "255,150,90",
          }
        : {
            isDark: false,
            skyTop: bg,
            skyMid: "#f4ddc6",
            horizon: "#f2a866",
            glow: "rgba(249,115,22,0.38)",
            far: "#cdbba9",
            near: "#9c8067",
            win: "255,168,92",
            ember: "234,120,40",
            cloud: "255,255,255",
          };
    };
    let pal = readPalette();

    let far: Building[] = [];
    let near: Building[] = [];
    let clouds: Cloud[] = [];
    let embers: Ember[] = [];

    const buildLayer = (
      tone: string,
      hMin: number,
      hMax: number,
      wMin: number,
      wMax: number,
      gap: number,
      seed: number,
      litChance: number,
    ): Building[] => {
      const rand = mulberry32(seed);
      const out: Building[] = [];
      let x = -30;
      const cellW = 12;
      const cellH = 15;
      const pad = 6;
      while (x < W + 60) {
        const bw = wMin + rand() * (wMax - wMin);
        const bh = (hMin + rand() * (hMax - hMin)) * H;
        const y = H - bh;
        const wins: Win[] = [];
        for (let wy = y + pad; wy < H - 12; wy += cellH) {
          for (let wx = x + pad; wx < x + bw - pad - 4; wx += cellW) {
            if (rand() > litChance) continue; // this window stays dark
            wins.push({
              x: wx,
              y: wy,
              w: 4,
              h: 6,
              phase: rand() * Math.PI * 2,
              spd: 0.4 + rand() * 1.0,
              base: 0.32 + rand() * 0.5,
            });
          }
        }
        out.push({ x, y, w: bw, h: bh, tone, wins });
        x += bw + gap + rand() * gap;
      }
      return out;
    };

    const buildScene = () => {
      far = buildLayer(pal.far, 0.3, 0.55, 44, 92, 5, 0x1111, 0.4);
      near = buildLayer(pal.near, 0.46, 0.82, 62, 132, 8, 0x2222, 0.46);
      const rc = mulberry32(0x3333);
      clouds = Array.from({ length: 5 }, () => ({
        x: rc() * W,
        y: H * (0.06 + rc() * 0.3),
        r: 70 + rc() * 130,
        spd: 3 + rc() * 6,
        a: 0.05 + rc() * 0.07,
      }));
      const re = mulberry32(0x4444);
      embers = Array.from({ length: 42 }, () => ({
        x: re() * W,
        y: re() * H,
        r: 0.6 + re() * 1.6,
        spd: 6 + re() * 15,
        sway: 6 + re() * 14,
        ph: re() * Math.PI * 2,
        a: 0.25 + re() * 0.5,
      }));
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      W = Math.max(1, Math.round(rect.width));
      H = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildScene();
    };

    const drawSky = () => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, pal.skyTop);
      g.addColorStop(0.42, pal.skyMid);
      g.addColorStop(0.82, pal.horizon);
      g.addColorStop(1, pal.skyMid);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const gx = W * 0.62;
      const gy = H * 0.84;
      const rg = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(W, H) * 0.55);
      rg.addColorStop(0, pal.glow);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    };

    const drawClouds = (t: number) => {
      for (const c of clouds) {
        const span = W + c.r * 2;
        const x = ((c.x + t * c.spd) % span) - c.r;
        const grd = ctx.createRadialGradient(x, c.y, 0, x, c.y, c.r);
        grd.addColorStop(0, `rgba(${pal.cloud},${c.a})`);
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.ellipse(x, c.y, c.r, c.r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawBuildings = (list: Building[], t: number, animate: boolean) => {
      for (const b of list) {
        ctx.fillStyle = b.tone;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        for (const w of b.wins) {
          const lit = animate
            ? w.base * (0.55 + 0.45 * Math.sin(t * w.spd + w.phase))
            : w.base * 0.8;
          ctx.fillStyle = `rgba(${pal.win},${lit < 0 ? 0 : lit})`;
          ctx.fillRect(w.x, w.y, w.w, w.h);
        }
      }
    };

    const drawEmbers = (t: number) => {
      for (const e of embers) {
        const y = H - ((e.y + t * e.spd) % (H + 20));
        const x = e.x + Math.sin(t * 0.6 + e.ph) * e.sway;
        const tw = 0.6 + 0.4 * Math.sin(t * 2 + e.ph);
        ctx.fillStyle = `rgba(${pal.ember},${e.a * tw})`;
        ctx.beginPath();
        ctx.arc(x, y, e.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const frame = (t: number, animate: boolean) => {
      ctx.clearRect(0, 0, W, H);
      drawSky();
      drawClouds(animate ? t : 0);
      drawBuildings(far, t, animate);
      drawBuildings(near, t, animate);
      if (animate) drawEmbers(t);
    };

    const reducedMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = reducedMQ.matches;
    let inView = true;
    let raf = 0;
    let last = 0;
    let clock = 0;

    const loop = (now: number) => {
      if (!last) last = now;
      clock += Math.min(0.05, (now - last) / 1000);
      last = now;
      frame(clock, true);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (raf || reduced || !inView) return;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const renderStatic = () => frame(6, false);

    resize();
    if (reduced) renderStatic();
    else start();

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced || !inView) renderStatic();
    });
    ro.observe(wrap);

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) start();
        else stop();
      },
      { rootMargin: "150px" },
    );
    io.observe(wrap);

    const onReduced = (e: MediaQueryListEvent) => {
      reduced = e.matches;
      if (reduced) {
        stop();
        renderStatic();
      } else {
        start();
      }
    };
    reducedMQ.addEventListener("change", onReduced);

    // theme toggle → re-read palette, rebuild silhouette tones, repaint
    const mo = new MutationObserver(() => {
      pal = readPalette();
      buildScene();
      if (reduced || !inView) renderStatic();
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      reducedMQ.removeEventListener("change", onReduced);
    };
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas ref={canvasRef} aria-hidden className="block h-full w-full" />
    </div>
  );
}
