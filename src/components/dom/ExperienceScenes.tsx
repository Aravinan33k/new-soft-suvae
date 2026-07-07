"use client";

import { useEffect, useRef } from "react";

// One canvas, eight cinematic story scenes — one per service chapter of the
// experience stage. Each scene is a short "kutty story" told on a local
// timeline (t = seconds since the chapter became active), so the story
// replays from the start every time its chapter is selected:
//   0 Custom AI      — data particles rush together and a glowing AI brain is born
//   1 Automation     — disconnected app nodes get wired up; golden pulses + gears
//   2 Chatbots       — a chat bubble becomes an AI orb answering everyone at once
//   3 Software       — code lines write themselves, fold into cubes, power up
//   4 Mobile         — a phone wireframe rises; UI parts fly in; devices multiply
//   5 Web            — a browser outline draws itself and a dashboard comes alive
//   6 Modernization  — dusty server racks transform into a cloud network
//   7 GCC            — a rotating globe lights up office by office
// Chapter changes dissolve through a stream of glowing particles with small
// electric arcs — the premium transition that ties every scene together.

type Pt = { x: number; y: number };
type Ctx = CanvasRenderingContext2D;

const ORANGE = "#FF8A3D";
const AMBER = "#FFC76A";
const BLUE = "#4EA8FF";
const GOLD = "#FFD166";
const GREEN = "#34D399";
const PURPLE = "#B388FF";
const WHITE_WARM = "#FFF7E6";

const TWO_PI = Math.PI * 2;
const FADE_MS = 900;

/* ── tiny animation helpers ────────────────────────────────────────── */
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
// eased progress of the story beat that runs [start, start + dur] seconds
const ph = (t: number, start: number, dur: number) =>
  easeOut((t - start) / dur);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function dot(
  ctx: Ctx,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number,
  blur = 8,
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

function ring(
  ctx: Ctx,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number,
  width = 1.5,
) {
  if (alpha <= 0 || r <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TWO_PI);
  ctx.stroke();
  ctx.restore();
}

function gear(
  ctx: Ctx,
  x: number,
  y: number,
  r: number,
  teeth: number,
  rot: number,
  color: string,
  alpha: number,
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TWO_PI);
  ctx.stroke();
  for (let i = 0; i < teeth; i++) {
    ctx.save();
    ctx.rotate((i / teeth) * TWO_PI);
    ctx.fillRect(r - 1, -2.5, r * 0.28 + 2, 5);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, TWO_PI);
  ctx.stroke();
  ctx.restore();
}

function heart(
  ctx: Ctx,
  x: number,
  y: number,
  s: number,
  color: string,
  alpha: number,
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.4, y, x - s * 0.7, y - s * 1.1, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.1, x + s * 1.4, y, x, y + s * 0.9);
  ctx.fill();
  ctx.restore();
}

type Scene = {
  build: (w: number, h: number) => void;
  // t is LOCAL story time in seconds since this chapter was activated
  draw: (ctx: Ctx, t: number, w: number, h: number, alpha: number) => void;
};

