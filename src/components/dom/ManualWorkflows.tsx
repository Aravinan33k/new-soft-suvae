"use client";

import { useEffect, useRef } from "react";

// Animated recreation of the "robots drowning in paperwork" artwork: a dark
// control room with glowing dashboards, stacks of documents on a desk, a
// robotic arm endlessly shuffling sheets from pile to pile, and red warning
// flags waving over the mess. Plain 2D canvas.

export default function ManualWorkflows({ className }: { className?: string }) {
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

    // Random-but-stable data for the dashboard widgets
    const bars = Array.from({ length: 7 }, () => Math.random());
    const line = Array.from({ length: 16 }, () => Math.random());

    let raf = 0;
    const draw = (now: number) => {
      const t = now / 1000;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // ── Room glow: red rim left, cyan rim right ──────────────────
      let g = ctx.createRadialGradient(0, h, 0, 0, h, w * 0.7);
      g.addColorStop(0, "rgba(255,40,70,0.16)");
      g.addColorStop(1, "rgba(255,40,70,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      g = ctx.createRadialGradient(w, 0, 0, w, 0, w * 0.8);
      g.addColorStop(0, "rgba(40,200,255,0.13)");
      g.addColorStop(1, "rgba(40,200,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // ── Wall dashboards ──────────────────────────────────────────
      const panel = (x: number, y: number, pw: number, ph: number) => {
        ctx.fillStyle = "rgba(8,10,24,0.9)";
        ctx.strokeStyle = "rgba(90,160,255,0.35)";
        ctx.lineWidth = dpr;
        ctx.beginPath();
        ctx.roundRect(x, y, pw, ph, 4 * dpr);
        ctx.fill();
        ctx.stroke();
      };

      // Center table panel with scrolling rows
      const px = w * 0.2;
      const py = h * 0.06;
      const pw = w * 0.34;
      const ph = h * 0.34;
      panel(px, py, pw, ph);
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, pw, ph);
      ctx.clip();
      const rowH = 7 * dpr;
      const scroll = (t * 6 * dpr) % rowH;
      for (let r = 0; r < ph / rowH + 1; r++) {
        const ry = py + r * rowH - scroll;
        ctx.fillStyle =
          r % 4 === 2 ? "rgba(255,90,90,0.4)" : "rgba(190,215,255,0.28)";
        ctx.fillRect(px + 5 * dpr, ry + 2 * dpr, pw - 10 * dpr, 2.4 * dpr);
      }
      ctx.restore();
      // Blinking alert strip on the table panel
      const alert = 0.5 + 0.5 * Math.sin(t * 4.2);
      ctx.fillStyle = `rgba(255,45,70,${0.25 + 0.5 * alert})`;
      ctx.fillRect(px, py + ph - 5 * dpr, pw, 5 * dpr);

      // Left mini status bars
      const lx = w * 0.045;
      panel(lx, h * 0.08, w * 0.12, h * 0.3);
      const cols = ["#3ef08a", "#ffd23e", "#ff4d5e", "#3ec9ff"];
      for (let r = 0; r < 6; r++) {
        const bw =
          (w * 0.085) * (0.35 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.9 + r * 1.7)));
        ctx.fillStyle = cols[r % cols.length];
        ctx.globalAlpha = 0.8;
        ctx.fillRect(lx + 6 * dpr, h * 0.11 + r * h * 0.042, bw, 3 * dpr);
        ctx.globalAlpha = 1;
      }

      // Right panels: line chart + bars
      const rx = w * 0.72;
      panel(rx, h * 0.05, w * 0.23, h * 0.18);
      ctx.strokeStyle = "rgba(255,70,90,0.85)";
      ctx.lineWidth = 1.4 * dpr;
      ctx.beginPath();
      line.forEach((v, i) => {
        const vx = rx + 6 * dpr + (i / (line.length - 1)) * (w * 0.23 - 12 * dpr);
        const wob = v + 0.25 * Math.sin(t * 1.4 + i);
        const vy = h * 0.2 - wob * h * 0.11;
        if (i === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      });
      ctx.stroke();

      panel(rx, h * 0.27, w * 0.23, h * 0.2);
      bars.forEach((v, i) => {
        const bw = (w * 0.23 - 14 * dpr) / bars.length;
        const bh =
          h * 0.14 * (0.3 + 0.7 * (v * 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.1 + i * 1.3))));
        ctx.fillStyle = i % 3 === 1 ? "rgba(255,80,100,0.85)" : "rgba(62,201,255,0.85)";
        ctx.fillRect(rx + 7 * dpr + i * bw, h * 0.45 - bh, bw * 0.62, bh);
      });

      // ── Desk ─────────────────────────────────────────────────────
      ctx.fillStyle = "#0c0d1e";
      ctx.fillRect(0, h * 0.62, w, h * 0.38);
      ctx.fillStyle = "rgba(120,150,220,0.12)";
      ctx.fillRect(0, h * 0.62, w, dpr);

      // ── Paper stacks ─────────────────────────────────────────────
      const stack = (sx: number, sy: number, sheets: number, sw: number) => {
        for (let i = 0; i < sheets; i++) {
          const jitter = Math.sin(i * 37.7) * 2 * dpr;
          const yy = sy - i * 2.6 * dpr;
          ctx.fillStyle = i === sheets - 1 ? "#e8eef8" : "#c9d6ea";
          ctx.strokeStyle = "rgba(70,90,130,0.5)";
          ctx.lineWidth = dpr * 0.6;
          ctx.beginPath();
          ctx.roundRect(sx + jitter, yy, sw, 2.2 * dpr, dpr);
          ctx.fill();
          ctx.stroke();
        }
      };
      const s1 = { x: w * 0.3, y: h * 0.78, n: 9, w: w * 0.13 };
      const s2 = { x: w * 0.48, y: h * 0.82, n: 13, w: w * 0.15 };
      const s3 = { x: w * 0.66, y: h * 0.76, n: 7, w: w * 0.12 };
      stack(s1.x, s1.y, s1.n, s1.w);
      stack(s2.x, s2.y, s2.n, s2.w);
      stack(s3.x, s3.y, s3.n, s3.w);

      // Flying sheet: loops from stack 1 to stack 3 forever (the "workflow")
      const cycle = (t % 2.6) / 2.6;
      const fx = s1.x + (s3.x - s1.x) * cycle;
      const arcY = Math.sin(cycle * Math.PI) * h * 0.16;
      const fy = s1.y - s1.n * 2.6 * dpr + (s3.y - s3.n * 2.6 * dpr - (s1.y - s1.n * 2.6 * dpr)) * cycle - arcY;
      ctx.save();
      ctx.translate(fx + s1.w / 2, fy);
      ctx.rotate(Math.sin(cycle * Math.PI * 2) * 0.18);
      ctx.fillStyle = "#f2f6fc";
      ctx.strokeStyle = "rgba(70,90,130,0.6)";
      ctx.beginPath();
      ctx.roundRect(-s1.w / 2, -4 * dpr, s1.w, 8 * dpr, dpr);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(90,110,150,0.7)";
      for (let l = 0; l < 3; l++)
        ctx.fillRect(-s1.w / 2 + 4 * dpr, -2 * dpr + l * 2.2 * dpr, s1.w * 0.6, dpr * 0.7);
      ctx.restore();

      // ── Robot arm (left), tracking the flying sheet ──────────────
      const baseX = w * 0.13;
      const baseY = h * 0.9;
      const sway = Math.sin(t * 0.9) * 0.12;
      // base
      ctx.fillStyle = "#2a2233";
      ctx.beginPath();
      ctx.roundRect(baseX - w * 0.045, baseY - h * 0.05, w * 0.09, h * 0.08, 6 * dpr);
      ctx.fill();
      // segments
      const j1 = { x: baseX, y: baseY - h * 0.09 };
      const a1 = -1.05 + sway; // upper arm angle
      const L1 = h * 0.24;
      const j2 = { x: j1.x + Math.cos(a1) * L1, y: j1.y + Math.sin(a1) * L1 };
      const a2 = -0.15 + sway * 1.6;
      const L2 = h * 0.18;
      const j3 = { x: j2.x + Math.cos(a2) * L2, y: j2.y + Math.sin(a2) * L2 };
      ctx.strokeStyle = "#4a3b52";
      ctx.lineCap = "round";
      ctx.lineWidth = 9 * dpr;
      ctx.beginPath();
      ctx.moveTo(j1.x, j1.y);
      ctx.lineTo(j2.x, j2.y);
      ctx.stroke();
      ctx.lineWidth = 6.5 * dpr;
      ctx.strokeStyle = "#5d4a66";
      ctx.beginPath();
      ctx.moveTo(j2.x, j2.y);
      ctx.lineTo(j3.x, j3.y);
      ctx.stroke();
      // joints + blinking red LEDs
      [j1, j2, j3].forEach((j, i) => {
        ctx.fillStyle = "#382e42";
        ctx.beginPath();
        ctx.arc(j.x, j.y, (5.5 - i) * dpr, 0, Math.PI * 2);
        ctx.fill();
        const blink = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.9);
        ctx.fillStyle = `rgba(255,50,60,${0.4 + 0.6 * blink})`;
        ctx.shadowColor = "rgba(255,50,60,0.9)";
        ctx.shadowBlur = 7 * dpr * blink;
        ctx.beginPath();
        ctx.arc(j.x, j.y, 1.7 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // ── Red warning flags over the desk ──────────────────────────
      const flag = (fx2: number, fy2: number, fw: number, fh: number, dir: number, ph2: number) => {
        ctx.strokeStyle = "#c8a24a";
        ctx.lineWidth = 1.6 * dpr;
        ctx.beginPath();
        ctx.moveTo(fx2, fy2);
        ctx.lineTo(fx2, fy2 + fh * 2.1);
        ctx.stroke();
        const wave = Math.sin(t * 3.1 + ph2) * fw * 0.14;
        ctx.fillStyle = "#e8232f";
        ctx.shadowColor = "rgba(255,40,60,0.55)";
        ctx.shadowBlur = 10 * dpr;
        ctx.beginPath();
        ctx.moveTo(fx2, fy2);
        ctx.lineTo(fx2 + dir * fw, fy2 + wave * 0.4 - fh * 0.12);
        ctx.lineTo(fx2 + dir * (fw + wave), fy2 + fh);
        ctx.lineTo(fx2, fy2 + fh * 0.82);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      };
      flag(w * 0.56, h * 0.34, w * 0.085, h * 0.12, -1, 0);
      flag(w * 0.62, h * 0.27, w * 0.1, h * 0.14, 1, 1.4);

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
