"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { IconType } from "react-icons";
import { FiPlay, FiCheck, FiArrowRight } from "react-icons/fi";
import {
  TbBrain,
  TbSitemap,
  TbDatabase,
  TbCloud,
  TbRocket,
  TbUsersGroup,
  TbRobot,
  TbListSearch,
  TbAffiliate,
  TbBrandOpenai,
  TbBrandAzure,
  TbBrandAws,
  TbVectorTriangle,
  TbSearch,
} from "react-icons/tb";
import {
  SiAnthropic,
  SiGooglegemini,
  SiMeta,
  SiMistralai,
  SiLangchain,
  SiGooglecloud,
  SiQdrant,
  SiDocker,
  SiKubernetes,
  SiVercel,
  SiTerraform,
} from "react-icons/si";
import EcoNetworkCanvas from "@/components/dom/EcoNetworkCanvas";
import SectionHeading from "@/components/dom/SectionHeading";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// TECHNOLOGY ECOSYSTEM — "From intelligence to impact" flow.
// Left: sticky intro (headline, copy, CTA, quick stats). Right: the stack as
// five numbered layers on a continuous dashed timeline.
//
// PROGRESSIVE ASSEMBLY: when the flow enters the viewport ONE orchestrated
// sequence plays — the section label fades in, layer 01 appears, the rail
// grows downward past it, 02 appears, the rail keeps growing … through 05
// and the outcome row. Only then does the AI-data-flow particle start
// riding the rail. The stack visibly assembles itself.
//
// Plus: pill magnet effect on layer hover, and a whisper-quiet animated
// neural-network canvas + drifting gradient blobs behind everything.

type Tech = { name: string; icon: IconType; color: string };
type Layer = {
  num: string;
  title: string;
  desc: string;
  icon: IconType;
  // per-category idle animation for the tile icon
  anim: "core" | "neural" | "pulse" | "network" | "rings" | "float" | "launch";
  // per-layer accent — drives the active card/tile/pill/rail/frame glow so
  // each step is instantly recognisable when the flow reaches it (echoes the
  // layer's own tool colours: orange → green → blue → cyan → violet)
  accent: string;
  techs: Tech[];
};

// AI CHIP glyph for Foundation Models — a neural processor: a chip die with
// signal pins on all four sides and a glowing intelligence core at its
// centre. Reads unambiguously as "the model / compute", and stays distinct
// from the Frameworks network glyph. HIT-ONLY like every other tile: still
// until the traveling dot adds .eco-hit, then the halo bursts, the pins flow
// current inward, the corner contacts relay-blink and two sparks twinkle —
// once. Styling/keyframes live in globals.css.
//
//      ┌─┴─┐
//     ─┤ ◎ ├─
//      └─┬─┘
function AiCoreGlyph() {
  return (
    <svg
      viewBox="0 0 44 44"
      className="h-10 w-10"
      fill="none"
      style={{ filter: "drop-shadow(0 0 5px rgba(255,138,61,0.55))" }}
      aria-hidden
    >
      <defs>
        <radialGradient id="aiCoreGrad" cx="38%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#FFE3BC" />
          <stop offset="45%" stopColor="#FFB057" />
          <stop offset="100%" stopColor="#F9723C" />
        </radialGradient>
      </defs>

      {/* chip pins — dashed signal leads that flow current inward on hit */}
      <g
        stroke="#FF9E55"
        strokeWidth="1.2"
        strokeDasharray="2.5 3"
        strokeLinecap="round"
        opacity="0.7"
      >
        {[
          [18, 7, 18, 13], [26, 7, 26, 13], // top
          [18, 37, 18, 31], [26, 37, 26, 31], // bottom
          [7, 18, 13, 18], [7, 26, 13, 26], // left
          [37, 18, 31, 18], [37, 26, 31, 26], // right
        ].map(([x1, y1, x2, y2]) => (
          <line
            key={`${x1}-${y1}-${x2}-${y2}`}
            className="aicore-link"
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
          />
        ))}
      </g>

      {/* chip die */}
      <rect
        x="12.5"
        y="12.5"
        width="19"
        height="19"
        rx="4"
        fill="rgba(255,138,61,0.10)"
        stroke="#FFC08A"
        strokeWidth="1.3"
      />

      {/* corner contacts — relay-blink in sequence on hit */}
      <g fill="#FFC08A">
        {[
          [16, 16], [28, 16], [16, 28], [28, 28],
        ].map(([cx, cy], i) => (
          <rect
            key={`${cx}-${cy}`}
            className="aicore-diamond"
            style={{ "--gd": `${i * 0.12}s` } as React.CSSProperties}
            x={cx - 1.3}
            y={cy - 1.3}
            width="2.6"
            height="2.6"
            rx="0.7"
          />
        ))}
      </g>

      {/* the intelligence core: halo (bursts outward on hit) + orb + highlight */}
      <circle className="aicore-halo" cx="22" cy="22" r="7" fill="#FF8A3D" />
      <circle cx="22" cy="22" r="5" fill="url(#aiCoreGrad)" />
      <circle cx="20.4" cy="20.4" r="1.5" fill="#FFF7E6" opacity="0.9" />

      {/* sparks — twinkle briefly on hit */}
      <circle className="aicore-spark" cx="22" cy="9.5" r="1.1" fill="#FFC08A" />
      <circle
        className="aicore-spark"
        style={{ "--gd": "0.25s" } as React.CSSProperties}
        cx="34.5"
        cy="22"
        r="1"
        fill="#FF8A3D"
      />
    </svg>
  );
}