/* ── Scene 0: Custom AI — chaos → clusters → brain → intelligence ─── */
// Story told in growing stages: a handful of data sparks appear and
// multiply; the lost particles start finding each other and pull together
// into small clusters (gravity, fast small / slow big); the clusters wire
// themselves to each other; everything condenses into a glowing AI brain
// with a BOOM pulse — and the brain keeps running: rotating slowly, firing
// synapses, breathing. "AI is created from data."
function customAIScene(): Scene {
  type P = {
    sx: number; sy: number; lx: number; ly: number; tx: number; ty: number;
    born: number; delay: number; gDur: number; bDur: number;
    size: number; color: string; jit: number;
  };
  type Mote = { x: number; y: number; vx: number; vy: number; size: number; jit: number };
  let parts: P[] = [];
  let clusterCenters: Pt[] = [];
  let clusterPairs: [number, number][] = [];
  let clusterLinks: [number, number][] = [];
  let brainLinks: [number, number][] = [];
  let motes: Mote[] = [];
  const pos: Pt[] = [];

  return {
    build(w, h) {
      const cx = w / 2, cy = h * 0.46, R = Math.min(w, h) * 0.21;
      // small clusters the particles first gather into
      const K = 7;
      clusterCenters = Array.from({ length: K }, (_, k) => {
        const a = (k / K) * TWO_PI + Math.random() * 0.5;
        return {
          x: cx + Math.cos(a) * Math.min(w, h) * (0.17 + Math.random() * 0.14),
          y: cy + Math.sin(a) * Math.min(w, h) * (0.11 + Math.random() * 0.11),
        };
      });
      const byCluster: number[][] = Array.from({ length: K }, () => []);
      parts = Array.from({ length: 300 }, (_, i) => {
        const k = i % K;
        byCluster[k].push(i);
        const cc = clusterCenters[k];
        const lobe = Math.random() < 0.5 ? -1 : 1;
        const a = Math.random() * TWO_PI;
        const br = Math.sqrt(Math.random()) * R;
        const size = 1 + Math.random() * 1.8;
        const g = () => Math.random() + Math.random() + Math.random() - 1.5;
        return {
          sx: Math.random() * w,
          sy: Math.random() * h,
          lx: cc.x + g() * 26,
          ly: cc.y + g() * 22,
          tx: cx + lobe * R * 0.42 + Math.cos(a) * br * 0.75,
          ty: cy + Math.sin(a) * br * 0.62,
          // suspense: a few sparks first, multiplying into hundreds
          born: 2.0 * Math.pow(Math.random(), 0.35),
          delay: Math.random() * 0.5,
          // small particles race, big ones drift (both settle near target)
          gDur: 1.4 * (0.55 + size / 2.9),
          bDur: 1.2 * (0.55 + size / 2.9),
          size,
          color: Math.random() < 0.16 ? "#FB5A38" : Math.random() < 0.5 ? ORANGE : AMBER,
          jit: Math.random() * TWO_PI,
        };
      });
      // wiring inside each small cluster
      clusterPairs = [];
      for (let k = 0; k < K; k++) {
        const members = byCluster[k];
        for (let m = 0; m < 10 && m + 1 < members.length; m++)
          clusterPairs.push([members[m], members[m + 1 + ((m * 7) % (members.length - m - 1))]]);
      }
      // the clusters then connect to each other
      clusterLinks = [];
      for (let k = 0; k < K; k++) clusterLinks.push([k, (k + 1) % K]);
      clusterLinks.push([0, 3], [2, 5]);
      // synapses between neighbouring brain points
      brainLinks = [];
      for (let i = 0; i < parts.length && brainLinks.length < 210; i += 2) {
        for (let j = i + 1; j < i + 14 && j < parts.length; j++) {
          const d = Math.hypot(parts[j].tx - parts[i].tx, parts[j].ty - parts[i].ty);
          if (d < R * 0.3) { brainLinks.push([i, j]); break; }
        }
      }
      // small soft motes drifting in front of the camera (depth)
      motes = Array.from({ length: 9 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 10,
        size: 2 + Math.random() * 2,
        jit: Math.random() * TWO_PI,
      }));
      pos.length = parts.length;
    },
    draw(ctx, t, w, h, alpha) {
      const cx = w / 2, cy = h * 0.46;

      // beats: sparks multiply (0–2) → clusters form (2.2–3.9) → clusters
      // connect (4.2–5.3) → condense into the brain (5.5–6.7) → BOOM →
      // the intelligence runs
      const boomT = t - 6.7;
      const boomKick = boomT > 0 ? Math.max(0, 1 - boomT / 0.35) : 0;
      const spinA = t > 7 ? (t - 7) * 0.04 : 0; // the formed brain rotates
      const cosS = Math.cos(spinA), sinS = Math.sin(spinA);

      let orgSum = 0;
      const bornA: number[] = [];
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const ba = ph(t, p.born, 0.35);
        bornA[i] = ba;
        // aimless wander while the data is still chaos
        const wx = p.sx + Math.sin(t * 0.5 + p.jit) * 34 + Math.cos(t * 0.32 + p.jit * 2) * 22;
        const wy = p.sy + Math.cos(t * 0.44 + p.jit) * 30 + Math.sin(t * 0.27 + p.jit * 2) * 18;
        // gravity: each particle falls toward its cluster at its own pace
        const u1 = ph(t, 2.2 + p.delay, p.gDur);
        const u2 = ph(t, 5.5 + p.delay * 0.4, p.bDur);
        orgSum += u1;
        let x = lerp(wx, p.lx, u1), y = lerp(wy, p.ly, u1);
        x = lerp(x, p.tx, u2) + Math.sin(t * 1.3 + p.jit) * 2.4 * u2;
        y = lerp(y, p.ty, u2) + Math.cos(t * 1.1 + p.jit) * 2.0 * u2;
        // once formed, the whole brain slowly rotates — it is running
        if (spinA > 0 && u2 >= 1) {
          const dx = x - cx, dy = y - cy;
          x = cx + dx * cosS - dy * sinS;
          y = cy + dx * sinS + dy * cosS;
        }
        pos[i] = { x, y };
      }
      const organized = orgSum / parts.length;

      // small clusters wire themselves as members arrive
      const cpA = ph(t, 3.1, 0.8) * (1 - ph(t, 5.7, 0.9)) * alpha;
      if (cpA > 0) {
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = "#D9A86B";
        for (let k = 0; k < clusterPairs.length; k++) {
          const [i, j] = clusterPairs[k];
          ctx.globalAlpha = cpA * 0.4 * Math.min(bornA[i], bornA[j]);
          ctx.beginPath();
          ctx.moveTo(pos[i].x, pos[i].y);
          ctx.lineTo(pos[j].x, pos[j].y);
          ctx.stroke();
        }
      }

      // ...then the clusters connect to each other, one line at a time
      const clA = (1 - ph(t, 5.9, 0.8)) * alpha;
      if (t > 4.2 && clA > 0) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = AMBER;
        for (let k = 0; k < clusterLinks.length; k++) {
          const u = ph(t, 4.2 + k * 0.14, 0.5);
          if (u <= 0) continue;
          const a = clusterCenters[clusterLinks[k][0]];
          const b = clusterCenters[clusterLinks[k][1]];
          ctx.globalAlpha = clA * 0.45;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(lerp(a.x, b.x, u), lerp(a.y, b.y, u));
          ctx.stroke();
          if (u >= 1) {
            const su = (t * 0.7 + k * 0.23) % 1;
            dot(ctx, lerp(a.x, b.x, su), lerp(a.y, b.y, su), 2, GOLD, clA * 0.8, 6);
          }
        }
      }

      // synapses fire once the brain has formed — with occasional bright
      // electric flashes so the AI visibly keeps computing
      const la = ph(t, 6.9, 1.1) * alpha;
      if (la > 0) {
        ctx.lineWidth = 0.7;
        for (let k = 0; k < brainLinks.length; k++) {
          const [i, j] = brainLinks[k];
          const flicker = 0.55 + 0.45 * Math.sin(t * 2.2 + k * 1.7);
          ctx.globalAlpha = la * 0.3 * flicker;
          ctx.strokeStyle = k % 5 === 0 ? GOLD : ORANGE;
          ctx.beginPath();
          ctx.moveTo(pos[i].x, pos[i].y);
          ctx.lineTo(pos[j].x, pos[j].y);
          ctx.stroke();
        }
        if (t > 7.5) {
          const sparkIdx = Math.floor(t * 1.43) % brainLinks.length;
          const sparkA = 1 - ((t * 1.43) % 1);
          const [i, j] = brainLinks[sparkIdx];
          ctx.save();
          ctx.globalAlpha = la * sparkA * 0.9;
          ctx.strokeStyle = "#FFE3A3";
          ctx.lineWidth = 1.4;
          ctx.shadowColor = GOLD;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(pos[i].x, pos[i].y);
          ctx.lineTo(pos[j].x, pos[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }

      // the particles — dim while lost, bright once purposeful, spiking
      // with the formation boom
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (bornA[i] <= 0) continue;
        ctx.globalAlpha =
          alpha * bornA[i] * (0.4 + 0.4 * organized) * (1 + boomKick * 1.1);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(pos[i].x, pos[i].y, p.size, 0, TWO_PI);
        ctx.fill();
      }

      // BOOM: the moment the brain locks in, one pulse makes it alive
      if (boomT > 0 && boomT < 1.1) {
        const bu = boomT / 1.1;
        ring(ctx, cx, cy, easeOut(bu) * Math.min(w, h) * 0.42, ORANGE, alpha * (1 - bu) * 0.8, 2.5);
        ring(ctx, cx, cy, easeOut(bu) * Math.min(w, h) * 0.3, GOLD, alpha * (1 - bu) * 0.5, 1.5);
        const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.4);
        flash.addColorStop(0, `rgba(255,199,106,${0.3 * (1 - bu) * alpha})`);
        flash.addColorStop(1, "transparent");
        ctx.globalAlpha = 1;
        ctx.fillStyle = flash;
        ctx.fillRect(0, 0, w, h);
      }

      // the brain thinks: energy waves ripple outward (t > 7.2)
      for (let k = 0; k < 3; k++) {
        const wave = (t - 7.2 + k * 1.1) % 3.3;
        if (t > 7.2 && wave > 0) {
          const u = wave / 3.3;
          ring(ctx, cx, cy, u * Math.min(w, h) * 0.44, ORANGE, alpha * 0.22 * (1 - u), 1.5);
        }
      }

      // depth: small soft motes drifting in front of the whole scene
      ctx.save();
      ctx.shadowBlur = 6;
      for (const mt of motes) {
        let mx = (mt.x + mt.vx * t) % (w + 60);
        let my = (mt.y + mt.vy * t) % (h + 60);
        if (mx < -60) mx += w + 60;
        if (my < -60) my += h + 60;
        ctx.globalAlpha = alpha * (0.04 + 0.04 * Math.sin(t * 0.8 + mt.jit));
        ctx.fillStyle = ORANGE;
        ctx.shadowColor = ORANGE;
        ctx.beginPath();
        ctx.arc(mx, my, mt.size, 0, TWO_PI);
        ctx.fill();
      }
      ctx.restore();

      // intelligence emerges: named capabilities orbit the brain (t > 7.6)
      const oa = ph(t, 7.6, 1) * alpha;
      if (oa > 0) {
        const oR = Math.min(w, h) * 0.33;
        const labels = ["LLM", "RAG", "AGENTS", "PREDICT"];
        for (let k = 0; k < 4; k++) {
          const a = t * 0.3 + (k / 4) * TWO_PI;
          const x = cx + Math.cos(a) * oR * 1.25;
          const y = cy + Math.sin(a) * oR * 0.62;
          const col = k % 2 === 0 ? AMBER : GOLD;
          ctx.save();
          ctx.globalAlpha = oa * 0.9;
          ctx.strokeStyle = col;
          ctx.fillStyle = col;
          ctx.lineWidth = 1.5;
          if (k === 0) {
            // LLM: a chip
            ctx.strokeRect(x - 7, y - 7, 14, 14);
            for (let b = -1; b <= 1; b++) {
              ctx.beginPath();
              ctx.moveTo(x + b * 4.5, y - 7); ctx.lineTo(x + b * 4.5, y - 11);
              ctx.moveTo(x + b * 4.5, y + 7); ctx.lineTo(x + b * 4.5, y + 11);
              ctx.stroke();
            }
          } else if (k === 1) {
            // RAG: a document with a lens
            ctx.strokeRect(x - 6, y - 8, 11, 15);
            ctx.beginPath(); ctx.arc(x + 5, y + 5, 4.5, 0, TWO_PI); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + 8.4, y + 8.4); ctx.lineTo(x + 12, y + 12); ctx.stroke();
          } else if (k === 2) {
            // agents: a triad
            for (let b = 0; b < 3; b++) {
              const ba = (b / 3) * TWO_PI - Math.PI / 2;
              ctx.beginPath();
              ctx.arc(x + Math.cos(ba) * 8, y + Math.sin(ba) * 8, 2.4, 0, TWO_PI);
              ctx.fill();
            }
            ctx.globalAlpha = oa * 0.4;
            ctx.beginPath(); ctx.arc(x, y, 8, 0, TWO_PI); ctx.stroke();
            ctx.globalAlpha = oa * 0.9;
          } else {
            // prediction: rising bars
            for (let b = 0; b < 3; b++)
              ctx.fillRect(x - 8 + b * 7, y + 7 - (b + 1) * 5.5, 4, (b + 1) * 5.5);
          }
          ctx.font = "600 9px ui-monospace, monospace";
          ctx.textAlign = "center";
          ctx.globalAlpha = oa * 0.75;
          ctx.fillText(labels[k], x, y + 24);
          ctx.restore();
        }
      }

      // core glow ignites as the brain condenses, breathing once alive
      const breath = 0.75 + 0.25 * Math.sin(t * 1.1);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.3);
      g.addColorStop(0, `rgba(255,140,60,${0.28 * breath * alpha * ph(t, 5.8, 1.2)})`);
      g.addColorStop(1, "transparent");
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
  };
}

