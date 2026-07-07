"use client";

import dynamic from "next/dynamic";
import {
  TbRocket,
  TbBrain,
  TbClock,
  TbHeadset,
  TbUsers,
  TbShieldCheck,
  TbCpu,
  TbDatabase,
  TbCloud,
  TbCode,
} from "react-icons/tb";
import CountUp from "@/components/dom/CountUp";

// Client wrapper so the three.js globe never blocks first paint, plus the
// six floating metric chips orbiting the Earth (HTML for crisp text) with
// thin connector lines linking each chip to a glowing node on the globe rim.
const GlobeScene = dynamic(() => import("@/components/canvas/GlobeScene"), {
  ssr: false,
  loading: () => null,
});

// Globe geometry in the 0-100 SVG space. The hero container is aspect-square,
// so the globe (three.js: fov 45, cam z 3.8, R 1.24) renders as a circle
// centred here with an apparent radius ~39 — the rim. Every node rides this
// one circle, each at the true angle toward its chip, so the six connectors
// read as a single coordinated system that actually meets the globe.
const GLOBE = { cx: 50, cy: 50, rim: 38 } as const;

// Round to 3 decimals so server- and client-computed trig serialize to the
// exact same string (avoids React hydration mismatches from float drift).
const round3 = (n: number) => Math.round(n * 1000) / 1000;

const nodeOnRim = (angleDeg: number): [number, number] => {
  const a = (angleDeg * Math.PI) / 180;
  return [
    round3(GLOBE.cx + GLOBE.rim * Math.cos(a)),
    round3(GLOBE.cy + GLOBE.rim * Math.sin(a)),
  ];
};

// A crisp L-connector: a short horizontal stub out of the chip's inner edge,
// then one 45° diagonal onto the rim node. `side` is +1 for chips on the left
// (stub runs toward the globe) and -1 for chips on the right. When the node
// sits level with the anchor (the mid chips) it collapses to a clean stub.
const connector = (
  anchor: [number, number],
  angleDeg: number,
  side: 1 | -1,
): [number, number][] => {
  const node = nodeOnRim(angleDeg);
  const drop = Math.abs(node[1] - anchor[1]); // 45° ⇒ horizontal run == drop
  if (drop < 0.5) return [anchor, node];
  const elbow: [number, number] = [node[0] + side * drop, anchor[1]];
  return [anchor, elbow, node];
};

type Chip = {
  icon: typeof TbBrain;
  value: string;
  label: string;
  pos: string;
  // chip inner-edge anchor (0-100 SVG space), rim-node angle (deg, y-down),
  // and which side of the globe the chip sits on
  anchor: [number, number];
  angle: number;
  side: 1 | -1;
  delay: number;
};

const CHIPS: Chip[] = [
  {
    icon: TbRocket,
    value: "50+",
    label: "Projects Delivered",
    pos: "left-[0%] top-[11%]",
    anchor: [24, 21.5],
    angle: 216,
    side: 1,
    delay: 0,
  },
  {
    icon: TbBrain,
    value: "15+",
    label: "AI Solutions",
    pos: "-left-[3%] top-[43%]",
    anchor: [21, 50],
    angle: 180,
    side: 1,
    delay: 2.1,
  },
  {
    icon: TbClock,
    value: "99.9%",
    label: "Uptime",
    pos: "left-[0%] bottom-[10%]",
    anchor: [24, 78.5],
    angle: 144,
    side: 1,
    delay: 4.2,
  },
  {
    icon: TbHeadset,
    value: "24/7",
    label: "Support",
    pos: "right-[0%] top-[11%]",
    anchor: [76, 21.5],
    angle: 324,
    side: -1,
    delay: 1.1,
  },
  {
    icon: TbUsers,
    value: "200+",
    label: "Happy Clients",
    pos: "-right-[3%] top-[43%]",
    anchor: [79, 50],
    angle: 0,
    side: -1,
    delay: 3.2,
  },
  {
    icon: TbShieldCheck,
    value: "100%",
    label: "Secure & Compliant",
    pos: "right-[0%] bottom-[10%]",
    anchor: [76, 78.5],
    angle: 36,
    side: -1,
    delay: 5.3,
  },
];

// Tech icons riding the outer orbit track. The layer spins as one unit
// (orbitSpin) while each badge counter-spins at the same rate so it stays
// upright — starting on the diagonals to fill the corner gaps.
const ORBITERS = [
  { icon: TbCpu, angle: 30 },
  { icon: TbDatabase, angle: 120 },
  { icon: TbCloud, angle: 210 },
  { icon: TbCode, angle: 300 },
];
const ORBIT_R = 46; // % of the container — just outside the globe rim (38)