// CONNECTED NEURAL NETWORK glyph for AI Frameworks — two rows of nodes
// joined by row links, end/centre columns and diagonals into the hub.
// HIT-ONLY: still until the traveling dot adds .eco-hit, then a signal
// flashes through the wires and the node halos ripple across the network
// in sequence — once. Styling/keyframes live in globals.css.
//
//   ●━━●━━●
//   ┃ ╲┃╱ ┃
//   ●━━●━━●
function AiNetworkGlyph() {
  const nodes: [number, number][] = [
    [8, 14],
    [22, 14],
    [36, 14],
    [8, 30],
    [22, 30],
    [36, 30],
  ];
  const edges: [number, number, number, number][] = [
    [8, 14, 22, 14],
    [22, 14, 36, 14],
    [8, 30, 22, 30],
    [22, 30, 36, 30],
    [8, 14, 8, 30],
    [36, 14, 36, 30],
    [22, 14, 22, 30],
    [8, 14, 22, 30],
    [36, 14, 22, 30],
  ];
  return (
    <svg
      viewBox="0 0 44 44"
      className="h-10 w-10"
      fill="none"
      style={{ filter: "drop-shadow(0 0 5px rgba(255,138,61,0.5))" }}
      aria-hidden
    >
      {/* wires — flash with a signal surge on hit */}
      <g stroke="#FF9E55" strokeWidth="1.1" opacity="0.5" strokeLinecap="round">
        {edges.map(([x1, y1, x2, y2], i) => (
          <line
            key={`${x1}-${y1}-${x2}-${y2}`}
            className="ainet-wire"
            style={{ "--gd": `${i * 0.05}s` } as React.CSSProperties}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
          />
        ))}
      </g>
      {/* nodes — halos ripple across the network in sequence on hit */}
      {nodes.map(([cx, cy], i) => (
        <g key={`${cx}-${cy}`}>
          <circle
            className="ainet-halo"
            style={{ "--gd": `${i * 0.09}s` } as React.CSSProperties}
            cx={cx}
            cy={cy}
            r="4.5"
            fill="#FF8A3D"
          />
          <circle cx={cx} cy={cy} r="2.6" fill="#FFB057" />
          <circle cx={cx} cy={cy} r="1" fill="#FFF7E6" opacity="0.9" />
        </g>
      ))}
    </svg>
  );
}

const LAYERS: Layer[] = [
  {
    num: "01",
    title: "Foundation Models",
    desc: "Leading LLMs and AI models powering intelligent applications.",
    icon: TbBrain, // fallback only — the tile renders the AiCoreGlyph
    anim: "core",
    accent: "#FF8A3D", // orange
    techs: [
      { name: "GPT", icon: TbBrandOpenai, color: "#FFFFFF" },
      { name: "Claude", icon: SiAnthropic, color: "#D97757" },
      { name: "Gemini", icon: SiGooglegemini, color: "#4E86F7" },
      { name: "Llama", icon: SiMeta, color: "#0668E1" },
      { name: "Mistral", icon: SiMistralai, color: "#F54E42" },
    ],
  },
  {
    num: "02",
    title: "AI Frameworks",
    desc: "Frameworks and tools for building powerful AI workflows.",
    icon: TbSitemap, // fallback only — the tile renders the AiNetworkGlyph
    anim: "neural",
    accent: "#5CBB7A", // green
    techs: [
      { name: "LangChain", icon: SiLangchain, color: "#5CBB7A" },
      { name: "CrewAI", icon: TbUsersGroup, color: "#FF5A50" },
      { name: "AutoGen", icon: TbRobot, color: "#3FB6C9" },
      { name: "LlamaIndex", icon: TbListSearch, color: "#B95AF0" },
    ],
  },
  {
    num: "03",
    title: "Vector Databases",
    desc: "Store, search and retrieve knowledge at scale with high performance.",
    icon: TbDatabase,
    anim: "rings",
    accent: "#7AA7FF", // blue
    techs: [
      { name: "Pinecone", icon: TbVectorTriangle, color: "#E3E8EF" },
      { name: "Weaviate", icon: TbAffiliate, color: "#61BD73" },
      { name: "Qdrant", icon: SiQdrant, color: "#DC4A5C" },
      { name: "FAISS", icon: TbSearch, color: "#7AA7FF" },
    ],
  },
  {
    num: "04",
    title: "Cloud Infrastructure",
    desc: "Scalable, secure and reliable cloud platforms for modern applications.",
    icon: TbCloud,
    anim: "float",
    accent: "#38B6FF", // cyan
    techs: [
      { name: "Azure AI", icon: TbBrandAzure, color: "#38B6FF" },
      { name: "AWS Bedrock", icon: TbBrandAws, color: "#FF9900" },
      { name: "Google Vertex AI", icon: SiGooglecloud, color: "#4285F4" },
      { name: "Anthropic", icon: SiAnthropic, color: "#E8E3D9" },
      { name: "OpenAI", icon: TbBrandOpenai, color: "#FFFFFF" },
    ],
  },
  {
    num: "05",
    title: "Deployment & DevOps",
    desc: "Deploy, monitor and optimize AI solutions seamlessly.",
    icon: TbRocket,
    anim: "launch",
    accent: "#9B6DE8", // violet
    techs: [
      { name: "Docker", icon: SiDocker, color: "#2496ED" },
      { name: "Kubernetes", icon: SiKubernetes, color: "#326CE5" },
      { name: "Vercel", icon: SiVercel, color: "#FFFFFF" },
      { name: "Terraform", icon: SiTerraform, color: "#9B6DE8" },
    ],
  },
];

const STATS = [
  { value: "25+", label: "Technologies" },
  { value: "6", label: "Technology Layers" },
  { value: "Unlimited", label: "Possibilities", accent: true },
];

// tiny sparks that burst outward from an icon tile as its card lands — the
// final "small particles" beat of each card's entrance. [dx, dy] = where each
// spark flies to from the tile centre.
const SPARKS: [number, number][] = [
  [-20, -12],
  [18, -16],
  [24, 8],
  [-16, 16],
  [2, -24],
  [6, 22],
];

