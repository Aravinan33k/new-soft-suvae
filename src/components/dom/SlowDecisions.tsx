"use client";

import { useEffect, useRef } from "react";

// Animated recreation of the "scattered glowing dashboards" artwork: a wall
// of HUD analytics widgets — progress bars crawling, gauges spinning, a
// candlestick chart ticking, spinners that never finish — insights loading
// forever while the decision waits. Plain 2D canvas, cyan-on-black.

const CYAN = "rgba(62,201,255,";

export default function SlowDecisions({ className }: { className?: string }) {
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

    // Stable candle data
    const candles = Array.from({ length: 12 }, (_, i) => ({
      o: 0.35 + 0.3 * Math.sin(i * 0.9) + Math.random() * 0.12,
      v: 0.1 + Math.random() * 0.2,
      up: Math.random() > 0.45,
    }));
    const trend = Array.from({ length: 18 }, () => Math.random());

    let raf = 0;
    const draw = (now: number) => {
      const t = now / 1000;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const fontPx = Math.max(8, Math.min(11, w / 60));
      ctx.font = `${fontPx * dpr}px monospace`;

      const panel = (x: number, y: number, pw: number, ph: number) => {
        ctx.fillStyle = "rgba(6,12,24,0.85)";
        ctx.strokeStyle = `${CYAN}0.45)`;
        ctx.lineWidth = dpr;
        ctx.beginPath();
        ctx.roundRect(x, y, pw, ph, 3 * dpr);
        ctx.fill();
        ctx.stroke();
        // window chrome "x □ □"
        ctx.fillStyle = `${CYAN}0.8)`;
        for (let i = 0; i < 2; i++)
          ctx.strokeRect(x + pw - (i + 1) * 7 * dpr, y + 3 * dpr, 4 * dpr, 4 * dpr);
        ctx.fillText("×", x + pw - 21 * dpr, y + 7 * dpr);
      };

      // ── Top progress bar, crawling toward 79% forever ─────────────
      const tbX = w * 0.2;
      const tbY = h * 0.05;
      const tbW = w * 0.42;
      const tbH = h * 0.05;
      ctx.strokeStyle = `${CYAN}0.7)`;
      ctx.lineWidth = dpr;
      ctx.beginPath();
      ctx.roundRect(tbX, tbY, tbW, tbH, tbH / 2);
      ctx.stroke();
      const crawl = 0.72 + 0.07 * (0.5 + 0.5 * Math.sin(t * 0.35));
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(tbX + 3 * dpr, tbY + 3 * dpr, (tbW - 6 * dpr) * crawl, tbH - 6 * dpr, tbH / 2);
      ctx.clip();
      // hatched fill drifting slowly
      const drift = (t * 4 * dpr) % (8 * dpr);
      ctx.strokeStyle = `${CYAN}0.9)`;
      ctx.lineWidth = 2.4 * dpr;
      for (let hx = tbX - 20 * dpr - drift; hx < tbX + tbW; hx += 8 * dpr) {
        ctx.beginPath();
        ctx.moveTo(hx, tbY + tbH);
        ctx.lineTo(hx + tbH, tbY);
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = `${CYAN}0.95)`;
      ctx.fillText(`${Math.round(crawl * 100)}%`, tbX + tbW * 0.16, tbY - 3 * dpr);

      // ── Left panel: bars + pill progress rows ─────────────────────
      const lpX = w * 0.04;
      const lpY = h * 0.16;
      const lpW = w * 0.22;
      const lpH = h * 0.5;
      panel(lpX, lpY, lpW, lpH);
      // vertical bars
      for (let i = 0; i < 4; i++) {
        const bh = lpH * 0.2 * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.5 + i * 1.4)));
        ctx.fillStyle = `${CYAN}0.85)`;
        ctx.fillRect(lpX + 8 * dpr + i * 9 * dpr, lpY + lpH * 0.28 - bh, 5 * dpr, bh);
      }
      // ticked list lines
      for (let r = 0; r < 3; r++) {
        ctx.fillStyle = `${CYAN}0.5)`;
        ctx.fillRect(lpX + lpW * 0.42, lpY + 12 * dpr + r * 9 * dpr, lpW * 0.32, 1.6 * dpr);
        ctx.strokeStyle = `${CYAN}0.9)`;
        ctx.beginPath();
        ctx.arc(lpX + lpW * 0.86, lpY + 13 * dpr + r * 9 * dpr, 3.4 * dpr, 0, Math.PI * 2);
        ctx.stroke();
      }
      // mini bar strip
      for (let i = 0; i < 14; i++) {
        const mh = 4 * dpr * (0.4 + 0.6 * Math.abs(Math.sin(i * 1.1 + t * 0.7)));
        ctx.fillStyle = `${CYAN}0.7)`;
        ctx.fillRect(lpX + 8 * dpr + i * ((lpW - 16 * dpr) / 14), lpY + lpH * 0.38 - mh, 2.4 * dpr, mh);
      }
      // pill progress rows — each stuck, inching along
      const pills = [
        { p: 0.32, ph: 0.9 },
        { p: 0.78, ph: 2.2 },
        { p: 0.54, ph: 4.1 },
      ];
      pills.forEach((pill, i) => {
        const py = lpY + lpH * 0.48 + i * lpH * 0.16;
        const pw2 = lpW - 16 * dpr;
        const fill = pill.p + 0.05 * Math.sin(t * 0.4 + pill.ph);
        ctx.strokeStyle = `${CYAN}0.55)`;
        ctx.beginPath();
        ctx.roundRect(lpX + 8 * dpr, py, pw2, lpH * 0.09, lpH * 0.045);
        ctx.stroke();
        const grad = ctx.createLinearGradient(lpX, 0, lpX + pw2, 0);
        grad.addColorStop(0, "rgba(62,201,255,0.25)");
        grad.addColorStop(1, "rgba(62,201,255,0.95)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(lpX + 8 * dpr, py, pw2 * fill, lpH * 0.09, lpH * 0.045);
        ctx.fill();
        ctx.fillStyle = "#06121f";
        ctx.beginPath();
        ctx.arc(lpX + 8 * dpr + pw2 * fill - 6 * dpr, py + lpH * 0.045, 6.4 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `${CYAN}0.9)`;
        ctx.stroke();
        ctx.fillStyle = `${CYAN}0.95)`;
        ctx.fillText(`${Math.round(fill * 100)}%`, lpX + 8 * dpr + pw2 * fill - 13 * dpr, py + lpH * 0.045 + 3 * dpr);
      });

      // ── Center panel: candlestick chart + sparkline row ───────────
      const cpX = w * 0.3;
      const cpY = h * 0.14;
      const cpW = w * 0.42;
      const cpH = h * 0.52;
      panel(cpX, cpY, cpW, cpH);
      // grid
      ctx.strokeStyle = `${CYAN}0.12)`;
      for (let gx = 1; gx < 6; gx++) {
        ctx.beginPath();
        ctx.moveTo(cpX + (gx / 6) * cpW, cpY + 8 * dpr);
        ctx.lineTo(cpX + (gx / 6) * cpW, cpY + cpH * 0.62);
        ctx.stroke();
      }
      // candles (the newest one ticks up and down while it "loads")
      const chartY = cpY + cpH * 0.08;
      const chartH = cpH * 0.5;
      candles.forEach((c, i) => {
        const cx2 = cpX + cpW * 0.06 + i * (cpW * 0.88) / candles.length;
        const live = i === candles.length - 1;
        const wobble = live ? 0.08 * Math.sin(t * 1.2) : 0;
        const top = chartY + chartH * (1 - c.o - c.v - wobble);
        const bh = chartH * (c.v + wobble * 0.5);
        ctx.strokeStyle = `${CYAN}0.85)`;
        ctx.lineWidth = dpr;
        ctx.beginPath();
        ctx.moveTo(cx2 + 3 * dpr, top - 6 * dpr);
        ctx.lineTo(cx2 + 3 * dpr, top + bh + 6 * dpr);
        ctx.stroke();
        ctx.fillStyle = c.up ? `${CYAN}0.95)` : "rgba(15,60,110,0.95)";
        ctx.strokeStyle = `${CYAN}0.9)`;
        ctx.fillRect(cx2, top, 6 * dpr, bh);
        ctx.strokeRect(cx2, top, 6 * dpr, bh);
      });
      // trend polyline drifting slowly
      ctx.strokeStyle = `${CYAN}0.9)`;
      ctx.lineWidth = 1.6 * dpr;
      ctx.beginPath();
      trend.forEach((v, i) => {
        const vx = cpX + cpW * 0.06 + (i / (trend.length - 1)) * cpW * 0.88;
        const vy = chartY + chartH * (0.85 - 0.55 * (v * 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.3 + i * 0.7))));
        i === 0 ? ctx.moveTo(vx, vy) : ctx.lineTo(vx, vy);
      });
      ctx.stroke();
      // sparkline row
      for (let sIdx = 0; sIdx < 3; sIdx++) {
        const sx = cpX + cpW * 0.04 + sIdx * cpW * 0.32;
        const sy = cpY + cpH * 0.7;
        const sw = cpW * 0.28;
        const sh = cpH * 0.22;
        ctx.strokeStyle = `${CYAN}0.3)`;
        ctx.strokeRect(sx, sy, sw, sh);
        ctx.strokeStyle = `${CYAN}0.85)`;
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) {
          const vx = sx + (i / 20) * sw;
          const vy = sy + sh * (0.5 - 0.32 * Math.sin(i * (0.5 + sIdx * 0.2) + t * (0.6 + sIdx * 0.3)));
          i === 0 ? ctx.moveTo(vx, vy) : ctx.lineTo(vx, vy);
        }
        ctx.stroke();
      }

      // ── Right panels: donut trio + big ring gauge ─────────────────
      const rpX = w * 0.76;
      const rpW = w * 0.2;
      panel(rpX, h * 0.14, rpW, h * 0.2);
      const donuts = [0.92, 0.78, 0.8];
      donuts.forEach((v, i) => {
        const dx = rpX + rpW * 0.2 + i * rpW * 0.3;
        const dy = h * 0.21;
        const r = Math.min(w, h) * 0.028;
        ctx.strokeStyle = `${CYAN}0.25)`;
        ctx.lineWidth = 3 * dpr;
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `${CYAN}0.95)`;
        ctx.beginPath();
        ctx.arc(dx, dy, r, -Math.PI / 2 + t * 0.5, -Math.PI / 2 + t * 0.5 + Math.PI * 2 * v);
        ctx.stroke();
        ctx.fillStyle = `${CYAN}0.95)`;
        ctx.fillText(`${Math.round(v * 100)}%`, dx - 8 * dpr, dy + r + 10 * dpr);
      });
      // big ring gauge 59% with rotating dashes
      panel(rpX, h * 0.4, rpW, h * 0.32);
      const gx2 = rpX + rpW / 2;
      const gy2 = h * 0.56;
      const gr = Math.min(w, h) * 0.065;
      ctx.setLineDash([7 * dpr, 5 * dpr]);
      ctx.strokeStyle = `${CYAN}0.9)`;
      ctx.lineWidth = 4.5 * dpr;
      ctx.save();
      ctx.translate(gx2, gy2);
      ctx.rotate(t * 0.6);
      ctx.beginPath();
      ctx.arc(0, 0, gr, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.restore();
      ctx.setLineDash([]);
      // orbit dots
      for (let i = 0; i < 3; i++) {
        const oa = t * 0.6 + (i * Math.PI * 2) / 3;
        ctx.fillStyle = `${CYAN}0.9)`;
        ctx.beginPath();
        ctx.arc(gx2 + Math.cos(oa) * gr * 1.35, gy2 + Math.sin(oa) * gr * 1.35, 1.8 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = `${CYAN}1)`;
      ctx.fillText("59%", gx2 - 9 * dpr, gy2 + 3 * dpr);

      // ── Bottom-left donuts 48% / 89% ──────────────────────────────
      [
        { v: 0.48, x: w * 0.09 },
        { v: 0.89, x: w * 0.19 },
      ].forEach((d) => {
        const dy2 = h * 0.8;
        const r = Math.min(w, h) * 0.045;
        ctx.strokeStyle = `${CYAN}0.22)`;
        ctx.lineWidth = 4 * dpr;
        ctx.beginPath();
        ctx.arc(d.x, dy2, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `${CYAN}0.95)`;
        ctx.beginPath();
        ctx.arc(d.x, dy2, r, -Math.PI / 2 - t * 0.4, -Math.PI / 2 - t * 0.4 + Math.PI * 2 * d.v);
        ctx.stroke();
        ctx.fillStyle = `${CYAN}0.95)`;
        ctx.fillText(`${Math.round(d.v * 100)}%`, d.x - 9 * dpr, dy2 + 3 * dpr);
      });

      // ── Bottom bar-chart panel ────────────────────────────────────
      const bpX = w * 0.3;
      const bpY = h * 0.74;
      const bpW = w * 0.26;
      const bpH = h * 0.2;
      panel(bpX, bpY, bpW, bpH);
      for (let i = 0; i < 12; i++) {
        const bh = bpH * 0.6 * (0.3 + 0.7 * Math.abs(Math.sin(i * 0.8 + t * 0.5)));
        ctx.fillStyle = `${CYAN}${0.5 + 0.4 * Math.abs(Math.sin(i + t))})`;
        ctx.fillRect(bpX + 8 * dpr + i * ((bpW - 16 * dpr) / 12), bpY + bpH - 8 * dpr - bh, 5 * dpr, bh);
      }

      // ── Dot-matrix panel + 97% dotted spinner ─────────────────────
      const mpX = w * 0.6;
      const mpY = h * 0.72;
      const mpW = w * 0.32;
      const mpH = h * 0.24;
      panel(mpX, mpY, mpW, mpH);
      const rows = [0.46, 0.79, 0.62, 0.88];
      rows.forEach((v, r) => {
        const ry = mpY + 10 * dpr + r * (mpH - 16 * dpr) / rows.length;
        ctx.fillStyle = `${CYAN}0.95)`;
        ctx.fillText(`${Math.round(v * 100)}%`, mpX + 5 * dpr, ry + 6 * dpr);
        const total = 12;
        const lit = Math.floor(total * v * (0.85 + 0.15 * Math.sin(t * 0.5 + r)));
        for (let i = 0; i < total; i++) {
          ctx.fillStyle = i < lit ? `${CYAN}0.9)` : `${CYAN}0.2)`;
          ctx.beginPath();
          ctx.roundRect(mpX + mpW * 0.24 + i * mpW * 0.045, ry, mpW * 0.03, 5 * dpr, 2 * dpr);
          ctx.fill();
        }
      });
      // dotted spinner
      const spX = mpX + mpW * 0.85;
      const spY = mpY + mpH * 0.5;
      const spR = Math.min(w, h) * 0.035;
      for (let i = 0; i < 10; i++) {
        const sa = (i / 10) * Math.PI * 2 + t * 1.2;
        const fade = (i / 10 + (t * 0.6) % 1) % 1;
        ctx.fillStyle = `${CYAN}${0.15 + 0.8 * fade})`;
        ctx.beginPath();
        ctx.arc(spX + Math.cos(sa) * spR, spY + Math.sin(sa) * spR, 1.7 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = `${CYAN}0.95)`;
      ctx.fillText("97%", spX - 9 * dpr, spY + 3 * dpr);

      // ── Checkboxes column, one check slowly blinking in ───────────
      const cbX = w * 0.265;
      for (let i = 0; i < 4; i++) {
        const cy2 = h * 0.72 + i * h * 0.065;
        ctx.strokeStyle = `${CYAN}0.8)`;
        ctx.lineWidth = 1.3 * dpr;
        ctx.strokeRect(cbX, cy2, 8 * dpr, 8 * dpr);
        if (i === 1) {
          const on = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.8));
          ctx.strokeStyle = `${CYAN}${on})`;
          ctx.lineWidth = 1.8 * dpr;
          ctx.beginPath();
          ctx.moveTo(cbX + 1.5 * dpr, cy2 + 4 * dpr);
          ctx.lineTo(cbX + 3.5 * dpr, cy2 + 6.5 * dpr);
          ctx.lineTo(cbX + 9 * dpr, cy2 - dpr);
          ctx.stroke();
        }
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