/* ── Scene 1: Automation — everything works together ──────────────── */
function automationScene(): Scene {
  type Node = { x: number; y: number; drift: number; glyph: number };
  let nodes: Node[] = [];
  let linkPairs: [number, number][] = [];

  const glyphs = (ctx: Ctx, g: number, s: number) => {
    // simple line glyphs: envelope, database, chat, chart, cloud, monitor
    ctx.lineWidth = 1.6;
    if (g === 0) {
      ctx.strokeRect(-s, -s * 0.7, s * 2, s * 1.4);
      ctx.beginPath(); ctx.moveTo(-s, -s * 0.7); ctx.lineTo(0, s * 0.15); ctx.lineTo(s, -s * 0.7); ctx.stroke();
    } else if (g === 1) {
      ctx.beginPath(); ctx.ellipse(0, -s * 0.6, s, s * 0.4, 0, 0, TWO_PI); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s, -s * 0.6); ctx.lineTo(-s, s * 0.6); ctx.ellipse(0, s * 0.6, s, s * 0.4, 0, Math.PI, TWO_PI, true); ctx.lineTo(s, -s * 0.6); ctx.stroke();
    } else if (g === 2) {
      rr(ctx, -s, -s * 0.75, s * 2, s * 1.3, 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.55); ctx.lineTo(-s * 0.65, s * 1.05); ctx.lineTo(0, s * 0.55); ctx.stroke();
    } else if (g === 3) {
      for (let b = 0; b < 3; b++) ctx.strokeRect(-s + b * s * 0.8, s * 0.8 - (b + 1) * s * 0.55, s * 0.5, (b + 1) * s * 0.55);
    } else if (g === 4) {
      ctx.beginPath();
      ctx.arc(-s * 0.35, 0, s * 0.5, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(s * 0.05, -s * 0.35, s * 0.55, Math.PI, TWO_PI);
      ctx.arc(s * 0.55, 0.5, s * 0.45, Math.PI * 1.5, Math.PI * 0.5);
      ctx.closePath(); ctx.stroke();
    } else {
      ctx.strokeRect(-s, -s * 0.75, s * 2, s * 1.2);
      ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.75); ctx.lineTo(-s * 0.4, s * 1.05); ctx.lineTo(s * 0.4, s * 1.05); ctx.lineTo(s * 0.4, s * 0.75); ctx.stroke();
    }
  };

  return {
    build(w, h) {
      const cx = w / 2, cy = h * 0.48, R = Math.min(w, h) * 0.3;
      nodes = Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * TWO_PI - Math.PI / 2 + (Math.random() - 0.5) * 0.35;
        return {
          x: cx + Math.cos(a) * R * (1 + (Math.random() - 0.5) * 0.25) * 1.35,
          y: cy + Math.sin(a) * R * (1 + (Math.random() - 0.5) * 0.25) * 0.8,
          drift: Math.random() * TWO_PI,
          glyph: i,
        };
      });
      linkPairs = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 3]];
    },
    draw(ctx, t, w, h, alpha) {
      const cx = w / 2, cy = h * 0.48;

      // beats: isolated apps (0–1.6) → lines search (1.6–5) → data flows
      // (5+) → the workflow completes on its own (7+)
      const np: Pt[] = nodes.map((n, i) => {
        // strong lonely drift that calms down once the node is wired in
        const wired = ph(t, 2.3 + i * 0.5, 0.8);
        const amp = 10 - 6 * wired;
        return {
          x: n.x + Math.sin(t * 0.9 + n.drift) * amp,
          y: n.y + Math.cos(t * 0.75 + n.drift) * amp,
        };
      });

      linkPairs.forEach(([i, j], k) => {
        const probeStart = 1.6 + k * 0.5;
        const uP = ph(t, probeStart, 0.7);
        if (uP <= 0) return;
        const a = np[i], b = np[j];
        const connected = t > probeStart + 0.7;
        ctx.save();
        if (!connected) {
          // a gray probe line searches for its partner
          ctx.globalAlpha = alpha * 0.4;
          ctx.strokeStyle = "#7d8db0";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 5]);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(lerp(a.x, b.x, uP), lerp(a.y, b.y, uP));
          ctx.stroke();
        } else {
          // found: the connection snaps solid in brand orange
          ctx.globalAlpha = alpha * 0.55;
          ctx.strokeStyle = ORANGE;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        ctx.restore();

        // a flash celebrates the moment of connection
        const snap = t - (probeStart + 0.7);
        if (snap > 0 && snap < 0.4)
          ring(ctx, b.x, b.y, 6 + snap * 40, AMBER, alpha * (1 - snap / 0.4) * 0.8, 1.5);

        // once everything is wired, golden data flows through the network
        if (t > 5.2) {
          const flow = ((t - 5.2) * 0.5 + k * 0.17) % 1;
          const px = lerp(a.x, b.x, flow), py = lerp(a.y, b.y, flow);
          dot(ctx, px, py, 2.6, GOLD, alpha * 0.9, 10);
          const tx = lerp(a.x, b.x, Math.max(0, flow - 0.08));
          const ty = lerp(a.y, b.y, Math.max(0, flow - 0.08));
          ctx.save();
          ctx.globalAlpha = alpha * 0.35;
          ctx.strokeStyle = GOLD;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(px, py); ctx.stroke();
          ctx.restore();
        }
      });

      // the app nodes: dim and alone at first, glowing once connected
      nodes.forEach((n, i) => {
        const appear = ph(t, i * 0.15, 0.7);
        if (appear <= 0) return;
        const wired = ph(t, 2.3 + i * 0.5, 0.8);
        const p = np[i];
        const s = 21;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.globalAlpha = alpha * appear * (0.35 + 0.65 * wired);
        ctx.strokeStyle = wired > 0.5 ? ORANGE : "#7d8db0";
        ctx.shadowColor = ORANGE;
        ctx.shadowBlur = wired * 14;
        ctx.lineWidth = 1.4;
        rr(ctx, -s, -s, s * 2, s * 2, 8);
        ctx.stroke();
        ctx.shadowBlur = 0;
        glyphs(ctx, n.glyph, s * 0.42);
        ctx.restore();

        // tasks complete on their own: little checks pop near each node
        if (t > 7) {
          const cyc = (t - 7 + i * 0.9) % 3.2;
          if (cyc < 1) {
            const ca = Math.sin(clamp01(cyc) * Math.PI);
            ctx.save();
            ctx.globalAlpha = alpha * ca;
            ctx.strokeStyle = GREEN;
            ctx.lineWidth = 2;
            ctx.translate(p.x + s + 8, p.y - s - 4 - cyc * 8);
            ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-1, 3); ctx.lineTo(5, -4); ctx.stroke();
            ctx.restore();
          }
        }
      });

      // gears spin at the heart of the running workflow (t > 5.6)
      const ga = ph(t, 5.6, 0.9) * alpha;
      if (ga > 0) {
        const spin = easeOut((t - 5.6) / 2) * t * 0.9;
        gear(ctx, cx - 14, cy - 6, 20, 8, spin, ORANGE, ga * 0.9);
        gear(ctx, cx + 20, cy + 14, 13, 8, -spin * 1.5 + 0.3, AMBER, ga * 0.75);
      }

      // the whole workflow completes: a green pulse sweeps the network
      if (t > 7.4) {
        const done = (t - 7.4) % 4;
        if (done < 1.2)
          ring(ctx, cx, cy, (done / 1.2) * Math.min(w, h) * 0.42, GREEN, alpha * 0.3 * (1 - done / 1.2), 1.5);
      }
    },
  };
}

/* ── Scene 2: Chatbots — the queue piles up, the AI clears it ─────── */
// Story: requests fly in from every side and pile up unanswered, the
// sleeping bot wakes, answers every message one after another, the queue
// vanishes, hearts float up — and it keeps answering instantly forever.
// "One AI helping everyone."
function chatbotsScene(): Scene {
  type Lane = { angle: number; arrive: number; color: string };
  let lanes: Lane[] = [];

  return {
    build() {
      const colors = [BLUE, GREEN, AMBER, PURPLE, GOLD, "#9fc3ff", GREEN, BLUE];
      lanes = Array.from({ length: 8 }, (_, i) => ({
        angle: (i / 8) * TWO_PI + 0.35,
        arrive: 0.3 + i * 0.3, // the pile builds during the first ~2.7s
        color: colors[i],
      }));
    },
    draw(ctx, t, w, h, alpha) {
      const cx = w / 2, cy = h * 0.44;
      const R = Math.min(w, h) * 0.09;
      const edge = Math.min(w, h) * 0.52;
      const wake = ph(t, 3, 0.9);
      const cleared = ph(t, 6.4, 1);

      // waiting queue slots under the bot
      const slot = (i: number): Pt => ({
        x: cx + ((i % 4) - 1.5) * 56,
        y: cy + R * 2.3 + Math.floor(i / 4) * 34,
      });

      // ── the bot: dormant and gray, then awake and warm ──
      const r = R * (0.92 + 0.08 * wake);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.4);
      g.addColorStop(0, `rgba(255,140,60,${(0.06 + 0.36 * wake) * alpha})`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.globalAlpha = 1;
      ctx.fillRect(cx - r * 3, cy - r * 3, r * 6, r * 6);
      ring(ctx, cx, cy, r, wake > 0.4 ? ORANGE : "#7d8db0", alpha * (0.5 + 0.5 * wake), 2);
      // wake-up flash
      const wakeCyc = t - 3;
      if (wakeCyc > 0 && wakeCyc < 0.8)
        ring(ctx, cx, cy, r + wakeCyc * 60, ORANGE, alpha * (1 - wakeCyc / 0.8) * 0.7, 1.6);

      // face: closed-line eyes while asleep, blinking ovals awake
      ctx.save();
      ctx.globalAlpha = alpha;
      const eye = r * 0.32;
      if (wake < 0.5) {
        ctx.strokeStyle = "#9aa7bd";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - eye - r * 0.1, cy - r * 0.18); ctx.lineTo(cx - eye + r * 0.1, cy - r * 0.18);
        ctx.moveTo(cx + eye - r * 0.1, cy - r * 0.18); ctx.lineTo(cx + eye + r * 0.1, cy - r * 0.18);
        ctx.stroke();
      } else {
        const blink = ((t * 0.6) % 3) < 0.12 ? 0.15 : 1;
        ctx.fillStyle = WHITE_WARM;
        ctx.beginPath();
        ctx.ellipse(cx - eye, cy - r * 0.18, r * 0.09, r * 0.16 * blink, 0, 0, TWO_PI);
        ctx.ellipse(cx + eye, cy - r * 0.18, r * 0.09, r * 0.16 * blink, 0, 0, TWO_PI);
        ctx.fill();
        // the smile grows as the queue disappears
        ctx.strokeStyle = WHITE_WARM;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.18, r * (0.26 + 0.12 * cleared), Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
      }
      ctx.restore();

      // halo only once awake
      if (wake > 0) {
        ctx.save();
        ctx.globalAlpha = alpha * wake * 0.5;
        ctx.strokeStyle = AMBER;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 8]);
        ctx.lineDashOffset = -t * 14;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.55, 0, TWO_PI);
        ctx.stroke();
        ctx.restore();
      }

      // ── the queue: requests pile up, then get answered one by one ──
      lanes.forEach((lane, i) => {
        const sx = cx + Math.cos(lane.angle) * edge * 1.35;
        const sy = cy + Math.sin(lane.angle) * edge * 0.8;
        const s = slot(i);
        const inU = ph(t, lane.arrive, 0.9);
        if (inU <= 0) return;
        const ansT = 3.9 + i * 0.26; // the awake bot clears one per beat

        if (t <= ansT) {
          // request flies in and waits in the pile, bobbing impatiently
          const x = lerp(sx, s.x, inU);
          const y = lerp(sy, s.y, inU) + (inU >= 1 ? Math.sin(t * 2.2 + i) * 2.5 : 0);
          ctx.save();
          ctx.globalAlpha = alpha * 0.85;
          ctx.strokeStyle = lane.color;
          ctx.lineWidth = 1.4;
          rr(ctx, x - 17, y - 10, 34, 20, 6);
          ctx.stroke();
          ctx.globalAlpha = alpha * 0.55;
          ctx.fillStyle = lane.color;
          ctx.fillRect(x - 10, y - 4, 14, 2);
          ctx.fillRect(x - 10, y + 1, 20, 2);
          // "…" pending dots blink while the message waits unanswered
          if (inU >= 1) {
            for (let d = 0; d < 3; d++) {
              const on = 0.25 + 0.75 * Math.abs(Math.sin(t * 2.4 + d * 0.9 + i));
              ctx.globalAlpha = alpha * 0.8 * on;
              ctx.beginPath();
              ctx.arc(x + 21 + d * 5, y - 8, 1.4, 0, TWO_PI);
              ctx.fill();
            }
          }
          ctx.restore();
        } else {
          const u = clamp01((t - ansT) / 0.8);
          if (u < 1) {
            // answered: an orange reply races back out along the lane
            const x = lerp(s.x, sx, easeOut(u)), y = lerp(s.y, sy, easeOut(u));
            ctx.save();
            ctx.globalAlpha = alpha * (1 - u * 0.7);
            ctx.strokeStyle = ORANGE;
            ctx.shadowColor = ORANGE;
            ctx.shadowBlur = 8;
            ctx.lineWidth = 1.3;
            rr(ctx, x - 15 - u * 5, y - 9 - u * 3, 30 + u * 10, 18 + u * 6, 6);
            ctx.stroke();
            ctx.restore();
            // the answer beam from the bot at the moment of reply
            if (u < 0.3) {
              ctx.save();
              ctx.globalAlpha = alpha * (1 - u / 0.3) * 0.5;
              ctx.strokeStyle = ORANGE;
              ctx.lineWidth = 1.2;
              ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(s.x, s.y); ctx.stroke();
              ctx.restore();
            }
          } else {
            // satisfied: a little heart floats up where the request stood
            const hu = clamp01((t - ansT - 0.8) / 1.3);
            if (hu < 1)
              heart(ctx, s.x, s.y - 6 - hu * 30, 5, "#FF7A9E", alpha * (1 - hu) * 0.9);
          }
        }
      });

      // ── always on: new messages get answered the instant they arrive ──
      if (t > 7.6) {
        const period = 2.4;
        const cyc = (t - 7.6) % period;
        const li = Math.floor((t - 7.6) / period) % lanes.length;
        const lane = lanes[li];
        const sx = cx + Math.cos(lane.angle) * edge * 1.35;
        const sy = cy + Math.sin(lane.angle) * edge * 0.8;
        const ex = cx + Math.cos(lane.angle) * R * 2.1;
        const ey = cy + Math.sin(lane.angle) * R * 2.1;
        if (cyc < 0.8) {
          const u = easeOut(cyc / 0.8);
          const x = lerp(sx, ex, u), y = lerp(sy, ey, u);
          ctx.save();
          ctx.globalAlpha = alpha * 0.85;
          ctx.strokeStyle = lane.color;
          ctx.lineWidth = 1.4;
          rr(ctx, x - 15, y - 9, 30, 18, 6);
          ctx.stroke();
          ctx.restore();
        } else if (cyc < 1.6) {
          const u = easeOut((cyc - 0.8) / 0.8);
          const x = lerp(ex, sx, u), y = lerp(ey, sy, u);
          ctx.save();
          ctx.globalAlpha = alpha * (1 - u * 0.6);
          ctx.strokeStyle = ORANGE;
          ctx.shadowColor = ORANGE;
          ctx.shadowBlur = 8;
          ctx.lineWidth = 1.3;
          rr(ctx, x - 15, y - 9, 30, 18, 6);
          ctx.stroke();
          ctx.restore();
        } else {
          const hu = (cyc - 1.6) / 0.8;
          heart(ctx, ex, ey - hu * 22, 4.5, "#FF7A9E", alpha * (1 - hu) * 0.9);
        }
      }

      // happy sparkles celebrate the cleared queue
      if (cleared > 0) {
        for (let k = 0; k < 5; k++) {
          const a = t * 0.5 + (k / 5) * TWO_PI;
          const x = cx + Math.cos(a) * r * 2.3;
          const y = cy + Math.sin(a) * r * 1.9;
          const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 2 + k * 1.3));
          ctx.save();
          ctx.globalAlpha = alpha * cleared * tw * 0.8;
          ctx.strokeStyle = GOLD;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y);
          ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
          ctx.stroke();
          ctx.restore();
        }
      }
    },
  };
}

