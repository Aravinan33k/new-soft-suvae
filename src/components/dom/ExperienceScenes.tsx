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
  if (alpha <= 0 || r <= 0) return;
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

// 6-digit hex → rgba() string with an explicit alpha
function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

type Scene = {
  build: (w: number, h: number) => void;
  // t is LOCAL story time in seconds since this chapter was activated
  draw: (ctx: Ctx, t: number, w: number, h: number, alpha: number) => void;
};

/* ── Shared cinematic atmosphere ───────────────────────────────────────
   Every chapter is framed by the same layered depth + lighting so the
   eight scenes read as one film instead of eight separate widgets. Layers
   move at deliberately different speeds (slow fog · medium grid · fast
   sweep) to build the speed-contrast the scenes were missing:
     back()  — drawn BEHIND the scene, before the camera push-in, so it
               parallaxes (doesn't zoom with the foreground):
                 · volumetric fog: two slow-drifting radial blooms
                 · perspective floor grid receding to a vanishing point
     front() — drawn OVER the scene, outside the camera, so it frames:
                 · blue volumetric glow rising from the lower centre
                 · a raking orange light sweep every ~11s (the fast layer)
                 · parallax bokeh particles drifting up at varied depths
                 · a soft vignette + cool top rim light                    */
type Bokeh = {
  x: number; y: number; r: number; z: number; sp: number; ph: number; warm: boolean;
};
function createAtmosphere() {
  let W = 0, H = 0;
  let bok: Bokeh[] = [];

  const build = (w: number, h: number) => {
    W = w; H = h;
    bok = [];
    for (let i = 0; i < 26; i++) {
      const z = Math.random(); // 0 far … 1 near
      bok.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: lerp(2, 9, z) * (0.6 + Math.random() * 0.8),
        z,
        sp: lerp(3, 12, z), // near particles drift faster (parallax)
        ph: Math.random() * TWO_PI,
        warm: Math.random() < 0.45,
      });
    }
  };

  const back = (ctx: Ctx, gt: number, w: number, h: number) => {
    if (w !== W || h !== H) build(w, h);

    // volumetric fog — two slow radial blooms breathing in place
    ctx.save();
    const bx = w * (0.32 + 0.08 * Math.sin(gt * 0.13));
    const by = h * (0.38 + 0.05 * Math.cos(gt * 0.11));
    let g = ctx.createRadialGradient(bx, by, 0, bx, by, Math.max(w, h) * 0.55);
    g.addColorStop(0, "rgba(78,168,255,0.06)");
    g.addColorStop(1, "rgba(78,168,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const ox = w * (0.72 - 0.07 * Math.sin(gt * 0.09));
    const oy = h * (0.66 + 0.05 * Math.sin(gt * 0.15));
    g = ctx.createRadialGradient(ox, oy, 0, ox, oy, Math.max(w, h) * 0.5);
    g.addColorStop(0, "rgba(255,138,61,0.05)");
    g.addColorStop(1, "rgba(255,138,61,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // perspective floor grid receding to a vanishing point, slow drift
    ctx.save();
    ctx.strokeStyle = "rgba(120,170,255,1)";
    ctx.lineWidth = 1;
    const hz = h * 0.52; // horizon
    const vpx = w * 0.5;
    const drift = (gt * 0.05) % 1;
    for (let i = 0; i < 9; i++) {
      const p = (i + drift) / 9; // 0..1 depth
      const yy = hz + (h - hz) * (p * p); // exponential spacing → perspective
      ctx.globalAlpha = 0.05 * (1 - p) + 0.008;
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke();
    }
    for (let i = 0; i <= 12; i++) {
      const fx = i / 12 - 0.5; // -0.5..0.5
      ctx.globalAlpha = 0.04 * (1 - Math.abs(fx) * 1.2);
      ctx.beginPath();
      ctx.moveTo(vpx + fx * 40, hz);
      ctx.lineTo(vpx + fx * w * 2.2, h);
      ctx.stroke();
    }
    ctx.restore();
  };

  const front = (ctx: Ctx, gt: number, w: number, h: number) => {
    if (w !== W || h !== H) build(w, h);

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    // blue volumetric glow rising from the lower centre
    const gy = h * 0.9;
    let g = ctx.createRadialGradient(w * 0.5, gy, 0, w * 0.5, gy, h * 0.7);
    g.addColorStop(0, `rgba(78,168,255,${0.05 + 0.02 * Math.sin(gt * 0.6)})`);
    g.addColorStop(1, "rgba(78,168,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // raking orange light sweep every ~11s — the fast atmosphere layer
    const sweep = (gt % 11) / 11;
    const sx = lerp(-0.3, 1.3, sweep) * w;
    const sweepA = Math.sin(clamp01(sweep) * Math.PI) * 0.1;
    if (sweepA > 0.002) {
      g = ctx.createLinearGradient(sx - w * 0.22, 0, sx + w * 0.22, h);
      g.addColorStop(0, "rgba(255,180,110,0)");
      g.addColorStop(0.5, `rgba(255,180,110,${sweepA})`);
      g.addColorStop(1, "rgba(255,180,110,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }

    // parallax bokeh drifting up at varied depths
    for (const b of bok) {
      const yy = (((b.y - gt * b.sp) % (h + 40)) + (h + 40)) % (h + 40);
      const xx = b.x + Math.sin(gt * 0.2 + b.ph) * (6 + b.z * 14);
      const a = (0.05 + 0.1 * b.z) * (0.55 + 0.45 * Math.sin(gt * 0.5 + b.ph));
      const col = b.warm ? "255,190,120" : "150,190,255";
      const gg = ctx.createRadialGradient(xx, yy, 0, xx, yy, b.r * 3);
      gg.addColorStop(0, `rgba(${col},${clamp01(a)})`);
      gg.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.arc(xx, yy, b.r * 3, 0, TWO_PI); ctx.fill();
    }
    ctx.restore();

    // vignette + cool top rim light — cinematic framing
    ctx.save();
    const vg = ctx.createRadialGradient(
      w * 0.5, h * 0.5, Math.min(w, h) * 0.35,
      w * 0.5, h * 0.5, Math.max(w, h) * 0.72,
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(2,6,20,0.55)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "screen";
    const rg = ctx.createLinearGradient(0, 0, 0, h * 0.22);
    rg.addColorStop(0, "rgba(120,160,255,0.05)");
    rg.addColorStop(1, "rgba(120,160,255,0)");
    ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h * 0.22);
    ctx.restore();
  };

  return { back, front };
}

/* ── Scene 0: Custom AI — a 6-second cinematic story ─────────────────
   Told on the local timeline t (seconds since the chapter activated):
     0.0–1.0  Dark digital space: a blue holographic grid fades in and a
              few glowing nodes appear in the void.
     1.0–2.0  Intelligence forms: nodes detect neighbours and thin lines
              shoot between them — a neural network grows organically.
     2.0–3.5  Data flows: light particles stream along the edges; every
              node they reach glows brighter; a big orange pulse rides the
              strongest path — the network is "learning".
     3.5–4.5  AI core activates: the centre ignites with a blue volumetric
              glow, holographic UI (confidence ring, graph, decision tree)
              fades in, scan rings expand, tiny particles orbit the core.
     4.5–5.5  Optimisation: the core emits an orange energy wave; weak
              nodes fade out, strong connections brighten, the network
              reorganises into a cleaner structure.
     5.5+     Living idle loop: the network breathes, data keeps flowing on
              the strong paths, the core pulses, scan rings sweep, light
              rays cross, and the whole scene drifts 1–2%. */
function customAIScene(): Scene {
  type Node = {
    x: number; y: number; born: number; strong: boolean; str: number;
    jx: number; jy: number; phase: number;
  };
  type Edge = { a: number; b: number; form: number; strong: boolean; w: number };
  type Dust = { x: number; y: number; vx: number; vy: number; z: number; s: number; ph: number };
  let nodes: Node[] = [];
  let edges: Edge[] = [];
  let dust: Dust[] = [];
  let core = 0; // index of the brightest central node
  let W = 0, H = 0, CX = 0, CY = 0, RAD = 0;

  return {
    build(w, h) {
      W = w; H = h; CX = w / 2; CY = h * 0.46;
      RAD = Math.min(w, h) * 0.34;
      const N = 46;
      // organic radial cloud, denser toward the centre (the "core" region)
      nodes = Array.from({ length: N }, (_, i) => {
        const isCore = i === 0;
        const a = Math.random() * TWO_PI;
        const rr0 = isCore ? 0 : Math.pow(Math.random(), 0.7) * RAD;
        const strong = isCore || Math.random() < 0.5;
        return {
          x: CX + Math.cos(a) * rr0 * 1.15,
          y: CY + Math.sin(a) * rr0 * 0.72,
          born: isCore ? 0.15 : 0.2 + Math.random() * 1.4, // nodes appear 0–1.6s
          strong,
          str: strong ? 0.7 + Math.random() * 0.3 : 0.2 + Math.random() * 0.3,
          jx: Math.random() * TWO_PI,
          jy: Math.random() * TWO_PI,
          phase: Math.random() * TWO_PI,
        };
      });
      core = 0;
      nodes[core].x = CX; nodes[core].y = CY; nodes[core].strong = true; nodes[core].str = 1;

      // connect nearby nodes — the neural mesh. Edges that touch a strong
      // node (or the core) survive the optimisation pass; weak ones prune.
      edges = [];
      const maxD = RAD * 0.5;
      for (let i = 0; i < N; i++) {
        let links = 0;
        for (let j = 0; j < N && links < 4; j++) {
          if (i === j) continue;
          const d = Math.hypot(nodes[j].x - nodes[i].x, nodes[j].y - nodes[i].y);
          if (d < maxD && (i < j || d < maxD * 0.6)) {
            const strong = nodes[i].strong && nodes[j].strong;
            edges.push({ a: i, b: j, form: 1.0 + Math.random() * 1.1, strong, w: d });
            links++;
          }
        }
      }
      // guarantee the core is richly connected
      for (let j = 1; j < 9; j++) edges.push({ a: core, b: j, form: 1.1 + j * 0.05, strong: true, w: 0 });

      // 3 depth layers of drifting dust for parallax
      dust = Array.from({ length: 26 }, () => {
        const z = Math.random(); // 0 far, 1 near
        return {
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * (6 + z * 20),
          vy: (Math.random() - 0.5) * (4 + z * 14),
          z, s: 0.6 + z * 2.2, ph: Math.random() * TWO_PI,
        };
      });
    },

    draw(ctx, t, w, h, alpha) {
      if (w !== W || h !== H) this.build(w, h);
      const cx = CX, cy = CY, R = RAD;

      // ── gentle camera drift (1–2% pan) so nothing feels static ────────
      const driftX = Math.sin(t * 0.12) * w * 0.012;
      const driftY = Math.cos(t * 0.09) * h * 0.012;
      const zoom = 1 + 0.06 * ph(t, 3.5, 1.0) * (1 - 0.5 * ph(t, 5.5, 2)); // slow push toward core, then ease back
      ctx.save();
      ctx.translate(cx + driftX, cy + driftY);
      ctx.scale(zoom, zoom);
      ctx.translate(-cx, -cy);

      const optim = ph(t, 4.6, 0.9); // 0→1 optimisation progress
      const idle = t - 5.5;

      // ── Scene 1: holographic blue grid fading in ──────────────────────
      const gridA = ph(t, 0.15, 1.1) * alpha * (0.5 + 0.5 * (1 - optim * 0.6));
      if (gridA > 0.01) {
        ctx.save();
        ctx.globalAlpha = gridA * 0.14;
        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 1;
        const gs = Math.min(w, h) / 11;
        // perspective-ish grid that shifts slowly as the camera drifts
        const sh = Math.sin(t * 0.15) * 8;
        for (let gx = -1; gx * gs < w + gs; gx++) {
          ctx.beginPath();
          ctx.moveTo(gx * gs + sh, 0);
          ctx.lineTo(gx * gs - sh, h);
          ctx.stroke();
        }
        for (let gy = 0; gy * gs < h + gs; gy++) {
          ctx.beginPath();
          ctx.moveTo(0, gy * gs);
          ctx.lineTo(w, gy * gs);
          ctx.stroke();
        }
        ctx.restore();
      }

      // node appear factor + live glow
      const nodeA: number[] = [];
      const px: number[] = [], py: number[] = [];
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        nodeA[i] = ph(t, n.born, 0.45);
        // weak nodes fade out during optimisation
        const survive = n.strong ? 1 : 1 - optim;
        nodeA[i] *= survive;
        // tiny living wobble
        px[i] = n.x + Math.sin(t * 0.7 + n.jx) * 2.4;
        py[i] = n.y + Math.cos(t * 0.6 + n.jy) * 2.0;
      }

      // ── edges: draw themselves in (Scene 2), brighten on optimise ─────
      for (let k = 0; k < edges.length; k++) {
        const e = edges[k];
        const u = ph(t, e.form, 0.55); // 0→1 as the line shoots out
        if (u <= 0) continue;
        const na = Math.min(nodeA[e.a], nodeA[e.b]);
        if (na <= 0) continue;
        const survive = e.strong ? 1 : 1 - optim;
        if (survive <= 0.02) continue;
        const ax = px[e.a], ay = py[e.a], bx = px[e.b], by = py[e.b];
        const ex = lerp(ax, bx, u), ey = lerp(ay, by, u);
        const base = e.strong ? 0.32 + optim * 0.28 : 0.18;
        ctx.globalAlpha = alpha * base * na * survive;
        ctx.strokeStyle = e.strong ? ORANGE : "#8a6a4a";
        ctx.lineWidth = e.strong ? 1 + optim * 0.4 : 0.7;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }

      // ── Scene 3+: data particles flow along formed edges ──────────────
      const flowA = ph(t, 2.0, 0.8) * alpha;
      if (flowA > 0.01) {
        ctx.save();
        ctx.shadowBlur = 6;
        for (let k = 0; k < edges.length; k++) {
          const e = edges[k];
          if (ph(t, e.form, 0.55) < 1) continue;
          const survive = e.strong ? 1 : 1 - optim;
          if (survive < 0.3) continue;
          // strong paths carry more, faster data
          const speed = e.strong ? 0.55 : 0.32;
          const streams = e.strong ? 2 : 1;
          for (let s = 0; s < streams; s++) {
            const prog = (t * speed + k * 0.37 + s * 0.5) % 1;
            const fx = lerp(px[e.a], px[e.b], prog);
            const fy = lerp(py[e.a], py[e.b], prog);
            const col = e.strong ? AMBER : "#C79A6A";
            dot(ctx, fx, fy, e.strong ? 1.8 : 1.2, col, flowA * 0.9 * survive, 6);
          }
        }
        ctx.restore();
      }

      // the big orange "decision" pulse riding the strongest path (Scene 3)
      if (t > 2.4) {
        const beat = (t - 2.4) % 2.2;
        if (beat < 1.1) {
          const bu = beat / 1.1;
          // route across a few core edges in sequence
          const routeEdges = edges.filter((e) => e.a === core || e.b === core).slice(0, 6);
          if (routeEdges.length) {
            const seg = Math.min(routeEdges.length - 1, Math.floor(bu * routeEdges.length));
            const e = routeEdges[seg];
            const local = (bu * routeEdges.length) % 1;
            const fx = lerp(px[e.a], px[e.b], local);
            const fy = lerp(py[e.a], py[e.b], local);
            dot(ctx, fx, fy, 3.4, "#FFB86B", alpha * (1 - bu) * 0.95, 14);
          }
        }
      }

      // ── nodes ─────────────────────────────────────────────────────────
      for (let i = 0; i < nodes.length; i++) {
        if (nodeA[i] <= 0) continue;
        const n = nodes[i];
        // glow pulses as data "arrives" + steady breathing once alive
        const pulse = 0.6 + 0.4 * Math.sin(t * 2.1 + n.phase);
        const bright = (n.strong ? 0.8 : 0.45) * (0.5 + 0.5 * pulse);
        const size = (i === core ? 4.5 : n.strong ? 2.6 : 1.8) * (1 + optim * (n.strong ? 0.25 : 0));
        const col = i === core ? WHITE_WARM : n.strong ? ORANGE : "#C98A5A";
        dot(ctx, px[i], py[i], size, col, alpha * nodeA[i] * bright, i === core ? 16 : 8);
      }

      // ── Scene 4: AI core activation — volumetric light + scan rings ────
      const coreA = ph(t, 3.5, 0.9) * alpha;
      if (coreA > 0.01) {
        // blue volumetric glow behind the core
        const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
        bg.addColorStop(0, `rgba(90,150,255,${0.16 * coreA})`);
        bg.addColorStop(0.5, `rgba(120,90,60,${0.05 * coreA})`);
        bg.addColorStop(1, "transparent");
        ctx.globalAlpha = 1;
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
        // warm core core-glow, breathing
        const breath = 0.72 + 0.28 * Math.sin(t * 1.3);
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.5);
        cg.addColorStop(0, `rgba(255,150,70,${0.3 * breath * coreA})`);
        cg.addColorStop(1, "transparent");
        ctx.fillStyle = cg;
        ctx.fillRect(0, 0, w, h);
        // tiny particles orbiting the core
        ctx.save();
        ctx.shadowBlur = 6;
        for (let o = 0; o < 10; o++) {
          const oa = t * 0.9 + (o / 10) * TWO_PI;
          const orr = R * (0.14 + (o % 3) * 0.05);
          dot(ctx, cx + Math.cos(oa) * orr * 1.2, cy + Math.sin(oa) * orr * 0.7, 1.4, AMBER, coreA * 0.7, 5);
        }
        ctx.restore();
        // expanding scan rings from the core, every ~2.4s
        for (let s = 0; s < 2; s++) {
          const sr = (t - 3.5 + s * 1.2) % 2.4;
          if (sr > 0) {
            const u = sr / 2.4;
            ring(ctx, cx, cy, u * R * 1.05, BLUE, coreA * 0.5 * (1 - u), 1);
          }
        }
      }

      // ── Scene 5: optimisation energy wave from the core ───────────────
      if (t > 4.6 && t < 6.2) {
        const wu = (t - 4.6) / 1.4;
        ring(ctx, cx, cy, easeOut(wu) * R * 1.25, ORANGE, alpha * (1 - wu) * 0.85, 2.5);
        ring(ctx, cx, cy, easeOut(wu) * R * 1.0, GOLD, alpha * (1 - wu) * 0.5, 1.5);
        const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
        flash.addColorStop(0, `rgba(255,180,90,${0.22 * (1 - wu) * alpha})`);
        flash.addColorStop(1, "transparent");
        ctx.globalAlpha = 1;
        ctx.fillStyle = flash;
        ctx.fillRect(0, 0, w, h);
      }

      // ── holographic UI panels fade in around the core (Scene 4→idle) ──
      const uiA = ph(t, 3.9, 1.0) * alpha;
      if (uiA > 0.01) {
        const oR = R * 0.98;
        // slow drift so the panels feel alive
        const labels = ["LLM", "RAG", "AGENTS", "PREDICT"];
        for (let k = 0; k < 4; k++) {
          const a = t * 0.18 + (k / 4) * TWO_PI;
          const x = cx + Math.cos(a) * oR * 1.18;
          const y = cy + Math.sin(a) * oR * 0.66;
          const col = k % 2 === 0 ? AMBER : GOLD;
          ctx.save();
          ctx.globalAlpha = uiA * 0.9;
          ctx.strokeStyle = col;
          ctx.fillStyle = col;
          ctx.lineWidth = 1.5;
          if (k === 0) {
            ctx.strokeRect(x - 7, y - 7, 14, 14);
            for (let b = -1; b <= 1; b++) {
              ctx.beginPath();
              ctx.moveTo(x + b * 4.5, y - 7); ctx.lineTo(x + b * 4.5, y - 11);
              ctx.moveTo(x + b * 4.5, y + 7); ctx.lineTo(x + b * 4.5, y + 11);
              ctx.stroke();
            }
          } else if (k === 1) {
            ctx.strokeRect(x - 6, y - 8, 11, 15);
            ctx.beginPath(); ctx.arc(x + 5, y + 5, 4.5, 0, TWO_PI); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + 8.4, y + 8.4); ctx.lineTo(x + 12, y + 12); ctx.stroke();
          } else if (k === 2) {
            for (let b = 0; b < 3; b++) {
              const ba = (b / 3) * TWO_PI - Math.PI / 2;
              ctx.beginPath();
              ctx.arc(x + Math.cos(ba) * 8, y + Math.sin(ba) * 8, 2.4, 0, TWO_PI);
              ctx.fill();
            }
            ctx.globalAlpha = uiA * 0.4;
            ctx.beginPath(); ctx.arc(x, y, 8, 0, TWO_PI); ctx.stroke();
            ctx.globalAlpha = uiA * 0.9;
          } else {
            for (let b = 0; b < 3; b++)
              ctx.fillRect(x - 8 + b * 7, y + 7 - (b + 1) * 5.5, 4, (b + 1) * 5.5);
          }
          ctx.font = "600 9px ui-monospace, monospace";
          ctx.textAlign = "center";
          ctx.globalAlpha = uiA * 0.75;
          ctx.fillText(labels[k], x, y + 24);
          ctx.restore();
        }
      }

      // ── Scene 6 idle: breathing rings + a soft orange light-ray sweep ──
      if (idle > 0) {
        for (let k = 0; k < 3; k++) {
          const wave = (idle + k * 1.3) % 4;
          const u = wave / 4;
          ring(ctx, cx, cy, u * R * 1.15, ORANGE, alpha * 0.16 * (1 - u), 1.2);
        }
        // light ray sweeping across every ~12s
        const sweep = (idle % 12) / 2; // active for 2s each cycle
        if (sweep < 1) {
          const sx = lerp(-w * 0.2, w * 1.2, sweep);
          const lg = ctx.createLinearGradient(sx - 120, 0, sx + 120, 0);
          lg.addColorStop(0, "transparent");
          lg.addColorStop(0.5, `rgba(255,138,61,${0.06 * alpha * Math.sin(sweep * Math.PI)})`);
          lg.addColorStop(1, "transparent");
          ctx.globalAlpha = 1;
          ctx.fillStyle = lg;
          ctx.fillRect(0, 0, w, h);
        }
      }

      ctx.restore(); // end camera transform

      // ── depth dust (drawn without the camera zoom, in screen space) ────
      ctx.save();
      for (const d of dust) {
        let mx = (d.x + d.vx * t) % (w + 80);
        let my = (d.y + d.vy * t) % (h + 80);
        if (mx < -40) mx += w + 80;
        if (my < -40) my += h + 80;
        ctx.globalAlpha = alpha * (0.03 + 0.05 * d.z) * (0.6 + 0.4 * Math.sin(t * 0.7 + d.ph));
        ctx.fillStyle = d.z > 0.6 ? AMBER : ORANGE;
        ctx.beginPath();
        ctx.arc(mx, my, d.s, 0, TWO_PI);
        ctx.fill();
      }
      ctx.restore();

      // ── futuristic HUD (screen space): the AI understands → decides → scales
      // a reasoning reticle locks onto the core as it thinks, then commits
      const ret = ph(t, 2.9, 0.6) * (1 - ph(t, 5.6, 0.8));
      if (ret > 0.01) {
        const rr2 = R * (0.66 - 0.08 * ph(t, 3.9, 0.5)); // tightens as it locks
        const br = 11;
        ctx.save();
        ctx.globalAlpha = alpha * ret * 0.75;
        ctx.strokeStyle = BLUE; ctx.lineWidth = 1.4;
        ctx.shadowColor = BLUE; ctx.shadowBlur = 5;
        for (const [sxg, syg] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          const cxr = cx + sxg * rr2, cyr = cy + syg * rr2 * 0.72;
          ctx.beginPath();
          ctx.moveTo(cxr + -sxg * br, cyr); ctx.lineTo(cxr, cyr); ctx.lineTo(cxr, cyr + -syg * br);
          ctx.stroke();
        }
        ctx.restore();
      }

      // narrated captions telling the understanding → decision → scale story
      const yCap = cy + R * 0.94 + 18;
      const CAPS = [
        { s: 0.3, e: 1.7, text: "INGESTING DATA" },
        { s: 1.7, e: 2.9, text: "UNDERSTANDING CONTEXT" },
        { s: 2.9, e: 3.9, text: "REASONING" },
        { s: 3.9, e: 5.3, text: "DECISION MADE" },
        { s: 5.3, e: 99, text: "AUTOMATING DECISIONS AT SCALE" },
      ];
      ctx.save();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const c of CAPS) {
        const inn = clamp01((t - c.s) / 0.45);
        const out = c.e > 90 ? 0 : clamp01((t - (c.e - 0.45)) / 0.45);
        const ca = inn * (1 - out);
        if (ca <= 0.01) continue;
        ctx.globalAlpha = alpha * ca * 0.95;
        ctx.fillStyle = AMBER; ctx.font = "700 12px ui-monospace, monospace";
        ctx.fillText(c.text, cx, yCap);
      }
      ctx.restore();

      // confidence readout + bar while it commits the decision
      const dec = ph(t, 3.9, 0.5) * (1 - ph(t, 5.3, 0.5));
      if (dec > 0.01) {
        const conf = Math.min(99.2, clamp01((t - 3.9) / 1.4) * 99.2);
        const bw2 = 128, bx2 = cx - bw2 / 2, by2 = yCap + 15;
        ctx.save();
        ctx.globalAlpha = alpha * dec;
        ctx.strokeStyle = "rgba(78,168,255,0.35)"; ctx.lineWidth = 1;
        rr(ctx, bx2, by2, bw2, 5, 2.5); ctx.stroke();
        ctx.fillStyle = BLUE; ctx.shadowColor = BLUE; ctx.shadowBlur = 6;
        rr(ctx, bx2, by2, bw2 * (conf / 100), 5, 2.5); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#BFE0FF"; ctx.font = "700 9px ui-monospace, monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(conf.toFixed(1) + "% CONFIDENCE", cx, by2 + 16);
        ctx.restore();
      }

      // idle: a live throughput ticker — decisions automated at scale
      if (idle > 0) {
        const dpm = (12480 + Math.floor(idle * 137)).toLocaleString();
        ctx.save();
        ctx.globalAlpha = alpha * 0.65;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = GREEN; ctx.font = "700 11px ui-monospace, monospace";
        ctx.fillText(dpm + " DECISIONS / MIN", cx, yCap + 24);
        ctx.restore();
      }
    },
  };
}