// Left-card backdrop artwork — one photo per layer (index-aligned with
// LAYERS). As the traveling dot rides the rail and crosses each layer on the
// right, the stats card reveals that layer's image (sliding in from the right,
// echoing the dot's direction), so the intro card "reacts" to where the flow
// currently is.
const LAYER_BG = [
  // Real photography/art matched to each heading (all from the existing
  // Canva-sourced asset pool — the old /eco renders read generic):
  "/carousel/03-ai-data-interface.jpg", // 01 Foundation Models — holographic AI chip + data streams
  "/services/software.jpg", // 02 AI Frameworks — code editor close-up (the tools)
  "/services/modernization.jpg", // 03 Vector Databases — server racks, stored data at scale
  "/carousel/06-cloud-computing.jpg", // 04 Cloud Infrastructure — glowing cloud over racks
  "/carousel/04-cross-platform-software.jpg", // 05 Deployment & DevOps — apps live across devices
];

// Assembly timing (ms). ONE choreographed sequence, not a pile-up:
//   0            left CTA fades in
//   120–820      the brain card rises + settles (its stats stagger in)
//   LEFT_MS-150  the brain "lights up" — a one-shot pulse ring swells off
//                the card, as if it just powered on
//   LEFT_MS      the right column's label answers the pulse
//   BASE+i*STEP  layer i lands; the rail grows in between; outcome after
//                the last layer; the traveling particle after it all.
const LEFT_MS = 900; // the brain card owns the stage this long
const BASE = LEFT_MS + 350;
const STEP = 550;
const RAIL_MS = STEP * LAYERS.length; // rail finishes as the outcome lands
const PARTICLE_AT = BASE + RAIL_MS + 500;