/* ── Scene 3: Software — building secure digital foundations ──────── */
function softwareScene(): Scene {
  type Row = { y: number; segs: { x: number; w: number; color: string }[] };
  let rows: Row[] = [];
  let cubes: { sx: number; sy: number; tx: number; ty: number }[] = [];

  return {
    build(w, h) {
      const left = w * 0.18, top = h * 0.14;
      const colors = [ORANGE, BLUE, AMBER, "#8899bb", GREEN];
      rows = Array.from({ length: 9 }, (_, i) => {
        let x = left + (i % 3) * 14;
        const segs = Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => {
          const sw = 18 + Math.random() * 46;
          const seg = { x, w: sw, color: colors[Math.floor(Math.random() * colors.length)] };
          x += sw + 9;
          return seg;
        });
        return { y: top + i * 17, segs };
      });
      // 3×3 isometric platform assembled at center
      const cx = w / 2, cy = h * 0.56, s = Math.min(w, h) * 0.052;
      cubes = [];
      for (let gy = 0; gy < 3; gy++)
        for (let gx = 0; gx < 3; gx++) {
          const ix = (gx - gy) * s * 1.02;
          const iy = (gx + gy) * s * 0.52;
          cubes.push({
            sx: left + 60, sy: rows[(gx + gy * 3) % rows.length].y,
            tx: cx + ix, ty: cy + iy - s,
          });
        }
    },
    draw(ctx, t, w, h, alpha) {
      const s = Math.min(w, h) * 0.052;
      const cx = w / 2, cy = h * 0.56;

      // code writes itself in the air (t 0 → 2.2), then folds away
      const fold = ph(t, 2.1, 1.2);
      rows.forEach((row, i) => {
        const typed = ph(t, i * 0.18, 0.8);
        if (typed <= 0 || fold >= 1) return;
        row.segs.forEach((seg, k) => {
          const su = clamp01(typed * row.segs.length - k);
          if (su <= 0) return;
          ctx.save();
          ctx.globalAlpha = alpha * 0.75 * su * (1 - fold);
          ctx.fillStyle = seg.color;
          ctx.fillRect(seg.x + fold * (cx - seg.x) * 0.4, row.y + fold * (cy - row.y) * 0.4, seg.w * (1 - fold * 0.7), 4);
          ctx.restore();
        });
        // typing caret
        if (typed < 1 && fold <= 0) {
          const last = row.segs[Math.min(row.segs.length - 1, Math.floor(typed * row.segs.length))];
          const caretOn = Math.floor(t * 3) % 2 === 0;
          if (caretOn) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = WHITE_WARM;
            ctx.fillRect(last.x + last.w + 3, row.y - 2, 2, 9);
          }
        }
      });

      // cubes assemble into the platform (t 2.2 → 4)
      cubes.forEach((c, k) => {
        const u = ph(t, 2.2 + k * 0.14, 0.7);
        if (u <= 0) return;
        const x = lerp(c.sx, c.tx, u), y = lerp(c.sy, c.ty, u);
        const powered = t > 4 ? 0.5 + 0.5 * Math.sin(t * 2.4 - k * 0.55) : 0;
        ctx.save();
        ctx.globalAlpha = alpha * u;
        ctx.lineWidth = 1.3;
        // top face
        ctx.fillStyle = `rgba(255,148,64,${0.14 + powered * 0.2})`;
        ctx.strokeStyle = ORANGE;
        ctx.beginPath();
        ctx.moveTo(x, y - s * 0.52); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s * 0.52); ctx.lineTo(x - s, y);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // left + right faces
        ctx.fillStyle = `rgba(190,84,38,${0.2 + powered * 0.12})`;
        ctx.beginPath();
        ctx.moveTo(x - s, y); ctx.lineTo(x, y + s * 0.52); ctx.lineTo(x, y + s * 1.28); ctx.lineTo(x - s, y + s * 0.76);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = `rgba(140,58,30,${0.26 + powered * 0.1})`;
        ctx.beginPath();
        ctx.moveTo(x + s, y); ctx.lineTo(x, y + s * 0.52); ctx.lineTo(x, y + s * 1.28); ctx.lineTo(x + s, y + s * 0.76);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      });

      // the system powers up: rising light column + guard icons (t > 4.2)
      const pa = ph(t, 4.2, 1) * alpha;
      if (pa > 0) {
        const g = ctx.createLinearGradient(0, cy - s * 6, 0, cy);
        g.addColorStop(0, "transparent");
        g.addColorStop(1, `rgba(255,138,61,${0.2 * pa})`);
        ctx.fillStyle = g;
        ctx.fillRect(cx - s * 1.4, cy - s * 6, s * 2.8, s * 6);

        const oR = Math.min(w, h) * 0.26;
        for (let k = 0; k < 3; k++) {
          const a = t * 0.4 + (k / 3) * TWO_PI + 0.6;
          const x = cx + Math.cos(a) * oR * 1.3;
          const y = cy - s + Math.sin(a) * oR * 0.55;
          ctx.save();
          ctx.globalAlpha = pa * 0.9;
          ctx.strokeStyle = k === 0 ? GREEN : k === 1 ? BLUE : AMBER;
          ctx.lineWidth = 1.6;
          if (k === 0) {
            // shield
            ctx.beginPath();
            ctx.moveTo(x, y - 9); ctx.lineTo(x + 8, y - 5); ctx.lineTo(x + 8, y + 2);
            ctx.quadraticCurveTo(x + 8, y + 8, x, y + 11);
            ctx.quadraticCurveTo(x - 8, y + 8, x - 8, y + 2);
            ctx.lineTo(x - 8, y - 5); ctx.closePath(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x - 3, y + 1); ctx.lineTo(x - 1, y + 4); ctx.lineTo(x + 4, y - 3); ctx.stroke();
          } else if (k === 1) {
            // cloud
            ctx.beginPath();
            ctx.arc(x - 5, y + 2, 6, Math.PI * 0.5, Math.PI * 1.5);
            ctx.arc(x, y - 4, 7, Math.PI, TWO_PI);
            ctx.arc(x + 7, y + 2, 5.5, Math.PI * 1.5, Math.PI * 0.5);
            ctx.closePath(); ctx.stroke();
          } else {
            // speed gauge
            ctx.beginPath(); ctx.arc(x, y + 3, 9, Math.PI, TWO_PI); ctx.stroke();
            const needle = Math.PI * (1.15 + 0.7 * (0.5 + 0.5 * Math.sin(t * 1.8)));
            ctx.beginPath(); ctx.moveTo(x, y + 3);
            ctx.lineTo(x + Math.cos(needle) * 7, y + 3 + Math.sin(needle) * 7); ctx.stroke();
          }
          ctx.restore();
        }
      }
    },
  };
}

