"use client";

import { useEffect, useRef } from "react";

// Animated recreation of the "isolated isometric devices" artwork: laptops,
// server boxes, and antennas each hovering over their own cyan-outlined pad
// on a dark navy field — with dashed links between pads that stop short,
// visualising systems that never quite connect. Plain 2D canvas.

type Kind = "laptop" | "server" | "slab" | "antenna" | "gadget";

type Device = {
  kind: Kind;
  gx: number;
  gy: number;
  scale: number;
  phase: number;
  speed: number;
  leds?: string[];
};

const DEVICES: Device[] = [
  { kind: "laptop", gx: 0, gy: 0, scale: 1.25, phase: 0.4, speed: 0.55 },
  { kind: "laptop", gx: 1.5, gy: 1.5, scale: 1.0, phase: 2.1, speed: 0.7 },
  { kind: "server", gx: -2.1, gy: 0.7, scale: 0.95, phase: 1.2, speed: 0.6, leds: ["#ff5b45", "#b06cff"] },
  { kind: "server", gx: -0.9, gy: 2.1, scale: 1.15, phase: 3.6, speed: 0.5, leds: ["#b06cff", "#ff5b45", "#3fe0ff"] },
  { kind: "server", gx: 2.4, gy: -0.4, scale: 0.9, phase: 5.0, speed: 0.65, leds: ["#ff5b45"] },
  { kind: "slab", gx: -0.7, gy: -1.7, scale: 1.0, phase: 0.9, speed: 0.45 },
  { kind: "antenna", gx: 1.1, gy: -2.0, scale: 1.0, phase: 4.2, speed: 0.8 },
  { kind: "gadget", gx: 0.5, gy: 2.6, scale: 0.7, phase: 2.8, speed: 0.75 },
];

// Dashed links that deliberately stop short of their target pad
const BROKEN_LINKS: [number, number][] = [
  [0, 2],
  [0, 6],
  [1, 4],
  [3, 7],
];

const CYAN = "rgba(63,224,255,";