export default function TechEcosystemFlow() {
  const flowRef = useRef<HTMLDivElement>(null);
  const particleRef = useRef<HTMLSpanElement>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  // the base rail (for measuring) + the bright fill segment that tracks the
  // traveling dot so the line visibly fills downward as the flow rides it
  const railRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  // the rail container (positioning reference) + the energy packet that
  // surges along the rail from the completing node to the next one, and the
  // last active layer so we can choreograph the hand-off on every change
  const railWrapRef = useRef<HTMLDivElement>(null);
  const energyRef = useRef<HTMLSpanElement>(null);
  const prevActiveRef = useRef(0);
  const reduced = useReducedMotion();
  const [assembledState, setAssembledState] = useState(false);
  // which layer the traveling dot is currently nearest — drives the left
  // card's crossfading backdrop. Defaults to 0 so a frame shows at rest.
  const [activeLayer, setActiveLayer] = useState(0);
  // true while the traveling dot is nearest the completion terminus — the
  // finish node takes the active emphasis (green) and the layers recede.
  const [atFinish, setAtFinish] = useState(false);
  // becomes true once the data flow starts riding the rail (after the whole
  // stack has assembled) — gates the active/dim layer emphasis.
  const [flowing, setFlowing] = useState(false);
  // reduced-motion: skip the scroll-triggered assembly, show it built
  const assembled = assembledState || reduced;

  useEffect(() => {
    if (reduced) return;
    const el = flowRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAssembledState(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  // the data flow begins riding the rail only after the whole stack has
  // assembled; flip `flowing` then so the active/dim emphasis starts in
  // sync with the traveling dot rather than during the staged entrance.
  useEffect(() => {
    if (!assembled || reduced) return;
    const t = setTimeout(() => setFlowing(true), PARTICLE_AT);
    return () => clearTimeout(t);
  }, [assembled, reduced]);

  // TRANSITION STORY: every time the flow moves to a new layer, choreograph
  // the hand-off like a workflow step completing → passing the baton →
  // lighting the next node. The completing node pulses, an energy packet
  // surges along the rail to the arriving node, and the arriving node bursts
  // (ring + sparks + title re-slide; its card + image already recolour).
  useEffect(() => {
    if (!flowing || reduced) return;
    const prev = prevActiveRef.current;
    const next = activeLayer;
    if (prev === next) return;
    prevActiveRef.current = next;

    const timers: number[] = [];
    const fire = (idx: number, cls: string, ms: number) => {
      const row = tileRefs.current[idx]?.parentElement;
      if (!row) return;
      row.classList.add(cls);
      timers.push(window.setTimeout(() => row.classList.remove(cls), ms));
    };
    fire(prev, "eco-complete", 700); // the node just left "completes"
    fire(next, "eco-arrive", 950); // the node reached lights up + bursts

    // energy packet: place it at the completing node, then send it along the
    // rail to the arriving node
    const wrap = railWrapRef.current;
    const en = energyRef.current;
    const oldT = tileRefs.current[prev];
    const newT = tileRefs.current[next];
    if (wrap && en && oldT && newT) {
      const wr = wrap.getBoundingClientRect();
      const a = oldT.getBoundingClientRect();
      const b = newT.getBoundingClientRect();
      const topA = a.top - wr.top + a.height / 2;
      const topB = b.top - wr.top + b.height / 2;
      const dur = Math.min(700, Math.max(320, Math.abs(topB - topA) * 1.15));
      en.style.transition = "none";
      en.style.top = `${topA}px`;
      en.style.opacity = "1";
      void en.offsetHeight; // reflow so the jump-to-start isn't animated
      en.style.transition = `top ${dur}ms cubic-bezier(0.45,0,0.2,1), opacity 220ms ease`;
      en.style.top = `${topB}px`;
      timers.push(
        window.setTimeout(() => {
          if (en) en.style.opacity = "0";
        }, dur),
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [activeLayer, flowing, reduced]);

  // HIT DETECTION: while the flow is on screen, watch the traveling dot and
  // flare each icon tile (class "eco-hit") the moment the dot crosses its
  // centre — the tile glows and its icon plays its signature burst. The
  // completion terminus rides the same system as slot LAYERS.length: crossing
  // it fires its green arrival burst, and while the dot sits nearest to it
  // the whole flow reads "complete" (atFinish).
  useEffect(() => {
    if (!assembled || reduced) return;
    let raf = 0;
    let running = false;
    let curActive = -1;
    let curFinish = false;
    const lastFire: number[] = Array.from({ length: LAYERS.length + 1 }, () => 0);

    const loop = () => {
      const dot = particleRef.current;
      if (dot) {
        const dr = dot.getBoundingClientRect();
        const py = dr.top + dr.height / 2;
        const now = performance.now();
        // grow the bright fill segment to wherever the dot currently is, so
        // the rail visibly fills downward as the flow rides it
        const rail = railRef.current;
        const fill = fillRef.current;
        if (rail && fill) {
          const rr = rail.getBoundingClientRect();
          const p = Math.max(0, Math.min(1, (py - rr.top) / rr.height));
          fill.style.transform = `scaleY(${p})`;
        }
        let nearest = curActive < 0 ? 0 : curActive;
        let nearestDist = Infinity;
        tileRefs.current.forEach((tile, i) => {
          if (!tile) return;
          const tr = tile.getBoundingClientRect();
          const ty = tr.top + tr.height / 2;
          // fire once per pass — the dot needs 2.5s+ to loop back around.
          // The hit class goes on the whole ROW so the icon tile AND that
          // layer's tool pills all react together.
          if (Math.abs(py - ty) < 18 && now - lastFire[i] > 2500) {
            lastFire[i] = now;
            const row = tile.parentElement ?? tile;
            // the terminus bursts with its (green) arrival FX; layers flare
            // with their signature hit effects
            const isFin = i === LAYERS.length;
            const cls = isFin ? "eco-arrive" : "eco-hit";
            row.classList.add(cls);
            setTimeout(() => row.classList.remove(cls), isFin ? 950 : 1200);
          }
          // track the layer whose tile the dot is closest to — this drives
          // the left card's crossfading backdrop.
          const dist = Math.abs(py - ty);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = i;
          }
        });
        // the terminus "holds" the flow while the dot is nearest to it;
        // activeLayer keeps its last layer so the backdrop stays sensible
        const finNear = nearest === LAYERS.length;
        if (finNear !== curFinish) {
          curFinish = finNear;
          setAtFinish(finNear);
        }
        if (!finNear && nearest !== curActive) {
          curActive = nearest;
          setActiveLayer(nearest);
        }
      }
      if (running) raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        raf = requestAnimationFrame(loop);
      } else if (!entry.isIntersecting) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    if (flowRef.current) io.observe(flowRef.current);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [assembled, reduced]);

  // shared reveal classes + per-step delay
  const stepClass = (visible: boolean) =>
    `transition-all duration-700 ease-out ${
      visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
    }`;
  // the staged card entrance runs the moment the stack assembles
  const entered = assembled && !reduced;

  // the active/dim emphasis only kicks in once the flow is actually riding
  // the rail — during the entrance every card lands at full strength, then
  // the flow takes over and pulls focus to the live layer.
  const emphasize = flowing;

  return (
    <div
      className="relative"
      style={
        {
          // the active layer's accent, exposed to the whole section so the
          // shared frame / rail fill / transition FX recolour in sync when
          // the flow moves to a new layer
          "--eco-accent": atFinish ? "#54C08A" : LAYERS[activeLayer].accent,
        } as React.CSSProperties
      }
    >
      {/* ── Gentle animated background: blobs + dot grid + neural canvas ── */}
      <div aria-hidden className="pointer-events-none absolute -inset-x-10 -inset-y-8 -z-10 overflow-hidden">
        <div className="eco-blob absolute -left-24 top-10 h-95 w-130 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,138,61,0.09),transparent_70%)] blur-2xl" />
        <div className="eco-blob-2 absolute -right-20 bottom-0 h-105 w-140 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,43,78,0.06),transparent_70%)] blur-2xl" />
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,#FF8A3D_1px,transparent_1px)] bg-size-[28px_28px]" />
        {/* living neural network — canvas, ~7% opacity */}
        <EcoNetworkCanvas />
      </div>

      {/* centered section heading, matching the rest of the page */}
      <SectionHeading
        eyebrow="Our Technology Ecosystem"
        title="Modern Technologies. Meaningful Connections."
        highlight="Connections."
        body="We combine best-in-class AI models, frameworks, data systems, and cloud infrastructure to build scalable, secure, and intelligent solutions."
      />

      <div className="mt-14 grid grid-cols-1 gap-14 lg:mt-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] lg:gap-12">
        {/* ── Left: sticky CTA + quick stats — FIRST beat of the sequence:
            the brain card enters and lights up before the right stack moves,
            so the stack reads as the brain's doing, not a parallel pop ──── */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className={stepClass(assembled)}>
            <a
              href="#experience"
              className="group inline-flex items-center gap-2.5 rounded-full border border-(--border) bg-(--card) px-6 py-3 text-sm font-medium text-(--foreground) transition-all duration-300 hover:border-(--brand-orange)/50 hover:bg-(--brand-orange)/10 hover:text-(--heading)"
            >
              <FiPlay className="h-3.5 w-3.5 text-[#FF8A3D] transition-transform duration-300 group-hover:scale-110" />
              See How It Works
            </a>
          </div>

          {/* quick stats card — a premium glass panel: floating shadow +
              warm glow lift it off the page and an animated gradient ring
              runs slowly around the rounded edge. Its backdrop reveals the
              layer the traveling dot is currently riding, sliding IN FROM THE
              RIGHT to echo the dot's direction, so the card feels alive.
              ENTRANCE: rises + settles from 96% scale right after the CTA,
              then fires a one-shot power-up pulse that hands off to the
              right column's assembly. */}
          <div
            className={`eco-frame relative mt-10 w-full max-w-md transition-all duration-700 ease-out ${
              assembled
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-6 scale-[0.96] opacity-0"
            }`}
            style={reduced ? undefined : { transitionDelay: "120ms" }}
          >
            {/* the brain lights up: one ring swells off the card, then the
                right column starts assembling — cause, then effect */}
            {entered && (
              <span
                aria-hidden
                className="eco-card-pulse"
                style={{ animationDelay: `${LEFT_MS - 150}ms` }}
              />
            )}
            <div className="relative flex min-h-115 w-full flex-col justify-end overflow-hidden rounded-3xl bg-(--card) p-8 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            {/* layer photos: all frames mounted; the ACTIVE one WIPES IN top →
                bottom (clip-path, echoing the rail's downward flow) with a
                slight zoom settle, painting over the outgoing photo, which
                then quietly fades beneath it — a reveal, not a crossfade */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              {LAYER_BG.map((src, i) => {
                const active = i === activeLayer;
                return (
                  <Image
                    key={src}
                    src={src}
                    alt=""
                    fill
                    sizes="448px"
                    quality={72}
                    priority={i === 0}
                    className={`scale-105 object-cover object-center ${
                      active && emphasize ? "eco-img-in" : ""
                    }`}
                    style={{
                      opacity: active ? 0.92 : 0,
                      // active paints ABOVE the outgoing frame so the wipe
                      // reveals it over the old picture
                      zIndex: active ? 2 : 1,
                      // outgoing: hold beneath the wipe, then slip away
                      transition: active ? "none" : "opacity 0.5s ease 0.3s",
                    }}
                  />
                );
              })}
              {/* wipe light — an accent beam sweeps down the frame in sync
                  with the clip-path reveal (keyed so it replays per layer) */}
              {emphasize && (
                <div key={activeLayer} aria-hidden className="eco-wipe z-3">
                  <span className="eco-wipe-beam" />
                </div>
              )}

              {/* scrim: darker at the bottom so the stats stay legible over the
                  photo, clear through the middle so the image reads */}
              <div className="absolute inset-0 z-4 bg-linear-to-t from-(--card) via-(--card)/25 to-(--card)/45" />
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-(--border) pt-6">
              {/* stats stagger in one by one while the card is settling, so
                  the panel reads as filling with data rather than popping
                  in pre-populated */}
              {STATS.map((s, si) => (
                <div
                  key={s.label}
                  className={stepClass(assembled)}
                  style={
                    reduced ? undefined : { transitionDelay: `${420 + si * 110}ms` }
                  }
                >
                  <p
                    className={`text-2xl font-bold leading-none ${
                      s.accent ? "text-(--brand-orange)" : "text-(--heading)"
                    }`}
                  >
                    {s.value}
                  </p>
                  <p className="mt-2 text-xs leading-snug text-(--text-secondary)">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>

        {/* ── Right: the layer flow assembling on a growing timeline ──── */}
        <div ref={flowRef} className="lg:pl-24">
          {/* section label — the right column's first beat, answering the
              brain card's power-up pulse */}
          <p
            className={`mb-8 text-xs font-medium uppercase tracking-[0.3em] text-(--text-secondary) ${stepClass(assembled)}`}
            style={reduced ? undefined : { transitionDelay: `${LEFT_MS}ms` }}
          >
            From Intelligence to Impact
          </p>

          <div ref={railWrapRef} className="relative">
            {/* the timeline rail — a dim GLOWING base line that grows
                top → bottom during assembly */}
            <div
              ref={railRef}
              aria-hidden
              className="absolute bottom-10 left-8.5 top-2 hidden w-0.5 rounded-full bg-linear-to-b from-[#FF8A3D]/60 via-[#FF8A3D]/30 to-[#FF8A3D]/60 shadow-[0_0_6px_rgba(255,138,61,0.22)] md:block"
              style={{
                transform: assembled ? "scaleY(1)" : "scaleY(0)",
                transformOrigin: "top",
                transition: reduced
                  ? undefined
                  : `transform ${RAIL_MS}ms linear ${BASE + 150}ms`,
              }}
            />
            {/* the FILL segment — a brighter line that tracks the traveling
                dot (its scaleY is set per-frame in JS), so the rail visibly
                fills downward as the flow rides it */}
            {assembled && !reduced && (
              <div
                ref={fillRef}
                aria-hidden
                className="eco-rail-fill absolute bottom-10 left-8.5 top-2 hidden w-0.5 rounded-full md:block"
                style={{
                  background:
                    "linear-gradient(to bottom, color-mix(in srgb, var(--eco-accent) 82%, #fff), var(--eco-accent), color-mix(in srgb, var(--eco-accent) 78%, #000))",
                  boxShadow:
                    "0 0 8px color-mix(in srgb, var(--eco-accent) 45%, transparent)",
                  transition: "background 0.5s ease, box-shadow 0.5s ease",
                }}
              />
            )}
            {/* ENERGY PACKET — surges along the rail from the completing node
                to the arriving one on every hand-off (JS drives its top) */}
            {assembled && !reduced && (
              <span
                ref={energyRef}
                aria-hidden
                className="eco-energy absolute left-8.5 hidden -translate-x-1/2 -translate-y-1/2 md:block"
                style={{ top: 0, opacity: 0 }}
              />
            )}
            {/* extra glow PULSES that continuously ride the rail on their own
                cadence, so data always feels in motion through the line */}
            {assembled &&
              !reduced &&
              [0, 1].map((k) => (
                <span
                  key={k}
                  aria-hidden
                  className="eco-rail-pulse absolute left-8.5 hidden h-1 w-1 -translate-x-1/2 rounded-full md:block"
                  style={{
                    animationDelay: `${PARTICLE_AT + k * 2200}ms`,
                    background: "color-mix(in srgb, var(--eco-accent) 40%, #fff)",
                    boxShadow:
                      "0 0 4px 1px color-mix(in srgb, var(--eco-accent) 30%, transparent)",
                  }}
                />
              ))}
            {/* AI DATA FLOW particle — starts once the stack is assembled */}
            {assembled && !reduced && (
              <span
                ref={particleRef}
                aria-hidden
                className="flow-particle absolute left-8.5 hidden -translate-x-1/2 opacity-0 md:block"
                style={{ animationDelay: `${PARTICLE_AT}ms` }}
              >
                {/* REFINED: a near-white core with one tight, low-alpha halo
                    and a short faint wake — reads as a precise light moving
                    down the line, not a neon blob */}
                <span
                  className="absolute bottom-0.5 left-1/2 h-8 w-px -translate-x-1/2 rounded-full blur-[1px]"
                  style={{
                    background:
                      "linear-gradient(to top, color-mix(in srgb, var(--eco-accent) 40%, transparent), transparent)",
                  }}
                />
                <span
                  className="block h-1.25 w-1.25 rounded-full"
                  style={{
                    background: "color-mix(in srgb, var(--eco-accent) 35%, #fff)",
                    boxShadow:
                      "0 0 5px 1px color-mix(in srgb, var(--eco-accent) 50%, transparent)",
                  }}
                />
              </span>
            )}

            <div className="space-y-16">
              {LAYERS.map((layer, i) => (
                <div
                  key={layer.num}
                  className={`relative ${entered ? "eco-layer-enter" : ""}`}
                  style={
                    {
                      // this layer's own accent for its active card/tile/pills
                      // + entrance glow
                      "--eco-accent": layer.accent,
                      // base delay for this card's internal micro-animations —
                      // children add their own offset via calc() so the icon,
                      // title, copy, glow + sparks cascade in sequence
                      "--eco-in-delay": `${BASE + i * STEP}ms`,
                      ...(reduced
                        ? {}
                        : assembled
                          ? { animationDelay: `${BASE + i * STEP}ms` }
                          : { opacity: 0 }),
                    } as unknown as React.CSSProperties
                  }
                >
                  {/* open content block — pills integrated under the copy.
                      Top-aligned so the title's midline sits exactly on the
                      68px tile's centre (16px num + 4px gap + 28px title).
                      When the flow is live, the active layer sits at full
                      strength and scale while the rest dim + recede slightly. */}
                  <div
                    className="group flex flex-col gap-5 md:flex-row md:items-start md:gap-6"
                    style={
                      emphasize
                        ? {
                            // dim inactive rows with a FILTER, never opacity —
                            // opacity composites the whole row translucent,
                            // which let the rail line ghost through the icon
                            // tile's opaque backdrop
                            filter:
                              i === activeLayer && !atFinish
                                ? "none"
                                : "saturate(0.6) brightness(0.55)",
                            transform:
                              i === activeLayer && !atFinish
                                ? "scale(1.02)"
                                : "scale(0.97)",
                            transformOrigin: "left center",
                            transition:
                              "filter 0.55s ease, transform 0.55s ease",
                          }
                        : undefined
                    }
                  >
                    {/* icon tile: solid backdrop so the rail passes behind it.
                        Each category icon carries its own subtle idle motion:
                        pulse / network dots / rotating rings / float / launch */}
                    <div
                      ref={(el) => {
                        tileRefs.current[i] = el;
                      }}
                      className={`eco-tile relative z-10 flex h-17 w-17 shrink-0 items-center justify-center rounded-xl border border-(--brand-orange)/35 bg-[color-mix(in_srgb,var(--brand-orange)_10%,var(--card))] text-(--brand-orange) shadow-[0_0_24px_-6px_var(--glow-orange)] group-hover:-translate-y-1 group-hover:scale-105 ${
                        emphasize && i === activeLayer && !atFinish
                          ? "eco-active"
                          : ""
                      }`}
                    >
                      {/* entrance GLOW beat — a one-shot bloom around the tile
                          as this card lands, the third stage after fade + scale */}
                      {entered && (
                        <span
                          aria-hidden
                          className="eco-tile-glow"
                          style={{ animationDelay: `${BASE + i * STEP + 480}ms` }}
                        />
                      )}
                      {/* small PARTICLES beat — sparks burst outward from the
                          tile as the last step of the card's entrance */}
                      {entered &&
                        SPARKS.map(([dx, dy], si) => (
                          <span
                            key={si}
                            aria-hidden
                            className="eco-spark"
                            style={
                              {
                                "--sx": `${dx}px`,
                                "--sy": `${dy}px`,
                                animationDelay: `calc(var(--eco-in-delay) + ${520 + si * 45}ms)`,
                              } as React.CSSProperties
                            }
                          />
                        ))}
                      {/* HAND-OFF FX — dormant until this node is left
                          (.eco-complete) or reached (.eco-arrive) by the flow:
                          a ring pulse plus a fresh burst of sparks on arrival */}
                      {entered && (
                        <>
                          <span
                            aria-hidden
                            className="eco-node-ring absolute inset-0 rounded-xl"
                          />
                          {SPARKS.map(([dx, dy], si) => (
                            <span
                              key={`a${si}`}
                              aria-hidden
                              className="eco-arrive-spark"
                              style={
                                {
                                  "--sx": `${dx}px`,
                                  "--sy": `${dy}px`,
                                  "--ad": `${si * 45}ms`,
                                } as React.CSSProperties
                              }
                            />
                          ))}
                        </>
                      )}
                      {/* Foundation: a glow ring pings outward in time with
                          the core's pulse */}
                      {(layer.anim === "core" || layer.anim === "pulse") && (
                        <span
                          aria-hidden
                          className="eco-ping absolute inset-0 rounded-xl border-2 border-[#FF8A3D]/60"
                        />
                      )}
                      {/* Vector DB: two dashed rings counter-rotate around
                          the icon like orbiting index shards */}
                      {layer.anim === "rings" && (
                        <>
                          <span
                            aria-hidden
                            className="eco-ring absolute inset-1 rounded-full border border-dashed border-[#FF9E55]/45"
                          />
                          <span
                            aria-hidden
                            className="eco-ring-2 absolute inset-2.5 rounded-full border border-dotted border-[#FF8A3D]/35"
                          />
                        </>
                      )}
                      <span
                        className={`inline-block transition-transform duration-300 ease-out group-hover:rotate-10 group-hover:scale-110 ${
                          entered ? "eco-in-icon" : ""
                        }`}
                        style={
                          entered
                            ? { animationDelay: "calc(var(--eco-in-delay) + 60ms)" }
                            : undefined
                        }
                      >
                      <span
                        className={`eco-burst relative ${
                          {
                            core: "",
                            neural: "",
                            pulse: "eco-ic-pulse",
                            network: "",
                            rings: "",
                            float: "eco-ic-float",
                            launch: "eco-ic-launch",
                          }[layer.anim]
                        }`}
                      >
                        {/* Foundation renders the animated AI-core glyph;
                            every other layer keeps its Tabler icon */}
                        {layer.anim === "core" ? (
                          <AiCoreGlyph />
                        ) : layer.anim === "neural" ? (
                          <AiNetworkGlyph />
                        ) : (
                          <layer.icon className="h-8 w-8" strokeWidth={1.5} />
                        )}
                        {/* Frameworks: connecting dots blink in sequence over
                            the sitemap's three nodes */}
                        {layer.anim === "network" && (
                          <>
                            <span aria-hidden className="eco-dot absolute left-[42%] top-[-4%] h-1.5 w-1.5 rounded-full bg-[#FFC08A]" />
                            <span aria-hidden className="eco-dot absolute left-[6%] top-[68%] h-1.5 w-1.5 rounded-full bg-[#FFC08A]" />
                            <span aria-hidden className="eco-dot absolute left-[78%] top-[68%] h-1.5 w-1.5 rounded-full bg-[#FFC08A]" />
                          </>
                        )}
                        {/* Cloud: raindrops fall from the cloud while the
                            dot passes */}
                        {layer.anim === "float" && (
                          <>
                            <span aria-hidden className="eco-rain absolute left-[24%] top-[72%] h-1.5 w-0.5 rounded-full bg-[#8FC2FF] shadow-[0_0_4px_rgba(143,194,255,0.8)]" />
                            <span aria-hidden className="eco-rain absolute left-[50%] top-[76%] h-1.5 w-0.5 rounded-full bg-[#8FC2FF] shadow-[0_0_4px_rgba(143,194,255,0.8)]" />
                            <span aria-hidden className="eco-rain absolute left-[74%] top-[72%] h-1.5 w-0.5 rounded-full bg-[#8FC2FF] shadow-[0_0_4px_rgba(143,194,255,0.8)]" />
                          </>
                        )}
                        {/* Deployment: a tiny launch trail flares under the
                            rocket every few seconds */}
                        {layer.anim === "launch" && (
                          <>
                            {/* exhaust trail */}
                            <span
                              aria-hidden
                              className="eco-trail absolute left-[30%] top-[72%] h-5 w-1 rotate-45 rounded-full bg-linear-to-b from-[#FFD9A8] via-[#FF8A3D]/80 to-transparent"
                            />
                            {/* thruster FIRE: bright flickering core + softer
                                outer flame licking from the rocket's rear as
                                it hops toward the top-right */}
                            <span
                              aria-hidden
                              className="eco-flame-1 absolute left-[30%] top-[76%] h-2.5 w-1 rounded-full bg-linear-to-b from-white via-[#FFD466] to-[#FF8A3D]/0 shadow-[0_0_6px_rgba(255,190,90,0.9)]"
                            />
                            <span
                              aria-hidden
                              className="eco-flame-2 absolute left-[22%] top-[80%] h-3.5 w-1.5 rounded-full bg-linear-to-b from-[#FFB067] via-[#FF6A3D]/70 to-transparent"
                            />
                          </>
                        )}
                      </span>
                      </span>
                    </div>

                    {/* content block: number, title, copy, then its pills.
                        The ACTIVE layer earns a raised orange-gradient card
                        surface behind its copy — brighter border, warm
                        gradient, floating shadow + glow — while inactive
                        layers stay flat + dim, so the live layer clearly leads. */}
                    <div className="relative min-w-0 flex-1">
                      <div
                        aria-hidden
                        className={`eco-card-surface ${
                          emphasize && i === activeLayer && !atFinish
                            ? "is-active"
                            : ""
                        }`}
                      />
                      <div className="relative z-10 transition-transform duration-300 ease-out group-hover:-translate-y-1">
                        <p
                          className={`font-mono text-xs font-semibold tracking-[0.2em] ${
                            entered ? "eco-in-title" : ""
                          }`}
                          style={{
                            color: layer.accent,
                            ...(entered
                              ? {
                                  animationDelay:
                                    "calc(var(--eco-in-delay) + 120ms)",
                                }
                              : {}),
                          }}
                        >
                          {layer.num}
                        </p>
                        <h3
                          className={`mt-1 text-2xl font-semibold leading-tight tracking-tight text-(--heading) ${
                            entered ? "eco-in-title" : ""
                          }`}
                          style={
                            entered
                              ? {
                                  animationDelay:
                                    "calc(var(--eco-in-delay) + 200ms)",
                                }
                              : undefined
                          }
                        >
                          <span className="eco-arrive-title inline-block">
                            {layer.title}
                          </span>
                          {/* arrow slides in + right on hover — enterprise
                              "explore" affordance in the layer's own accent */}
                          <FiArrowRight
                            aria-hidden
                            className="ml-2 inline-block h-5 w-5 -translate-x-1.5 align-[-3px] opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0.5 group-hover:opacity-100"
                            style={{ color: layer.accent }}
                          />
                        </h3>
                        <p
                          className={`mt-2 max-w-lg text-sm leading-relaxed text-(--text-secondary) ${
                            entered ? "eco-in-desc" : ""
                          }`}
                          style={
                            entered
                              ? {
                                  animationDelay:
                                    "calc(var(--eco-in-delay) + 320ms)",
                                }
                              : undefined
                          }
                        >
                          {layer.desc}
                        </p>

                      {/* MAGNET EFFECT: hovering anywhere on the layer draws
                          its pills 4–8px toward the heading, each on its own
                          vector + a staggered delay, so the cluster leans in
                          organically rather than sliding as one block */}
                      <div className="mt-4 flex flex-wrap gap-2.5">
                        {layer.techs.map((t, ti) => (
                          <span
                            key={t.name}
                            className={`eco-pill flex items-center gap-2 rounded-xl border border-(--border) bg-(--card) px-3.5 py-2 text-[13px] font-medium text-(--foreground) transition-all duration-300 ease-out hover:border-(--brand-orange)/40 hover:shadow-[0_8px_20px_-8px_var(--shadow-strong)] ${
                              [
                                "group-hover:-translate-x-2 group-hover:-translate-y-1",
                                "group-hover:-translate-y-2",
                                "group-hover:-translate-x-1.5 group-hover:-translate-y-1.5",
                              ][ti % 3]
                            }${emphasize && i === activeLayer && !atFinish ? " eco-pill-active" : ""}`}
                            style={
                              {
                                transitionDelay: `${ti * 40}ms`,
                                "--pi": ti,
                              } as React.CSSProperties
                            }
                          >
                            <t.icon className="h-4 w-4" style={{ color: t.color }} />
                            {t.name}
                          </span>
                        ))}
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* COMPLETION TERMINUS — the pipeline resolves instead of the
                  rail being cut off: a check node the rail flows into, plus a
                  "pipeline complete" outcome. Lands last, after layer 05. */}
              <div
                className={`relative ${entered ? "eco-layer-enter" : ""}`}
                style={
                  {
                    "--eco-accent": "#54C08A",
                    "--eco-in-delay": `${BASE + LAYERS.length * STEP}ms`,
                    ...(reduced
                      ? {}
                      : assembled
                        ? { animationDelay: `${BASE + LAYERS.length * STEP}ms` }
                        : { opacity: 0 }),
                  } as unknown as React.CSSProperties
                }
              >
                {/* fully wired into the flow's animation system: the dot's
                    arrival fires a green burst (ring + sparks + title
                    re-slide via .eco-arrive from hit detection), and while
                    the dot holds here the node takes the ACTIVE emphasis —
                    lit tile, raised green card surface — as the layers above
                    recede. Same treatment as the five layers, in success
                    green. */}
                <div
                  className="flex items-center gap-5 md:gap-6"
                  style={
                    emphasize
                      ? {
                          filter: atFinish
                            ? "none"
                            : "saturate(0.6) brightness(0.55)",
                          transform: atFinish ? "scale(1.02)" : "scale(0.97)",
                          transformOrigin: "left center",
                          transition: "filter 0.55s ease, transform 0.55s ease",
                        }
                      : undefined
                  }
                >
                  {/* check node sitting on the rail's end */}
                  <div
                    ref={(el) => {
                      tileRefs.current[LAYERS.length] = el;
                    }}
                    className={`eco-finish eco-tile relative z-10 flex h-17 w-17 shrink-0 items-center justify-center rounded-xl border border-[#54C08A]/45 bg-[#54C08A]/12 text-[#54C08A] ${
                      emphasize && atFinish ? "eco-active" : ""
                    }`}
                  >
                    <span aria-hidden className="eco-finish-ring absolute inset-0 rounded-xl border-2 border-[#54C08A]/60" />
                    {/* arrival FX — dormant until the dot reaches the node
                        (.eco-arrive): expanding ring + green spark burst */}
                    {entered && (
                      <>
                        <span
                          aria-hidden
                          className="eco-node-ring absolute inset-0 rounded-xl"
                        />
                        {SPARKS.map(([dx, dy], si) => (
                          <span
                            key={`f${si}`}
                            aria-hidden
                            className="eco-arrive-spark"
                            style={
                              {
                                "--sx": `${dx}px`,
                                "--sy": `${dy}px`,
                                "--ad": `${si * 45}ms`,
                              } as React.CSSProperties
                            }
                          />
                        ))}
                      </>
                    )}
                    <FiCheck className="h-8 w-8" strokeWidth={2.4} />
                  </div>
                  <div className="relative min-w-0 flex-1">
                    {/* raised green card surface while the flow rests here */}
                    <div
                      aria-hidden
                      className={`eco-card-surface ${
                        emphasize && atFinish ? "is-active" : ""
                      }`}
                    />
                    <div className="relative z-10">
                      <p
                        className="font-mono text-xs font-semibold tracking-[0.2em]"
                        style={{ color: "#54C08A" }}
                      >
                        ✓ COMPLETE
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-(--heading)">
                        <span className="eco-arrive-title inline-block">
                          AI Pipeline Complete
                        </span>
                      </h3>
                      <p className="mt-2 max-w-lg text-sm leading-relaxed text-(--text-secondary)">
                        From foundation models to production deployment — every
                        layer orchestrated into one intelligent, scalable
                        system.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
