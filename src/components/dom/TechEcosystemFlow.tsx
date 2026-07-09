"use client";

import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import { FiPlay } from "react-icons/fi";
import {
  TbBrain,
  TbSitemap,
  TbDatabase,
  TbCloud,
  TbRocket,
  TbBox,
  TbStack2,
  TbInfinity,
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
    techs: [
      { name: "Docker", icon: SiDocker, color: "#2496ED" },
      { name: "Kubernetes", icon: SiKubernetes, color: "#326CE5" },
      { name: "Vercel", icon: SiVercel, color: "#FFFFFF" },
      { name: "Terraform", icon: SiTerraform, color: "#9B6DE8" },
    ],
  },
];

const STATS = [
  { icon: TbBox, value: "25+", label: "Technologies" },
  { icon: TbStack2, value: "6", label: "Technology Layers" },
  { icon: TbInfinity, value: "Unlimited", label: "Possibilities", accent: true },
];

// Assembly timing (ms): label at 0, layer i at BASE + i * STEP, rail keeps
// growing in between, outcome after the last layer, particle after it all.
const BASE = 250;
const STEP = 550;
const RAIL_MS = STEP * LAYERS.length; // rail finishes as the outcome lands
const PARTICLE_AT = BASE + RAIL_MS + 500;

export default function TechEcosystemFlow() {
  const flowRef = useRef<HTMLDivElement>(null);
  const particleRef = useRef<HTMLSpanElement>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = useReducedMotion();
  const [assembledState, setAssembledState] = useState(false);
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

  // HIT DETECTION: while the flow is on screen, watch the traveling dot and
  // flare each icon tile (class "eco-hit") the moment the dot crosses its
  // centre — the tile glows and its icon plays its signature burst.
  useEffect(() => {
    if (!assembled || reduced) return;
    let raf = 0;
    let running = false;
    const lastFire: number[] = LAYERS.map(() => 0);

    const loop = () => {
      const dot = particleRef.current;
      if (dot) {
        const dr = dot.getBoundingClientRect();
        const py = dr.top + dr.height / 2;
        const now = performance.now();
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
            row.classList.add("eco-hit");
            setTimeout(() => row.classList.remove("eco-hit"), 1200);
          }
        });
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
  const stepDelay = (i: number) =>
    reduced ? undefined : { transitionDelay: assembled ? `${BASE + i * STEP}ms` : "0ms" };

  return (
    <div className="relative">
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
        {/* ── Left: sticky CTA + quick stats ─────────────────────────── */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <a
            href="#experience"
            className="group inline-flex items-center gap-2.5 rounded-full border border-(--border) bg-(--card) px-6 py-3 text-sm font-medium text-(--foreground) transition-all duration-300 hover:border-(--brand-orange)/50 hover:bg-(--brand-orange)/10 hover:text-(--heading)"
          >
            <FiPlay className="h-3.5 w-3.5 text-[#FF8A3D] transition-transform duration-300 group-hover:scale-110" />
            See How It Works
          </a>

          {/* quick stats card */}
          <div className="mt-10 max-w-sm space-y-6 rounded-2xl border border-(--border) bg-(--card) p-7 backdrop-blur-md">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#FF8A3D]/25 bg-[#FF8A3D]/8 text-[#FF9E55]">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <p
                    className={`text-xl font-bold ${
                      s.accent ? "text-(--brand-orange)" : "text-(--heading)"
                    }`}
                  >
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-xs text-(--text-secondary)">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: the layer flow assembling on a growing timeline ──── */}
        <div ref={flowRef} className="lg:pl-24">
          {/* section label — first beat of the assembly */}
          <p
            className={`mb-8 text-xs font-medium uppercase tracking-[0.3em] text-(--text-secondary) ${stepClass(assembled)}`}
            style={reduced ? undefined : { transitionDelay: "0ms" }}
          >
            From Intelligence to Impact
          </p>

          <div className="relative">
            {/* the timeline rail — a continuous GLOWING line that grows
                top → bottom during assembly */}
            <div
              aria-hidden
              className="absolute bottom-28 left-8.5 top-2 hidden w-0.5 rounded-full bg-linear-to-b from-[#FF8A3D]/60 via-[#FF8A3D]/30 to-[#FF8A3D]/60 shadow-[0_0_10px_rgba(255,138,61,0.4)] md:block"
              style={{
                transform: assembled ? "scaleY(1)" : "scaleY(0)",
                transformOrigin: "top",
                transition: reduced
                  ? undefined
                  : `transform ${RAIL_MS}ms linear ${BASE + 150}ms`,
              }}
            />
            {/* AI DATA FLOW particle — starts once the stack is assembled */}
            {assembled && !reduced && (
              <span
                ref={particleRef}
                aria-hidden
                className="flow-particle absolute left-8.5 hidden -translate-x-1/2 opacity-0 md:block"
                style={{ animationDelay: `${PARTICLE_AT}ms` }}
              >
                <span className="absolute bottom-0.5 left-1/2 h-14 w-0.5 -translate-x-1/2 rounded-full bg-linear-to-t from-[#FF8A3D]/70 via-[#FF8A3D]/25 to-transparent blur-[1px]" />
                <span className="block h-1.25 w-1.25 rounded-full bg-[#FFC08A] shadow-[0_0_6px_2px_rgba(255,138,61,0.9),0_0_18px_7px_rgba(255,138,61,0.35)]" />
              </span>
            )}

            <div className="space-y-16">
              {LAYERS.map((layer, i) => (
                <div
                  key={layer.num}
                  className={`relative ${stepClass(assembled)}`}
                  style={stepDelay(i)}
                >
                  {/* open content block — pills integrated under the copy.
                      Top-aligned so the title's midline sits exactly on the
                      68px tile's centre (16px num + 4px gap + 28px title). */}
                  <div className="group flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
                    {/* icon tile: solid backdrop so the rail passes behind it.
                        Each category icon carries its own subtle idle motion:
                        pulse / network dots / rotating rings / float / launch */}
                    <div
                      ref={(el) => {
                        tileRefs.current[i] = el;
                      }}
                      className="eco-tile relative z-10 flex h-17 w-17 shrink-0 items-center justify-center rounded-xl border border-(--brand-orange)/35 bg-(--brand-orange)/10 text-(--brand-orange) shadow-[0_0_24px_-6px_var(--glow-orange)] group-hover:scale-105"
                    >
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
                    </div>

                    {/* content block: number, title, copy, then its pills */}
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-semibold text-[#FF8A3D]">
                        {layer.num}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-(--heading)">
                        {layer.title}
                      </h3>
                      <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-(--text-secondary)">
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
                            }`}
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
              ))}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
