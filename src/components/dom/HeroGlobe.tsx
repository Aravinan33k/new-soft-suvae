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
// six floating service chips orbiting the Earth (HTML for crisp text).
const GlobeScene = dynamic(() => import("@/components/canvas/GlobeScene"), {
  ssr: false,
  loading: () => null,
});

const CHIPS = [
  { icon: TbBrain, label: ["AI & Machine", "Learning"], pos: "left-[2%] top-[10%]", delay: 0 },
  { icon: TbChartBar, label: ["Data &", "Analytics"], pos: "-left-[6%] top-[44%]", delay: 2.1 },
  { icon: TbCloud, label: ["Cloud &", "Infrastructure"], pos: "left-[4%] bottom-[8%]", delay: 4.2 },
  { icon: TbSettingsAutomation, label: ["Automation &", "Integration"], pos: "right-[2%] top-[10%]", delay: 1.1 },
  { icon: TbCode, label: ["Custom", "Software"], pos: "-right-[6%] top-[44%]", delay: 3.2 },
  { icon: TbBuildingSkyscraper, label: ["Enterprise", "Solutions"], pos: "right-[4%] bottom-[8%]", delay: 5.3 },
];

export default function HeroGlobe() {
  return (
    <div className="relative h-full w-full">
      <GlobeScene />
      {CHIPS.map((chip) => (
        <div
          key={chip.label.join(" ")}
          className={`chip-float absolute ${chip.pos} flex items-center gap-2 rounded-xl border border-white/10 bg-[#0d0d10]/75 py-1.5 pl-1.5 pr-3 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.7)] backdrop-blur-md`}
          style={{ animationDelay: `-${chip.delay}s` }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#FF8A3D]/30 bg-[#FF8A3D]/10">
            <chip.icon className="h-4 w-4 text-[#FF9E55]" />
          </span>
          <span className="text-left text-[9px] font-semibold uppercase leading-[1.3] tracking-[0.08em] text-zinc-200">
            {chip.label[0]}
            <br />
            {chip.label[1]}
          </span>
        </div>
      ))}
    </div>
  );
}
