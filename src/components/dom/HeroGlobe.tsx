"use client";

import dynamic from "next/dynamic";
import {
  TbBrain,
  TbSettingsAutomation,
  TbChartBar,
  TbCode,
  TbCloud,
  TbBuildingSkyscraper,
} from "react-icons/tb";

// Client wrapper so the three.js globe never blocks first paint, plus the
// six floating service chips orbiting the Earth (HTML for crisp text) with
// thin connector lines linking each chip to a glowing node on the globe rim.
const GlobeScene = dynamic(() => import("@/components/canvas/GlobeScene"), {
  ssr: false,
  loading: () => null,
});

// Globe geometry in the 0-100 SVG space. The hero container is aspect-square,
// so the globe (three.js: fov 45, cam z 3.8, R 1.15) renders as a circle
// centred here with an apparent radius ~35 — the rim. Every node rides this
// one circle, each at the true angle toward its chip, so the six connectors
// read as a single coordinated system that actually meets the globe.
const GLOBE = { cx: 50, cy: 50, rim: 35 } as const;

const nodeOnRim = (angleDeg: number): [number, number] => {
  const a = (angleDeg * Math.PI) / 180;
  return [GLOBE.cx + GLOBE.rim * Math.cos(a), GLOBE.cy + GLOBE.rim * Math.sin(a)];
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
  title: [string, string];
  sub: string;
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
    icon: TbBrain,
    title: ["AI & Machine", "Learning"],
    sub: "Smarter insights, better decisions",
    pos: "left-[0%] top-[11%]",
    anchor: [24, 21.5],
    angle: 216,
    side: 1,
    delay: 0,
  },
  {
    icon: TbChartBar,
    title: ["Data &", "Analytics"],
    sub: "Transform data into growth",
    pos: "-left-[3%] top-[43%]",
    anchor: [21, 50],
    angle: 180,
    side: 1,
    delay: 2.1,
  },
  {
    icon: TbCloud,
    title: ["Cloud &", "Infrastructure"],
    sub: "Scalable, secure & reliable",
    pos: "left-[0%] bottom-[10%]",
    anchor: [24, 78.5],
    angle: 144,
    side: 1,
    delay: 4.2,
  },
  {
    icon: TbSettingsAutomation,
    title: ["Automation &", "Integration"],
    sub: "Streamline workflows, save time",
    pos: "right-[0%] top-[11%]",
    anchor: [76, 21.5],
    angle: 324,
    side: -1,
    delay: 1.1,
  },
  {
    icon: TbCode,
    title: ["Custom", "Software"],
    sub: "Built for your unique needs",
    pos: "-right-[3%] top-[43%]",
    anchor: [79, 50],
    angle: 0,
    side: -1,
    delay: 3.2,
  },
  {
    icon: TbBuildingSkyscraper,
    title: ["Enterprise", "Solutions"],
    sub: "Power your transformation",
    pos: "right-[0%] bottom-[10%]",
    anchor: [76, 78.5],
    angle: 36,
    side: -1,
    delay: 5.3,
  },
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
        {CHIPS.map((c) => {
          const pts = connector(c.anchor, c.angle, c.side);
          const node = pts[pts.length - 1];
          const anchor = pts[0];
          const poly = pts.map((p) => p.join(",")).join(" ");
          return (
            <g key={c.title.join(" ")}>
              {/* soft under-glow */}
              <polyline
                points={poly}
                fill="none"
                stroke="#FF8A3D"
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
                stroke="#FFC079"
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
              <circle cx={anchor[0]} cy={anchor[1]} r="0.7" fill="#FFC079" />

              {/* rim node: one soft static glow + an occasional gentle pulse */}
              <circle cx={node[0]} cy={node[1]} r="2.4" fill="#FF8A3D" fillOpacity="0.14" />
              <circle cx={node[0]} cy={node[1]} r="1.35" fill="#FF8A3D" fillOpacity="0.3" />
              <circle
                cx={node[0]}
                cy={node[1]}
                r="1.2"
                fill="none"
                stroke="#FFB765"
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
              <circle cx={node[0]} cy={node[1]} r="0.85" fill="#FFE9C7" />
            </g>
          );
        })}
      </svg>

      {/* the chips */}
      {CHIPS.map((chip) => (
        <div
          key={chip.title.join(" ")}
          className={`chip-float absolute z-[2] ${chip.pos} w-[150px] max-w-[46%] rounded-xl border border-white/10 bg-[#0d0d10]/80 px-3 py-2.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.75)] backdrop-blur-md`}
          style={{ animationDelay: `-${chip.delay}s` }}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#FF8A3D]/30 bg-[#FF8A3D]/10">
              <chip.icon className="h-4 w-4 text-[#FF9E55]" />
            </span>
            <span className="text-left text-[10px] font-semibold uppercase leading-[1.25] tracking-[0.06em] text-white">
              {chip.title[0]}
              <br />
              {chip.title[1]}
            </span>
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-zinc-400">
            {chip.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