// Dashed beams tying each holographic panel to its own glowing rim node,
// same 0-100 SVG space as the chip connectors above.
const HOLO_LINKS: { anchor: [number, number]; angle: number }[] = [
  { anchor: [54, 10.5], angle: 279 }, // top "Neural Link" panel
  { anchor: [40, 91], angle: 102 }, // bottom "Data Stream" panel
];

export default function HeroGlobe() {
  return (
    <div className="relative h-full w-full">
      <GlobeScene />

      {/* elbow connector lines chip -> globe rim node (behind the chips) */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] hidden h-full w-full md:block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* dashed orbit tracks — the path the tech icons ride, plus a wider
            counter-rotating guide with a lone comet for parallax depth */}
        <circle
          cx={GLOBE.cx}
          cy={GLOBE.cy}
          r={ORBIT_R}
          fill="none"
          stroke="#FF9A3C"
          strokeOpacity="0.13"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="0.6 2.2"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${GLOBE.cx} ${GLOBE.cy}`}
            to={`-360 ${GLOBE.cx} ${GLOBE.cy}`}
            dur="90s"
            repeatCount="indefinite"
          />
        </circle>
        <circle
          cx={GLOBE.cx}
          cy={GLOBE.cy}
          r={49}
          fill="none"
          stroke="#FFC76A"
          strokeOpacity="0.07"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="0.3 3"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${GLOBE.cx} ${GLOBE.cy}`}
            to={`360 ${GLOBE.cx} ${GLOBE.cy}`}
            dur="140s"
            repeatCount="indefinite"
          />
        </circle>
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${GLOBE.cx} ${GLOBE.cy}`}
            to={`360 ${GLOBE.cx} ${GLOBE.cy}`}
            dur="34s"
            repeatCount="indefinite"
          />
          <circle cx={GLOBE.cx + 49} cy={GLOBE.cy} r="1.6" fill="#FFC76A" fillOpacity="0.18" />
          <circle cx={GLOBE.cx + 49} cy={GLOBE.cy} r="0.6" fill="#FFF7E6" fillOpacity="0.9" />
        </g>

        {/* flowing dashed beams: holographic panel -> glowing rim node */}
        {HOLO_LINKS.map((l) => {
          const node = nodeOnRim(l.angle);
          return (
            <g key={l.angle}>
              <line
                x1={l.anchor[0]}
                y1={l.anchor[1]}
                x2={node[0]}
                y2={node[1]}
                stroke="#FFC76A"
                strokeOpacity="0.55"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                strokeDasharray="0.9 0.9"
                className="hero-beam-flow"
              />
              <circle cx={node[0]} cy={node[1]} r="1.8" fill="#FF9A3C" fillOpacity="0.16" />
              <circle cx={node[0]} cy={node[1]} r="0.7" fill="#FFF7E6" />
            </g>
          );
        })}

        {CHIPS.map((c) => {
          const pts = connector(c.anchor, c.angle, c.side);
          const node = pts[pts.length - 1];
          const anchor = pts[0];
          const poly = pts.map((p) => p.join(",")).join(" ");
          return (
            <g key={c.label}>
              {/* soft under-glow */}
              <polyline
                points={poly}
                fill="none"
                stroke="#FF9A3C"
                strokeOpacity="0.2"
                strokeWidth="3.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* crisp core stroke — draws itself in on load */}
              <polyline
                points={poly}
                fill="none"
                stroke="#FFC76A"
                strokeOpacity="0.95"
                strokeWidth="1.3"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset="1"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="1"
                  to="0"
                  dur="0.9s"
                  begin={`${0.2 + c.delay * 0.12}s`}
                  fill="freeze"
                  calcMode="spline"
                  keySplines="0.22 1 0.36 1"
                  keyTimes="0;1"
                />
              </polyline>

              {/* small tab where the line meets the chip's inner edge */}
              <circle cx={anchor[0]} cy={anchor[1]} r="0.7" fill="#FFC76A" />

              {/* rim node: one soft static glow + an occasional gentle pulse */}
              <circle cx={node[0]} cy={node[1]} r="2.4" fill="#FF9A3C" fillOpacity="0.14" />
              <circle cx={node[0]} cy={node[1]} r="1.35" fill="#FF9A3C" fillOpacity="0.3" />
              <circle
                cx={node[0]}
                cy={node[1]}
                r="1.2"
                fill="none"
                stroke="#FFC76A"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              >
                <animate
                  attributeName="r"
                  values="1.2;1.2;3.4"
                  keyTimes="0;0.8;1"
                  dur="6.5s"
                  begin={`${0.9 + c.delay * 0.8}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="stroke-opacity"
                  values="0;0;0.5;0"
                  keyTimes="0;0.8;0.88;1"
                  dur="6.5s"
                  begin={`${0.9 + c.delay * 0.8}s`}
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx={node[0]} cy={node[1]} r="0.85" fill="#FFF7E6" />
            </g>
          );
        })}
      </svg>

      {/* floating holographic mini-panels in the empty top/bottom gaps —
          translucent glass tilted in 3D, scanline sweeping, fake telemetry */}
      <div
        aria-hidden
        className="hero-holo pointer-events-none absolute left-[44%] top-0 z-[1] hidden w-[132px] md:block"
        style={{ "--holo-tilt": "16deg" } as React.CSSProperties}
      >
        <div className="relative overflow-hidden rounded-lg border border-[#FF8A3D]/20 bg-[#0d0d10]/55 px-3 py-2.5 shadow-[0_0_24px_-8px_rgba(255,138,61,0.45)] backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FFC76A]" />
            <span className="text-[8px] font-semibold uppercase tracking-[0.22em] text-[#FFB057]/90">
              Neural Link
            </span>
          </div>
          <div className="mt-2 space-y-1.5">
            {[
              { w: "100%", d: "0s" },
              { w: "72%", d: "-1.1s" },
              { w: "52%", d: "-2.2s" },
            ].map((bar) => (
              <span
                key={bar.w}
                className="holo-bar block h-[3px] rounded-full bg-gradient-to-r from-[#FF8A3D]/70 to-[#FFC76A]/25"
                style={{ width: bar.w, animationDelay: bar.d }}
              />
            ))}
          </div>
          <span className="holo-scanline absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-[#FFC76A]/10 to-transparent" />
        </div>
      </div>
      <div
        aria-hidden
        className="hero-holo pointer-events-none absolute bottom-0 left-[28%] z-[1] hidden w-[136px] md:block"
        style={{ "--holo-tilt": "-14deg", animationDelay: "-3.5s" } as React.CSSProperties}
      >
        <div className="relative overflow-hidden rounded-lg border border-[#FF8A3D]/20 bg-[#0d0d10]/55 px-3 py-2 shadow-[0_0_24px_-8px_rgba(255,138,61,0.45)] backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-semibold uppercase tracking-[0.22em] text-[#FFB057]/90">
              Data Stream
            </span>
            <span className="text-[8px] font-bold text-[#FFC76A]">24ms</span>
          </div>
          <svg viewBox="0 0 96 22" className="mt-1.5 h-5 w-full" aria-hidden>
            <polyline
              points="0,17 12,13 24,15 36,7 48,11 60,4 72,9 84,3 96,7"
              fill="none"
              stroke="#FF9A3C"
              strokeOpacity="0.25"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <polyline
              points="0,17 12,13 24,15 36,7 48,11 60,4 72,9 84,3 96,7"
              fill="none"
              stroke="#FFC76A"
              strokeOpacity="0.9"
              strokeWidth="1.4"
              strokeLinejoin="round"
              strokeDasharray="4 3"
              className="hero-beam-flow"
            />
          </svg>
          <span className="holo-scanline absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-[#FFC76A]/10 to-transparent" />
        </div>
      </div>

      {/* orbiting tech icons riding the dashed track (behind the chips) */}
      <div
        aria-hidden
        className="orbit-spin pointer-events-none absolute inset-0 z-[1] hidden md:block"
      >
        {ORBITERS.map((o) => {
          const a = (o.angle * Math.PI) / 180;
          return (
            <div
              key={o.angle}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${round3(50 + ORBIT_R * Math.cos(a))}%`,
                top: `${round3(50 + ORBIT_R * Math.sin(a))}%`,
              }}
            >
              <div className="orbit-counter flex h-8 w-8 items-center justify-center rounded-lg border border-[#FF8A3D]/25 bg-[#0d0d10]/70 shadow-[0_0_18px_-4px_rgba(255,138,61,0.5)] backdrop-blur-sm">
                <o.icon className="h-4 w-4 text-[#FF9E55]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* the chips */}
      {CHIPS.map((chip) => (
        <div
          key={chip.label}
          className={`chip-float absolute z-[2] ${chip.pos} w-[150px] max-w-[46%] rounded-xl border border-white/10 bg-[#0d0d10]/80 px-3 py-2.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.75)] backdrop-blur-md`}
          style={{ animationDelay: `-${chip.delay}s` }}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#FF8A3D]/30 bg-[#FF8A3D]/10">
              <chip.icon className="h-4 w-4 text-[#FF9E55]" />
            </span>
            <span className="text-left text-lg font-bold leading-none text-white">
              <CountUp value={chip.value} />
            </span>
          </div>
          <p className="mt-1.5 text-[10px] font-medium uppercase leading-snug tracking-[0.08em] text-zinc-400">
            {chip.label}
          </p>
        </div>
      ))}
    </div>
  );
}