/* ── Scene 4: Mobile — smart experiences in your pocket ───────────── */
function mobileScene(): Scene {
  type Part = { tx: number; ty: number; tw: number; th: number; fromA: number; kind: number };
  let parts: Part[] = [];

  const phone = (ctx: Ctx, x: number, y: number, pw: number, phh: number, alpha: number, glow: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 2;
    ctx.shadowColor = ORANGE;
    ctx.shadowBlur = 10 + glow * 18;
    rr(ctx, x - pw / 2, y - phh / 2, pw, phh, pw * 0.12);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // notch
    ctx.globalAlpha = alpha * 0.9;
    rr(ctx, x - pw * 0.16, y - phh / 2 + 6, pw * 0.32, 6, 3);
    ctx.stroke();
    if (glow > 0) {
      const g = ctx.createLinearGradient(0, y - phh / 2, 0, y + phh / 2);
      g.addColorStop(0, `rgba(255,140,60,${0.14 * glow * alpha})`);
      g.addColorStop(1, `rgba(249,43,78,${0.08 * glow * alpha})`);
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      rr(ctx, x - pw / 2 + 4, y - phh / 2 + 4, pw - 8, phh - 8, pw * 0.09);
      ctx.fill();
    }
    ctx.restore();
  };

  return {
    build(w, h) {
      const pw = Math.min(w, h) * 0.26 * 0.56, phh = Math.min(w, h) * 0.26 * 1.15;
      const cx = w / 2, cy = h * 0.5;
      const sl = cx - pw / 2 + 8, st = cy - phh / 2 + 22, iw = pw - 16;
      parts = [
        { tx: sl, ty: st, tw: iw, th: 12, fromA: Math.PI, kind: 0 },              // header
        { tx: sl, ty: st + 20, tw: iw * 0.45, th: 26, fromA: -0.6, kind: 1 },     // card
        { tx: sl + iw * 0.55, ty: st + 20, tw: iw * 0.45, th: 26, fromA: 0.6, kind: 1 },
        { tx: sl, ty: st + 56, tw: iw, th: 40, fromA: Math.PI / 2, kind: 2 },     // chart
        { tx: sl, ty: st + 106, tw: iw, th: 10, fromA: -Math.PI / 2, kind: 3 },   // row
        { tx: sl, ty: st + 122, tw: iw, th: 10, fromA: Math.PI * 0.8, kind: 3 },
        { tx: sl + iw - 26, ty: st + 142, tw: 26, th: 13, fromA: 0.2, kind: 4 },  // toggle
      ];
    },
    draw(ctx, t, w, h, alpha) {
      const size = Math.min(w, h) * 0.26;
      const pw = size * 0.56, phh = size * 1.15;
      const cx = w / 2;
      const bob = Math.sin(t * 0.9) * 4;
      const rise = 1 - ph(t, 0, 1.4);
      const cy = h * 0.5 + rise * 90 + bob;
      const riseA = ph(t, 0, 1.4);
      const glow = ph(t, 3.9, 1);

      // duplicate Android + iPhone versions appear beside (t > 4.8)
      const dup = ph(t, 4.8, 1);
      if (dup > 0) {
        const off = pw * 1.35 * dup;
        ctx.save();
        ctx.translate(cx - off, cy + 8);
        ctx.rotate(-0.09 * dup);
        phone(ctx, 0, 0, pw * 0.82, phh * 0.82, alpha * dup * 0.55, glow * 0.5);
        ctx.restore();
        ctx.save();
        ctx.translate(cx + off, cy + 8);
        ctx.rotate(0.09 * dup);
        phone(ctx, 0, 0, pw * 0.82, phh * 0.82, alpha * dup * 0.55, glow * 0.5);
        ctx.restore();
      }

      phone(ctx, cx, cy, pw, phh, alpha * riseA, glow);

      // UI components fly into place (t 1.4 → 3.4)
      const dy = cy - h * 0.5;
      parts.forEach((p, i) => {
        const u = ph(t, 1.4 + i * 0.24, 0.6);
        if (u <= 0) return;
        const dist = (1 - u) * Math.min(w, h) * 0.4;
        const x = p.tx + Math.cos(p.fromA) * dist;
        const y = p.ty + dy + Math.sin(p.fromA) * dist;
        ctx.save();
        ctx.globalAlpha = alpha * u * 0.9;
        if (p.kind === 2) {
          // mini chart: three animated bars
          ctx.strokeStyle = "rgba(255,199,106,0.4)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, p.tw, p.th);
          for (let b = 0; b < 4; b++) {
            const bh = p.th * (0.3 + 0.6 * Math.abs(Math.sin(t * 1.2 + b)));
            ctx.fillStyle = b % 2 ? AMBER : ORANGE;
            ctx.fillRect(x + 6 + b * (p.tw / 4.4), y + p.th - bh, p.tw / 8, bh);
          }
        } else if (p.kind === 4) {
          // toggle flips on
          ctx.strokeStyle = GREEN;
          ctx.lineWidth = 1.4;
          rr(ctx, x, y, p.tw, p.th, p.th / 2);
          ctx.stroke();
          const on = t > 3.6 ? 1 : 0;
          ctx.fillStyle = GREEN;
          ctx.beginPath();
          ctx.arc(x + (on ? p.tw - p.th / 2 : p.th / 2), y + p.th / 2, p.th / 2 - 2.5, 0, TWO_PI);
          ctx.fill();
        } else {
          ctx.fillStyle = p.kind === 0 ? "rgba(255,138,61,0.5)" : "rgba(255,199,106,0.26)";
          rr(ctx, x, y, p.tw, p.th, 4);
          ctx.fill();
        }
        ctx.restore();
      });

      // the AI assistant wakes up inside the app (t > 3.2)
      const aiA = ph(t, 3.2, 0.7);
      if (aiA > 0) {
        const ax = cx, ay = cy + phh * 0.22;
        const ar = 12 * aiA;
        dot(ctx, ax, ay, ar * 1.6, ORANGE, alpha * aiA * 0.16, 20);
        ring(ctx, ax, ay, ar, ORANGE, alpha * aiA * 0.9, 1.6);
        ctx.save();
        ctx.globalAlpha = alpha * aiA;
        ctx.fillStyle = WHITE_WARM;
        ctx.beginPath();
        ctx.arc(ax - ar * 0.34, ay - ar * 0.16, 1.5, 0, TWO_PI);
        ctx.arc(ax + ar * 0.34, ay - ar * 0.16, 1.5, 0, TWO_PI);
        ctx.fill();
        ctx.strokeStyle = WHITE_WARM;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(ax, ay + ar * 0.14, ar * 0.34, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
        ctx.restore();
        const pw2 = (t * 0.8) % 1;
        ring(ctx, ax, ay, ar + pw2 * 14, ORANGE, alpha * aiA * 0.4 * (1 - pw2), 1);
      }

      // notification pings once alive
      if (t > 4.4) {
        const cyc = (t - 4.4) % 2.6;
        if (cyc < 1.1) {
          const px = cx + pw / 2 - 6, py = cy - phh / 2 + 6;
          dot(ctx, px, py, 4, "#F92B4E", alpha * (1 - cyc / 1.1), 8);
          ring(ctx, px, py, 4 + cyc * 14, "#F92B4E", alpha * (1 - cyc / 1.1) * 0.7, 1.2);
        }
      }
    },
  };
}

/* ── Scene 5: Web — powerful experiences on every screen ──────────── */
function webScene(): Scene {
  let chart: number[] = [];

  return {
    build() {
      chart = Array.from({ length: 9 }, () => 0.25 + Math.random() * 0.65);
    },
    draw(ctx, t, w, h, alpha) {
      const bw = Math.min(w * 0.5, 460), bh = bw * 0.62;
      const bx = w / 2 - bw / 2, by = h * 0.47 - bh / 2 + Math.sin(t * 0.8) * 4;

      // the browser draws itself as an outline (t 0 → 1.4)
      const draw = ph(t, 0, 1.4);
      ctx.save();
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 1.6;
      const per = (bw + bh) * 2;
      ctx.setLineDash([per * draw, per]);
      rr(ctx, bx, by, bw, bh, 10);
      ctx.stroke();
      ctx.setLineDash([]);
      if (draw > 0.5) {
        ctx.globalAlpha = alpha * (draw - 0.5) * 2 * 0.8;
        ctx.beginPath();
        ctx.moveTo(bx, by + 26);
        ctx.lineTo(bx + bw, by + 26);
        ctx.stroke();
        [ORANGE, AMBER, GREEN].forEach((c, i) => {
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.arc(bx + 14 + i * 12, by + 13, 3.2, 0, TWO_PI);
          ctx.fill();
        });
      }
      ctx.restore();

      // dashboard panels animate into position (t 1.4 → 3.4)
      const inner = { x: bx + 12, y: by + 36, w: bw - 24, h: bh - 48 };
      const panel = (u: number, x: number, y: number, pw2: number, ph2: number, slide: number) => {
        if (u <= 0) return 0;
        ctx.globalAlpha = alpha * u * 0.6;
        ctx.strokeStyle = "rgba(255,176,87,0.45)";
        ctx.lineWidth = 1;
        rr(ctx, x, y + (1 - u) * slide, pw2, ph2, 5);
        ctx.stroke();
        return u;
      };

      ctx.save();
      // sidebar
      const u0 = panel(ph(t, 1.4, 0.5), inner.x, inner.y, inner.w * 0.2, inner.h, 18);
      if (u0 > 0) {
        ctx.fillStyle = "rgba(255,199,106,0.32)";
        for (let i = 0; i < 4; i++)
          ctx.fillRect(inner.x + 7, inner.y + 10 + i * 16, inner.w * 0.2 - 14, 5);
      }
      // stat cards
      for (let i = 0; i < 3; i++) {
        const cw = inner.w * 0.24;
        const u = panel(ph(t, 1.7 + i * 0.2, 0.5), inner.x + inner.w * 0.23 + i * (cw + 8), inner.y, cw, inner.h * 0.3, 14);
        if (u > 0) {
          ctx.fillStyle = i === 0 ? ORANGE : i === 1 ? GREEN : AMBER;
          ctx.globalAlpha = alpha * u * 0.85;
          ctx.fillRect(inner.x + inner.w * 0.23 + i * (cw + 8) + 7, inner.y + 8, cw * 0.4, 5);
          ctx.fillStyle = "rgba(255,247,230,0.5)";
          ctx.fillRect(inner.x + inner.w * 0.23 + i * (cw + 8) + 7, inner.y + 18, cw * 0.6, 4);
        }
      }
      // line chart panel + animated polyline
      const chY = inner.y + inner.h * 0.36;
      const chH = inner.h * 0.62;
      const chX = inner.x + inner.w * 0.23;
      const chW = inner.w * 0.5;
      const uC = panel(ph(t, 2.3, 0.6), chX, chY, chW, chH, 16);
      if (uC > 0) {
        const prog = clamp01((t - 2.6) / 2.2);
        ctx.save();
        ctx.globalAlpha = alpha * uC * 0.95;
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = ORANGE;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        const n = Math.max(2, Math.ceil(chart.length * prog));
        for (let i = 0; i < n; i++) {
          const px = chX + 8 + (i / (chart.length - 1)) * (chW - 16);
          const wob = Math.sin(t * 1.5 + i) * 2;
          const py = chY + chH - 8 - chart[i] * (chH - 18) + wob;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
          if (i === n - 1 && prog < 1) dot(ctx, px, py, 3, GOLD, alpha, 8);
        }
        ctx.stroke();
        ctx.restore();
      }
      // donut
      const uD = panel(ph(t, 2.6, 0.6), chX + chW + 8, chY, inner.w * 0.26 - 8, chH, 16);
      if (uD > 0) {
        const dx = chX + chW + 8 + (inner.w * 0.26 - 8) / 2;
        const dyy = chY + chH / 2;
        const sweep = clamp01((t - 2.9) / 1.6) * TWO_PI * 0.72;
        ctx.save();
        ctx.globalAlpha = alpha * uD;
        ctx.lineWidth = 5;
        ctx.strokeStyle = "rgba(255,199,106,0.18)";
        ctx.beginPath(); ctx.arc(dx, dyy, chH * 0.26, 0, TWO_PI); ctx.stroke();
        ctx.strokeStyle = ORANGE;
        ctx.beginPath(); ctx.arc(dx, dyy, chH * 0.26, -Math.PI / 2, -Math.PI / 2 + sweep); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // glowing interaction: a cursor moves and clicks (t > 3.6)
      if (t > 3.6) {
        const u = (t - 3.6) % 3;
        const cxr = bx + bw * (0.3 + 0.35 * (0.5 + 0.5 * Math.sin(u * 2.1)));
        const cyr = by + bh * (0.45 + 0.3 * (0.5 + 0.5 * Math.cos(u * 1.7)));
        ctx.save();
        ctx.globalAlpha = alpha * 0.95;
        ctx.fillStyle = WHITE_WARM;
        ctx.beginPath();
        ctx.moveTo(cxr, cyr);
        ctx.lineTo(cxr + 4, cyr + 11);
        ctx.lineTo(cxr + 6.5, cyr + 6.5);
        ctx.lineTo(cxr + 11, cyr + 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        const clickCyc = u % 1.5;
        if (clickCyc < 0.5)
          ring(ctx, cxr, cyr, 4 + clickCyc * 24, ORANGE, alpha * (1 - clickCyc * 2) * 0.8, 1.4);
      }

      // the AI assistant joins the finished dashboard (t > 3.9)
      const aiA = ph(t, 3.9, 0.7);
      if (aiA > 0) {
        const ax = bx + bw - 30, ay = by + bh - 26;
        const ar = 10 * aiA;
        dot(ctx, ax, ay, ar * 1.6, ORANGE, alpha * aiA * 0.18, 16);
        ring(ctx, ax, ay, ar, ORANGE, alpha * aiA * 0.9, 1.5);
        ctx.save();
        ctx.globalAlpha = alpha * aiA;
        ctx.fillStyle = WHITE_WARM;
        ctx.beginPath();
        ctx.arc(ax - ar * 0.34, ay - ar * 0.14, 1.3, 0, TWO_PI);
        ctx.arc(ax + ar * 0.34, ay - ar * 0.14, 1.3, 0, TWO_PI);
        ctx.fill();
        ctx.strokeStyle = WHITE_WARM;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(ax, ay + ar * 0.12, ar * 0.34, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
        ctx.restore();
        // greeting bubble pops beside the assistant
        const hi = ph(t, 4.4, 0.5) * (1 - ph(t, 6.4, 0.8));
        if (hi > 0) {
          ctx.save();
          ctx.globalAlpha = alpha * hi * 0.9;
          ctx.strokeStyle = AMBER;
          ctx.lineWidth = 1.2;
          rr(ctx, ax - 46, ay - 24, 30, 16, 5);
          ctx.stroke();
          ctx.fillStyle = AMBER;
          ctx.fillRect(ax - 41, ay - 18, 14, 2);
          ctx.fillRect(ax - 41, ay - 14, 20, 2);
          ctx.restore();
        }
      }

      // the build completes: a bright pulse runs around the frame
      if (t > 5.6) {
        const doneP = (t - 5.6) % 5;
        if (doneP < 1) {
          ctx.save();
          ctx.globalAlpha = alpha * (1 - doneP) * 0.6;
          ctx.strokeStyle = ORANGE;
          ctx.lineWidth = 2;
          ctx.shadowColor = ORANGE;
          ctx.shadowBlur = 14;
          rr(ctx, bx - doneP * 10, by - doneP * 10, bw + doneP * 20, bh + doneP * 20, 12);
          ctx.stroke();
          ctx.restore();
        }
      }
    },
  };
}

/* ── Scene 6: Modernization — transforming the old into the future ── */
function modernizationScene(): Scene {
  type Puff = { delay: number; rack: number; slot: number };
  let puffs: Puff[] = [];

  const cloud = (ctx: Ctx, x: number, y: number, s: number, color: string, alpha: number, fill = false) => {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = "rgba(255,167,88,0.1)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x - s * 0.6, y, s * 0.5, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(x - s * 0.05, y - s * 0.42, s * 0.55, Math.PI * 0.95, Math.PI * 1.95);
    ctx.arc(x + s * 0.62, y - s * 0.05, s * 0.48, Math.PI * 1.4, Math.PI * 0.5);
    ctx.closePath();
    if (fill) ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  return {
    build() {
      puffs = Array.from({ length: 18 }, (_, i) => ({
        delay: 2.6 + Math.random() * 1.6,
        rack: i % 3,
        slot: Math.floor(Math.random() * 5),
      }));
    },
    draw(ctx, t, w, h, alpha) {
      const rackW = Math.min(w, h) * 0.11, rackH = rackW * 2.1;
      const baseY = h * 0.52;
      const rackX = (i: number) => w * 0.22 + (i - 1) * rackW * 1.4;
      const cloudX = (i: number) => w * 0.72 + (i - 1) * rackW * 1.5;
      const cloudY = (i: number) => h * 0.42 + (i % 2) * rackH * 0.34;

      // the old server room fades in, dusty and flickering (t 0 → 1.5)
      const oldA = ph(t, 0, 1.5) * (1 - ph(t, 4.6, 1.6) * 0.55);
      for (let i = 0; i < 3; i++) {
        const x = rackX(i), flick = 0.75 + 0.25 * Math.sin(t * 6 + i * 2.4);
        ctx.save();
        ctx.globalAlpha = alpha * oldA * 0.75 * flick;
        ctx.strokeStyle = "#7d8db0";
        ctx.lineWidth = 1.4;
        ctx.strokeRect(x - rackW / 2, baseY - rackH / 2, rackW, rackH);
        for (let sl = 0; sl < 5; sl++) {
          const sy = baseY - rackH / 2 + 9 + sl * (rackH - 18) / 4;
          // slots go from dead gray to live blue as the energy hits (t > 2.4)
          const live = ph(t, 2.4 + i * 0.5 + sl * 0.14, 0.5);
          ctx.strokeStyle = live > 0.4 ? AMBER : "#55627c";
          ctx.globalAlpha = alpha * oldA * (0.5 + live * 0.5);
          ctx.strokeRect(x - rackW / 2 + 5, sy, rackW - 10, 7);
          if (live > 0.4) {
            ctx.fillStyle = GOLD;
            ctx.globalAlpha = alpha * live * (0.4 + 0.6 * Math.abs(Math.sin(t * 3 + sl)));
            ctx.fillRect(x + rackW / 2 - 11, sy + 2, 3, 3);
          }
        }
        ctx.restore();
      }

      // blue energy surges through the cable into the racks (t 1.5 → …)
      if (t > 1.5) {
        const cy2 = baseY + rackH * 0.62;
        ctx.save();
        ctx.globalAlpha = alpha * 0.45;
        ctx.strokeStyle = AMBER;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 7]);
        ctx.lineDashOffset = -t * 26;
        ctx.beginPath();
        ctx.moveTo(w * 0.06, cy2);
        ctx.quadraticCurveTo(w * 0.3, cy2 + 26, rackX(2) + rackW, cy2);
        ctx.stroke();
        ctx.restore();
        const u = ((t - 1.5) * 0.45) % 1;
        const qx = lerp(w * 0.06, rackX(2) + rackW, u);
        const qy = cy2 + Math.sin(u * Math.PI) * 24;
        dot(ctx, qx, qy, 3, GOLD, alpha * 0.9, 10);
      }

      // servers dissolve upward into cloud puffs that drift right (t > 2.6)
      puffs.forEach((p) => {
        const cyc = t - p.delay;
        if (cyc < 0) return;
        const u = clamp01(cyc / 2.4);
        if (u >= 1) return;
        const sx = rackX(p.rack);
        const sy = baseY - rackH / 2 + 12 + p.slot * (rackH - 18) / 4;
        const tx = cloudX(p.rack), ty = cloudY(p.rack);
        const x = lerp(sx, tx, easeOut(u));
        const y = lerp(sy, ty, easeOut(u)) - Math.sin(u * Math.PI) * 46;
        dot(ctx, x, y, 2.2 + u, u < 0.5 ? AMBER : GOLD, alpha * (1 - u * 0.35) * 0.9, 8);
      });

      // the cloud network forms (t > 3.4)
      const ca = ph(t, 3.4, 1.4) * alpha;
      if (ca > 0) {
        for (let i = 0; i < 3; i++)
          cloud(ctx, cloudX(i), cloudY(i), rackW * 0.66, AMBER, ca * (0.6 + 0.4 * Math.sin(t * 1.4 + i * 2)), true);
        // pulsing links between clouds
        ctx.save();
        ctx.globalAlpha = ca * 0.4;
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = -t * 16;
        for (let i = 0; i < 2; i++) {
          ctx.beginPath();
          ctx.moveTo(cloudX(i), cloudY(i));
          ctx.lineTo(cloudX(i + 1), cloudY(i + 1));
          ctx.stroke();
        }
        ctx.restore();
      }

      // AI monitors every operation: scanning ring above the network (t > 4.6)
      const ma = ph(t, 4.6, 1) * alpha;
      if (ma > 0) {
        const mx = w * 0.72, my = h * 0.2;
        ring(ctx, mx, my, 15, ORANGE, ma * 0.9, 1.6);
        ctx.save();
        ctx.globalAlpha = ma;
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 1.6;
        const sweep = t * 1.6;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + Math.cos(sweep) * 13, my + Math.sin(sweep) * 13);
        ctx.stroke();
        ctx.restore();
        ring(ctx, mx, my, 20 + ((t * 14) % 16), ORANGE, ma * 0.3 * (1 - ((t * 14) % 16) / 16), 1);
        // watch beams down to each cloud
        ctx.save();
        ctx.globalAlpha = ma * 0.18;
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(mx, my + 15);
          ctx.lineTo(cloudX(i), cloudY(i) - rackW * 0.5);
          ctx.stroke();
        }
        ctx.restore();
      }
    },
  };
}

/* ── Scene 7: GCC — connecting global talent with AI ──────────────── */
function gccScene(): Scene {
  let sphere: { lat: number; lon: number }[] = [];
  let offices: number[] = [];
  let stars: { x: number; y: number; r: number; phase: number }[] = [];

  return {
    build(w, h) {
      // fibonacci point sphere
      sphere = Array.from({ length: 240 }, (_, i) => {
        const y = 1 - (i / 239) * 2;
        return { lat: Math.asin(y), lon: i * 2.399963 };
      });
      offices = [24, 70, 118, 150, 190, 226];
      stars = Array.from({ length: 50 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.5 + Math.random() * 1.1,
        phase: Math.random() * TWO_PI,
      }));
    },
    draw(ctx, t, w, h, alpha) {
      const cx = w / 2, cy = h * 0.5, R = Math.min(w, h) * 0.27;
      const rot = t * 0.22;

      // beats: dark globe (0–1.6) → offices wake one by one (1.6–5.5) →
      // AI links them (arcs draw sequentially) → one glowing world network
      const oT = (k: number) => 1.6 + k * 0.75;
      let litCount = 0;
      for (let k = 0; k < offices.length; k++) if (t > oT(k)) litCount++;
      const network = ph(t, 6.8, 1.4);
      // the whole planet brightens as offices join
      const B = 0.3 + 0.42 * (litCount / offices.length) + 0.28 * network;

      for (const s of stars) {
        ctx.globalAlpha = alpha * (0.12 + 0.2 * (0.5 + 0.5 * Math.sin(s.phase + t)));
        ctx.fillStyle = "#cdd9ee";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TWO_PI);
        ctx.fill();
      }

      // project the rotating globe; z decides front/back brightness
      const proj = sphere.map((p) => {
        const lon = p.lon + rot;
        const x3 = Math.cos(p.lat) * Math.cos(lon);
        const z3 = Math.cos(p.lat) * Math.sin(lon);
        return { x: cx + x3 * R, y: cy + Math.sin(p.lat) * R * 0.96, z: z3 };
      });

      const globeIn = ph(t, 0, 1.4);
      // halo behind the finished world network
      if (network > 0) {
        const halo = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 1.8);
        halo.addColorStop(0, `rgba(255,167,88,${0.1 * network * alpha})`);
        halo.addColorStop(1, "transparent");
        ctx.globalAlpha = 1;
        ctx.fillStyle = halo;
        ctx.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4);
      }
      proj.forEach((p) => {
        const front = p.z > 0;
        ctx.globalAlpha = alpha * globeIn * (front ? 0.55 : 0.16) * B;
        ctx.fillStyle = front ? "#9fc3ff" : "#4a5f85";
        ctx.beginPath();
        ctx.arc(p.x, p.y, front ? 1.4 : 1, 0, TWO_PI);
        ctx.fill();
      });
      ring(ctx, cx, cy, R * 1.01, AMBER, alpha * globeIn * 0.25 * B, 1);

      // offices wake one by one — the first with a dramatic double flare
      offices.forEach((oi, k) => {
        const lit = ph(t, oT(k), 0.6);
        if (lit <= 0) return;
        const p = proj[oi];
        const vis = p.z > -0.15 ? 1 : 0.25;
        const flare = t - oT(k);
        if (flare < 0.9) {
          const fu = flare / 0.9;
          const boost = k === 0 ? 1.6 : 1;
          ring(ctx, p.x, p.y, 4 + fu * 34 * boost, GOLD, alpha * vis * (1 - fu) * 0.9, 1.6);
          if (k === 0)
            ring(ctx, p.x, p.y, 4 + fu * 58, GOLD, alpha * vis * (1 - fu) * 0.5, 1.2);
        }
        dot(ctx, p.x, p.y, 3.2 * lit, GOLD, alpha * lit * vis, 12);
        const pulse = (t * 0.9 + k * 0.4) % 1;
        ring(ctx, p.x, p.y, 4 + pulse * 15, GOLD, alpha * lit * vis * 0.45 * (1 - pulse), 1.2);
      });

      // AI links the offices: each arc draws itself once both ends are lit
      for (let k = 0; k < offices.length; k++) {
        const a = proj[offices[k]];
        const b = proj[offices[(k + 1) % offices.length]];
        const arcStart = oT(Math.max(k, (k + 1) % offices.length)) + 0.5;
        const drawU = ph(t, arcStart, 0.8);
        if (drawU <= 0 || a.z < -0.15 || b.z < -0.15) continue;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        const lift = Math.min(60, d * 0.35);
        const cx2 = mx + ((mx - cx) / (Math.abs(mx - cx) + 1)) * lift * 0.4;
        const cy2 = my - lift;
        const bez = (u: number): Pt => {
          const ia = 1 - u;
          return {
            x: ia * ia * a.x + 2 * ia * u * cx2 + u * u * b.x,
            y: ia * ia * a.y + 2 * ia * u * cy2 + u * u * b.y,
          };
        };
        // progressive draw toward the newly-lit office
        ctx.save();
        ctx.globalAlpha = alpha * 0.55 * (0.7 + 0.3 * network);
        ctx.strokeStyle = AMBER;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        const segs = 24;
        for (let s2 = 1; s2 <= Math.ceil(segs * drawU); s2++) {
          const q = bez(Math.min(1, s2 / segs) * drawU);
          ctx.lineTo(q.x, q.y);
        }
        ctx.stroke();
        ctx.restore();
        // data travels across continents — more packets once the network is up
        if (drawU >= 1) {
          const packets = network > 0.5 ? 2 : 1;
          for (let m = 0; m < packets; m++) {
            const u = (t * 0.5 + k * 0.3 + m * 0.5) % 1;
            const q = bez(u);
            dot(ctx, q.x, q.y, 2.2, GOLD, alpha * 0.9, 8);
          }
        }
      }

      // AI analytics float above the finished world (t > 8)
      const pa = ph(t, 8, 1) * alpha;
      if (pa > 0) {
        for (let k = 0; k < 3; k++) {
          const a = t * 0.3 + (k / 3) * TWO_PI;
          const x = cx + Math.cos(a) * R * 1.45;
          const y = cy - R * 0.55 + Math.sin(a) * R * 0.36;
          const depth = 0.6 + 0.4 * Math.sin(a);
          ctx.save();
          ctx.globalAlpha = pa * 0.75 * depth;
          ctx.strokeStyle = k === 1 ? PURPLE : AMBER;
          ctx.lineWidth = 1.2;
          rr(ctx, x - 20, y - 13, 40, 26, 5);
          ctx.stroke();
          for (let b = 0; b < 4; b++) {
            const bh = 4 + 12 * Math.abs(Math.sin(t * 1.4 + k * 2 + b));
            ctx.fillStyle = k === 1 ? PURPLE : AMBER;
            ctx.fillRect(x - 14 + b * 8, y + 9 - bh, 4, bh);
          }
          ctx.restore();
        }
      }
    },
  };
}

