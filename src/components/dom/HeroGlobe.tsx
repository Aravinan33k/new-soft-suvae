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
// thin connector lines linking each chip to a glowing node on the globe.
const GlobeScene = dynamic(() => import("@/components/canvas/GlobeScene"), {
  ssr: false,
  loading: () => null,
});

type Chip = {
  icon: typeof TbBrain;
  title: [string, string];
  sub: string;
  pos: string;
  // elbow connector in 0-100 SVG space: [chip anchor, elbow, globe node]
  pts: [number, number][];
  delay: number;
};

const CHIPS: Chip[] = [
  {
    icon: TbBrain,
    title: ["AI & Machine", "Learning"],
    sub: "Smarter insights, better decisions",
    pos: "left-[0%] top-[11%]",
    pts: [[19, 23], [27, 23], [35, 31]],
    delay: 0,
  },
  {
    icon: TbChartBar,
    title: ["Data &", "Analytics"],
    sub: "Transform data into growth",
    pos: "-left-[3%] top-[43%]",
    pts: [[15, 50], [20, 50], [24, 49]],
    delay: 2.1,
  },
  {
    icon: TbCloud,
    title: ["Cloud &", "Infrastructure"],
    sub: "Scalable, secure & reliable",
    pos: "left-[0%] bottom-[10%]",
    pts: [[19, 77], [27, 77], [35, 69]],
    delay: 4.2,
  },
  {
    icon: TbSettingsAutomation,
    title: ["Automation &", "Integration"],
    sub: "Streamline workflows, save time",
    pos: "right-[0%] top-[11%]",
    pts: [[81, 23], [73, 23], [65, 31]],
    delay: 1.1,
  },
  {
    icon: TbCode,
    title: ["Custom", "Software"],
    sub: "Built for your unique needs",
    pos: "-right-[3%] top-[43%]",
    pts: [[85, 50], [80, 50], [76, 49]],
    delay: 3.2,
  },
  {
    icon: TbBuildingSkyscraper,
    title: ["Enterprise", "Solutions"],
    sub: "Power your transformation",
    pos: "right-[0%] bottom-[10%]",
    pts: [[81, 77], [73, 77], [65, 69]],
    delay: 5.3,
  },
];

export default function HeroGlobe() {
  return (
    <div className="relative h-full w-full">
      <GlobeScene />

      {/* elbow connector lines chip -> globe node (behind the chips) */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] hidden h-full w-full md:block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {CHIPS.map((c) => {
          const node = c.pts[c.pts.length - 1];
          const poly = c.pts.map((p) => p.join(",")).join(" ");
          return (
            <g key={c.title.join(" ")}>
              {/* soft under-glow stroke */}
              <polyline
                points={poly}
                fill="none"
                stroke="#FF8A3D"
                strokeOpacity="0.28"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* crisp core stroke */}
              <polyline
                points={poly}
                fill="none"
                stroke="#FFB765"
                strokeOpacity="0.95"
                strokeWidth="1.4"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* a light pulse traveling chip -> globe */}
              <circle r="1" fill="#fff">
                <animateMotion
                  dur={`${2.2 + c.delay * 0.15}s`}
                  begin={`${c.delay * 0.3}s`}
                  repeatCount="indefinite"
                  path={`M${c.pts.map((p) => p.join(",")).join(" L")}`}
                />
              </circle>
              {/* glowing node on the globe */}
              <circle cx={node[0]} cy={node[1]} r="1.6" fill="#FF8A3D" fillOpacity="0.5">
                <animate
                  attributeName="r"
                  values="1.4;2.4;1.4"
                  dur="2.4s"
                  begin={`${c.delay * 0.3}s`}
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx={node[0]} cy={node[1]} r="0.85" fill="#FFE3B0" />
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