/* ── Scene 1: Automation — a 6-second cinematic story ────────────────
   "Manual work enters, AI understands it, automates every step, and
   delivers results faster with zero friction."
     0.0–1.0  Manual work: documents/emails/forms drift, softly glowing,
              disconnected, with faint inactive workflow lines.
     1.0–2.0  AI detects the workflow: an orange radar pulse scans out from
              the centre — documents it touches stop drifting and snap onto
              a workflow, the channels illuminate.
     2.0–3.5  Automation starts: documents flow along glowing light channels
              and TRANSFORM at each stage (verify / classify / approve /
              process) — each turning into a green checkmark.
     3.5–4.5  AI decides: the centre lights with blue volumetric glow, holo
              panels appear (progress ring, automation %, task queue,
              optimisation graph); green approves, a blue path branches, an
              orange pulse predicts ahead.
     4.5–5.5  Business accelerates: many documents flow at once, an orange
              energy wave sweeps the whole workflow, every finish bursts light.
     5.5+     Continuous automation: a calm always-running loop — channels
              pulse, documents keep flowing, dashboards refresh, blue light
              drifts, the camera pans 1–2%. */
function automationScene(): Scene {
  type Doc = { sx: number; sy: number; drift: number; type: number; off: number; speed: number; wave: number };
  let docs: Doc[] = [];
  let W = 0, H = 0, CX = 0, CY = 0, AMP = 0, X0 = 0, X1 = 0;
  // workflow stages along the channel (u position + label)
  const STAGES = [
    { u: 0.18, label: "VERIFY" },
    { u: 0.40, label: "CLASSIFY" },
    { u: 0.62, label: "APPROVE" },
    { u: 0.84, label: "PROCESS" },
  ];

  // the elegant light channel the documents ride (gentle S-curve)
  const pathAt = (u: number): Pt => ({
    x: lerp(X0, X1, u),
    y: CY + Math.sin(u * Math.PI * 1.6 - 0.3) * AMP,
  });

  // a small document card with a type glyph; morphs to a green check when done
  const docCard = (ctx: Ctx, x: number, y: number, type: number, prog: number, a: number) => {
    // prog 0 = raw manual doc (white), 1 = processed (green check)
    const done = prog >= 0.999;
    const col = done ? GREEN : prog > 0.02 ? ORANGE : "#DFE6F2";
    const s = 8;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = a;
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = done ? 10 : 6;
    ctx.lineWidth = 1.4;
    rr(ctx, -s, -s * 1.25, s * 2, s * 2.5, 2.5);
    ctx.stroke();
    if (done) {
      // completed → checkmark
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-4, 0); ctx.lineTo(-1, 3.5); ctx.lineTo(5, -4);
      ctx.stroke();
    } else {
      // type glyph: 0 invoice lines, 1 email flap, 2 form fields, 3 chart, 4 spreadsheet grid
      ctx.lineWidth = 1;
      if (type === 1) {
        ctx.beginPath(); ctx.moveTo(-s, -s * 1.1); ctx.lineTo(0, -s * 0.2); ctx.lineTo(s, -s * 1.1); ctx.stroke();
      } else if (type === 3) {
        for (let b = 0; b < 3; b++) ctx.fillRect(-5 + b * 4, 4 - (b + 1) * 3, 2.4, (b + 1) * 3);
      } else if (type === 4) {
        ctx.beginPath();
        ctx.moveTo(-s, -1); ctx.lineTo(s, -1); ctx.moveTo(-s, 3); ctx.lineTo(s, 3);
        ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.stroke();
      } else {
        for (let b = 0; b < 3; b++) { ctx.beginPath(); ctx.moveTo(-5, -3 + b * 3.5); ctx.lineTo(5, -3 + b * 3.5); ctx.stroke(); }
      }
    }
    ctx.restore();
  };

  // ── the signature moment: ONE hero invoice metamorphoses through the
  // whole automation lifecycle, lifted out of the workflow for a close-up.
  // Each stage is a distinct, readable transformation of the item itself —
  // not a new icon: INVOICE → AI SCAN → VERIFIED → APPROVED → PAID → DONE.
  const heroStages = [
    { end: 1.0, key: "INVOICE", col: "#DFE6F2" },
    { end: 2.2, key: "AI SCAN", col: BLUE },
    { end: 3.2, key: "VERIFIED", col: GREEN },
    { end: 4.2, key: "APPROVED", col: ORANGE },
    { end: 5.2, key: "PAYMENT", col: GOLD },
    { end: 6.7, key: "COMPLETED", col: GREEN },
  ];
  const HERO_CYCLE = 6.7;

  const heroItem = (ctx: Ctx, cx: number, cyIn: number, cyc: number, a: number) => {
    if (a <= 0.01) return;
    let si = 0;
    while (si < heroStages.length - 1 && cyc > heroStages[si].end) si++;
    const prevEnd = si === 0 ? 0 : heroStages[si - 1].end;
    const st = heroStages[si];
    const sp = clamp01((cyc - prevEnd) / (st.end - prevEnd));
    const cw = 44, chh = 56;
    const cy = cyIn + (si === 5 ? -easeOut(sp) * 12 : 0); // lifts on completion

    // spotlight behind the item, tinted to the current stage
    ctx.save();
    ctx.globalAlpha = a;
    const spot = ctx.createRadialGradient(cx, cy, 0, cx, cy, 82);
    spot.addColorStop(0, rgba(st.col, 0.2));
    spot.addColorStop(1, rgba(st.col, 0));
    ctx.fillStyle = spot;
    ctx.beginPath(); ctx.arc(cx, cy, 82, 0, TWO_PI); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = a;

    // card body — border + fill glow shift with the stage; pulses when done
    ctx.fillStyle = rgba(st.col, si === 5 ? 0.15 : 0.07);
    rr(ctx, -cw / 2, -chh / 2, cw, chh, 5); ctx.fill();
    ctx.strokeStyle = st.col; ctx.lineWidth = 1.7;
    ctx.shadowColor = st.col;
    ctx.shadowBlur = 14 + (si === 5 ? 10 * (0.6 + 0.4 * Math.sin(cyc * 6)) : 0);
    rr(ctx, -cw / 2, -chh / 2, cw, chh, 5); ctx.stroke();
    ctx.shadowBlur = 0;

    // invoice content persists faintly beneath the later stamps
    const inkA = si >= 2 ? 0.32 : 0.7;
    ctx.strokeStyle = rgba(st.col, inkA);
    ctx.fillStyle = rgba(st.col, inkA);
    ctx.lineWidth = 1;
    ctx.font = "700 9px ui-monospace, monospace"; ctx.textAlign = "left";
    ctx.fillText("$", -cw / 2 + 6, -chh / 2 + 12);
    for (let r = 0; r < 4; r++) {
      const yy = -chh / 2 + 19 + r * 7;
      ctx.beginPath();
      ctx.moveTo(-cw / 2 + 6, yy);
      ctx.lineTo(cw / 2 - 6 - (r % 2) * 9, yy);
      ctx.stroke();
    }

    if (si === 1) {
      // AI SCAN — a blue light bar rakes top→bottom, clipped to the card
      ctx.save();
      rr(ctx, -cw / 2, -chh / 2, cw, chh, 5); ctx.clip();
      const scanY = -chh / 2 + sp * chh;
      const lg = ctx.createLinearGradient(0, scanY - 9, 0, scanY + 9);
      lg.addColorStop(0, rgba(BLUE, 0));
      lg.addColorStop(0.5, rgba(BLUE, 0.55));
      lg.addColorStop(1, rgba(BLUE, 0));
      ctx.fillStyle = lg; ctx.fillRect(-cw / 2, scanY - 9, cw, 18);
      ctx.strokeStyle = BLUE; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-cw / 2, scanY); ctx.lineTo(cw / 2, scanY); ctx.stroke();
      ctx.restore();
    } else if (si === 2) {
      // VERIFIED — a green shield with a check pops onto the item
      const bs = easeOut(clamp01(sp * 1.6));
      ctx.save();
      ctx.globalAlpha = a * clamp01(sp * 2.4);
      ctx.translate(0, -1); ctx.scale(bs, bs);
      ctx.strokeStyle = GREEN; ctx.fillStyle = rgba(GREEN, 0.2);
      ctx.lineWidth = 1.8; ctx.shadowColor = GREEN; ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -11); ctx.lineTo(9, -7); ctx.lineTo(9, 3);
      ctx.quadraticCurveTo(9, 10, 0, 13);
      ctx.quadraticCurveTo(-9, 10, -9, 3); ctx.lineTo(-9, -7); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-1, 4); ctx.lineTo(5, -5); ctx.stroke();
      ctx.restore();
    } else if (si === 3) {
      // APPROVED — an orange stamp swings in and slams flat at an angle
      const slam = easeOut(clamp01(sp * 1.5));
      ctx.save();
      ctx.globalAlpha = a * clamp01(sp * 2.4);
      ctx.rotate(lerp(-0.9, -0.32, slam));
      ctx.scale(lerp(1.9, 1, slam), lerp(1.9, 1, slam));
      ctx.strokeStyle = ORANGE; ctx.fillStyle = ORANGE;
      ctx.lineWidth = 1.8; ctx.shadowColor = ORANGE; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, TWO_PI); ctx.stroke();
      ctx.font = "700 6px ui-monospace, monospace"; ctx.textAlign = "center";
      ctx.fillText("APPROVED", 0, 2.4);
      ctx.restore();
    } else if (si === 4) {
      // PAYMENT — a gold coin flies in and lands centre
      const fly = easeOut(clamp01(sp * 1.4));
      const coinX = lerp(cw * 0.95, 0, fly);
      const coinY = lerp(-chh * 0.55, 0, fly);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(GOLD, 0.95); ctx.shadowColor = GOLD; ctx.shadowBlur = 13;
      ctx.beginPath(); ctx.arc(coinX, coinY, 9, 0, TWO_PI); ctx.fill();
      ctx.fillStyle = "#5B3D00"; ctx.font = "700 10px ui-monospace, monospace";
      ctx.textAlign = "center"; ctx.fillText("$", coinX, coinY + 3.4);
      ctx.restore();
    } else if (si === 5) {
      // COMPLETED — a big check draws itself; sparks rise off the item
      const pop = easeOut(clamp01(sp * 2.2));
      ctx.save();
      ctx.strokeStyle = GREEN; ctx.lineWidth = 2.6; ctx.lineCap = "round";
      ctx.shadowColor = GREEN; ctx.shadowBlur = 14; ctx.globalAlpha = a;
      const c1 = { x: -10, y: 1 }, c2 = { x: -3, y: 9 }, c3 = { x: 11, y: -10 };
      ctx.beginPath();
      if (pop < 0.5) {
        const u = pop / 0.5;
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(lerp(c1.x, c2.x, u), lerp(c1.y, c2.y, u));
      } else {
        const u = (pop - 0.5) / 0.5;
        ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y);
        ctx.lineTo(lerp(c2.x, c3.x, u), lerp(c2.y, c3.y, u));
      }
      ctx.stroke();
      ctx.restore();
      for (let k = 0; k < 6; k++) {
        const u = (sp + k / 6) % 1;
        dot(ctx, (k - 2.5) * 6, chh * 0.15 - u * chh, 1.6 * (1 - u), "#CFFFE0", a * (1 - u) * 0.9, 8);
      }
    }
    ctx.restore(); // end card translate

    // stage caption + lifecycle progress ticks beneath the item
    ctx.save();
    ctx.globalAlpha = a * 0.95;
    ctx.fillStyle = st.col;
    ctx.font = "700 9px ui-monospace, monospace"; ctx.textAlign = "center";
    ctx.fillText(st.key, cx, cy + chh / 2 + 17);
    const tw = 7, gap = 3;
    const total = heroStages.length * tw + (heroStages.length - 1) * gap;
    for (let k = 0; k < heroStages.length; k++) {
      const tx = cx - total / 2 + k * (tw + gap);
      ctx.globalAlpha = a * (k <= si ? 0.9 : 0.25);
      ctx.fillStyle = k <= si ? heroStages[k].col : "#4A5568";
      rr(ctx, tx, cy + chh / 2 + 23, tw, 2.6, 1.3); ctx.fill();
    }
    ctx.restore();
  };

  return {
    build(w, h) {
      W = w; H = h; CX = w / 2; CY = h * 0.47;
      AMP = Math.min(w, h) * 0.13;
      X0 = w * 0.16; X1 = w * 0.84;
      // first wave: the manual documents that get organised (8)
      // second wave (wave=1): appear only during the acceleration beat
      docs = Array.from({ length: 20 }, (_, i) => {
        const wave = i < 8 ? 0 : 1;
        return {
          sx: w * (0.2 + Math.random() * 0.6),
          sy: h * (0.18 + Math.random() * 0.6),
          drift: Math.random() * TWO_PI,
          type: i % 5,
          off: Math.random(),
          speed: 0.14 + Math.random() * 0.05,
          wave,
        };
      });
    },

    draw(ctx, t, w, h, alpha) {
      if (w !== W || h !== H) this.build(w, h);
      const cx = CX, cy = CY;

      // gentle camera pan/zoom
      const driftX = Math.sin(t * 0.11) * w * 0.012;
      const driftY = Math.cos(t * 0.08) * h * 0.01;
      const zoom = 1 + 0.05 * ph(t, 3.5, 1) * (1 - 0.5 * ph(t, 5.6, 2));
      ctx.save();
      ctx.translate(cx + driftX, cy + driftY);
      ctx.scale(zoom, zoom);
      ctx.translate(-cx, -cy);

      const organise = clamp01((t - 1.05) / 0.7); // radar snaps docs onto the workflow
      const accel = ph(t, 4.5, 0.9);
      const idle = t - 5.5;

      // ── the workflow channel: faint & inactive first, then illuminated ─
      // the radar sweep lights the channel from left to right
      const radarU = clamp01((t - 1.0) / 1.1); // leading edge of the scan (0→1)
      const SEG = 60;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      for (let s = 0; s < SEG; s++) {
        const u0 = s / SEG, u1 = (s + 1) / SEG;
        const lit = u0 < radarU; // channel illuminates as the scan passes
        const p0 = pathAt(u0), p1 = pathAt(u1);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        if (lit) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 3 - u0 * 10);
          ctx.globalAlpha = alpha * (0.28 + 0.22 * pulse + 0.2 * accel);
          ctx.strokeStyle = ORANGE;
        } else {
          ctx.globalAlpha = alpha * 0.12;
          ctx.strokeStyle = "#6E7C9C";
        }
        ctx.stroke();
      }

      // ── AI radar pulse (Scene 2) ──────────────────────────────────────
      if (t > 1.0 && t < 2.4) {
        const ru = (t - 1.0) / 1.3;
        ring(ctx, cx, cy, easeOut(ru) * Math.min(w, h) * 0.55, ORANGE, alpha * (1 - ru) * 0.85, 2.5);
        ring(ctx, cx, cy, easeOut(ru) * Math.min(w, h) * 0.4, AMBER, alpha * (1 - ru) * 0.5, 1.5);
      }

      // ── stage nodes on the channel, with labels ───────────────────────
      STAGES.forEach((st, k) => {
        const p = pathAt(st.u);
        const lit = radarU > st.u;
        const a = alpha * (lit ? 0.9 : 0.3);
        ring(ctx, p.x, p.y, 12, lit ? ORANGE : "#6E7C9C", a * 0.8, 1.4);
        dot(ctx, p.x, p.y, 3, lit ? AMBER : "#6E7C9C", a, lit ? 8 : 0);
        // a task-complete burst as documents finish this stage (once flowing)
        if (t > 2.2 && lit) {
          const burst = (t * 0.9 + k * 0.4) % 2;
          if (burst < 0.5) ring(ctx, p.x, p.y, 12 + burst * 40, GREEN, alpha * (1 - burst / 0.5) * 0.5, 1.2);
        }
        if (lit) {
          ctx.save();
          ctx.globalAlpha = a * 0.7;
          ctx.fillStyle = AMBER;
          ctx.font = "600 8px ui-monospace, monospace";
          ctx.textAlign = "center";
          ctx.fillText(st.label, p.x, p.y + 24);
          ctx.restore();
        }
      });

      // ── Scene 4: decision branch (green approve + blue alternate) ──────
      const decA = ph(t, 3.6, 0.9) * alpha;
      if (decA > 0.01) {
        const dp = pathAt(0.62); // at the APPROVE stage
        const gy = dp.y - AMP * 0.9, by = dp.y + AMP * 0.9;
        const ex = lerp(dp.x, X1, 0.35);
        // green approved path
        ctx.save();
        ctx.globalAlpha = decA * 0.5;
        ctx.strokeStyle = GREEN; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(dp.x, dp.y); ctx.quadraticCurveTo(lerp(dp.x, ex, 0.5), gy, ex, gy); ctx.stroke();
        // blue alternate branch
        ctx.globalAlpha = decA * 0.4;
        ctx.strokeStyle = BLUE;
        ctx.beginPath(); ctx.moveTo(dp.x, dp.y); ctx.quadraticCurveTo(lerp(dp.x, ex, 0.5), by, ex, by); ctx.stroke();
        ctx.restore();
        // orange predictive pulse racing ahead down the approved path
        const pu = (t * 0.7) % 1;
        const pp = { x: lerp(dp.x, ex, pu), y: lerp(dp.y, gy, easeOut(pu)) };
        dot(ctx, pp.x, pp.y, 2.4, "#FFB86B", decA * 0.9, 10);
      }

      // ── documents ─────────────────────────────────────────────────────
      // Scene 1 scattered → radar organises → flow + transform along channel
      for (let i = 0; i < docs.length; i++) {
        const d = docs[i];
        // second wave only joins during acceleration
        const waveGate = d.wave === 0 ? 1 : accel;
        if (waveGate <= 0.02) continue;
        // scattered manual position (soft drift)
        const sx = d.sx + Math.sin(t * 0.6 + d.drift) * 16;
        const sy = d.sy + Math.cos(t * 0.5 + d.drift) * 12;
        // position along the channel once organised
        const flowSpeed = d.speed * (1 + 0.7 * accel); // faster when accelerating
        const u = ((t - 1.2) * flowSpeed + d.off) % 1;
        const fp = pathAt(u < 0 ? 0 : u);
        // blend scatter → channel as the radar organises everything
        const org = d.wave === 0 ? organise : 1;
        const x = lerp(sx, fp.x, org);
        const y = lerp(sy, fp.y, org);
        // transformation progress = how many stages this doc has passed
        let passed = 0;
        for (const st of STAGES) if (u > st.u) passed++;
        const prog = org < 0.9 ? 0 : passed / STAGES.length;
        const appear = d.wave === 0 ? 1 : waveGate;
        // finish burst when a doc completes the last stage
        if (prog >= 0.999) {
          const fb = (u - 0.86) / 0.14;
          if (fb > 0 && fb < 1) dot(ctx, x, y, 3 + fb * 3, "#CFFFE0", alpha * (1 - fb) * appear, 12);
        }
        docCard(ctx, x, y, d.type, prog, alpha * appear * (0.55 + 0.45 * org));
      }

      // ── Scene 5: acceleration energy wave sweeping the whole workflow ──
      if (t > 4.5 && t < 6.2) {
        const wu = (t - 4.5) / 1.4;
        const ex = lerp(X0, X1, easeOut(wu));
        const ep = pathAt(easeOut(wu));
        dot(ctx, ex, ep.y, 5, "#FFC98A", alpha * (1 - wu) * 0.9, 18);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.5);
        grad.addColorStop(0, `rgba(255,180,90,${0.16 * (1 - wu) * alpha})`);
        grad.addColorStop(1, "transparent");
        ctx.globalAlpha = 1;
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // ── Scene 4/idle: blue volumetric light + holographic dashboards ───
      const coreA = ph(t, 3.5, 0.9) * alpha;
      if (coreA > 0.01) {
        const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.5);
        bg.addColorStop(0, `rgba(90,150,255,${0.12 * coreA})`);
        bg.addColorStop(1, "transparent");
        ctx.globalAlpha = 1;
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
      }
      const uiA = ph(t, 3.8, 1) * alpha;
      if (uiA > 0.01) {
        // progress ring + automation % (top-right of the workflow)
        const rx = w * 0.8, ry = h * 0.2;
        const pct = 0.55 + 0.4 * clamp01((t - 3.8) / 2.5) + 0.03 * Math.sin(t * 2);
        ctx.save();
        ctx.globalAlpha = uiA * 0.85;
        ring(ctx, rx, ry, 15, "#3a4a63", 1, 3);
        ctx.strokeStyle = ORANGE; ctx.lineWidth = 3; ctx.lineCap = "round";
        ctx.beginPath(); ctx.arc(rx, ry, 15, -Math.PI / 2, -Math.PI / 2 + Math.min(pct, 1) * TWO_PI); ctx.stroke();
        ctx.fillStyle = AMBER; ctx.font = "700 9px ui-monospace, monospace"; ctx.textAlign = "center";
        ctx.fillText(Math.round(Math.min(pct, 1) * 100) + "%", rx, ry + 3);
        ctx.font = "600 7px ui-monospace, monospace"; ctx.globalAlpha = uiA * 0.6;
        ctx.fillText("AUTOMATED", rx, ry + 28);
        ctx.restore();
        // task-queue bars (bottom-left) refreshing
        const qx = w * 0.17, qy = h * 0.78;
        ctx.save();
        ctx.globalAlpha = uiA * 0.7;
        for (let b = 0; b < 5; b++) {
          const bl = 10 + 22 * (0.5 + 0.5 * Math.sin(t * 1.4 + b));
          ctx.fillStyle = b < 3 ? ORANGE : "#3a4a63";
          ctx.fillRect(qx + b * 8, qy - bl, 5, bl);
        }
        ctx.restore();
        // optimisation sparkline (top-left)
        const gx = w * 0.16, gy2 = h * 0.2;
        ctx.save();
        ctx.globalAlpha = uiA * 0.7;
        ctx.strokeStyle = GREEN; ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let s = 0; s <= 16; s++) {
          const vx = gx + s * 3;
          const vy = gy2 - (6 + s * 0.4) * (0.7 + 0.3 * Math.sin(s * 0.9 + t * 1.5));
          if (s === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
        }
        ctx.stroke();
        ctx.restore();
      }

      // ── idle: soft light sweep every ~9s + notification blips ──────────
      if (idle > 0) {
        const sweep = (idle % 9) / 1.8;
        if (sweep < 1) {
          const sx = lerp(-w * 0.2, w * 1.2, sweep);
          const lg = ctx.createLinearGradient(sx - 110, 0, sx + 110, 0);
          lg.addColorStop(0, "transparent");
          lg.addColorStop(0.5, `rgba(255,138,61,${0.05 * alpha * Math.sin(sweep * Math.PI)})`);
          lg.addColorStop(1, "transparent");
          ctx.globalAlpha = 1;
          ctx.fillStyle = lg;
          ctx.fillRect(0, 0, w, h);
        }
      }

      // ── the hero invoice metamorphosis (the signature moment) ──────────
      // lifted out of the workflow once automation begins; loops forever.
      if (t > 2.0) {
        const ht = t - 2.0;
        heroItem(ctx, w * 0.73, h * 0.44, ht % HERO_CYCLE, alpha * clamp01(ht / 0.4));
      }

      ctx.restore(); // end camera transform
    },
  };
}

