"use client";

import { useEffect, useRef } from "react";

// Ordered scroll sections and the ambient accent each one "powers on". The
// background eases toward wherever you are and blends between neighbouring
// sections, so scrolling reads like travelling through one connected world
// rather than flipping between separate pages. Warm hero → cool mid → warm CTA.
const SECTIONS: { id: string; rgb: [number, number, number] }[] = [
  { id: "top", rgb: [255, 138, 61] }, // Hero — orange
  { id: "experience", rgb: [255, 120, 70] }, // Services — warm ember
  { id: "industries", rgb: [78, 168, 255] }, // Industries — blue
  { id: "stack", rgb: [46, 211, 183] }, // Tech stack — teal
  { id: "contact", rgb: [251, 90, 56] }, // CTA — ember
  { id: "testimonials", rgb: [255, 199, 106] }, // Reviews — gold
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

// ── Changing environments ────────────────────────────────────────────────
// The canvas no longer paints one repeating motif everywhere. Instead it walks
// through eight distinct "worlds" as you scroll the page top→bottom, cross-
// fading between neighbours so the terrain is always quietly shifting. Every
// motif is drawn at a near-invisible 3–8% ceiling — depth you feel more than
// see — and tinted by the same section accent the wash uses, so the whole
// field still reads as one connected place.
//   0 Neural network   4 AI blueprint
//   1 Data center      5 Floating holograms
//   2 Digital grid     6 Binary rain
//   3 Particle universe 7 Glass reflections
const ENV_COUNT = 8;

type NeuralNode = { x: number; y: number; vx: number; vy: number };
type UniStar = { x: number; y: number; z: number; ph: number; sp: number };
type Holo = {
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  ph: number;
};
type Rack = { x: number; w: number; y0: number; y1: number; seed: number };
type EnvState = {
  neural: NeuralNode[];
  stars: UniStar[];
  holos: Holo[];
  racks: Rack[];
};

// Persistent whole-site backdrop — fixed to the viewport so it stays put while
// every section scrolls over it. Section-aware colour + scroll-aware terrain:
// its glow orbs and aurora ease toward the active section's accent, while the
// canvas morphs through eight environments across the length of the page.
export default function SiteAmbientBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let raf = 0;
    const env: EnvState = { neural: [], stars: [], holos: [], racks: [] };

    // interactive mouse light — eased so it trails the cursor softly
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const mouse = { x: 50, y: 42, tx: 50, ty: 42 };
    // pixel-space cursor for the reactive neural network — the canvas is a
    // full-viewport overlay, so clientX/Y map straight to its CSS coords
    const cursor = { x: -999, y: -999, active: false };
    const CURSOR_R = 190; // how far the pointer's pull reaches
    const CURSOR_LINK = 160; // how far links form toward the pointer

    // eased "current" accent + intensity + scroll position, and their targets
    const cur = { r: 255, g: 138, b: 61, i: 0.85, p: 0 };
    const target = { r: 255, g: 138, b: 61, i: 0.85, p: 0 };
    let dirty = true; // recompute target on the next frame

    const isDark = () =>
      document.documentElement.getAttribute("data-theme") === "dark";
    // the light "warm ivory" theme wants a far quieter wash than dark navy
    let themeMul = isDark() ? 0.3 : 0.16;

    // How far down the whole document are we? Drives which environments show.
    const computeScrollP = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      target.p = maxScroll > 0 ? clamp01(window.scrollY / maxScroll) : 0;
    };

    // Which section (blended) is the viewport centred on? Returns the eased
    // accent + an intensity that peaks at a section's centre and dips midway
    // between two sections — the "active is bright, seams are calm" feel.
    const computeTarget = () => {
      computeScrollP();
      const secs = SECTIONS.map((s) => ({
        s,
        el: document.getElementById(s.id),
      })).filter((x) => x.el);
      if (!secs.length) return;
      const vp = window.scrollY + window.innerHeight / 2;
      const centers = secs.map((x) => {
        const r = x.el!.getBoundingClientRect();
        return r.top + window.scrollY + r.height / 2;
      });

      let rgb: [number, number, number];
      let focus: number;
      if (vp <= centers[0]) {
        rgb = secs[0].s.rgb;
        focus = 1;
      } else if (vp >= centers[centers.length - 1]) {
        rgb = secs[secs.length - 1].s.rgb;
        focus = 1;
      } else {
        let i = 0;
        while (i < centers.length - 1 && vp > centers[i + 1]) i++;
        const t = clamp01((vp - centers[i]) / (centers[i + 1] - centers[i]));
        const a = secs[i].s.rgb;
        const b = secs[i + 1].s.rgb;
        rgb = [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
        // 1 at either section centre, ~0.7 at the midpoint between them
        focus = 0.7 + 0.3 * (1 - 2 * Math.min(t, 1 - t));
      }
      target.r = rgb[0];
      target.g = rgb[1];
      target.b = rgb[2];
      target.i = focus * themeMul;
    };

    const applyVars = () => {
      root.style.setProperty("--amb-r", `${Math.round(cur.r)}`);
      root.style.setProperty("--amb-g", `${Math.round(cur.g)}`);
      root.style.setProperty("--amb-b", `${Math.round(cur.b)}`);
      root.style.setProperty("--amb-i", cur.i.toFixed(3));
    };

    function seed() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 0 · Neural network — drifting nodes that wire up when close
      env.neural = Array.from({ length: 30 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
      }));
      // 3 · Particle universe — depth-sorted stars drifting up with parallax
      env.stars = Array.from({ length: 150 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random(), // 0 far/tiny/slow → 1 near/big/faster
        ph: Math.random() * Math.PI * 2,
        sp: 0.4 + Math.random() * 1.4,
      }));
      // 5 · Floating holograms — a few translucent wireframe panels rising
      env.holos = Array.from({ length: 5 }, () => {
        const w = 90 + Math.random() * 150;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          w,
          h: w * (0.5 + Math.random() * 0.35),
          vy: 0.05 + Math.random() * 0.08,
          ph: Math.random() * Math.PI * 2,
        };
      });
      // 1 · Data center — evenly spaced server-rack columns
      const cols = Math.max(4, Math.round(width / 150));
      const gap = width / cols;
      env.racks = Array.from({ length: cols }, (_, i) => {
        const w = gap * (0.34 + Math.random() * 0.12);
        const top = height * (0.1 + Math.random() * 0.12);
        return {
          x: gap * (i + 0.5) - w / 2,
          w,
          y0: top,
          y1: height * (0.82 + Math.random() * 0.1),
          seed: Math.random() * 1000,
        };
      });
    }

    // ── Environment renderers ─────────────────────────────────────────────
    // Each paints one motif into the canvas at the given weight (its cross-fade
    // share, 0–1). `a` is a helper that turns a peak opacity into the final
    // alpha, folding in the fade weight and a lighter ceiling for light theme.
    function accentStr() {
      return `${Math.round(cur.r)},${Math.round(cur.g)},${Math.round(cur.b)}`;
    }

    function drawNeural(now: number, a: (peak: number) => number) {
      const accent = accentStr();
      const LINK = 150;
      for (const n of env.neural) {
        n.x += n.vx;
        n.y += n.vy;
        // mouse-reactive: nodes within reach gently gather toward the cursor,
        // so the neural field "leans in" as you move — reads as the system
        // thinking. A direct positional nudge (not velocity) stays stable and
        // lets nodes resume drifting the instant the cursor leaves.
        if (cursor.active) {
          const dx = cursor.x - n.x;
          const dy = cursor.y - n.y;
          const d = Math.hypot(dx, dy);
          if (d < CURSOR_R && d > 24) {
            const pull = (1 - d / CURSOR_R) * 0.7;
            n.x += (dx / d) * pull;
            n.y += (dy / d) * pull;
          }
        }
        if (n.x < -20) n.x = width + 20;
        if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20;
        if (n.y > height + 20) n.y = -20;
      }
      ctx!.lineWidth = 1;
      for (let i = 0; i < env.neural.length; i++) {
        for (let j = i + 1; j < env.neural.length; j++) {
          const p = env.neural[i];
          const q = env.neural[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx!.strokeStyle = `rgba(${accent},${a(0.05) * (1 - d / LINK)})`;
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(q.x, q.y);
            ctx!.stroke();
          }
        }
      }
      // brighter links from nearby nodes to the pointer + a soft node on it
      if (cursor.active) {
        for (const n of env.neural) {
          const d = Math.hypot(n.x - cursor.x, n.y - cursor.y);
          if (d < CURSOR_LINK) {
            ctx!.strokeStyle = `rgba(${accent},${a(0.12) * (1 - d / CURSOR_LINK)})`;
            ctx!.beginPath();
            ctx!.moveTo(n.x, n.y);
            ctx!.lineTo(cursor.x, cursor.y);
            ctx!.stroke();
          }
        }
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(${accent},${a(0.14)})`;
        ctx!.arc(cursor.x, cursor.y, 2.2, 0, Math.PI * 2);
        ctx!.fill();
      }
      for (const n of env.neural) {
        // a signal pulse breathing along each node
        const tw = 0.6 + 0.4 * Math.sin(now * 1.3 + n.x * 0.01);
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(${accent},${a(0.07) * tw})`;
        ctx!.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function drawDataCenter(now: number, a: (peak: number) => number) {
      const accent = accentStr();
      for (const r of env.racks) {
        ctx!.strokeStyle = `rgba(${accent},${a(0.05)})`;
        ctx!.lineWidth = 1;
        ctx!.strokeRect(r.x, r.y0, r.w, r.y1 - r.y0);
        // stacked server-unit dividers
        const units = 14;
        const uh = (r.y1 - r.y0) / units;
        for (let u = 1; u < units; u++) {
          const y = r.y0 + u * uh;
          ctx!.strokeStyle = `rgba(${accent},${a(0.03)})`;
          ctx!.beginPath();
          ctx!.moveTo(r.x, y);
          ctx!.lineTo(r.x + r.w, y);
          ctx!.stroke();
          // a couple of blinking status LEDs per unit
          const blink = 0.5 + 0.5 * Math.sin(now * 3 + r.seed + u * 1.7);
          ctx!.fillStyle = `rgba(${accent},${a(0.08) * blink})`;
          ctx!.beginPath();
          ctx!.arc(r.x + 5, y - uh * 0.5, 1.1, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
    }

    function drawGrid(now: number, a: (peak: number) => number) {
      const accent = accentStr();
      const horizon = height * 0.44;
      const vpx = width / 2;
      ctx!.lineWidth = 1;
      // receding floor lines scrolling toward the viewer
      const rows = 16;
      const scroll = (now * 0.05) % 1;
      for (let k = 0; k < rows; k++) {
        const f = (k + scroll) / rows; // 0 at horizon → 1 at bottom
        const y = horizon + (height - horizon) * (f * f);
        ctx!.strokeStyle = `rgba(${accent},${a(0.05) * f})`;
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(width, y);
        ctx!.stroke();
      }
      // verticals converging to the vanishing point
      const spread = 10;
      for (let k = -spread; k <= spread; k++) {
        const bx = vpx + (k / spread) * width * 0.9;
        ctx!.strokeStyle = `rgba(${accent},${a(0.045)})`;
        ctx!.beginPath();
        ctx!.moveTo(vpx + (k / spread) * width * 0.06, horizon);
        ctx!.lineTo(bx, height);
        ctx!.stroke();
      }
    }

    function drawUniverse(now: number, a: (peak: number) => number) {
      const dark = isDark();
      const rgb = dark ? "255,244,224" : "120,110,100";
      for (const s of env.stars) {
        s.y -= (0.04 + s.z * 0.14) * 0.6; // gentle upward drift, parallax by depth
        if (s.y < -4) {
          s.y = height + 4;
          s.x = Math.random() * width;
        }
        const tw = 0.5 + 0.5 * Math.sin(now * s.sp + s.ph);
        const r = 0.4 + s.z * 1.8;
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(${rgb},${a(0.06) * (0.35 + tw * 0.65) * (0.4 + s.z)})`;
        ctx!.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function drawBlueprint(now: number, a: (peak: number) => number) {
      const accent = accentStr();
      ctx!.lineWidth = 1;
      const anchors = [
        { x: width * 0.24, y: height * 0.32 },
        { x: width * 0.78, y: height * 0.66 },
      ];
      anchors.forEach((c, idx) => {
        const rot = now * 0.12 * (idx ? -1 : 1);
        // concentric reticle rings
        for (let ri = 1; ri <= 3; ri++) {
          ctx!.strokeStyle = `rgba(${accent},${a(0.05)})`;
          ctx!.beginPath();
          ctx!.arc(c.x, c.y, 34 * ri, 0, Math.PI * 2);
          ctx!.stroke();
        }
        // rotating crosshair ticks
        ctx!.strokeStyle = `rgba(${accent},${a(0.06)})`;
        for (let t = 0; t < 8; t++) {
          const ang = rot + (t / 8) * Math.PI * 2;
          const r0 = 108;
          const r1 = 122;
          ctx!.beginPath();
          ctx!.moveTo(c.x + Math.cos(ang) * r0, c.y + Math.sin(ang) * r0);
          ctx!.lineTo(c.x + Math.cos(ang) * r1, c.y + Math.sin(ang) * r1);
          ctx!.stroke();
        }
      });
      // dashed schematic trace linking the two anchors
      ctx!.strokeStyle = `rgba(${accent},${a(0.045)})`;
      ctx!.setLineDash([6, 8]);
      ctx!.beginPath();
      ctx!.moveTo(anchors[0].x, anchors[0].y);
      ctx!.lineTo(anchors[0].x, anchors[1].y);
      ctx!.lineTo(anchors[1].x, anchors[1].y);
      ctx!.stroke();
      ctx!.setLineDash([]);
    }

    function drawHolograms(now: number, a: (peak: number) => number) {
      const accent = accentStr();
      for (const h of env.holos) {
        h.y -= h.vy;
        if (h.y + h.h < 0) h.y = height + h.h;
        // fake 3D tilt: horizontal squash breathing over time
        const squash = 0.55 + 0.45 * Math.abs(Math.sin(now * 0.5 + h.ph));
        const w = h.w * squash;
        const x = h.x - w / 2;
        ctx!.save();
        ctx!.strokeStyle = `rgba(${accent},${a(0.06)})`;
        ctx!.lineWidth = 1;
        ctx!.strokeRect(x, h.y, w, h.h);
        // corner ticks
        const t = 8;
        ctx!.beginPath();
        ctx!.moveTo(x, h.y + t);
        ctx!.lineTo(x, h.y);
        ctx!.lineTo(x + t, h.y);
        ctx!.moveTo(x + w - t, h.y + h.h);
        ctx!.lineTo(x + w, h.y + h.h);
        ctx!.lineTo(x + w, h.y + h.h - t);
        ctx!.stroke();
        // interior scan lines
        ctx!.strokeStyle = `rgba(${accent},${a(0.03)})`;
        for (let s = 1; s < 4; s++) {
          const yy = h.y + (h.h * s) / 4;
          ctx!.beginPath();
          ctx!.moveTo(x, yy);
          ctx!.lineTo(x + w, yy);
          ctx!.stroke();
        }
        ctx!.restore();
      }
    }

    function drawBinaryRain(now: number, a: (peak: number) => number) {
      const accent = accentStr();
      const step = 15;
      const cols = Math.ceil(width / step);
      ctx!.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx!.textBaseline = "top";
      for (let c = 0; c < cols; c++) {
        const x = c * step + 2;
        const speed = 26 + ((c * 37) % 30);
        const span = height + 240;
        const head = ((now * speed + c * 53) % span) - 120;
        const trail = 12;
        for (let k = 0; k < trail; k++) {
          const y = head - k * step;
          if (y < -step || y > height) continue;
          // deterministic flicker so glyphs feel alive without per-frame RNG
          const bit = (((c * 31 + Math.floor(y / step) * 17) ^
            Math.floor(now * 3)) &
            1) as 0 | 1;
          const fade = 1 - k / trail;
          ctx!.fillStyle = `rgba(${accent},${a(0.07) * fade * fade})`;
          ctx!.fillText(bit ? "1" : "0", x, y);
        }
      }
    }

    function drawGlass(now: number, a: (peak: number) => number) {
      // broad specular streaks sweeping diagonally, like light across glass
      const streaks = 3;
      for (let s = 0; s < streaks; s++) {
        const period = 14 + s * 5;
        const prog = ((now / period + s * 0.37) % 1) * 1.5 - 0.25; // -0.25→1.25
        const cx = prog * width;
        const bandW = width * 0.26;
        const grad = ctx!.createLinearGradient(
          cx - bandW,
          0,
          cx + bandW,
          height,
        );
        const peak = a(0.05);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.5, `rgba(255,255,255,${peak})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx!.save();
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        // a slanted parallelogram band
        ctx!.moveTo(cx - bandW, 0);
        ctx!.lineTo(cx + bandW, 0);
        ctx!.lineTo(cx + bandW + width * 0.14, height);
        ctx!.lineTo(cx - bandW + width * 0.14, height);
        ctx!.closePath();
        ctx!.fill();
        ctx!.restore();
      }
    }

    const RENDERERS = [
      drawNeural,
      drawDataCenter,
      drawGrid,
      drawUniverse,
      drawBlueprint,
      drawHolograms,
      drawBinaryRain,
      drawGlass,
    ];

    function draw(ease: number) {
      if (dirty) {
        computeTarget();
        dirty = false;
      }
      // ease the accent + intensity + scroll position toward their targets
      cur.r += (target.r - cur.r) * ease;
      cur.g += (target.g - cur.g) * ease;
      cur.b += (target.b - cur.b) * ease;
      cur.i += (target.i - cur.i) * ease;
      cur.p += (target.p - cur.p) * ease;
      // ease the mouse light toward the cursor
      mouse.x += (mouse.tx - mouse.x) * Math.min(1, ease * 3);
      mouse.y += (mouse.ty - mouse.y) * Math.min(1, ease * 3);
      applyVars();
      root!.style.setProperty("--mx", `${mouse.x.toFixed(2)}%`);
      root!.style.setProperty("--my", `${mouse.y.toFixed(2)}%`);

      const now = performance.now() * 0.001;
      ctx!.clearRect(0, 0, width, height);

      const dark = isDark();
      const ceiling = dark ? 1 : 0.62; // light theme keeps it even quieter

      // Walk the eight environments across the page: only the current motif and
      // its neighbour are ever painted, cross-fading as you scroll between them.
      const pos = cur.p * (ENV_COUNT - 1);
      const i = Math.min(ENV_COUNT - 2, Math.floor(pos));
      const t = clamp01(pos - i);
      const pairs: [number, number][] = [
        [i, 1 - t],
        [i + 1, t],
      ];
      for (const [idx, w] of pairs) {
        if (w < 0.01) continue;
        // fold the section focus in so seams stay calm and centres glow
        const mul = w * ceiling * (0.55 + 0.6 * cur.i);
        RENDERERS[idx](now, (peak) => peak * mul);
      }
    }

    function loop() {
      draw(0.05);
      raf = requestAnimationFrame(loop);
    }

    seed();
    if (reduceMotion) {
      // no perpetual motion; snap accent + scroll pos and paint one frame
      const snap = () => {
        dirty = true;
        computeTarget();
        cur.r = target.r;
        cur.g = target.g;
        cur.b = target.b;
        cur.i = target.i;
        cur.p = target.p;
        dirty = false;
        draw(1);
      };
      snap();
      window.addEventListener("scroll", snap, { passive: true });
      const onResizeR = () => {
        seed();
        snap();
      };
      window.addEventListener("resize", onResizeR);
      const moR = new MutationObserver(() => {
        themeMul = isDark() ? 0.3 : 0.16;
        snap();
      });
      moR.observe(document.documentElement, { attributeFilter: ["data-theme"] });
      return () => {
        window.removeEventListener("scroll", snap);
        window.removeEventListener("resize", onResizeR);
        moR.disconnect();
      };
    }

    loop();

    const onScroll = () => {
      dirty = true;
    };
    const onResize = () => {
      seed();
      dirty = true;
    };
    const onMouse = (e: MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth) * 100;
      mouse.ty = (e.clientY / window.innerHeight) * 100;
      cursor.x = e.clientX;
      cursor.y = e.clientY;
      cursor.active = true;
    };
    // stop pulling nodes when the cursor leaves the window
    const onLeave = () => {
      cursor.active = false;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    if (finePointer) {
      window.addEventListener("mousemove", onMouse, { passive: true });
      document.addEventListener("mouseleave", onLeave);
      window.addEventListener("blur", onLeave);
    }
    const mo = new MutationObserver(() => {
      themeMul = isDark() ? 0.3 : 0.16;
      dirty = true;
    });
    mo.observe(document.documentElement, { attributeFilter: ["data-theme"] });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-0 -z-30 overflow-hidden bg-(--background) transition-colors duration-[450ms]"
      style={
        {
          "--amb-r": "255",
          "--amb-g": "138",
          "--amb-b": "61",
          "--amb-i": "0.85",
          "--mx": "50%",
          "--my": "42%",
        } as React.CSSProperties
      }
    >
      {/* Layer 0: very subtle line grid — enterprise depth cue (≈4% opacity) */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 90% 70% at 50% 30%, black, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 70% at 50% 30%, black, transparent 80%)",
        }}
      />

      {/* Layer 1: broad accent wash — eases to the active section's colour */}
      <div
        className="site-wash absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 22% 16%, rgb(var(--amb-r) var(--amb-g) var(--amb-b) / calc(0.15 * var(--amb-i))), transparent 63%), radial-gradient(ellipse 55% 45% at 82% 84%, rgb(var(--amb-r) var(--amb-g) var(--amb-b) / calc(0.09 * var(--amb-i))), transparent 60%)",
        }}
      />

      {/* Layer 2: a brighter accent orb near the top-right focal area */}
      <div
        className="site-wash absolute inset-0 blur-2xl [animation-delay:-11s]"
        style={{
          background:
            "radial-gradient(circle at 76% 20%, rgb(var(--amb-r) var(--amb-g) var(--amb-b) / calc(0.12 * var(--amb-i))), transparent 34%)",
        }}
      />

      {/* Layer 3: slow aurora sweep in the active accent. Taller than the
          old 70% band and dissolved with a vertical mask — the band's hard
          bottom edge used to park at ~60% of the viewport, reading as a
          "background colour cut" wherever a section boundary crossed it. */}
      <div
        className="site-aurora absolute -inset-x-1/4 top-[-10%] h-[95%] blur-3xl"
        style={{
          background:
            "linear-gradient(100deg, transparent 12%, rgb(var(--amb-r) var(--amb-g) var(--amb-b) / calc(0.13 * var(--amb-i))) 44%, transparent 88%)",
          maskImage:
            "linear-gradient(to bottom, black 30%, transparent 96%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 30%, transparent 96%)",
        }}
      />

      {/* Cinematic light rays — 3 soft accent beams sweeping at different
          speeds/angles, like hidden spotlights behind the scene */}
      {(
        [
          { a: "16deg", d: "22s", delay: "0s", left: "8%", w: "26%" },
          { a: "-12deg", d: "30s", delay: "-8s", left: "44%", w: "30%" },
          { a: "22deg", d: "26s", delay: "-15s", left: "70%", w: "24%" },
        ] as const
      ).map((r, i) => (
        <div
          key={i}
          className="site-ray absolute -top-[20%] h-[140%] blur-2xl"
          style={
            {
              left: r.left,
              width: r.w,
              "--ray-a": r.a,
              "--ray-d": r.d,
              animationDelay: r.delay,
              background:
                "linear-gradient(90deg, transparent, rgb(var(--amb-r) var(--amb-g) var(--amb-b) / calc(0.28 * var(--amb-i))), transparent)",
            } as React.CSSProperties
          }
        />
      ))}

      {/* Thin holographic fog drifting across the field — masked top/bottom
          so the band's edges dissolve instead of cutting at fixed viewport
          heights */}
      <div
        className="site-fog absolute -inset-x-[10%] top-[25%] h-[55%] blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 50%, rgb(var(--amb-r) var(--amb-g) var(--amb-b) / calc(0.05 * var(--amb-i))), transparent 70%)",
          maskImage:
            "linear-gradient(to bottom, transparent, black 25%, black 70%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 25%, black 70%, transparent)",
        }}
      />

      {/* Changing environments — canvas morphs through eight motifs as you
          scroll (neural net → data center → grid → universe → blueprint →
          holograms → binary rain → glass), each held at a 3–8% ceiling */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Interactive mouse light — a soft radial glow trailing the cursor */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(520px circle at var(--mx) var(--my), rgb(var(--amb-r) var(--amb-g) var(--amb-b) / 0.06), transparent 70%)",
        }}
      />

      {/* Layer 6: film-grain noise, on top so it reads across everything else */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "140px 140px",
        }}
      />
    </div>
  );
}