/* ── Component: story scenes + particle-stream chapter transitions ── */
export default function ExperienceScenes({
  active,
  className = "",
}: {
  active: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scenes: Scene[] = [
      customAIScene(),
      automationScene(),
      chatbotsScene(),
      softwareScene(),
      mobileScene(),
      webScene(),
      modernizationScene(),
      gccScene(),
    ];
    const clamp = (i: number) => Math.max(0, Math.min(scenes.length - 1, i));

    let w = 0, h = 0;
    let raf = 0;
    let current = clamp(activeRef.current);
    let prev = current;
    let fadeStart = -Infinity;
    let currentStart = performance.now();
    let prevStart = currentStart;

    // the premium transition: the old scene's object BREAKS APART into a
    // 10,000-spark swarm — the same brand-ramp palette and neural-link look
    // as the preloader's particle logo — which gathers where the next scene
    // forms. A handful of sparks appear first, multiply, then thousands.
    const SWARM = 10000;
    // logo ramp #FF9440 → #FB5A38 → #F92B4E, plus glow-gold #FFC76A
    const RAMP = ["#FF9440", "#FC7E3C", "#FB5A38", "#FA4243", "#F92B4E", "#FFC76A"];
    type Swarm = {
      x0: Float32Array; y0: Float32Array; cx: Float32Array; cy: Float32Array;
      x1: Float32Array; y1: Float32Array; delay: Float32Array; dur: Float32Array;
      size: Float32Array; bucket: Uint8Array; fg: Uint8Array; order: Uint32Array;
    };
    let swarm: Swarm | null = null;
    let swarmPairs: [number, number][] = [];
    // approx standard normal in [-1.5, 1.5]
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5);

    const spawnTransition = () => {
      const n = SWARM;
      const m = Math.min(w, h);
      const ocx = w / 2, ocy = h * 0.47; // where the scene objects live
      const s: Swarm = {
        x0: new Float32Array(n), y0: new Float32Array(n),
        cx: new Float32Array(n), cy: new Float32Array(n),
        x1: new Float32Array(n), y1: new Float32Array(n),
        delay: new Float32Array(n), dur: new Float32Array(n),
        size: new Float32Array(n), bucket: new Uint8Array(n),
        fg: new Uint8Array(n), order: new Uint32Array(n),
      };
      for (let i = 0; i < n; i++) {
        // the old object shatters: most sparks are born at its heart
        if (Math.random() < 0.8) {
          s.x0[i] = ocx + gauss() * m * 0.3;
          s.y0[i] = ocy + gauss() * m * 0.22;
        } else {
          s.x0[i] = Math.random() * w;
          s.y0[i] = Math.random() * h;
        }
        s.cx[i] = w / 2 + (Math.random() - 0.5) * w * 0.22;
        s.cy[i] = h / 2 + (Math.random() - 0.5) * h * 0.22;
        // ...and gather again where the next object will form
        if (Math.random() < 0.75) {
          s.x1[i] = ocx + gauss() * m * 0.38;
          s.y1[i] = ocy + gauss() * m * 0.28;
        } else {
          s.x1[i] = Math.random() * w;
          s.y1[i] = Math.random() * h;
        }
        // suspense: ~15 sparks first, multiplying into thousands
        s.delay[i] = 0.75 * Math.pow(Math.random(), 0.34);
        // a few slightly-larger sparks race past in the foreground (depth)
        const fg = Math.random() < 0.035;
        s.fg[i] = fg ? 1 : 0;
        s.size[i] = fg ? 1.8 + Math.random() * 1.4 : 0.8 + Math.random() * 1.9;
        // small sparks fly fast, big ones drift slow
        s.dur[i] =
          (0.45 + Math.random() * 0.35) *
          (fg ? 0.7 : 0.5 + s.size[i] / 2.7) ;
        // colored by destination height, exactly like the logo's ramp,
        // with a sprinkle of gold
        s.bucket[i] =
          Math.random() < 0.1
            ? 5
            : Math.min(4, Math.floor((s.y1[i] / h) * 5));
      }
      // draw order grouped by color so each frame pays for 6 fillStyle sets
      let o = 0;
      for (let b = 0; b < RAMP.length; b++)
        for (let i = 0; i < n; i++) if (s.bucket[i] === b) s.order[o++] = i;
      swarm = s;
      // sampled pairs — linked only while their sparks are actually near,
      // the same organic neural web the logo forms
      swarmPairs = Array.from({ length: 700 }, () => [
        (Math.random() * n) | 0,
        (Math.random() * n) | 0,
      ]);
    };

    const swarmPos = (s: Swarm, i: number, u: number): Pt => {
      // gravity feel: ease in (falls toward the stream), settle at the end
      const e = u * u * (3 - 2 * u);
      const a = 1 - e;
      return {
        x: a * a * s.x0[i] + 2 * a * e * s.cx[i] + e * e * s.x1[i],
        y: a * a * s.y0[i] + 2 * a * e * s.cy[i] + e * e * s.y1[i],
      };
    };

    const drawTransition = (now: number) => {
      const T = (now - fadeStart) / 1000;
      const s = swarm;
      if (!s || T > 1.85) return;

      // the swarm itself: 10k brand-ramp sparks in 6 color batches
      let lastB = -1;
      for (let k = 0; k < s.order.length; k++) {
        const i = s.order[k];
        if (s.fg[i]) continue; // foreground pass comes last
        const u = clamp01((T - s.delay[i]) / s.dur[i]);
        if (u <= 0 || u >= 1) continue;
        const b = s.bucket[i];
        if (b !== lastB) {
          ctx.fillStyle = RAMP[b];
          lastB = b;
        }
        ctx.globalAlpha = Math.sin(u * Math.PI) * 0.85;
        const p = swarmPos(s, i, u);
        const sz = s.size[i];
        ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;

      // neural links appear between sparks that pass near each other —
      // the logo animation's connection-line orange
      ctx.strokeStyle = "#FF9A3C";
      ctx.lineWidth = 0.7;
      for (let k = 0; k < swarmPairs.length; k++) {
        const [i, j] = swarmPairs[k];
        const ui = clamp01((T - s.delay[i]) / s.dur[i]);
        const uj = clamp01((T - s.delay[j]) / s.dur[j]);
        if (ui <= 0 || ui >= 1 || uj <= 0 || uj >= 1) continue;
        const a = swarmPos(s, i, ui);
        const b = swarmPos(s, j, uj);
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d > 90) continue;
        ctx.globalAlpha = (1 - d / 90) * 0.38 * Math.sin(ui * Math.PI);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // golden electric arcs crackle across the stream
      for (let k = 0; k + 13 < swarmPairs.length; k += 47) {
        const [i] = swarmPairs[k];
        const [j] = swarmPairs[k + 13];
        const ui = clamp01((T - s.delay[i]) / s.dur[i]);
        const uj = clamp01((T - s.delay[j]) / s.dur[j]);
        if (ui <= 0 || ui >= 1 || uj <= 0 || uj >= 1) continue;
        const a = swarmPos(s, i, ui);
        const b = swarmPos(s, j, uj);
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d > 150) continue;
        ctx.save();
        ctx.globalAlpha = 0.24;
        ctx.strokeStyle = "#FFE3A3";
        ctx.lineWidth = 1;
        ctx.shadowColor = AMBER;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        const segs = 4;
        for (let s2 = 1; s2 <= segs; s2++) {
          const u2 = s2 / segs;
          const jx = (Math.random() - 0.5) * 12 * (s2 < segs ? 1 : 0);
          const jy = (Math.random() - 0.5) * 12 * (s2 < segs ? 1 : 0);
          ctx.lineTo(lerp(a.x, b.x, u2) + jx, lerp(a.y, b.y, u2) + jy);
        }
        ctx.stroke();
        ctx.restore();
      }

      // depth: the foreground sparks pass in front with a faint glow
      ctx.save();
      ctx.shadowBlur = 5;
      let lastFB = -1;
      for (let k = 0; k < s.order.length; k++) {
        const i = s.order[k];
        if (!s.fg[i]) continue;
        const u = clamp01((T - s.delay[i]) / s.dur[i]);
        if (u <= 0 || u >= 1) continue;
        const b = s.bucket[i];
        if (b !== lastFB) {
          ctx.fillStyle = RAMP[b];
          ctx.shadowColor = RAMP[b];
          lastFB = b;
        }
        ctx.globalAlpha = Math.sin(u * Math.PI) * 0.4;
        const p = swarmPos(s, i, u);
        const sz = s.size[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz, 0, TWO_PI);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    const build = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      w = rect.width;
      h = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scenes.forEach((s) => s.build(w, h));
    };

    const drawBg = () => {
      // the canvas stays transparent — the card behind it paints the navy
      // radial background, so the colour is continuous across the whole
      // card no matter where this canvas is positioned
      ctx.clearRect(0, 0, w, h);
    };

    const frame = (now: number) => {
      const target = clamp(activeRef.current);
      if (target !== current) {
        prev = current;
        prevStart = currentStart;
        current = target;
        currentStart = now;
        fadeStart = now;
        spawnTransition();
      }
      const f = Math.min(1, (now - fadeStart) / FADE_MS);

      ctx.clearRect(0, 0, w, h);
      drawBg();

      // cinematic camera: each chapter opens slightly wide and tilted, then
      // slowly pushes in with a tiny settling orbit before coming to rest
      const camT = (now - currentStart) / 1000;
      const cam = easeOut(clamp01(camT / 8));
      const zoom = 1.015 + 0.05 * cam;
      const orbit = (1 - cam) * 0.028; // ~1.6° that eases to a stop
      ctx.save();
      ctx.translate(w / 2, h * 0.47);
      ctx.rotate(orbit);
      ctx.scale(zoom, zoom);
      ctx.translate(-w / 2, -h * 0.47);
      if (f < 1) scenes[prev].draw(ctx, (now - prevStart) / 1000, w, h, 1 - f);
      scenes[current].draw(ctx, (now - currentStart) / 1000, w, h, f);
      ctx.restore();

      // the swarm lives between worlds — outside the camera transform
      drawTransition(now);

      raf = requestAnimationFrame(frame);
    };

    build();
    if (reduced) {
      // a settled story moment as a static frame; refreshed on chapter change
      const still = () => {
        const target = clamp(activeRef.current);
        if (target !== current) current = target;
        drawBg();
        scenes[current].draw(ctx, 8, w, h, 1);
      };
      still();
      const iv = window.setInterval(still, 400);
      const ro2 = new ResizeObserver(() => {
        build();
        still();
      });
      if (canvas.parentElement) ro2.observe(canvas.parentElement);
      return () => {
        window.clearInterval(iv);
        ro2.disconnect();
      };
    }

    raf = requestAnimationFrame(frame);

    const ro = new ResizeObserver(() => {
      build();
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className={className} aria-hidden>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