/* ── Scene 2: Chatbots & AI Agents — the conversation that never sleeps ─
   NOT smiling bots. The story is language understood at scale:
     0.0–1.2  Messages pour in from every channel at once — web, social, SMS,
              support, voice, email — chat bubbles rising inward. The demand
              never stops.
     1.2–2.4  The AI understands: bubbles reach the core and dissolve into a
              stream of language tokens feeding a glowing NLP waveform; intent
              tags light up (BILLING · BOOKING · REFUND · SUPPORT).
     2.4–3.6  It works every channel in parallel: a typing indicator blinks at
              the core while the waveform composes replies.
     3.6–4.8  Answers stream back: solid reply bubbles with a check curve out
              to every channel at once — each lights up "resolved".
     4.8–5.8  It predicts: a reply leaves the core BEFORE the question has
              finished rising; the two meet halfway — answered in 0.3s.
     5.8+     Always on: messages keep flowing in, the waveform pulses, the
              typing dots blink, replies stream out, and a resolved counter
              ticks — any red "priority" message is caught instantly. */
function chatbotsScene(): Scene {
  const CYAN = "#22D3EE";
  type Ch = { ang: number; color: string; icon: number; name: string };
  let chans: Ch[] = [];
  let W = 0, H = 0, CX = 0, CY = 0, EX = 0, EY = 0, R = 0;

  const cpos = (i: number): Pt => ({
    x: CX + Math.cos(chans[i].ang) * EX,
    y: CY + Math.sin(chans[i].ang) * EY,
  });

  // communication-channel glyph — no faces: bubble / mic / envelope /
  // at-sign / sms / headset
  const chanIcon = (ctx: Ctx, x: number, y: number, icon: number, color: string, a: number, scale = 1.7) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = a;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.4;
    ctx.shadowColor = color; ctx.shadowBlur = 5;
    if (icon === 0) { // web chat — speech bubble
      rr(ctx, -8, -7, 16, 12, 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3, 5); ctx.lineTo(-6, 9); ctx.lineTo(0, 5); ctx.stroke();
    } else if (icon === 1) { // voice — mic
      rr(ctx, -3, -8, 6, 11, 3); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -2, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, 8); ctx.moveTo(-4, 8); ctx.lineTo(4, 8); ctx.stroke();
    } else if (icon === 2) { // email — envelope
      ctx.strokeRect(-8, -6, 16, 12);
      ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(0, 1); ctx.lineTo(8, -6); ctx.stroke();
    } else if (icon === 3) { // social — @
      ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, TWO_PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 8, -0.2 * Math.PI, 1.5 * Math.PI); ctx.stroke();
    } else if (icon === 4) { // sms — bubble with dots
      rr(ctx, -8, -6, 16, 12, 3); ctx.stroke();
      for (let d = 0; d < 3; d++) { ctx.beginPath(); ctx.arc(-4 + d * 4, 0, 1, 0, TWO_PI); ctx.fill(); }
    } else { // support — headset
      ctx.beginPath(); ctx.arc(0, 0, 7, Math.PI, TWO_PI); ctx.stroke();
      ctx.fillRect(-8.5, 0, 3, 5); ctx.fillRect(5.5, 0, 3, 5);
    }
    ctx.restore();
  };

  // a chat bubble. solid = filled reply; mark = draw a check inside
  const bubble = (ctx: Ctx, x: number, y: number, s: number, color: string, a: number, solid: boolean, mark: boolean) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = a;
    ctx.strokeStyle = color; ctx.lineWidth = 1.3;
    ctx.shadowColor = color; ctx.shadowBlur = solid ? 10 : 5;
    const w = 9 * s, h = 7 * s;
    if (solid) {
      ctx.fillStyle = rgba(color, 0.9);
      rr(ctx, -w, -h, w * 2, h * 2, 3 * s); ctx.fill();
    } else {
      rr(ctx, -w, -h, w * 2, h * 2, 3 * s); ctx.stroke();
    }
    // little tail
    ctx.beginPath();
    ctx.moveTo(-w * 0.4, h); ctx.lineTo(-w * 0.7, h + 3 * s); ctx.lineTo(-w * 0.05, h);
    if (solid) { ctx.fillStyle = rgba(color, 0.9); ctx.fill(); } else { ctx.stroke(); }
    if (mark) {
      ctx.strokeStyle = solid ? "#0F2A1E" : color; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-3 * s, 0); ctx.lineTo(-0.5 * s, 2.6 * s); ctx.lineTo(3.4 * s, -2.4 * s); ctx.stroke();
    } else if (!solid) {
      ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = a * 0.7;
      ctx.beginPath();
      ctx.moveTo(-w * 0.6, -h * 0.2); ctx.lineTo(w * 0.6, -h * 0.2);
      ctx.moveTo(-w * 0.6, h * 0.3); ctx.lineTo(w * 0.2, h * 0.3); ctx.stroke();
    }
    ctx.restore();
  };

  // typing indicator: three dots that bounce in sequence
  const typingDots = (ctx: Ctx, x: number, y: number, color: string, a: number, t: number) => {
    for (let d = 0; d < 3; d++) {
      const bounce = Math.max(0, Math.sin(t * 6 - d * 0.7));
      dot(ctx, x - 5 + d * 5, y - bounce * 3, 1.7, color, a * (0.4 + 0.6 * bounce), 5);
    }
  };

  // the AI core — a voice-assistant style NLP waveform, no face: volumetric
  // glow, a pulsing comprehension ring, and vertical bars that dance when it
  // is understanding/speaking
  const coreAI = (ctx: Ctx, x: number, y: number, r: number, a: number, active: number, t: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
    g.addColorStop(0, rgba(ORANGE, (0.06 + 0.3 * active) * a));
    g.addColorStop(1, "transparent");
    ctx.globalAlpha = 1; ctx.fillStyle = g;
    ctx.fillRect(x - r * 2.8, y - r * 2.8, r * 5.6, r * 5.6);
    ring(ctx, x, y, r, active > 0.3 ? ORANGE : "#7d8db0", a * (0.55 + 0.45 * active), 1.8);
    // comprehension ring
    ctx.save();
    ctx.globalAlpha = a * (0.3 + 0.4 * active);
    ctx.strokeStyle = AMBER; ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]); ctx.lineDashOffset = -t * 18;
    ctx.beginPath(); ctx.arc(x, y, r * 1.5, 0, TWO_PI); ctx.stroke();
    ctx.restore();
    // NLP waveform bars
    const bars = 9, bw = 1.8, span = r * 0.9;
    ctx.save();
    ctx.globalAlpha = a; ctx.fillStyle = AMBER;
    ctx.shadowColor = ORANGE; ctx.shadowBlur = 6;
    for (let b = 0; b < bars; b++) {
      const fx = x - span + (b / (bars - 1)) * span * 2;
      const amp = (0.2 + 0.8 * active) * r * 0.7;
      const hh = (0.18 + 0.82 * Math.abs(Math.sin(t * 5 + b * 0.8))) * amp;
      ctx.fillRect(fx - bw / 2, y - hh, bw, hh * 2);
    }
    ctx.restore();
    dot(ctx, x, y, r * 0.12, WHITE_WARM, a * (0.4 + 0.5 * active), 8);
  };

  const INTENTS = ["BILLING", "BOOKING", "REFUND", "SUPPORT"];

  return {
    build(w, h) {
      W = w; H = h; CX = w / 2; CY = h * 0.46;
      EX = Math.min(w, h) * 0.62; EY = Math.min(w, h) * 0.4;
      R = Math.min(w, h) * 0.085;
      const set = [
        { color: BLUE, icon: 0, name: "WEB" },
        { color: PURPLE, icon: 3, name: "SOCIAL" },
        { color: GREEN, icon: 4, name: "SMS" },
        { color: CYAN, icon: 5, name: "SUPPORT" },
        { color: ORANGE, icon: 1, name: "VOICE" },
        { color: GOLD, icon: 2, name: "EMAIL" },
      ];
      chans = set.map((c, i) => ({ ...c, ang: -Math.PI / 2 + (i / set.length) * TWO_PI }));
    },

    draw(ctx, t, w, h, alpha) {
      if (w !== W || h !== H) this.build(w, h);
      const cx = CX, cy = CY;
      const dx = Math.sin(t * 0.1) * w * 0.01, dy = Math.cos(t * 0.08) * h * 0.008;
      ctx.save();
      ctx.translate(dx, dy);

      const active = ph(t, 1.2, 0.8);
      const answer = ph(t, 3.6, 1.0);
      const idle = t - 5.8;
      const beat = 0.9 + 0.1 * Math.sin(t * (active > 0.4 ? 3.0 : 1.2));

      // ── channels around the edge ──
      chans.forEach((c, i) => {
        const ap = ph(t, i * 0.07, 0.5);
        if (ap <= 0) return;
        const p = cpos(i);
        const joy = clamp01((answer - 0.2 - i * 0.05) / 0.4);
        ring(ctx, p.x, p.y, 27, c.color, alpha * ap * (0.35 + 0.4 * joy), 1.6);
        chanIcon(ctx, p.x, p.y, c.icon, c.color, alpha * ap * (0.7 + 0.3 * joy));
        ctx.save();
        ctx.globalAlpha = alpha * ap * 0.6; ctx.fillStyle = c.color;
        ctx.font = "600 9px ui-monospace, monospace"; ctx.textAlign = "center";
        ctx.fillText(c.name, p.x, p.y + 42);
        ctx.restore();
        if (joy > 0.05 && joy < 1) {
          ring(ctx, p.x, p.y, 27 + joy * 26, c.color, alpha * (1 - joy) * 0.55, 1.2);
        }
      });

      // ── incoming question bubbles streaming inward ──
      chans.forEach((c, i) => {
        const p = cpos(i);
        for (let q = 0; q < 3; q++) {
          const launch = (q === 0 ? 0.15 : 1.6 + q * 0.2) + i * 0.1;
          const u = ph(t, launch, 1.2);
          if (u <= 0 || u >= 1) continue;
          const e = easeOut(u);
          const x = lerp(p.x, cx, e), y = lerp(p.y, cy, e);
          const s = lerp(1, 0.3, u);
          if (u < 0.82) {
            bubble(ctx, x, y, s, c.color, alpha * 0.85 * (1 - u * 0.2), false, false);
          } else {
            // dissolve into language tokens falling into the core
            for (let k = 0; k < 3; k++) {
              const tu = (u - 0.82) / 0.18;
              dot(ctx, lerp(x, cx, tu) + (k - 1) * 3, lerp(y, cy, tu), 1.4 * (1 - tu), AMBER, alpha * (1 - tu) * 0.9, 5);
            }
          }
        }
      });

      // ── the AI core ──
      coreAI(ctx, cx, cy, R * beat, alpha, Math.max(active, idle > 0 ? 1 : 0), t);

      // intent tags flash around the core while understanding
      if (active > 0.1 && idle <= 0) {
        INTENTS.forEach((it, k) => {
          const on = 0.3 + 0.7 * Math.abs(Math.sin(t * 2 + k * 1.3));
          const ang = -Math.PI / 2 + k * (TWO_PI / INTENTS.length) + 0.3;
          const rx = cx + Math.cos(ang) * R * 2.4, ry = cy + Math.sin(ang) * R * 2.4;
          ctx.save();
          ctx.globalAlpha = alpha * active * on * 0.8;
          ctx.fillStyle = AMBER; ctx.font = "600 7px ui-monospace, monospace"; ctx.textAlign = "center";
          ctx.fillText(it, rx, ry);
          ctx.restore();
        });
      }

      // typing indicator at the core while it works
      if (active > 0.3 && idle <= 0) typingDots(ctx, cx, cy - R * 1.9, ORANGE, alpha * active, t);

      // ── answers stream back out to every channel in parallel ──
      chans.forEach((c, i) => {
        const aU = ph(t, 3.7 + i * 0.06, 0.75);
        if (aU > 0 && aU < 1) {
          const p = cpos(i);
          const mx = lerp(cx, p.x, 0.5) + (p.y - cy) * 0.12;
          const my = lerp(cy, p.y, 0.5) - (p.x - cx) * 0.12;
          const bx = (1 - aU) * (1 - aU) * cx + 2 * (1 - aU) * aU * mx + aU * aU * p.x;
          const by = (1 - aU) * (1 - aU) * cy + 2 * (1 - aU) * aU * my + aU * aU * p.y;
          bubble(ctx, bx, by, 0.7, c.color, alpha * 0.95, true, true);
        }
      });

      // ── prediction: an answer leaves before the question finishes ──
      if (t > 4.8 && t < 5.9) {
        const pu = (t - 4.8) / 1.1;
        const c = chans[0]; const p = cpos(0);
        const ax = lerp(cx, p.x, easeOut(pu)), ay = lerp(cy, p.y, easeOut(pu));
        bubble(ctx, ax, ay, 0.62, c.color, alpha * (1 - pu * 0.2), true, true);
        const qu = clamp01((pu - 0.35) / 0.65);
        if (qu > 0) {
          const qx = lerp(p.x, cx, easeOut(qu)), qy = lerp(p.y, cy, easeOut(qu));
          bubble(ctx, qx, qy, 0.5 * (1 - qu * 0.4), c.color, alpha * qu * 0.7, false, false);
        }
        if (pu > 0.45 && pu < 0.62) {
          const mid = { x: lerp(cx, p.x, 0.5), y: lerp(cy, p.y, 0.5) };
          ring(ctx, mid.x, mid.y, (pu - 0.45) * 80, GOLD, alpha * (1 - (pu - 0.45) / 0.17) * 0.7, 1.4);
        }
        ctx.save();
        ctx.globalAlpha = alpha * clamp01(pu * 2) * (1 - clamp01((pu - 0.7) / 0.3)) * 0.9;
        ctx.fillStyle = GOLD; ctx.font = "700 9px ui-monospace, monospace"; ctx.textAlign = "center";
        ctx.fillText("ANSWERED IN 0.3s", cx, cy + R * 2.5);
        ctx.restore();
      }

      // ── idle: always-on loop ──
      if (idle > 0) {
        const period = 2.2;
        const cyc = idle % period;
        const which = Math.floor(idle / period) % chans.length;
        const priority = Math.floor(idle / period) % 4 === 3;
        const c = chans[which]; const p = cpos(which);
        const col = priority ? "#FF4D4D" : c.color;
        if (cyc < 0.5) {
          const u = cyc / 0.5;
          ring(ctx, p.x, p.y, 6 + u * 16, col, alpha * (1 - u) * 0.9, 1.6);
        } else if (cyc < 1.2) {
          const u = easeOut((cyc - 0.5) / 0.7);
          bubble(ctx, lerp(p.x, cx, u), lerp(p.y, cy, u), lerp(0.8, 0.35, u), col, alpha * 0.9, false, false);
        } else if (cyc < 1.9) {
          const u = easeOut((cyc - 1.2) / 0.7);
          bubble(ctx, lerp(cx, p.x, u), lerp(cy, p.y, u), 0.6, col, alpha * (1 - u * 0.3), true, true);
        }
        const n = 1240 + Math.floor(idle * 7);
        ctx.save();
        ctx.globalAlpha = alpha * 0.6; ctx.fillStyle = GREEN;
        ctx.font = "700 10px ui-monospace, monospace"; ctx.textAlign = "center";
        ctx.fillText(n.toLocaleString() + " RESOLVED", cx, cy + R * 2.7);
        ctx.restore();
        typingDots(ctx, cx, cy - R * 1.9, ORANGE, alpha * 0.7, t);
      }

      ctx.restore();
    },
  };
}

