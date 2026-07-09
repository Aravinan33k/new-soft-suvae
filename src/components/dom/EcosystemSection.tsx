"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { IconType } from "react-icons";
import { TbCpu, TbAward, TbHeartHandshake, TbWorld } from "react-icons/tb";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// "How It Works" — the intelligent-ecosystem section.
//
// Visualizes the message instead of just stating it: a subtle neural mesh
// background, an animated ecosystem diagram (data/systems/workflows nodes
// feeding a pulsing AI core) whose connector lines fan down into the four
// stat cards, glassmorphism cards with count-up gradient numbers, and
// staggered entrance motion.

// `charge` = how far the power dial fills (0–1). Decorative energy level, not
// a percentage — varied per stat so the four dials don't look identical.
const STATS = [
  { value: 400, suffix: "+", label: "AI & Engineering Specialists", icon: TbCpu, charge: 0.92 },
  { value: 13, suffix: "+", label: "Years of Experience", icon: TbAward, charge: 0.72 },
  { value: 150, suffix: "+", label: "Global Clients", icon: TbHeartHandshake, charge: 0.85 },
  { value: 21, suffix: "+", label: "Countries", icon: TbWorld, charge: 0.64 },
];

// deterministic PRNG so the SSR and client renders match
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// faint neural mesh filling the section background (~7% opacity)
function NeuralMesh() {
  const mesh = useMemo(() => {
    const rand = mulberry32(20260704);
    const nodes = Array.from({ length: 30 }, () => ({
      x: rand() * 1200,
      y: rand() * 640,
      r: 1.2 + rand() * 1.8,
    }));
    const links: { x1: number; y1: number; x2: number; y2: number }[] = [];
    nodes.forEach((n, i) => {
      const near = nodes
        .map((m, j) => ({ j, d: (m.x - n.x) ** 2 + (m.y - n.y) ** 2 }))
        .filter((e) => e.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      near.forEach((e) => {
        if (e.j > i) {
          const m = nodes[e.j];
          links.push({ x1: n.x, y1: n.y, x2: m.x, y2: m.y });
        }
      });
    });
    return { nodes, links };
  }, []);

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
      viewBox="0 0 1200 640"
      preserveAspectRatio="xMidYMid slice"
    >
      {mesh.links.map((l, i) => (
        <line
          key={i}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="#FF8A3D"
          strokeWidth="1"
        />
      ))}
      {mesh.nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.r} fill="#FFB057" />
      ))}
      {/* a few drifting sparks */}
      {mesh.links.slice(0, 6).map((l, i) => (
        <circle key={`p${i}`} r="2" fill="#FFCF8A">
          <animateMotion
            dur={`${5 + i * 1.3}s`}
            repeatCount="indefinite"
            path={`M${l.x1},${l.y1} L${l.x2},${l.y2}`}
          />
        </circle>
      ))}
    </svg>
  );
}

// Animated AI workflow (lg screens): an explicit pipeline — INPUT sources
// at the top flow down into the AI BRAIN, which fans out into the four
// stat-card OUTPUTs below. Particles stream through every connector
// continuously (one passes roughly every second).
// four inputs, symmetric about the core (x=400) so they converge evenly and
// then fan back out into exactly four outputs — a balanced funnel
const INPUTS: { x: number; label: string }[] = [
  { x: 130, label: "Data" },
  { x: 310, label: "Systems" },
  { x: 490, label: "Workflows" },
  { x: 670, label: "Teams" },
];
const INPUT_Y = 40;
const CORE = { x: 400, y: 172 };
const FAN_XS = [100, 300, 500, 700];

