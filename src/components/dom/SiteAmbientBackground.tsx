"use client";

import { useEffect, useRef } from "react";

type Particle = { x: number; y: number; vx: number; vy: number; r: number };
type Star = {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  amp: number;
};
// Cinematic dust: near-invisible motes drifting at random. Depth drives size,
// speed, and alpha (foreground bigger/faster, background tiny/slow) → real depth.
type Dust = { x: number; y: number; vx: number; vy: number; d: number };

const PARTICLE_COUNT = 40;
const STAR_COUNT = 90;
const DUST_COUNT = 34;
const LINK_DIST = 140;

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

// Persistent whole-site backdrop — fixed to the viewport so it stays put while
// every section scrolls over it. Section-aware: its glow orbs, aurora sweep,
// and particle links continuously ease toward the active section's accent and
// brighten near a section's centre, dimming at the seams between sections.
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
    let particles: Particle[] = [];
    let stars: Star[] = [];
    let dust: Dust[] = [];
    let raf = 0;

    // interactive mouse light — eased so it trails the cursor softly
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const mouse = { x: 50, y: 42, tx: 50, ty: 42 };

    // eased "current" accent + intensity, and the scroll-derived target
    const cur = { r: 255, g: 138, b: 61, i: 0.85 };
    const target = { r: 255, g: 138, b: 61, i: 0.85 };
    let dirty = true; // recompute target on the next frame

    const isDark = () =>
      document.documentElement.getAttribute("data-theme") === "dark";
    // the light "warm ivory" theme wants a far quieter wash than dark navy
    let themeMul = isDark() ? 0.3 : 0.16;

    // Which section (blended) is the viewport centred on? Returns the eased
    // accent + an intensity that peaks at a section's centre and dips midway
    // between two sections — the "active is bright, seams are calm" feel.
    const computeTarget = () => {
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

      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: 0.7 + Math.random(),
      }));
      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.4 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.4,
        amp: 0.2 + Math.random() * 0.5,
      }));
      dust = Array.from({ length: DUST_COUNT }, () => {
        const d = Math.random(); // 0 = far/tiny/slow, 1 = near/big/faster
        const sp = 0.06 + d * 0.16;
        const a = Math.random() * Math.PI * 2;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 0.03, // a gentle overall upward drift
          d,
        };
      });
    }

    function draw(ease: number) {
      if (dirty) {
        computeTarget();
        dirty = false;
      }
      // ease the accent + intensity toward the active section
      cur.r += (target.r - cur.r) * ease;
      cur.g += (target.g - cur.g) * ease;
      cur.b += (target.b - cur.b) * ease;
      cur.i += (target.i - cur.i) * ease;
      // ease the mouse light toward the cursor
      mouse.x += (mouse.tx - mouse.x) * Math.min(1, ease * 3);
      mouse.y += (mouse.ty - mouse.y) * Math.min(1, ease * 3);
      applyVars();
      root!.style.setProperty("--mx", `${mouse.x.toFixed(2)}%`);
      root!.style.setProperty("--my", `${mouse.y.toFixed(2)}%`);

      const now = performance.now() * 0.001;
      ctx!.clearRect(0, 0, width, height);

      const dark = isDark();
      const starRgb = dark ? "255,240,220" : "120,113,108";
      const starScale = dark ? 0.4 : 0.22;
      const accent = `${Math.round(cur.r)},${Math.round(cur.g)},${Math.round(cur.b)}`;
      // links + particles carry the section accent, brightened by focus
      const linkScale = (dark ? 0.1 : 0.06) * (0.5 + cur.i);
      const partAlpha = (dark ? 0.22 : 0.13) * (0.5 + cur.i);

      for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(now * s.speed + s.phase);
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(${starRgb},${(0.1 + tw * s.amp) * starScale})`;
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }

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
            ctx!.strokeStyle = `rgba(${accent},${(1 - dist / LINK_DIST) * linkScale})`;
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
        ctx!.fillStyle = `rgba(${accent},${partAlpha})`;
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      // cinematic dust — warm-white motes, depth-sorted, barely-there
      const dustRgb = dark ? "255,244,224" : "120,110,100";
      for (const m of dust) {
        m.x += m.vx;
        m.y += m.vy;
        if (m.x < -10) m.x = width + 10;
        if (m.x > width + 10) m.x = -10;
        if (m.y < -10) m.y = height + 10;
        if (m.y > height + 10) m.y = -10;
        const r = 0.5 + m.d * 2.1;
        const a = (0.02 + m.d * 0.05) * (0.6 + 0.4 * cur.i);
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(${dustRgb},${a})`;
        ctx!.arc(m.x, m.y, r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function loop() {
      draw(0.05);
      raf = requestAnimationFrame(loop);
    }

    seed();
    if (reduceMotion) {
      // no perpetual motion; snap the accent to the section and paint once
      const snap = () => {
        dirty = true;
        computeTarget();
        cur.r = target.r;
        cur.g = target.g;
        cur.b = target.b;
        cur.i = target.i;
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
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    if (finePointer)
      window.addEventListener("mousemove", onMouse, { passive: true });
    const mo = new MutationObserver(() => {
      themeMul = isDark() ? 0.3 : 0.16;
      dirty = true;
    });
    mo.observe(document.documentElement, { attributeFilter: ["data-theme"] });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
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

      {/* Layer 3: slow aurora sweep in the active accent */}
      <div
        className="site-aurora absolute -inset-x-1/4 top-[-10%] h-[70%] blur-3xl"
        style={{
          background:
            "linear-gradient(100deg, transparent 12%, rgb(var(--amb-r) var(--amb-g) var(--amb-b) / calc(0.13 * var(--amb-i))) 44%, transparent 88%)",
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

      {/* Thin holographic fog drifting across the field */}
      <div
        className="site-fog absolute -inset-x-[10%] top-[30%] h-[45%] blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 50%, rgb(var(--amb-r) var(--amb-g) var(--amb-b) / calc(0.05 * var(--amb-i))), transparent 70%)",
        }}
      />

      {/* Layers 4 + 5: twinkling starfield + drifting accent-tinted particles */}
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