/* ── Scene 3: Software — idea → enterprise application, built live ────
   NOT code scrolling. The software LIFECYCLE is the hero:
     0.0–1.0  An idea: one glowing particle drops onto a self-drawing
              blueprint grid; ripples; labels Idea / Innovation / Solution.
     1.0–2.0  The blueprint builds itself: an app frame draws, and DB / API /
              cloud / auth architecture nodes snap into place around it.
     2.0–3.0  UI assembles from hexagonal light particles — navbar, sidebar,
              cards and a chart materialise inside the app (Dashboard, Login…).
     3.0–4.0  Integrations connect: glowing API highways shoot to Cloud,
              Payment, Email, Mobile, CRM, ERP — data packets travelling.
     4.0–5.0  AI Code Guardian: a rotating AI cube scans and ticks off
              Performance / Security / A11y / Quality / UX; a bar hits 100%.
     5.0–6.0  Intelligent testing: holographic test bots trace user journeys
              across the app, leaving green trails; the app glows greener.
     6.0–7.0  Global deployment: the app bursts into particles that orbit a
              holographic globe; continents and server nodes light up.
     7.0+     Living enterprise software: the app floats, dashboards update,
              API packets flow, cloud sync pulses, maintenance drones patrol. */
function softwareScene(): Scene {
  const HEX = ["#4EA8FF", ORANGE, WHITE_WARM]; // smart code particles: blue / orange / white
  type Particle = { sx: number; sy: number; tx: number; ty: number; c: string; delay: number };
  let particles: Particle[] = [];
  let W = 0, H = 0, CX = 0, CY = 0, AW = 0, AH = 0;

  // architecture nodes that snap in around the app (icon id + angle)
  const ARCH = [
    { icon: "db", ang: -2.5 }, { icon: "api", ang: -0.6 },
    { icon: "cloud", ang: -1.55 }, { icon: "auth", ang: 2.4 },
  ];
  // integration endpoints with their own API-highway colour
  const INTEG = [
    { name: "CLOUD", c: "#4EA8FF" }, { name: "PAYMENT", c: GOLD },
    { name: "EMAIL", c: ORANGE }, { name: "MOBILE", c: GREEN },
    { name: "CRM", c: PURPLE }, { name: "ERP", c: "#22D3EE" },
  ];

  const appRect = () => ({ x: CX - AW / 2, y: CY - AH / 2, w: AW, h: AH });

  const archIcon = (ctx: Ctx, icon: string, x: number, y: number, a: number) => {
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a;
    ctx.strokeStyle = AMBER; ctx.fillStyle = AMBER; ctx.lineWidth = 1.4;
    if (icon === "db") {
      ctx.beginPath(); ctx.ellipse(0, -6, 8, 3.2, 0, 0, TWO_PI); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-8, 6); ctx.ellipse(0, 6, 8, 3.2, 0, Math.PI, TWO_PI, true); ctx.lineTo(8, -6); ctx.stroke();
    } else if (icon === "api") {
      ctx.font = "700 9px ui-monospace, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.strokeRect(-11, -7, 22, 14); ctx.fillText("API", 0, 1);
    } else if (icon === "cloud") {
      ctx.beginPath(); ctx.arc(-5, 2, 6, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(0, -4, 7, Math.PI, TWO_PI); ctx.arc(7, 2, 5.5, Math.PI * 1.5, Math.PI * 0.5); ctx.closePath(); ctx.stroke();
    } else {
      // auth shield
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(8, -5); ctx.lineTo(8, 2); ctx.quadraticCurveTo(8, 8, 0, 11); ctx.quadraticCurveTo(-8, 8, -8, 2); ctx.lineTo(-8, -5); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3, 1); ctx.lineTo(-1, 4); ctx.lineTo(4, -3); ctx.stroke();
    }
    ctx.restore();
  };

  return {
    build(w, h) {
      W = w; H = h; CX = w / 2; CY = h * 0.47;
      AW = Math.min(w, h) * 0.42; AH = Math.min(w, h) * 0.5;
      const r = appRect();
      // light particles that fall from above and assemble into the UI
      particles = Array.from({ length: 90 }, () => ({
        sx: r.x + Math.random() * r.w,
        sy: -20 - Math.random() * h * 0.4,
        tx: r.x + 10 + Math.random() * (r.w - 20),
        ty: r.y + 30 + Math.random() * (r.h - 40),
        c: HEX[Math.floor(Math.random() * HEX.length)],
        delay: Math.random() * 0.7,
      }));
    },

    draw(ctx, t, w, h, alpha) {
      if (w !== W || h !== H) this.build(w, h);
      const cx = CX, cy = CY, r = appRect();

      // slow camera drift + a gentle zoom-out during global deployment
      const dx = Math.sin(t * 0.1) * w * 0.008;
      const zoom = 1 - 0.12 * ph(t, 6.0, 0.9) * (1 - ph(t, 7.0, 0.8));
      ctx.save();
      ctx.translate(cx + dx, cy);
      ctx.scale(zoom, zoom);
      ctx.translate(-cx, -cy);

      const idea = ph(t, 0, 0.7);
      const bp = ph(t, 0.9, 1.0);          // blueprint frame + architecture
      const assemble = ph(t, 2.0, 1.0);    // UI particles
      const deploy = ph(t, 6.0, 0.9);
      const living = t - 7.0;

      // ── living blueprint grid (breathes; faint coordinate ticks) ──────
      const gridA = idea * alpha * (0.5 + 0.5 * (1 - deploy));
      if (gridA > 0.01) {
        ctx.save();
        ctx.globalAlpha = gridA * 0.12;
        ctx.strokeStyle = "#4EA8FF"; ctx.lineWidth = 1;
        const gs = Math.min(w, h) / 16;
        const off = (t * 4) % gs;
        for (let gx = r.x - gs; gx < r.x + r.w + gs; gx += gs) { ctx.beginPath(); ctx.moveTo(gx + off * 0.2, r.y - 30); ctx.lineTo(gx, r.y + r.h + 30); ctx.stroke(); }
        for (let gy = r.y - 30; gy < r.y + r.h + 30; gy += gs) { ctx.beginPath(); ctx.moveTo(r.x - gs, gy); ctx.lineTo(r.x + r.w + gs, gy); ctx.stroke(); }
        ctx.restore();
      }

      // ── Scene 1: idea particle drop + ripple + labels ─────────────────
      if (t < 1.3) {
        const drop = easeOut(clamp01(t / 0.6));
        const py = lerp(cy - h * 0.3, cy, drop);
        dot(ctx, cx, py, 3.5 + 2 * Math.sin(t * 6), WHITE_WARM, alpha, 16);
        if (t > 0.55 && t < 1.3) {
          const ru = (t - 0.55) / 0.75;
          ring(ctx, cx, cy, ru * Math.min(w, h) * 0.22, "#4EA8FF", alpha * (1 - ru) * 0.7, 1.4);
        }
        const labels = ["IDEA", "INNOVATION", "SOLUTION"];
        labels.forEach((l, i) => {
          const la = ph(t, 0.4 + i * 0.2, 0.5) * (1 - ph(t, 1.6, 0.5));
          if (la <= 0) return;
          const a = -Math.PI / 2 + (i - 1) * 1.1;
          ctx.save();
          ctx.globalAlpha = alpha * la * 0.8;
          ctx.fillStyle = AMBER; ctx.font = "600 9px ui-monospace, monospace"; ctx.textAlign = "center";
          ctx.fillText(l, cx + Math.cos(a) * 70, cy + Math.sin(a) * 46);
          ctx.restore();
        });
      }

      // ── Scene 2: the app frame draws itself ───────────────────────────
      if (bp > 0.01 && deploy < 0.85) {
        ctx.save();
        ctx.globalAlpha = alpha * bp * (1 - deploy);
        ctx.strokeStyle = ORANGE; ctx.lineWidth = 1.6;
        // frame draws progressively (perimeter reveal)
        rr(ctx, r.x, r.y, r.w, r.h * Math.min(1, bp * 1.1), 10);
        ctx.stroke();
        // title bar dots
        if (bp > 0.5) {
          for (let d = 0; d < 3; d++) dot(ctx, r.x + 14 + d * 12, r.y + 14, 2.5, ["#FF5F57", "#FEBC2E", "#28C840"][d], alpha * bp, 0);
        }
        ctx.restore();

        // architecture nodes snap in around the frame
        ARCH.forEach((n, i) => {
          const u = ph(t, 1.2 + i * 0.14, 0.5);
          if (u <= 0) return;
          const ex = cx + Math.cos(n.ang) * AW * 0.95;
          const ey = cy + Math.sin(n.ang) * AH * 0.9;
          // connector from app to node
          ctx.save();
          ctx.globalAlpha = alpha * u * 0.4 * (1 - deploy);
          ctx.strokeStyle = AMBER; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
          ctx.restore();
          archIcon(ctx, n.icon, ex, ey, alpha * u * (1 - deploy) * 0.9);
        });
      }

      // ── Scene 3: UI assembles from falling light particles ────────────
      if (assemble > 0.01 && deploy < 0.6) {
        // particles falling into place
        for (const p of particles) {
          const u = ph(t, 2.0 + p.delay, 0.8);
          if (u <= 0 || u >= 1) continue;
          const x = lerp(p.sx, p.tx, easeOut(u));
          const y = lerp(p.sy, p.ty, easeOut(u));
          dot(ctx, x, y, 1.6, p.c, alpha * (1 - deploy), 4);
        }
        // resolved UI blocks inside the app (fade in as particles settle)
        const ui = clamp01((assemble - 0.4) / 0.6) * (1 - deploy);
        if (ui > 0.01) {
          ctx.save();
          ctx.globalAlpha = alpha * ui;
          // navbar
          ctx.fillStyle = "rgba(255,138,61,0.5)"; ctx.fillRect(r.x + 10, r.y + 26, r.w - 20, 8);
          // sidebar
          ctx.fillStyle = "rgba(78,168,255,0.35)"; ctx.fillRect(r.x + 10, r.y + 40, 26, r.h - 52);
          // cards
          ctx.strokeStyle = ORANGE; ctx.lineWidth = 1;
          rr(ctx, r.x + 44, r.y + 42, r.w - 58, 26, 4); ctx.stroke();
          rr(ctx, r.x + 44, r.y + 76, (r.w - 64) / 2, 30, 4); ctx.stroke();
          // mini chart bars
          const bx = r.x + 44 + (r.w - 64) / 2 + 10, by = r.y + 106;
          for (let b = 0; b < 5; b++) {
            const bl = 6 + 18 * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.6 + b)));
            ctx.fillStyle = b % 2 ? AMBER : ORANGE;
            ctx.fillRect(bx + b * 8, by - bl, 5, bl);
          }
          // labels
          ctx.fillStyle = AMBER; ctx.font = "600 7px ui-monospace, monospace"; ctx.textAlign = "left";
          ["DASHBOARD", "ANALYTICS"].forEach((l, i) => ctx.fillText(l, r.x + 48, r.y + 58 + i * 34));
          ctx.restore();
        }
      }

      // ── Scene 4: API highways to integration endpoints ────────────────
      const apiA = ph(t, 3.0, 0.9) * alpha * (1 - deploy);
      if (apiA > 0.01) {
        INTEG.forEach((it, i) => {
          const a = -Math.PI / 2 + (i / INTEG.length) * TWO_PI;
          const ex = cx + Math.cos(a) * Math.min(w, h) * 0.6;
          const ey = cy + Math.sin(a) * Math.min(w, h) * 0.42;
          const grow = ph(t, 3.0 + i * 0.08, 0.5);
          const hx = lerp(cx, ex, grow), hy = lerp(cy, ey, grow);
          // glowing highway
          ctx.save();
          ctx.globalAlpha = apiA * 0.5; ctx.strokeStyle = it.c; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(hx, hy); ctx.stroke();
          ctx.restore();
          if (grow >= 1) {
            // endpoint chip + label
            ctx.save();
            ctx.globalAlpha = apiA * 0.9;
            ctx.strokeStyle = it.c; ctx.fillStyle = it.c; ctx.lineWidth = 1.3;
            ring(ctx, ex, ey, 5, it.c, apiA, 6);
            ctx.font = "600 7px ui-monospace, monospace"; ctx.textAlign = "center";
            ctx.fillText(it.name, ex, ey + 16);
            ctx.restore();
            // data packets travelling at their own speed
            for (let pk = 0; pk < 2; pk++) {
              const prog = (t * (0.4 + i * 0.05) + pk * 0.5) % 1;
              dot(ctx, lerp(cx, ex, prog), lerp(cy, ey, prog), 1.8, it.c, apiA, 6);
            }
          }
        });
      }

      // ── Scene 5: AI Code Guardian cube — scans, ticks, 100% ───────────
      const guard = ph(t, 4.0, 0.8) * alpha;
      if (guard > 0.01 && deploy < 0.4) {
        const gx = r.x + r.w + 46, gy = cy - 10;
        const spin = t * 1.1;
        const cs = 15 + 2 * Math.sin(t * 3);
        // rotating cube (square whose width oscillates → pseudo-3D spin)
        ctx.save();
        ctx.globalAlpha = guard * (1 - deploy);
        ctx.translate(gx, gy);
        ctx.strokeStyle = "#4EA8FF"; ctx.fillStyle = "rgba(78,168,255,0.12)"; ctx.lineWidth = 1.6;
        const wob = Math.abs(Math.cos(spin)) * cs + 4;
        ctx.beginPath(); ctx.rect(-wob, -cs, wob * 2, cs * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = AMBER; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, -cs); ctx.lineTo(0, cs); ctx.stroke();
        ctx.restore();
        // scan line sweeping the app
        const scanY = r.y + ((t * 0.9) % 1) * r.h;
        ctx.save();
        ctx.globalAlpha = guard * 0.5 * (1 - deploy);
        ctx.strokeStyle = "#4EA8FF"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(r.x, scanY); ctx.lineTo(r.x + r.w, scanY); ctx.stroke();
        ctx.restore();
        // checklist ticking off
        const checks = ["PERFORMANCE", "SECURITY", "A11Y", "QUALITY", "UX"];
        checks.forEach((c, i) => {
          const done = t > 4.2 + i * 0.18;
          ctx.save();
          ctx.globalAlpha = guard * (1 - deploy) * (done ? 0.9 : 0.35);
          ctx.fillStyle = done ? GREEN : "#8899bb"; ctx.strokeStyle = done ? GREEN : "#8899bb";
          const yy = gy - 34 + i * 15;
          if (done) { ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(gx - 24, yy); ctx.lineTo(gx - 21, yy + 3); ctx.lineTo(gx - 16, yy - 3); ctx.stroke(); }
          ctx.font = "600 7px ui-monospace, monospace"; ctx.textAlign = "left";
          ctx.fillText(c, gx - 12, yy + 2);
          ctx.restore();
        });
        // 100% loading bar under the cube
        const pct = clamp01((t - 4.2) / 0.7);
        ctx.save();
        ctx.globalAlpha = guard * (1 - deploy);
        ctx.strokeStyle = "#3a4a63"; ctx.strokeRect(gx - 26, gy + 34, 52, 5);
        ctx.fillStyle = pct >= 1 ? GREEN : ORANGE; ctx.fillRect(gx - 26, gy + 34, 52 * pct, 5);
        ctx.restore();
      }

      // ── Scene 6: intelligent test bots trace journeys (green trails) ──
      const testA = ph(t, 5.0, 0.7) * alpha * (1 - deploy);
      if (testA > 0.01) {
        const journeys = 6;
        for (let b = 0; b < journeys; b++) {
          const prog = (t * 0.5 + b / journeys) % 1;
          // each bot weaves a different path across the app
          const bx = r.x + 20 + ((b % 3) / 2) * (r.w - 40);
          const by = r.y + 40 + prog * (r.h - 60) + Math.sin(prog * 6 + b) * 12;
          const col = b % 2 ? GREEN : "#4EA8FF";
          // trail
          ctx.save();
          ctx.globalAlpha = testA * 0.3; ctx.strokeStyle = GREEN; ctx.lineWidth = 1;
          ctx.beginPath();
          for (let s = 0; s < 8; s++) {
            const pp = Math.max(0, prog - s * 0.03);
            const yy = r.y + 40 + pp * (r.h - 60) + Math.sin(pp * 6 + b) * 12;
            if (s === 0) ctx.moveTo(bx, yy); else ctx.lineTo(bx, yy);
          }
          ctx.stroke();
          ctx.restore();
          dot(ctx, bx, by, 2.2, col, testA, 6);
        }
        // app glows greener as tests pass
        ctx.save();
        ctx.globalAlpha = testA * 0.15 * clamp01((t - 5.2) / 0.8);
        ctx.strokeStyle = GREEN; ctx.lineWidth = 2;
        rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.stroke();
        ctx.restore();
      }

      // ── Scene 7: global deployment — particles orbit a holo globe ─────
      if (deploy > 0.01) {
        const gR = Math.min(w, h) * 0.26;
        // the globe
        ctx.save();
        ctx.globalAlpha = alpha * deploy * 0.9;
        ring(ctx, cx, cy, gR, "#4EA8FF", alpha * deploy * 0.6, 1.4);
        ctx.strokeStyle = "rgba(78,168,255,0.4)"; ctx.lineWidth = 1;
        for (let m = 1; m < 4; m++) { const rx = gR * (m / 4); ctx.beginPath(); ctx.ellipse(cx, cy, rx, gR, 0, 0, TWO_PI); ctx.stroke(); }
        ctx.beginPath(); ctx.ellipse(cx, cy, gR, gR * 0.5, 0, 0, TWO_PI); ctx.stroke();
        ctx.restore();
        // continents / server nodes lighting up
        const regions = 6;
        for (let k = 0; k < regions; k++) {
          const on = clamp01((deploy - k * 0.12) / 0.3);
          if (on <= 0) continue;
          const a = (k / regions) * TWO_PI + t * 0.2;
          const rx = cx + Math.cos(a) * gR * 0.8;
          const ry = cy + Math.sin(a) * gR * 0.5;
          dot(ctx, rx, ry, 2.6, GREEN, alpha * on, 8);
          if (on > 0.5) ring(ctx, rx, ry, (on - 0.5) * 24, GREEN, alpha * (1 - (on - 0.5) / 0.5) * 0.6, 1);
        }
        // particles orbiting the globe (the app dispersed worldwide)
        for (let p = 0; p < 30; p++) {
          const a = t * 0.8 + (p / 30) * TWO_PI;
          const rr0 = gR * (0.7 + 0.4 * ((p * 7) % 10) / 10);
          dot(ctx, cx + Math.cos(a) * rr0, cy + Math.sin(a) * rr0 * 0.62, 1.3, p % 2 ? AMBER : "#4EA8FF", alpha * deploy * 0.8, 4);
        }
      }

      // ── Scene 8: living software — dashboards update, packets flow ────
      if (living > 0) {
        // maintenance drones patrolling the app edges
        for (let d = 0; d < 3; d++) {
          const a = t * 0.5 + (d / 3) * TWO_PI;
          const px = cx + Math.cos(a) * AW * 0.62;
          const py = cy + Math.sin(a) * AH * 0.6;
          dot(ctx, px, py, 1.8, "#4EA8FF", alpha * 0.7, 6);
        }
        // occasional notification blip at the app corner
        const blip = living % 3;
        if (blip < 0.5) dot(ctx, r.x + r.w - 10, r.y + 10, 2 + blip * 2, GREEN, alpha * (1 - blip / 0.5), 8);
        // cloud-sync pulse ring every few seconds
        const sync = living % 4;
        if (sync < 1) ring(ctx, cx, cy, sync * AW * 0.9, "#4EA8FF", alpha * (1 - sync) * 0.18, 1);
      }

      ctx.restore(); // camera
    },
  };
}