function EcosystemDiagram() {
  const inPaths = INPUTS.map(
    (s) =>
      `M${s.x},${INPUT_Y} C${s.x},${INPUT_Y + 62} ${CORE.x},${CORE.y - 72} ${CORE.x},${CORE.y - 26}`,
  );
  const outPaths = FAN_XS.map(
    (x) => `M${CORE.x},${CORE.y + 26} C${CORE.x},${CORE.y + 82} ${x},252 ${x},330`,
  );
  return (
    <svg
      aria-hidden
      className="mx-auto hidden w-full max-w-4xl lg:block"
      viewBox="0 0 800 340"
      fill="none"
    >
      <defs>
        {/* volumetric halo that anchors the centre of the composition */}
        <radialGradient id="brainGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF8A3D" stopOpacity="0.42" />
          <stop offset="38%" stopColor="#FF6A3D" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#FF6A3D" stopOpacity="0" />
        </radialGradient>
        {/* Soft Suave mark gradient (same ramp as the brand logo) */}
        <linearGradient id="ssMark" x1="8" y1="0" x2="20" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF9440" />
          <stop offset="0.5" stopColor="#FB5A38" />
          <stop offset="1" stopColor="#F92B4E" />
        </linearGradient>
      </defs>

      {/* stage labels down the left edge */}
      {[
        { y: INPUT_Y, label: "INPUT" },
        { y: CORE.y, label: "AI CORE" },
        { y: 320, label: "PROVEN" },
      ].map((s) => (
        <text
          key={s.label}
          x={14}
          y={s.y + 3}
          fill="#71717a"
          fontSize="9"
          letterSpacing="3"
          fontFamily="inherit"
        >
          {s.label}
        </text>
      ))}

      {/* INPUT nodes + connectors flowing down into the brain */}
      {INPUTS.map((s, i) => (
        <g key={s.label}>
          <path
            d={inPaths[i]}
            stroke="#FF8A3D"
            strokeOpacity="0.3"
            strokeWidth="1"
            strokeDasharray="3 7"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0;-60"
              dur={`${2.6 + i * 0.3}s`}
              repeatCount="indefinite"
            />
          </path>
          {/* two particles per connector, staggered ~1s apart */}
          {[0, 1].map((k) => (
            <circle key={k} r="2.4" fill="#FFCF8A">
              <animateMotion
                dur="2s"
                begin={`${((i * 0.4 + k) % 2).toFixed(1)}s`}
                repeatCount="indefinite"
                path={inPaths[i]}
              />
            </circle>
          ))}
          <circle cx={s.x} cy={INPUT_Y} r="4.5" fill="#131316" stroke="#FF8A3D" strokeOpacity="0.55" />
          <circle cx={s.x} cy={INPUT_Y} r="1.6" fill="#FFB057" />
          <text
            x={s.x}
            y={INPUT_Y - 13}
            textAnchor="middle"
            fill="#a1a1aa"
            fontSize="11"
            fontFamily="inherit"
          >
            {s.label}
          </text>
        </g>
      ))}

      {/* soft halo anchoring the centre (static — calmer) */}
      <circle cx={CORE.x} cy={CORE.y} r="66" fill="url(#brainGlow)" />

      {/* ── the CORE ───────────────────────────────────────────────────
          the Soft Suave mark IS the core — sitting still, softly lit, with a
          single gentle power pulse and one slow subtle ring. The output
          connectors feed from it: the brand as the quiet engine of it all. */}
      <g transform={`translate(${CORE.x} ${CORE.y})`}>
        {/* soft energy field behind the mark */}
        <circle r="32" fill="#FF6A3D" fillOpacity="0.08" />

        {/* the only ring kept: one subtle dotted ring, turning very slowly */}
        <g>
          <circle r="36" fill="none" stroke="#FF8A3D" strokeOpacity="0.26" strokeDasharray="3 9" strokeWidth="1.1" />
          <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="48s" repeatCount="indefinite" />
        </g>

        {/* the SOFT SUAVE MARK — static, softly lit */}
        <g
          transform="translate(-21.7 -25.2) scale(1.4)"
          style={{ filter: "drop-shadow(0 0 6px rgba(255,138,61,0.55))" }}
        >
          <path d="M28.9462 8.28184L15.4679 15.7242L6.22567 10.5576L15.4679 5.39099L20.6667 8.28184L24.7743 6.00607L15.4679 0.839447L0 9.38897V11.6647L13.4141 19.1686V29.4404L4.10766 24.2738V18.5536L0 16.2778V26.5495L15.4679 35.1606L17.5859 33.9919V19.1686L26.8282 14.002V24.2738L21.6936 27.1646V31.7161L31 26.5495V9.38897L28.9462 8.28184Z" fill="url(#ssMark)" />
          <path d="M17.8425 16.0318L30.1013 9.266L28.9461 8.58942L16.6873 15.3552L17.8425 16.0318Z" fill="url(#ssMark)" />
          <path d="M20.6666 6.6822L21.8218 6.06712L17.8425 3.85286L16.6873 4.52944L20.6666 6.6822Z" fill="url(#ssMark)" />
          <path d="M2.63124 25.1347V16.8312L0.320679 15.5396V25.1347L15.4677 33.5612L16.6871 32.9461L2.63124 25.1347Z" fill="url(#ssMark)" />
        </g>
      </g>

      {/* OUTPUT connectors flowing down into the stat cards */}
      {outPaths.map((path, i) => (
        <g key={FAN_XS[i]}>
          <path
            d={path}
            stroke="#FF8A3D"
            strokeOpacity="0.26"
            strokeWidth="1"
            strokeDasharray="3 7"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0;-60"
              dur={`${3 + i * 0.3}s`}
              repeatCount="indefinite"
            />
          </path>
          {[0, 1].map((k) => (
            <circle key={k} r="2.4" fill="#FFCF8A">
              <animateMotion
                dur="2.2s"
                begin={`${((i * 0.5 + k * 1.1) % 2.2).toFixed(1)}s`}
                repeatCount="indefinite"
                path={path}
              />
            </circle>
          ))}
          <circle cx={FAN_XS[i]} cy={332} r="3" fill="#FF8A3D" fillOpacity="0.7" />
        </g>
      ))}
    </svg>
  );
}

