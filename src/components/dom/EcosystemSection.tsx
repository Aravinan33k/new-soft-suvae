"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { TbCpu, TbAward, TbHeartHandshake, TbWorld } from "react-icons/tb";

// "How It Works" — the intelligent-ecosystem section.
//
// Visualizes the message instead of just stating it: a subtle neural mesh
// background, an animated ecosystem diagram (data/systems/workflows nodes
// feeding a pulsing AI core) whose connector lines fan down into the four
// stat cards, glassmorphism cards with count-up gradient numbers, and
// staggered entrance motion.

const STATS = [
  { value: 400, suffix: "+", label: "AI & Engineering Specialists", icon: TbCpu },
  { value: 13, suffix: "+", label: "Years of Experience", icon: TbAward },
  { value: 150, suffix: "+", label: "Global Clients", icon: TbHeartHandshake },
  { value: 21, suffix: "+", label: "Countries", icon: TbWorld },
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
const INPUTS: { x: number; label: string }[] = [
  { x: 160, label: "Data" },
  { x: 280, label: "Systems" },
  { x: 400, label: "Workflows" },
  { x: 520, label: "Apps" },
  { x: 640, label: "Teams" },
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
      {/* stage labels down the left edge */}
      {[
        { y: INPUT_Y, label: "INPUT" },
        { y: CORE.y, label: "AI BRAIN" },
        { y: 320, label: "OUTPUT" },
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

      {/* the AI BRAIN: layered core with pulse + rotating dashed ring */}
      <circle cx={CORE.x} cy={CORE.y} r="30" fill="#FF6A3D" fillOpacity="0.1" />
      <circle cx={CORE.x} cy={CORE.y} r="16" stroke="#FF8A3D" strokeOpacity="0.6">
        <animate attributeName="r" values="14;24;14" dur="3s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
      </circle>
      <g>
        <circle
          cx={CORE.x}
          cy={CORE.y}
          r="22"
          stroke="#FFB057"
          strokeOpacity="0.4"
          strokeDasharray="4 9"
          fill="none"
        />
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`0 ${CORE.x} ${CORE.y}`}
          to={`360 ${CORE.x} ${CORE.y}`}
          dur="14s"
          repeatCount="indefinite"
        />
      </g>
      <circle cx={CORE.x} cy={CORE.y} r="9" fill="#FF6A3D" />
      <circle cx={CORE.x} cy={CORE.y} r="4" fill="#FFE3C2">
        <animate attributeName="r" values="3.4;5;3.4" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <text
        x={CORE.x + 36}
        y={CORE.y + 4}
        fill="#FFB057"
        fontSize="10"
        letterSpacing="2"
        fontFamily="inherit"
      >
        AI BRAIN
      </text>

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

// number that counts up from 0 when it scrolls into view
function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1600;
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
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
          className="text-xs font-medium uppercase tracking-[0.3em] text-[#FF8A3D]"
        >
          How It Works
        </motion.p>
        <motion.h2
          variants={headingReveal}
          className="mt-4 text-3xl font-semibold text-white md:text-4xl"
        >
          We connect it all into one{" "}
          <span className="bg-gradient-to-r from-[#FF8A3D] via-[#FFB868] to-white bg-clip-text text-transparent">
            intelligent ecosystem
          </span>
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="mt-8 text-base leading-relaxed text-zinc-400 md:text-lg"
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
      </motion.div>

      <div className="relative mx-auto mt-10 max-w-4xl lg:-mt-2">
        {/* bottom glow behind the cards */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-12 -bottom-20 h-64 bg-[radial-gradient(ellipse_55%_90%_at_50%_100%,rgba(255,106,61,0.1),transparent_70%)]"
        />
        <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: "easeOut" }}
              className="group relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.04] px-6 py-7 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-20px_40px_-30px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-[#FF8A3D]/40 hover:bg-white/[0.06] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_44px_-14px_rgba(0,0,0,0.55),0_0_44px_-8px_rgba(255,138,61,0.4)]"
            >
              {/* top highlight */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
              />
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#FF8A3D]/30 bg-[#FF8A3D]/10 text-[#FFB057] transition-transform duration-300 group-hover:scale-110">
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 bg-gradient-to-b from-[#FFC98A] via-[#FF9440] to-[#FF6A3D] bg-clip-text text-[42px] font-bold leading-none tracking-tight text-transparent">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-3 text-sm leading-snug text-zinc-400">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