/* ── Scene 4: Mobile — the Digital Factory ──────────────────────────
   No phone, no globe, no floating screens. The app is MANUFACTURED like
   a luxury product on a futuristic production line:
     0.0–1.0  A transparent conveyor line fades in and AI robot arms lower
              into position over six build stations.
     1.0–3.8  A blank unit rides the belt; at each station an arm adds a
              layer — Skeleton → Colours → Interactions → Animations → AI →
              Security Shield — the interface builds up as it travels.
     3.8–4.8  The finished unit enters a glowing scan chamber; scanners
              sweep it and every feature checks GREEN.
     4.8–6.0  The chamber opens and the completed UI floats out and scales
              up — the interface itself is the hero, not a device.
     6.0+     The line keeps running: the hero UI lives (cards update, chart
              animates, AI pulses) while a fresh blank starts down the belt.
              "We manufacture enterprise mobile apps." */
function mobileScene(): Scene {
  let W = 0, H = 0, CX = 0, CY = 0, beltL = 0, beltR = 0, beltY = 0, chamberX = 0;
  let UH = 0, UW = 0;
  const STATIONS = ["SKELETON", "COLOURS", "INTERACT", "ANIMATE", "AI", "SECURE"];
  const stationX = (i: number) => lerp(beltL, beltR, (i + 0.5) / STATIONS.length);
  const layerAt = (i: number) => 1.2 + i * 0.42; // moment station i's layer is applied

  // the app unit: a portrait UI card whose content builds up in layers
  const unit = (ctx: Ctx, cx: number, cy: number, uw: number, uh: number, built: number, a: number, t: number, glow: number) => {
    const x = cx - uw / 2, y = cy - uh / 2;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = ORANGE; ctx.lineWidth = 1.6;
    ctx.shadowColor = ORANGE; ctx.shadowBlur = 6 + glow * 16;
    rr(ctx, x, y, uw, uh, uw * 0.13); ctx.stroke();
    ctx.shadowBlur = 0;
    if (built < 0.5) { ctx.restore(); return; }
    const pad = uw * 0.12, iw = uw - pad * 2;
    const coloured = built >= 2;
    // header
    ctx.fillStyle = coloured ? "rgba(255,138,61,0.6)" : "rgba(150,160,180,0.4)";
    ctx.fillRect(x + pad, y + uh * 0.1, iw, uh * 0.05);
    // two cards
    const cardY = y + uh * 0.2, cardH = uh * 0.15;
    ctx.strokeStyle = coloured ? "#4EA8FF" : "#8899bb"; ctx.lineWidth = 1;
    rr(ctx, x + pad, cardY, iw * 0.46, cardH, 3); ctx.stroke();
    rr(ctx, x + pad + iw * 0.54, cardY, iw * 0.46, cardH, 3); ctx.stroke();
    if (coloured) {
      ctx.fillStyle = "rgba(78,168,255,0.22)"; ctx.fillRect(x + pad + 1, cardY + 1, iw * 0.46 - 2, cardH - 2);
      ctx.fillStyle = "rgba(255,199,106,0.22)"; ctx.fillRect(x + pad + iw * 0.54 + 1, cardY + 1, iw * 0.46 - 2, cardH - 2);
    }
    // chart area — live bars once ANIMATE layer is on, else a flat block
    const chY = y + uh * 0.4, chH = uh * 0.22;
    ctx.strokeStyle = coloured ? ORANGE : "#8899bb"; rr(ctx, x + pad, chY, iw, chH, 3); ctx.stroke();
    if (built >= 4) {
      for (let b = 0; b < 5; b++) {
        const bh = chH * (0.3 + 0.6 * Math.abs(Math.sin(t * 1.6 + b)));
        ctx.fillStyle = b % 2 ? AMBER : ORANGE;
        ctx.fillRect(x + pad + 4 + b * (iw / 6), chY + chH - bh, iw / 9, bh);
      }
    } else if (coloured) {
      ctx.fillStyle = "rgba(255,138,61,0.15)"; ctx.fillRect(x + pad + 1, chY + 1, iw - 2, chH - 2);
    }
    // interactions: a toggle + a button, once INTERACT layer is on
    if (built >= 3) {
      const tgY = y + uh * 0.7;
      ctx.strokeStyle = GREEN; ctx.lineWidth = 1.2;
      rr(ctx, x + pad, tgY, uw * 0.2, uh * 0.05, uh * 0.025); ctx.stroke();
      ctx.fillStyle = GREEN;
      ctx.beginPath(); ctx.arc(x + pad + uw * 0.2 - uh * 0.025, tgY + uh * 0.025, uh * 0.018, 0, TWO_PI); ctx.fill();
      ctx.strokeStyle = ORANGE;
      rr(ctx, x + uw - pad - uw * 0.3, tgY, uw * 0.3, uh * 0.05, 3); ctx.stroke();
    }
    // AI badge (top-right) once AI layer is on
    if (built >= 5) {
      const bx = x + uw - pad - 4, by = y + uh * 0.12;
      ring(ctx, bx, by, 4, ORANGE, a, 6); dot(ctx, bx, by, 1.5, WHITE_WARM, a, 4);
    }
    // security shield (bottom-left) once SECURE layer is on
    if (built >= 6) {
      const sx = x + pad + 4, sy = y + uh * 0.86;
      ctx.strokeStyle = GREEN; ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 6); ctx.lineTo(sx + 5, sy - 3.5); ctx.lineTo(sx + 5, sy + 1);
      ctx.quadraticCurveTo(sx + 5, sy + 5, sx, sy + 7);
      ctx.quadraticCurveTo(sx - 5, sy + 5, sx - 5, sy + 1); ctx.lineTo(sx - 5, sy - 3.5); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx - 2, sy); ctx.lineTo(sx - 0.5, sy + 2); ctx.lineTo(sx + 2.5, sy - 2); ctx.stroke();
    }
    ctx.restore();
  };

  // an overhead robot arm at station i; reaches down to place its layer
  const arm = (ctx: Ctx, sx: number, topY: number, reach: number, a: number) => {
    const active = reach > 0.1;
    const col = active ? ORANGE : "#7d8db0";
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = "#6E7C9C"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx - 10, topY); ctx.lineTo(sx + 10, topY); ctx.stroke(); // ceiling mount
    // two-segment arm with a slight elbow, extending on reach
    const elbowX = sx + 8, elbowY = topY + 20;
    const tipY = topY + 34 + reach * 26;
    ctx.strokeStyle = col; ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(sx, topY); ctx.lineTo(elbowX, elbowY); ctx.lineTo(sx, tipY); ctx.stroke();
    dot(ctx, sx, tipY, 2.4, active ? AMBER : "#7d8db0", a, active ? 8 : 0);
    ctx.restore();
    return tipY;
  };

  return {
    build(w, h) {
      W = w; H = h; CX = w / 2; CY = h * 0.47;
      beltL = w * 0.13; beltR = w * 0.66; beltY = CY + Math.min(w, h) * 0.12;
      chamberX = w * 0.82;
      UH = Math.min(w, h) * 0.2; UW = UH * 0.58;
    },

    draw(ctx, t, w, h, alpha) {
      if (w !== W || h !== H) this.build(w, h);
      const cx = CX;

      // slow camera drift
      ctx.save();
      ctx.translate(Math.sin(t * 0.1) * w * 0.006, 0);

      const beltIn = ph(t, 0, 0.9);
      const travel = clamp01((t - 1.0) / 2.8);
      const toChamber = clamp01((t - 3.8) / 0.7);
      const scan = ph(t, 4.2, 0.8);
      const heroU = clamp01((t - 4.8) / 1.1);
      const living = t - 6.0;

      // ── conveyor belt: rails, moving belt dashes, support struts ──────
      if (beltIn > 0.01) {
        ctx.save();
        ctx.globalAlpha = alpha * beltIn * 0.7;
        ctx.strokeStyle = "#6E7C9C"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(beltL - 20, beltY - 7); ctx.lineTo(chamberX + 40, beltY - 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(beltL - 20, beltY + 7); ctx.lineTo(chamberX + 40, beltY + 7); ctx.stroke();
        // moving belt segments
        ctx.globalAlpha = alpha * beltIn * 0.3;
        ctx.strokeStyle = ORANGE; ctx.lineWidth = 1;
        const off = (t * 40) % 22;
        for (let bx = beltL - 20 + off; bx < chamberX + 40; bx += 22) { ctx.beginPath(); ctx.moveTo(bx, beltY - 7); ctx.lineTo(bx - 6, beltY + 7); ctx.stroke(); }
        // support legs
        ctx.globalAlpha = alpha * beltIn * 0.4; ctx.strokeStyle = "#6E7C9C";
        for (let lx = beltL; lx < chamberX; lx += (chamberX - beltL) / 5) {
          ctx.beginPath(); ctx.moveTo(lx, beltY + 7); ctx.lineTo(lx - 8, beltY + 34); ctx.moveTo(lx, beltY + 7); ctx.lineTo(lx + 8, beltY + 34); ctx.stroke();
        }
        ctx.restore();
      }

      // ── robot arms + station labels ───────────────────────────────────
      const topY = beltY - Math.min(w, h) * 0.34;
      STATIONS.forEach((label, i) => {
        const sx = stationX(i);
        const armA = alpha * ph(t, 0.6 + i * 0.05, 0.5) * (1 - heroU * 0.6);
        if (armA <= 0.02) return;
        const reach = Math.max(0, 1 - Math.abs(t - layerAt(i)) / 0.34);
        const tipY = arm(ctx, sx, topY, reach, armA);
        // spark as the layer is welded on
        if (reach > 0.4) {
          dot(ctx, sx, tipY, 3, WHITE_WARM, armA * reach, 12);
          ring(ctx, sx, tipY, reach * 14, AMBER, armA * (1 - reach) * 0.8 + armA * 0.3, 1);
        }
        // station label under the belt
        ctx.save();
        const done = t > layerAt(i);
        ctx.globalAlpha = armA * (done ? 0.9 : 0.5);
        ctx.fillStyle = done ? AMBER : "#7d8db0";
        ctx.font = "600 7px ui-monospace, monospace"; ctx.textAlign = "center";
        ctx.fillText((i + 1) + " " + label, sx, beltY + 30);
        if (done) dot(ctx, sx - 22, beltY + 27, 1.6, GREEN, armA, 4);
        ctx.restore();
      });

      // how many layers have been applied
      let built = 0;
      for (let i = 0; i < STATIONS.length; i++) if (t > layerAt(i)) built++;

      // ── the unit travelling the belt (hidden once it becomes the hero) ─
      if (heroU < 1) {
        const ux = travel < 1
          ? lerp(stationX(0), stationX(STATIONS.length - 1), travel)
          : lerp(stationX(STATIONS.length - 1), chamberX, toChamber);
        const uy = beltY - UH * 0.5 - 8;
        unit(ctx, ux, uy, UW, UH, heroU > 0 ? 6 : built, alpha * (1 - heroU), t, 0);
      }

      // ── scan chamber at the belt's end ────────────────────────────────
      const chW = UW + 30, chH2 = UH + 30, chY = beltY - UH * 0.5 - 8;
      if (beltIn > 0.5) {
        ctx.save();
        ctx.globalAlpha = alpha * 0.5 * (1 - heroU);
        ctx.strokeStyle = "#4EA8FF"; ctx.lineWidth = 1.4;
        rr(ctx, chamberX - chW / 2, chY - chH2 / 2, chW, chH2, 8); ctx.stroke();
        // corner brackets
        ctx.restore();
      }
      // scanning sweep + green feature checks
      if (scan > 0.01 && toChamber >= 1 && heroU < 1) {
        const sweepY = chY - chH2 / 2 + ((t * 0.8) % 1) * chH2;
        ctx.save();
        ctx.globalAlpha = alpha * 0.6 * (1 - heroU);
        ctx.strokeStyle = "#4EA8FF"; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(chamberX - chW / 2, sweepY); ctx.lineTo(chamberX + chW / 2, sweepY); ctx.stroke();
        ctx.restore();
        for (let k = 0; k < 6; k++) {
          const on = t > 4.3 + k * 0.1;
          if (!on) continue;
          const ck = chY - chH2 / 2 + 8 + k * ((chH2 - 16) / 5);
          dot(ctx, chamberX + chW / 2 - 6, ck, 1.8, GREEN, alpha * (1 - heroU) * 0.9, 6);
        }
        if (t > 4.6) {
          ctx.save();
          ctx.globalAlpha = alpha * (1 - heroU) * 0.9; ctx.fillStyle = GREEN;
          ctx.font = "700 8px ui-monospace, monospace"; ctx.textAlign = "center";
          ctx.fillText("PASS", chamberX, chY + chH2 / 2 + 14);
          ctx.restore();
        }
      }

      // ── hero: the finished UI floats out and scales up ────────────────
      if (heroU > 0) {
        const hx = lerp(chamberX, cx, easeOut(heroU));
        const hy = lerp(chY, CY - Math.min(w, h) * 0.02, easeOut(heroU)) + Math.sin(t * 0.9) * 4;
        const sc = lerp(1, 1.7, easeOut(heroU));
        // glow bloom behind the hero
        const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, UH * sc);
        g.addColorStop(0, `rgba(255,140,60,${0.16 * heroU * alpha})`);
        g.addColorStop(1, "transparent");
        ctx.globalAlpha = 1; ctx.fillStyle = g;
        ctx.fillRect(hx - UH * sc, hy - UH * sc, UH * sc * 2, UH * sc * 2);
        unit(ctx, hx, hy, UW * sc, UH * sc, 6, alpha, t, heroU);
        // notification ping + AI pulse on the living hero
        if (living > 0) {
          const cyc = living % 2.6;
          if (cyc < 1) {
            const px = hx + UW * sc / 2 - 8, py = hy - UH * sc / 2 + 8;
            dot(ctx, px, py, 3.5, "#F92B4E", alpha * (1 - cyc), 8);
            ring(ctx, px, py, 4 + cyc * 12, "#F92B4E", alpha * (1 - cyc) * 0.7, 1.1);
          }
          const sync = living % 3.5;
          if (sync < 1) ring(ctx, hx, hy, UW * sc * 0.6 + sync * UW * sc, "#4EA8FF", alpha * (1 - sync) * 0.14, 1);
        }
      }

      ctx.restore(); // camera
    },
  };
}