export default function DisconnectedDevices({
  className,
}: {
  className?: string;
}) {
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

    const dust = Array.from({ length: 20 }, () => ({
      x: Math.random(),
      y: Math.random(),
      p: Math.random() * Math.PI * 2,
    }));

    const iso = (gx: number, gy: number, s: number, w: number, h: number) => ({
      x: w * 0.52 + (gx - gy) * s * 0.98,
      y: h * 0.55 + (gx + gy) * s * 0.49,
    });

    const pad = (x: number, y: number, hw: number, hh: number, a: number) => {
      ctx.strokeStyle = `${CYAN}${a})`;
      ctx.lineWidth = Math.max(1, dpr * 0.8);
      ctx.beginPath();
      ctx.moveTo(x, y - hh);
      ctx.lineTo(x + hw, y);
      ctx.lineTo(x, y + hh);
      ctx.lineTo(x - hw, y);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = `rgba(10,22,40,0.55)`;
      ctx.fill();
    };

    const box = (
      x: number,
      y: number,
      hw: number,
      hh: number,
      d: number,
      top: string,
      left: string,
      right: string,
      edgeA: number,
    ) => {
      const tY = y - d;
      const path = (pts: number[][], fill: string) => {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = `${CYAN}${edgeA})`;
        ctx.lineWidth = Math.max(1, dpr * 0.7);
        ctx.stroke();
      };
      path([[x - hw, tY], [x, tY + hh], [x, y + hh], [x - hw, y]], left);
      path([[x, tY + hh], [x + hw, tY], [x + hw, y], [x, y + hh]], right);
      path([[x, tY - hh], [x + hw, tY], [x, tY + hh], [x - hw, tY]], top);
    };

    const draw = (now: number) => {
      const t = now / 1000;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const s = Math.min(w, h) / 9.5;

      // Ambient dust
      for (const d of dust) {
        const a = 0.1 + 0.12 * Math.sin(t * 0.7 + d.p);
        ctx.fillStyle = `rgba(140,210,255,${a})`;
        ctx.fillRect(d.x * w, d.y * h, dpr, dpr);
      }

      const pos = DEVICES.map((dev) => iso(dev.gx, dev.gy, s, w, h));

      // Broken dashed links (drawn under everything)
      ctx.setLineDash([5 * dpr, 5 * dpr]);
      BROKEN_LINKS.forEach(([a, b], i) => {
        const flicker = 0.22 + 0.16 * Math.sin(t * 1.1 + i * 2.3);
        const A = pos[a];
        const B = pos[b];
        const fx = A.x + (B.x - A.x) * 0.58;
        const fy = A.y + (B.y - A.y) * 0.58;
        ctx.strokeStyle = `${CYAN}${flicker})`;
        ctx.lineWidth = Math.max(1, dpr * 0.8);
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(fx, fy);
        ctx.stroke();
        // The severed end
        ctx.fillStyle = `${CYAN}${flicker + 0.25})`;
        ctx.fillRect(fx - 1.5 * dpr, fy - 1.5 * dpr, 3 * dpr, 3 * dpr);
      });
      ctx.setLineDash([]);

      // Devices, back to front
      const order = DEVICES.map((d, i) => i).sort(
        (a, b) => DEVICES[a].gx + DEVICES[a].gy - (DEVICES[b].gx + DEVICES[b].gy),
      );

      for (const i of order) {
        const dev = DEVICES[i];
        const { x, y } = pos[i];
        const k = s * dev.scale;
        const lift = (Math.sin(t * dev.speed + dev.phase) * 0.5 + 0.5) * k * 0.18;
        const glow = 0.5 + 0.5 * Math.sin(t * dev.speed * 1.3 + dev.phase);
        const padPulse = 0.3 + 0.2 * Math.sin(t * 0.9 + dev.phase);

        pad(x, y + k * 0.28, k * 1.5, k * 0.75, padPulse);
        const dy = y - lift;

        ctx.save();
        ctx.shadowColor = `${CYAN}${0.35 * glow})`;
        ctx.shadowBlur = 10 * dpr * glow;

        if (dev.kind === "laptop") {
          // Base
          box(x, dy, k * 1.1, k * 0.55, k * 0.14, "#25314a", "#1a2438", "#141c2c", 0.35);
          // Keyboard hint lines
          ctx.strokeStyle = `${CYAN}${0.28})`;
          ctx.lineWidth = dpr * 0.6;
          for (let r = 1; r <= 3; r++) {
            ctx.beginPath();
            ctx.moveTo(x - k * 0.62 + r * dpr, dy - k * 0.14 + r * k * 0.09);
            ctx.lineTo(x + k * 0.3, dy - k * 0.14 + r * k * 0.09 - k * 0.28);
            ctx.stroke();
          }
          // Screen rising from the back edge
          const bx = x + k * 1.1;
          const by = dy - k * 0.14;
          const nx = x;
          const ny = dy - k * 0.14 - k * 0.55;
          const rise = k * 1.05;
          const tilt = k * 0.16;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(nx, ny);
          ctx.lineTo(nx + tilt, ny - rise);
          ctx.lineTo(bx + tilt, by - rise);
          ctx.closePath();
          ctx.fillStyle = "#1c2740";
          ctx.fill();
          ctx.strokeStyle = `${CYAN}${0.45})`;
          ctx.stroke();
          // Glowing display inset
          ctx.beginPath();
          ctx.moveTo(bx - k * 0.08, by - k * 0.12);
          ctx.lineTo(nx + k * 0.08, ny - k * 0.08);
          ctx.lineTo(nx + tilt + k * 0.08, ny - rise + k * 0.16);
          ctx.lineTo(bx + tilt - k * 0.08, by - rise + k * 0.12);
          ctx.closePath();
          ctx.fillStyle = `rgba(63,200,255,${0.28 + 0.3 * glow})`;
          ctx.fill();
        } else if (dev.kind === "server") {
          box(x, dy, k * 0.75, k * 0.38, k * 1.25, "#2c3852", "#1a2438", "#141d2e", 0.4);
        } else if (dev.kind === "slab") {
          box(x, dy, k * 1.05, k * 0.52, k * 0.3, "#7e8ca1", "#2a3650", "#1d2842", 0.45);
        } else if (dev.kind === "antenna") {
          for (let a = 0; a < 3; a++) {
            const ax = x + (a - 1) * k * 0.55;
            const ay = dy + (a % 2) * k * 0.18;
            const tall = k * (1.1 + a * 0.25);
            ctx.strokeStyle = `rgba(120,140,170,0.9)`;
            ctx.lineWidth = dpr * 1.4;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax, ay - tall);
            ctx.stroke();
            const hs = k * (0.16 + a * 0.05);
            const blink = 0.5 + 0.5 * Math.sin(t * 1.6 + a * 1.7 + dev.phase);
            ctx.fillStyle = `rgba(63,224,255,${0.35 + 0.55 * blink})`;
            ctx.beginPath();
            ctx.moveTo(ax, ay - tall - hs);
            ctx.lineTo(ax + hs, ay - tall);
            ctx.lineTo(ax, ay - tall + hs);
            ctx.lineTo(ax - hs, ay - tall);
            ctx.closePath();
            ctx.fill();
          }
        } else {
          box(x, dy, k * 0.55, k * 0.28, k * 0.5, "#25314a", "#1a2438", "#141c2c", 0.35);
        }

        // Blinking LEDs on the left face
        if (dev.leds) {
          dev.leds.forEach((c, li) => {
            const blink =
              0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2.2 + li * 2.1 + dev.phase));
            ctx.shadowColor = c;
            ctx.shadowBlur = 8 * dpr * blink;
            ctx.globalAlpha = blink;
            ctx.fillStyle = c;
            ctx.fillRect(
              x - k * 0.5 + li * k * 0.28,
              dy - k * 0.45 + li * k * 0.14,
              2.4 * dpr,
              2.4 * dpr,
            );
            ctx.globalAlpha = 1;
          });
        }
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    let raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
