"use client";

import { useEffect, useRef } from "react";

// Animated recreation of the "glowing isometric circuit cubes" artwork:
// a central cluster of holographic blue cubes on a dark grid, gently
// bobbing and pulsing, with a few fragments drifting away from the block —
// visualising fragmented data. Plain 2D canvas, ~30 cubes, trivially cheap.

type Cube = {
  gx: number;
  gy: number;
  phase: number;
  speed: number;
  wire: boolean; // hologram-style wireframe cube
  drift: boolean; // detached fragment floating away from the cluster
};

const GRID = 4;
const GLOW = "rgba(80,200,255,";

function drawCube(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  glow: number,
  wire: boolean,
  dpr: number,
) {
  const hw = s; // half width of the diamond
  const hh = s * 0.5; // half height of the diamond
  const d = s * 1.05; // cube depth

  const topY = y - d;
  // Top diamond corners
  const N = [x, topY - hh];
  const E = [x + hw, topY];
  const S = [x, topY + hh];
  const W = [x - hw, topY];
  // Bottom corners
  const E2 = [x + hw, topY + d];
  const S2 = [x, topY + hh + d];
  const W2 = [x - hw, topY + d];

  ctx.save();
  ctx.lineWidth = Math.max(1, dpr);
  ctx.shadowColor = `${GLOW}${0.8 * glow})`;
  ctx.shadowBlur = 14 * dpr * glow;
  ctx.strokeStyle = `${GLOW}${0.5 + 0.45 * glow})`;

  const face = (pts: number[][], fill: string) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (!wire) {
      ctx.fillStyle = fill;
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(40,120,220,${0.08 + 0.1 * glow})`;
      ctx.fill();
    }
    ctx.stroke();
  };

  // Left face (lit circuit blue), right face (deeper), top face (dark slab)
  face([W, S, S2, W2], `rgba(28,110,220,${0.5 + 0.4 * glow})`);
  face([S, E, E2, S2], `rgba(12,60,150,${0.55 + 0.35 * glow})`);
  face([N, E, S, W], wire ? "" : `rgba(30,42,64,${0.92})`);

  // Circuit sparkles on the side faces
  if (!wire) {
    ctx.shadowBlur = 6 * dpr * glow;
    ctx.fillStyle = `rgba(170,235,255,${0.5 + 0.5 * glow})`;
    const dots = 3;
    for (let i = 1; i <= dots; i++) {
      ctx.fillRect(
        x - hw * 0.7 + (i * hw * 0.4) / dots,
        topY + hh * 0.6 + (i % 2) * hh * 0.5,
        1.4 * dpr,
        1.4 * dpr,
      );
    }
    // Tiny chip dot on the top face
    ctx.fillStyle = `rgba(120,225,255,${0.35 + 0.5 * glow})`;
    ctx.fillRect(x - dpr, topY - dpr, 2 * dpr, 2 * dpr);
  }
  ctx.restore();
}

export default function FragmentCubes({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Central cluster with fragmented gaps
    const cubes: Cube[] = [];
    for (let gx = 0; gx < GRID; gx++) {
      for (let gy = 0; gy < GRID; gy++) {
        if ((gx === 1 && gy === 2) || (gx === 3 && gy === 0)) continue; // gaps
        cubes.push({
          gx,
          gy,
          phase: Math.random() * Math.PI * 2,
          speed: 0.5 + Math.random() * 0.7,
          wire: Math.random() < 0.2,
          drift: false,
        });
      }
    }
    // Detached fragments drifting off the block
    const fragments = [
      { gx: -1.7, gy: 1.1 },
      { gx: 4.6, gy: 0.3 },
      { gx: 5.0, gy: 2.6 },
      { gx: -1.3, gy: 3.5 },
      { gx: 2.2, gy: -1.6 },
    ];
    for (const f of fragments) {
      cubes.push({
        ...f,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.5,
        wire: Math.random() < 0.5,
        drift: true,
      });
    }
    cubes.sort((a, b) => a.gx + a.gy - (b.gx + b.gy)); // back-to-front

    // Sparse background dots
    const dots = Array.from({ length: 26 }, () => ({
      x: Math.random(),
      y: Math.random(),
      p: Math.random() * Math.PI * 2,
    }));

    let raf = 0;
    const draw = (now: number) => {
      const t = now / 1000;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Faint circuit dots
      for (const dot of dots) {
        const a = 0.12 + 0.12 * Math.sin(t * 0.8 + dot.p);
        ctx.fillStyle = `rgba(110,190,255,${a})`;
        ctx.fillRect(dot.x * w, dot.y * h, dpr, dpr);
      }

      const s = Math.min(w, h) / 10;
      const cx = w * 0.56;
      const cy = h * 0.52 + s;
      for (const c of cubes) {
        const bob = Math.sin(t * c.speed + c.phase);
        const lift =
          (bob * 0.5 + 0.5) * s * (c.drift ? 0.6 : 0.3) +
          (c.drift ? s * 0.5 : 0);
        const glow = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * c.speed * 1.4 + c.phase));
        const x = cx + (c.gx - c.gy) * s * 0.95;
        const y =
          cy + (c.gx + c.gy) * s * 0.475 - GRID * s * 0.475 - lift;
        drawCube(ctx, x, y, s * (c.drift ? 0.5 : 0.78), glow, c.wire, dpr);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