/* ── Scene 5: Web Apps — visitors become customers, built live ───────
   A meaningful build story, not a static dashboard:
     0.0–1.2  BUILD: a browser frame draws itself; the URL types in.
     1.2–2.6  ASSEMBLE: navbar, a hero CTA, sidebar, stat cards, a live chart
              and a donut slide in — the wireframe fills with colour.
     2.6–3.6  RESPONSIVE: the frame squeezes to a phone and back — one layout,
              every screen (the signature beat).
     3.6–4.5  UX: a cursor glides in, the CTA lights on hover, a click ripples.
     4.5–5.4  PERFORMANCE: a speed gauge sweeps to 99 with a "0.4s" load.
     5.4–6.9  CONVERT: visitors stream in from the top, reach the CTA and turn
              into customers — green coins fly to a rising CONVERTED counter.
     6.9+     LIVING: the app runs — the chart breathes, the donut fills, and
              visitors keep converting; an AI assistant keeps it personal. */
function webScene(): Scene {
  type V = { lane: number; off: number; sp: number; conv: boolean };
  let visitors: V[] = [];
  let chart: number[] = [];
  let W = 0, H = 0;

  return {
    build(w, h) {
      W = w; H = h;
      chart = Array.from({ length: 9 }, () => 0.28 + Math.random() * 0.6);
      visitors = Array.from({ length: 16 }, (_, i) => ({
        lane: i % 4,
        off: Math.random(),
        sp: 0.15 + Math.random() * 0.12,
        conv: Math.random() < 0.6,
      }));
    },

    draw(ctx, t, w, h, alpha) {
      if (w !== W || h !== H) this.build(w, h);

      // responsive squeeze: full width → phone → back, once, at 2.6–3.6
      const morph = clamp01(ph(t, 2.6, 0.5) - ph(t, 3.1, 0.5));
      const fullW = Math.min(w * 0.5, 470);
      const bw = lerp(fullW, fullW * 0.36, morph);
      const bh = fullW * 0.62;
      if (bh < 60) return; // skip degenerate frames before the canvas is sized
      const bx = w / 2 - bw / 2;
      const by = h * 0.45 - bh / 2 + Math.sin(t * 0.7) * 3;
      const inner = { x: bx + 12, y: by + 34, w: bw - 24, h: bh - 46 };
      // the hero CTA everything funnels toward
      const ctaX = inner.x + inner.w * 0.5;
      const ctaY = inner.y + inner.h * 0.16;
      const ctaW = Math.max(46, inner.w * 0.3), ctaH = 14;

      // ── BUILD: the browser frame draws itself ──
      const drawP = ph(t, 0, 1.2);
      ctx.save();
      ctx.globalAlpha = alpha * 0.95;
      ctx.strokeStyle = ORANGE; ctx.lineWidth = 1.6;
      const per = (bw + bh) * 2;
      ctx.setLineDash([per * drawP, per]);
      rr(ctx, bx, by, bw, bh, 10); ctx.stroke();
      ctx.setLineDash([]);
      if (drawP > 0.5) {
        const ca = alpha * (drawP - 0.5) * 2;
        ctx.globalAlpha = ca * 0.8;
        ctx.beginPath(); ctx.moveTo(bx, by + 26); ctx.lineTo(bx + bw, by + 26); ctx.stroke();
        [ORANGE, AMBER, GREEN].forEach((c, i) => {
          ctx.fillStyle = c; ctx.beginPath();
          ctx.arc(bx + 14 + i * 12, by + 13, 3.2, 0, TWO_PI); ctx.fill();
        });
        ctx.globalAlpha = ca * 0.45;
        ctx.strokeStyle = "rgba(255,199,106,0.5)"; ctx.lineWidth = 1;
        rr(ctx, bx + 54, by + 7, bw - 68, 12, 6); ctx.stroke();
        const url = "yoursite.com";
        const shown = url.slice(0, Math.floor(clamp01((t - 0.7) / 0.8) * url.length));
        ctx.globalAlpha = ca * 0.85; ctx.fillStyle = AMBER;
        ctx.font = "600 8px ui-monospace, monospace"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillText(shown, bx + 60, by + 13);
      }
      ctx.restore();

      // ── content, clipped to the frame so the squeeze reads as real ──
      ctx.save();
      rr(ctx, bx + 2, by + 28, bw - 4, bh - 30, 8); ctx.clip();

      if (morph > 0.32) {
        // mobile layout while squeezed — one stacked column
        ctx.globalAlpha = alpha * morph;
        ctx.fillStyle = "rgba(255,176,87,0.5)";
        ctx.fillRect(inner.x + 5, inner.y + 4, inner.w - 10, 7);
        for (let i = 0; i < 4; i++) {
          ctx.globalAlpha = alpha * morph * 0.55;
          ctx.strokeStyle = "rgba(255,176,87,0.5)"; ctx.lineWidth = 1;
          rr(ctx, inner.x + 5, inner.y + 17 + i * 19, inner.w - 10, 15, 3); ctx.stroke();
        }
      } else {
        // ── desktop dashboard ──
        const dv = alpha * clamp01(1 - morph / 0.32);
        // sidebar
        const u0 = ph(t, 1.4, 0.5);
        if (u0 > 0) {
          ctx.globalAlpha = dv * u0 * 0.55;
          ctx.strokeStyle = "rgba(255,176,87,0.45)"; ctx.lineWidth = 1;
          rr(ctx, inner.x, inner.y + (1 - u0) * 18, inner.w * 0.18, inner.h, 5); ctx.stroke();
          ctx.fillStyle = "rgba(255,199,106,0.3)";
          for (let i = 0; i < 4; i++) ctx.fillRect(inner.x + 6, inner.y + 10 + i * 15, inner.w * 0.18 - 12, 4);
        }
        const cx0 = inner.x + inner.w * 0.22;
        const cw = inner.w * 0.78;
        // hero CTA button (pulses; lights on hover during UX beat)
        const uH = ph(t, 1.7, 0.5);
        if (uH > 0) {
          const hover = t > 3.7 && t < 4.5 ? 0.5 + 0.5 * Math.sin((t - 3.7) * 6) : 0;
          const pulse = 0.5 + 0.5 * Math.sin(t * 3);
          ctx.globalAlpha = dv * uH;
          ctx.fillStyle = rgba(ORANGE, 0.85 + 0.15 * hover);
          ctx.shadowColor = ORANGE; ctx.shadowBlur = 8 + 10 * (hover + pulse * 0.3);
          rr(ctx, ctaX - ctaW / 2, ctaY - ctaH / 2 + (1 - uH) * 12, ctaW, ctaH, 7); ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = dv * uH * 0.9; ctx.fillStyle = "#2A1400";
          ctx.font = "700 7px ui-monospace, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("GET STARTED", ctaX, ctaY + (1 - uH) * 12);
        }
        // three stat cards
        for (let i = 0; i < 3; i++) {
          const u = ph(t, 1.9 + i * 0.15, 0.5);
          if (u <= 0) continue;
          const sw = cw * 0.3, sx = cx0 + i * (sw + cw * 0.05), sy = inner.y + inner.h * 0.32;
          ctx.globalAlpha = dv * u * 0.6;
          ctx.strokeStyle = "rgba(255,176,87,0.4)"; ctx.lineWidth = 1;
          rr(ctx, sx, sy + (1 - u) * 12, sw, inner.h * 0.24, 4); ctx.stroke();
          ctx.fillStyle = [ORANGE, GREEN, AMBER][i]; ctx.globalAlpha = dv * u * 0.85;
          ctx.fillRect(sx + 6, sy + 7, sw * 0.45, 4);
          ctx.fillStyle = "rgba(255,247,230,0.5)";
          ctx.fillRect(sx + 6, sy + 15, sw * 0.7, 3);
        }
        // line chart
        const uC = ph(t, 2.3, 0.6);
        const chX = cx0, chY = inner.y + inner.h * 0.62, chW = cw * 0.62, chH = inner.h * 0.34;
        if (uC > 0) {
          ctx.globalAlpha = dv * uC * 0.5;
          ctx.strokeStyle = "rgba(255,176,87,0.4)"; ctx.lineWidth = 1;
          rr(ctx, chX, chY, chW, chH, 4); ctx.stroke();
          const prog = clamp01((t - 2.6) / 2.0);
          ctx.save();
          ctx.globalAlpha = dv * uC; ctx.strokeStyle = ORANGE; ctx.lineWidth = 1.8;
          ctx.shadowColor = ORANGE; ctx.shadowBlur = 6; ctx.beginPath();
          const n = Math.max(2, Math.ceil(chart.length * prog));
          let lpx = chX, lpy = chY;
          for (let i = 0; i < n; i++) {
            const px = chX + 8 + (i / (chart.length - 1)) * (chW - 16);
            const py = chY + chH - 8 - chart[i] * (chH - 16) + Math.sin(t * 1.5 + i) * 2;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            lpx = px; lpy = py;
          }
          ctx.stroke();
          if (prog < 1) dot(ctx, lpx, lpy, 3, GOLD, dv, 8);
          ctx.restore();
        }
        // donut
        const uD = ph(t, 2.6, 0.6);
        if (uD > 0) {
          const dcx = chX + chW + (cw * 0.34) / 2 + 6, dcy = chY + chH / 2, drr = chH * 0.4;
          const sweep = clamp01((t - 2.9) / 1.6) * TWO_PI * 0.72;
          ctx.save();
          ctx.globalAlpha = dv * uD; ctx.lineWidth = 5;
          ctx.strokeStyle = "rgba(255,199,106,0.18)";
          ctx.beginPath(); ctx.arc(dcx, dcy, drr, 0, TWO_PI); ctx.stroke();
          ctx.strokeStyle = ORANGE;
          ctx.beginPath(); ctx.arc(dcx, dcy, drr, -Math.PI / 2, -Math.PI / 2 + sweep); ctx.stroke();
          ctx.restore();
        }
      }

      // ── CONVERT: visitors stream in and reach the CTA (inside the app) ──
      const conv = ph(t, 5.4, 0.7);
      if (conv > 0 && morph < 0.2) {
        visitors.forEach((v) => {
          const u = ((t * v.sp + v.off) % 1);
          const laneX = inner.x + inner.w * (0.18 + v.lane * 0.21);
          if (u < 0.5) {
            // descend from the top of the page, funnelling toward the CTA
            const e = u / 0.5;
            const x = lerp(laneX, ctaX, easeOut(e));
            const y = lerp(inner.y - 8, ctaY, e);
            dot(ctx, x, y, 2.2, "#DFE6F2", alpha * conv * 0.9, 5);
          } else if (u < 0.6) {
            // click ripple at the CTA
            const e = (u - 0.5) / 0.1;
            ring(ctx, ctaX, ctaY, 4 + e * 16, v.conv ? GREEN : "#8390AB", alpha * conv * (1 - e) * 0.8, 1.3);
          }
        });
      }
      ctx.restore(); // end frame clip

      // converted customers fly OUT of the app toward the counter below
      const counterX = w / 2, counterY = by + bh + 30;
      if (conv > 0 && morph < 0.2) {
        visitors.forEach((v) => {
          if (!v.conv) return;
          const u = ((t * v.sp + v.off) % 1);
          if (u >= 0.6) {
            const e = (u - 0.6) / 0.4;
            const x = lerp(ctaX, counterX, easeOut(e));
            const y = lerp(ctaY, counterY, easeOut(e));
            dot(ctx, x, y, 3, GOLD, alpha * (1 - e * 0.3), 8);
            ctx.save();
            ctx.globalAlpha = alpha * (1 - e * 0.3); ctx.fillStyle = "#3A2600";
            ctx.font = "700 5px ui-monospace, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText("$", x, y + 0.5); ctx.restore();
          }
        });
        // the rising CONVERTED counter
        const pct = Math.round(clamp01((t - 5.6) / 3) * 60 + 8 + 2 * Math.sin(t * 2));
        ctx.save();
        ctx.globalAlpha = alpha * conv;
        ctx.fillStyle = GREEN; ctx.font = "700 12px ui-monospace, monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(Math.min(pct, 68) + "% CONVERTED", counterX, counterY + 8);
        ctx.globalAlpha = alpha * conv * 0.6; ctx.fillStyle = "#9FB0C9";
        ctx.font = "600 7px ui-monospace, monospace";
        ctx.fillText("VISITORS → CUSTOMERS", counterX, counterY + 22);
        ctx.restore();
      }

      // ── RESPONSIVE label + device glyphs during the squeeze ──
      if (morph > 0.05) {
        ctx.save();
        ctx.globalAlpha = alpha * morph;
        ctx.fillStyle = AMBER; ctx.font = "700 9px ui-monospace, monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("RESPONSIVE", w / 2, by - 14);
        ctx.restore();
      }

      // ── UX: a cursor glides in, hovers the CTA, clicks ──
      if (t > 3.6 && t < 5.4) {
        const u = (t - 3.6) % 2.2;
        const from = { x: bx + bw * 0.78, y: by + bh * 0.8 };
        const e = easeOut(clamp01(u / 1.1));
        const cxr = lerp(from.x, ctaX + 6, e), cyr = lerp(from.y, ctaY + 6, e);
        ctx.save();
        ctx.globalAlpha = alpha * 0.95; ctx.fillStyle = WHITE_WARM;
        ctx.beginPath();
        ctx.moveTo(cxr, cyr); ctx.lineTo(cxr + 4, cyr + 11);
        ctx.lineTo(cxr + 6.5, cyr + 6.5); ctx.lineTo(cxr + 11, cyr + 4);
        ctx.closePath(); ctx.fill(); ctx.restore();
        if (u > 1.1 && u < 1.6) ring(ctx, ctaX, ctaY, 4 + (u - 1.1) * 34, ORANGE, alpha * (1 - (u - 1.1) / 0.5) * 0.8, 1.4);
      }

      // ── PERFORMANCE: a speed gauge sweeps to 99 ──
      const perf = ph(t, 4.5, 0.6) * (1 - ph(t, 6.4, 0.8));
      if (perf > 0.01) {
        const gx = bx + bw - 40, gy = by + bh - 34, gr = 15;
        const score = Math.round(clamp01((t - 4.6) / 1.2) * 99);
        ctx.save();
        ctx.globalAlpha = alpha * perf;
        ctx.lineWidth = 3; ctx.strokeStyle = "rgba(52,211,153,0.2)";
        ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
        ctx.strokeStyle = GREEN; ctx.shadowColor = GREEN; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI * 0.75, Math.PI * 0.75 + (score / 100) * Math.PI * 1.5); ctx.stroke();
        ctx.shadowBlur = 0; ctx.fillStyle = GREEN;
        ctx.font = "700 11px ui-monospace, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(score), gx, gy + 1);
        ctx.globalAlpha = alpha * perf * 0.7; ctx.font = "600 6px ui-monospace, monospace";
        ctx.fillText("0.4s LOAD", gx, gy + gr + 8);
        ctx.restore();
      }

      // ── AI assistant joins once the app is live ──
      const aiA = ph(t, 6.4, 0.7);
      if (aiA > 0) {
        const ax = bx + bw - 26, ay = by + 44, ar = 9 * aiA;
        dot(ctx, ax, ay, ar * 1.6, ORANGE, alpha * aiA * 0.18, 14);
        ring(ctx, ax, ay, ar, ORANGE, alpha * aiA * 0.9, 1.5);
        const spark = 0.5 + 0.5 * Math.sin(t * 4);
        dot(ctx, ax, ay, ar * 0.3, WHITE_WARM, alpha * aiA * spark, 6);
      }
    },
  };
}