// Mobile (and small tablet): the desktop SVG funnel is hidden, so phones get
// a simplified vertical version — input chips flow down a glowing connector
// into a pulsing AI core, then down into the stat cards below. Keeps the
// INPUT → BRAIN → PROVEN story instead of showing bare numbers with no context.
function MobileDiagram() {
  return (
    <div className="mx-auto flex max-w-xs flex-col items-center lg:hidden">
      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.3em] text-(--text-secondary)">
        Input
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {INPUTS.map((s) => (
          <span
            key={s.label}
            className="rounded-full border border-(--brand-orange)/25 bg-(--brand-orange)/10 px-3 py-1 text-xs font-medium text-(--foreground)"
          >
            {s.label}
          </span>
        ))}
      </div>

      {/* connector down into the brain */}
      <span
        aria-hidden
        className="my-3 h-9 w-px bg-gradient-to-b from-(--brand-orange)/60 to-(--brand-orange)/15"
      />

      {/* the AI core — the Soft Suave mark, sitting still and softly lit */}
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-(--brand-orange)/40 bg-(--brand-orange)/10">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-(--brand-orange)/20 blur-md"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/softsuave-mark.svg"
          alt="Soft Suave"
          className="relative h-7 w-7"
        />
      </div>
      <p className="mt-2.5 text-[10px] font-medium uppercase tracking-[0.3em] text-(--brand-orange)">
        AI Core
      </p>

      {/* connector down into the proven-scale cards */}
      <span
        aria-hidden
        className="mt-3 h-9 w-px bg-gradient-to-b from-(--brand-orange)/40 to-(--brand-orange)/10"
      />
    </div>
  );
}