/* ── Scene 6: Cloud & Infrastructure — the Living Digital City ───────
   Not an ambient loop — a scripted cinematic arc where the infrastructure
   is the hero and proves it is reliable, intelligent and resilient without
   a single word: Offline → Power On → Connect → Operate → Failure →
   Self-Heal → Recover → Scale → Stable.
     OFFLINE   0.0–1.2  Dark. Platforms wait as cold outlines; only tiny
                        health LEDs blink. Nothing is moving yet.
     POWER ON  1.2–2.2  A blue energy pulse rises from below into a core
                        that ignites; a power wave sweeps out and every
                        platform wakes in sequence, lighting outward.
     CONNECT   2.2–3.6  Energy bridges build themselves from both ends
                        until they meet — the network grows naturally.
     OPERATE   3.6–5.0  Traffic flows only on live routes: orange REQUEST
                        packets out, blue RESPONSE packets back, at
                        different speeds. The background reacts.
     FAILURE   5.0–5.6  One platform goes dark; its bridges vanish and the
                        traffic on them freezes — a half-second "oh no".
     SELF-HEAL 5.6–6.6  Neighbours react: a green reroute bridge grows and
                        traffic instantly redirects. Nothing crashes.
     RECOVER   6.6–7.4  The platform repairs itself; traffic rebalances.
     SCALE     7.4–9.0  Traffic surges; new platforms rise from below and
                        the load balances — auto-scaling, shown not told.
     STABLE    9.0+     A calm living loop: platforms breathe, dual-way
                        traffic hums, a sync pulse ripples, camera settles.
   The camera slowly pushes in ~3% across the arc and nudges on failure. */
function modernizationScene(): Scene {
  const CYAN = "#22D3EE";
  const RED = "#F92B4E";
  // beat boundaries in local seconds — the arc plays once, then idles
  const T = { power: 1.2, connect: 2.2, operate: 3.6, fail: 5.0, heal: 5.6, recover: 6.6, scale: 7.4, stable: 9.0 };
  type Plat = { ang: number; rx: number; ry: number; depth: number; icon: number; name: string; future: boolean };
  let plats: Plat[] = [];
  let bridges: [number, number][] = [];
  let W = 0, H = 0, CX = 0, CY = 0, RX = 0, RY = 0, S = 0;

  const platPos = (i: number, t: number): Pt => {
    const p = plats[i];
    return {
      x: CX + Math.cos(p.ang) * p.rx,
      y: CY + Math.sin(p.ang) * p.ry - p.depth + Math.sin(t * 0.7 + i) * 3.5,
    };
  };

  // a floating hexagonal light-platform (isometric, squashed) with an icon
  const platform = (ctx: Ctx, x: number, y: number, s: number, wake: number, color: string, a: number, icon: number, t: number) => {
    ctx.save();
    ctx.globalAlpha = a;
    // side extrusion (depth)
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const ang = (k * 60 + 30) * Math.PI / 180;
      const px = x + Math.cos(ang) * s, py = y + Math.sin(ang) * s * 0.5;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(20,26,38,0.85)`;
    ctx.fill();
    // glowing top rim
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.shadowColor = color; ctx.shadowBlur = 6 + wake * 14;
    ctx.stroke();
    ctx.shadowBlur = 0;
    // circuit lines that light up on wake
    if (wake > 0.05) {
      ctx.globalAlpha = a * wake * 0.6;
      ctx.strokeStyle = color; ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x + s * 0.5, y);
      ctx.moveTo(x, y - s * 0.25); ctx.lineTo(x, y + s * 0.25);
      ctx.stroke();
      // small icon glyph at the platform centre
      ctx.globalAlpha = a * wake;
      ctx.strokeStyle = WHITE_WARM; ctx.fillStyle = WHITE_WARM; ctx.lineWidth = 1;
      if (icon === 0) { ctx.strokeRect(x - 4, y - 4, 8, 8); for (let b = -1; b <= 1; b++) { ctx.beginPath(); ctx.moveTo(x + b * 3, y - 4); ctx.lineTo(x + b * 3, y - 6); ctx.moveTo(x + b * 3, y + 4); ctx.lineTo(x + b * 3, y + 6); ctx.stroke(); } }
      else if (icon === 1) { ctx.beginPath(); ctx.ellipse(x, y - 3, 5, 2, 0, 0, TWO_PI); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 5, y - 3); ctx.lineTo(x - 5, y + 3); ctx.ellipse(x, y + 3, 5, 2, 0, Math.PI, TWO_PI, true); ctx.lineTo(x + 5, y - 3); ctx.stroke(); }
      else if (icon === 2) { for (let d = 0; d < 3; d++) { ctx.beginPath(); ctx.ellipse(x, y - 4 + d * 4, 5, 1.8, 0, 0, TWO_PI); ctx.stroke(); } }
      else if (icon === 3) { ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 5, y - 3); ctx.lineTo(x + 5, y + 2); ctx.quadraticCurveTo(x + 5, y + 5, x, y + 7); ctx.quadraticCurveTo(x - 5, y + 5, x - 5, y + 2); ctx.lineTo(x - 5, y - 3); ctx.closePath(); ctx.stroke(); }
      else { for (let n = 0; n < 3; n++) { const na = n * 2.09 - 1.57; ctx.beginPath(); ctx.arc(x + Math.cos(na) * 5, y + Math.sin(na) * 4, 1.6, 0, TWO_PI); ctx.fill(); } ctx.globalAlpha = a * wake * 0.5; ctx.beginPath(); ctx.arc(x, y, 5, 0, TWO_PI); ctx.stroke(); }
    }
    ctx.restore();
    // pulsing under-glow while awake
    if (wake > 0.1) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 2 + x);
      dot(ctx, x, y + s * 0.5 + 3, s * 0.6, color, a * wake * (0.1 + 0.06 * pulse), 14);
    }
  };

  return {
    build(w, h) {
      W = w; H = h; CX = w / 2; CY = h * 0.46;
      RX = Math.min(w, h) * 0.34; RY = Math.min(w, h) * 0.2;
      S = Math.min(w, h) * 0.06;
      const set = [
        { icon: 0, name: "COMPUTE" }, { icon: 1, name: "DATABASE" },
        { icon: 2, name: "STORAGE" }, { icon: 3, name: "SECURITY" },
        { icon: 4, name: "NETWORK" },
      ];
      plats = set.map((d, i) => ({
        ...d, future: false,
        ang: -Math.PI / 2 + (i / set.length) * TWO_PI,
        rx: RX * (0.9 + (i % 2) * 0.18), ry: RY * (0.9 + ((i + 1) % 2) * 0.16),
        depth: (i % 2) * Math.min(w, h) * 0.03,
      }));
      // two future platforms that emerge during the evolution beat
      plats.push({ icon: 0, name: "SCALE", future: true, ang: -Math.PI / 2 + 0.5, rx: RX * 0.5, ry: RY * 1.5, depth: -Math.min(w, h) * 0.02 });
      plats.push({ icon: 4, name: "EDGE", future: true, ang: Math.PI / 2 + 0.4, rx: RX * 1.25, ry: RY * 0.7, depth: Math.min(w, h) * 0.02 });
      // the connected network (ring + two cross-links)
      bridges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 2], [1, 3]];
    },

    draw(ctx, t, w, h, alpha) {
      if (w !== W || h !== H) this.build(w, h);
      const cx = CX, cy = CY;
      const MIN = Math.min(w, h);

      // ── failure / self-heal / scale timing ───────────────────────────
      const failIdx = 2; // STORAGE goes dark
      const reroute: [number, number] = [1, 4];
      const failDown = clamp01((t - T.fail) / 0.4);   // →1 by 5.4
      const failUp = clamp01((t - T.recover) / 0.5);  // →1 by 7.1
      const failFade = clamp01(failDown - failUp);    // 1 while offline
      // held "oh no" beat: traffic freezes for ~0.5s right after the failure
      const deadBeat =
        clamp01((t - T.fail) / 0.12) * (1 - clamp01((t - (T.fail + 0.5)) / 0.2));
      // traffic envelope: ramps in at OPERATE, dies on the dead-beat, surges on SCALE
      const surge =
        clamp01((t - T.scale) / 0.7) * (1 - clamp01((t - (T.scale + 1.4)) / 0.7));
      const traffic =
        clamp01((t - T.operate) / 0.6) * (1 - 0.9 * deadBeat) * (1 + 0.9 * surge);
      const coreRise = ph(t, T.power, 0.8);

      // ── camera: slow ~3% push-in, gentle drift, a nudge on failure ────
      const push = easeOut(clamp01(t / T.stable)) * 0.03;
      const nudge = t > T.fail ? Math.sin((t - T.fail) * 9) * Math.exp(-(t - T.fail) * 2.5) : 0;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1 + push, 1 + push);
      ctx.translate(-cx, -cy);
      ctx.translate(Math.sin(t * 0.09) * w * 0.006 + nudge * w * 0.02, Math.cos(t * 0.07) * h * 0.006);

      // ── reactive background: floor glow + pulsing rings track traffic ─
      if (coreRise > 0.05) {
        const gI = 0.04 + 0.1 * traffic;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, MIN * 0.6);
        g.addColorStop(0, `rgba(78,168,255,${gI * coreRise * alpha})`);
        g.addColorStop(1, "transparent");
        ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        for (let r = 0; r < 4; r++) {
          const u = (t * 0.14 + r / 4) % 1;
          ring(ctx, cx, cy, u * MIN * 0.5, BLUE, alpha * coreRise * (0.05 + 0.09 * traffic) * (1 - u), 1);
        }
      }

      // ── POWER ON: a blue energy pulse rises from below into the core ──
      const pw = t - T.power;
      if (pw > 0 && pw < 1.0) {
        const u = easeOut(pw), py = cy + (1 - u) * h * 0.5;
        for (let s = 4; s >= 0; s--) dot(ctx, cx, py + s * 15, 5 - s * 0.6, BLUE, alpha * (1 - pw) * (1 - s * 0.18), 16);
        dot(ctx, cx, py, 6, WHITE_WARM, alpha * (1 - pw * 0.2), 22);
      }

      // ── bridges: build from both ends, then dual-direction liquid light
      const drawBridge = (i: number, j: number, grow: number, a: number, streams: number, colOut: string, colIn: string, live: number) => {
        if (grow <= 0.01) return;
        const A = platPos(i, t), B = platPos(j, t);
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2 - Math.hypot(B.x - A.x, B.y - A.y) * 0.12;
        const bez = (u: number) => ({
          x: (1 - u) * (1 - u) * A.x + 2 * (1 - u) * u * mx + u * u * B.x,
          y: (1 - u) * (1 - u) * A.y + 2 * (1 - u) * u * my + u * u * B.y,
        });
        ctx.save();
        ctx.globalAlpha = a * 0.5; ctx.strokeStyle = grow >= 1 ? colOut : BLUE; ctx.lineWidth = 1.4;
        const half = Math.min(1, grow);
        ctx.beginPath();
        for (let u = 0; u <= half * 0.5; u += 0.05) { const p = bez(u); if (u === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }
        ctx.moveTo(B.x, B.y);
        for (let u = 1; u >= 1 - half * 0.5; u -= 0.05) { const p = bez(u); ctx.lineTo(p.x, p.y); }
        ctx.stroke();
        ctx.restore();
        // liquid-light packets: orange REQUEST i→j, blue RESPONSE j→i (slower),
        // each drawn as a short trail so it reads like plasma in fibre
        if (grow >= 1 && live > 0.02) {
          for (let s = 0; s < streams; s++) {
            const po = (t * (0.34 + 0.12 * ((i + s) % 3)) + s / streams + i * 0.13) % 1;
            for (let tr = 0; tr < 3; tr++) { const p = bez(clamp01(po - tr * 0.05)); dot(ctx, p.x, p.y, 2 - tr * 0.5, colOut, a * live * (0.9 - tr * 0.28), 7); }
            const pi = 1 - ((t * (0.26 + 0.1 * ((j + s) % 3)) + s / streams + j * 0.17) % 1);
            for (let tr = 0; tr < 3; tr++) { const p = bez(clamp01(pi + tr * 0.05)); dot(ctx, p.x, p.y, 1.7 - tr * 0.4, colIn, a * live * (0.65 - tr * 0.2), 6); }
          }
        }
      };

      bridges.forEach((b, k) => {
        const [i, j] = b;
        const grow = ph(t, T.connect + k * 0.16, 0.6);
        let a = alpha;
        if (i === failIdx || j === failIdx) a *= (1 - failFade);
        const busy = 0.5 + 0.5 * Math.sin(t * 1.5 + k);
        const live = traffic * (0.6 + 0.4 * busy);
        drawBridge(i, j, grow, a * (0.7 + 0.3 * busy), grow >= 1 ? 2 : 0, ORANGE, BLUE, live);
      });
      // SELF-HEAL: a green reroute bridge grows while the platform is down and
      // instantly carries the redirected traffic — nothing crashes
      if (failFade > 0.2) {
        drawBridge(reroute[0], reroute[1], easeOut(clamp01((t - T.heal) / 0.5)), alpha * failFade, 3, GREEN, GREEN, traffic * failFade);
      }

      // ── the energy core + power wave ──────────────────────────────────
      const coreY = cy + (1 - coreRise) * MIN * 0.32;
      dot(ctx, cx, coreY, 5 + 2 * Math.sin(t * 3), WHITE_WARM, alpha * (0.4 + 0.6 * coreRise), 18);
      ring(ctx, cx, coreY, 9, ORANGE, alpha * coreRise * 0.8, 1.4);
      const wp = t - (T.power + 0.3);
      if (wp > 0 && wp < 1.2) ring(ctx, cx, cy, easeOut(wp / 1.2) * MIN * 0.55, BLUE, alpha * (1 - wp / 1.2) * 0.7, 2);

      // ── platforms: offline LEDs → radial power-on → breathing glow ────
      const maxDist = Math.hypot(RX * 1.3, RY * 1.3);
      const order = plats.map((_, i) => i).filter((i) => !plats[i].future || t > T.scale)
        .sort((a, b) => platPos(a, t).y - platPos(b, t).y);
      for (const i of order) {
        const p = plats[i];
        const pos = platPos(i, t);
        let a = alpha, wake: number;
        if (p.future) {
          // AUTO-SCALE: new platforms rise from below during the surge
          const em = ph(t, T.scale + 0.2 + (i - 5) * 0.5, 0.7);
          wake = em; a *= em; pos.y += (1 - em) * MIN * 0.12;
        } else {
          // power spreads outward from the core — nearer platforms wake first
          const dist = Math.hypot(pos.x - cx, pos.y - cy);
          wake = ph(t, T.power + 0.25 + (dist / maxDist) * 0.7, 0.5);
          // OFFLINE: only a tiny health LED blinks before the platform wakes
          if (wake < 0.12) {
            const blink = 0.5 + 0.5 * Math.sin(t * 4 + i * 2.1);
            dot(ctx, pos.x, pos.y, 1.3, i % 2 ? RED : AMBER, alpha * 0.3 * blink * (1 - wake * 8), 5);
          }
        }
        // subtle breathing so awake platforms feel powered, never static
        const breath = 0.9 + 0.1 * (0.5 + 0.5 * Math.sin(t * 1.5 + i));
        if (i === failIdx) { a *= (1 - failFade * 0.85); wake *= (1 - failFade); }
        const col = i === failIdx && failFade > 0.3 ? RED : p.future ? CYAN : ORANGE;
        platform(ctx, pos.x, pos.y, S, wake * breath, col, a, p.icon, t);
        // the failed platform's alarm LED
        if (i === failIdx && failFade > 0.3) {
          dot(ctx, pos.x, pos.y, 2, RED, alpha * failFade * (0.5 + 0.5 * Math.sin(t * 9)), 8);
        }
        if (wake > 0.3) {
          ctx.save();
          ctx.globalAlpha = a * wake * 0.7;
          ctx.fillStyle = p.future ? CYAN : AMBER;
          ctx.font = "600 7px ui-monospace, monospace"; ctx.textAlign = "center";
          ctx.fillText(p.name, pos.x, pos.y + S * 0.5 + 14);
          ctx.restore();
        }
      }

      // ── FAILURE alarm ring + RECOVER (self-repair) ring ───────────────
      if (failDown > 0 && failUp < 1 && t - T.fail < 0.8) {
        const pos = platPos(failIdx, t), au = (t - T.fail) / 0.8;
        ring(ctx, pos.x, pos.y, au * 46, RED, alpha * (1 - au) * 0.8, 2);
      }
      if (t > T.recover && t < T.recover + 1.2) {
        const pos = platPos(failIdx, t), ru = (t - T.recover) / 1.2;
        ring(ctx, pos.x, pos.y, ru * 42, GREEN, alpha * (1 - ru) * 0.7, 1.4);
      }

      // ── STABLE: a calm sync pulse keeps rippling through the city ─────
      const evolve = t - T.stable;
      if (evolve > 0) {
        const cyc = evolve % 4;
        if (cyc < 1.4) {
          const ru = cyc / 1.4;
          ring(ctx, cx, cy, easeOut(ru) * MIN * 0.5, "#4EA8FF", alpha * (1 - ru) * 0.25, 1.2);
          plats.forEach((p, i) => {
            if (p.future && t < T.scale) return;
            const pos = platPos(i, t);
            const d = Math.hypot(pos.x - cx, pos.y - cy) / (MIN * 0.5);
            if (Math.abs(ru - d) < 0.08) dot(ctx, pos.x, pos.y, S * 0.5, WHITE_WARM, alpha * 0.4, 12);
          });
        }
      }

      ctx.restore(); // camera
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
        // a small team clusters on the ground at each hub — real talent
        for (let m = 0; m < 3; m++) {
          const ta = (m / 3) * TWO_PI + t * 0.6 + k;
          dot(ctx, p.x + Math.cos(ta) * 6, p.y + Math.sin(ta) * 6, 1.1 * lit, WHITE_WARM, alpha * lit * vis * 0.7, 4);
        }
        // "follow the sun": the active shift travels hub → hub, round the clock
        if (k === Math.floor(t * 0.5) % offices.length && vis > 0.5) {
          const sh = (t * 0.5) % 1;
          ring(ctx, p.x, p.y, 6 + sh * 22, BLUE, alpha * (1 - sh) * 0.6, 1.6);
        }
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

      // ── the meaningful message: captions tell the GCC story as it builds,
      //    and a headcount climbs to prove it is built to scale ──
      const CAPS = [
        { s: 1.6, e: 3.2, text: "STANDING UP YOUR GCC" },
        { s: 3.2, e: 4.8, text: "GLOBAL TALENT HUBS ONLINE" },
        { s: 4.8, e: 6.4, text: "ONE 24/7 OPERATION" },
        { s: 6.4, e: 8.0, text: "AI-POWERED WORKFLOWS & ANALYTICS" },
        { s: 8.0, e: 99, text: "BUILT TO SCALE" },
      ];
      ctx.save();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const c of CAPS) {
        const inn = clamp01((t - c.s) / 0.5);
        const out = c.e > 90 ? 0 : clamp01((t - (c.e - 0.5)) / 0.5);
        const ca = inn * (1 - out);
        if (ca <= 0.01) continue;
        ctx.globalAlpha = alpha * ca * 0.92;
        ctx.fillStyle = AMBER; ctx.font = "700 12px ui-monospace, monospace";
        ctx.fillText(c.text, cx, cy + R + 34);
      }
      // headcount that climbs during the scale beat — teams built to scale
      const gccScale = ph(t, 8.0, 0.6);
      if (gccScale > 0) {
        const heads = Math.min(480, Math.floor(clamp01((t - 8.0) / 3) * 480));
        ctx.globalAlpha = alpha * gccScale;
        ctx.fillStyle = GREEN; ctx.font = "700 13px ui-monospace, monospace";
        ctx.fillText(heads + "+ SPECIALISTS, ONE TEAM", cx, cy + R + 56);
      }
      ctx.restore();
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
    const atmo = createAtmosphere();

    let w = 0, h = 0;
    let raf = 0;
    let current = clamp(activeRef.current);
    let prev = current;
    let fadeStart = -Infinity;
    let currentStart = performance.now();
    let prevStart = currentStart;

    // Chapter transitions are a clean, premium light-sweep layered over the
    // cross-dissolve the render loop already performs (prev scene fades out as
    // the next fades in). No particles. See drawTransition below.

    // A premium light-sweep: a soft luminous band glides across the frame once
    // while the two scenes cross-dissolve underneath, with a brief warm bloom
    // at the centre where the new scene forms. Clean and cinematic — no dots.
    const drawTransition = (now: number) => {
      const T = (now - fadeStart) / 1000;
      const DUR = 1.0;
      if (T < 0 || T > DUR) return;
      const u = clamp01(T / DUR);
      const e = easeOut(u);
      const fade = Math.sin(u * Math.PI); // rises then falls over the sweep

      // 1) a soft diagonal band of warm light travelling left → right
      const bandW = w * 0.55;
      const cxb = -bandW + (w + bandW * 2) * e;
      const grad = ctx.createLinearGradient(cxb - bandW, 0, cxb + bandW, 0);
      grad.addColorStop(0, "rgba(255,167,88,0)");
      grad.addColorStop(0.5, `rgba(255,184,120,${0.16 * fade})`);
      grad.addColorStop(1, "rgba(255,167,88,0)");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // 2) a thin bright leading edge riding the sweep
      ctx.save();
      ctx.globalAlpha = 0.45 * fade;
      ctx.strokeStyle = "#FFE3A3";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = AMBER;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(cxb + bandW * 0.5, -20);
      ctx.lineTo(cxb + bandW * 0.5 - 40, h + 20); // slight diagonal lean
      ctx.stroke();
      ctx.restore();

      // 3) a brief warm bloom where the next scene forms (peaks early)
      const bloom = Math.sin(clamp01(u / 0.55) * Math.PI);
      if (bloom > 0.01) {
        const g = ctx.createRadialGradient(w / 2, h * 0.47, 0, w / 2, h * 0.47, Math.min(w, h) * 0.55);
        g.addColorStop(0, `rgba(255,150,70,${0.12 * bloom})`);
        g.addColorStop(1, "transparent");
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
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
      }
      const f = Math.min(1, (now - fadeStart) / FADE_MS);

      ctx.clearRect(0, 0, w, h);
      drawBg();

      const gt = now / 1000; // continuous clock for the atmosphere layers
      // depth behind the scene, before the push-in so it parallaxes
      atmo.back(ctx, gt, w, h);

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

      // lighting + foreground framing over the scene
      atmo.front(ctx, gt, w, h);

      // the swarm lives between worlds — above the frame
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
        atmo.back(ctx, 8, w, h);
        scenes[current].draw(ctx, 8, w, h, 1);
        atmo.front(ctx, 8, w, h);
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