// A stat rendered as a radial POWER DIAL: a ring of ticks charges up to the
// stat's level while the number counts up, and a glowing pip rides the leading
// edge. One eased progress value drives both the dial and the number, so they
// fill in lock-step when the stat scrolls into view.
type StatDialProps = {
  value: number;
  suffix: string;
  label: string;
  icon: IconType;
  charge: number;
  delay: number;
};
function StatDial({ value, suffix, label, icon: Icon, charge, delay }: StatDialProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();
  const [prog, setProg] = useState(0);

  useEffect(() => {
    // reduced-motion shows the fully-charged dial (derived below), no ticking
    if (!inView || reduced) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1700;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start - delay) / dur);
      const e = p <= 0 ? 0 : 1 - Math.pow(1 - p, 3);
      setProg(e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, delay]);

  const p = reduced ? 1 : prog; // reduced-motion: straight to fully charged
  const C = 85; // centre
  const R = 68; // tick ring radius
  const N = 48; // number of ticks
  const level = charge * p; // 0 … charge
  const pipAng = (-90 + level * 360) * (Math.PI / 180);
  const pipX = C + R * Math.cos(pipAng);
  const pipY = C + R * Math.sin(pipAng);
  const num = Math.round(value * p);

  return (
    <div ref={ref} className="relative flex aspect-square w-[168px] items-center justify-center">
      <svg viewBox="0 0 170 170" className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
        {/* faint full track */}
        <circle cx={C} cy={C} r={R - 3} stroke="#FF8A3D" strokeOpacity="0.12" strokeWidth="1" />
        {/* charging ticks — lit up to the current level */}
        {Array.from({ length: N }).map((_, i) => {
          const frac = i / N;
          const ang = (-90 + frac * 360) * (Math.PI / 180);
          const lit = frac <= level + 1e-4;
          const ri = lit ? R - 9 : R - 6;
          return (
            <line
              key={i}
              x1={C + ri * Math.cos(ang)}
              y1={C + ri * Math.sin(ang)}
              x2={C + R * Math.cos(ang)}
              y2={C + R * Math.sin(ang)}
              stroke={lit ? "#FFB057" : "#FF8A3D"}
              strokeOpacity={lit ? 0.95 : 0.18}
              strokeWidth={lit ? 2 : 1.4}
              strokeLinecap="round"
              style={lit ? { filter: "drop-shadow(0 0 3px rgba(255,150,70,0.8))" } : undefined}
            />
          );
        })}
        {/* glowing pip riding the leading edge of the charge */}
        {prog > 0.02 && (
          <circle
            cx={pipX}
            cy={pipY}
            r="4.5"
            fill="#FFE3C2"
            style={{ filter: "drop-shadow(0 0 6px rgba(255,170,90,0.95))" }}
          />
        )}
      </svg>

      {/* centred content: icon, count-up number, label */}
      <div className="relative flex flex-col items-center px-4 text-center">
        <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-(--brand-orange)/30 bg-(--brand-orange)/10 text-(--brand-orange)">
          <Icon className="h-4 w-4" />
        </span>
        <span className="bg-gradient-to-b from-(--brand-orange-soft) via-(--brand-orange) to-(--brand-orange-hover) bg-clip-text text-[32px] font-bold leading-none tracking-tight text-transparent">
          {num}
          {suffix}
        </span>
        <span className="mt-2 max-w-[120px] text-[11px] leading-snug text-(--text-secondary)">
          {label}
        </span>
      </div>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
};

// premium heading reveal: de-blur + letter spacing settling from wide to tight
const headingReveal = {
  hidden: { opacity: 0, y: 24, filter: "blur(10px)", letterSpacing: "0.12em" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    letterSpacing: "-0.025em",
    transition: { duration: 1, ease: "easeOut" as const },
  },
};

export default function EcosystemSection() {
  return (
    <section id="connect" className="relative pt-24 lg:pt-30">
      <NeuralMesh />
      {/* soft glowing orb behind the heading */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-16 h-80 w-80 -translate-x-1/2 rounded-full bg-[#FF6A3D]/[0.13] blur-[110px]"
      />

      <motion.div
        className="relative mx-auto max-w-3xl text-center"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        transition={{ staggerChildren: 0.12 }}
      >
        <motion.p
          variants={fadeUp}
          className="text-xs font-medium uppercase tracking-[0.3em] text-(--brand-orange)"
        >
          How It Works
        </motion.p>
        <motion.h2
          variants={headingReveal}
          className="mt-4 text-3xl font-extrabold text-(--heading) md:text-4xl"
        >
          We connect it all into one{" "}
          <span className="bg-gradient-to-r from-(--brand-orange) via-(--brand-orange-soft) to-(--heading) bg-clip-text text-transparent">
            intelligent ecosystem
          </span>
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="mt-8 text-base leading-relaxed text-(--foreground) md:text-lg"
        >
          Soft Suave links your data, systems, and workflows through AI —
          turning fragmented operations into a single, living network that
          learns, automates, and scales.
        </motion.p>
      </motion.div>

      {/* animated ecosystem feeding the stat cards */}
      <motion.div
        className="relative mt-16 md:mt-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <EcosystemDiagram />
        <MobileDiagram />
      </motion.div>

      <div className="relative mx-auto mt-10 max-w-4xl lg:-mt-2">
        {/* bottom glow behind the cards */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-12 -bottom-20 h-64 bg-[radial-gradient(ellipse_55%_90%_at_50%_100%,rgba(255,106,61,0.1),transparent_70%)]"
        />
        <div className="relative grid grid-cols-2 justify-items-center gap-x-6 gap-y-10 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: "easeOut" }}
            >
              <StatDial
                value={stat.value}
                suffix={stat.suffix}
                label={stat.label}
                icon={stat.icon}
                charge={stat.charge}
                delay={i * 160}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
