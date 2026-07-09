"use client";

import dynamic from "next/dynamic";
import CountUp from "@/components/dom/CountUp";

// Client wrapper so the three.js globe never blocks first paint, plus the six
// key metrics floating as minimal text labels spread radially around the Earth
// (HTML for crisp text), echoing the globe's faint orbital rings.
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

type Stat = {
  value: string;
  label: string;
  // radial placement around the globe + text alignment toward it
  pos: string;
  align: string;
  delay: number;
};

const STATS: Stat[] = [
  { value: "50+", label: "Projects Delivered", pos: "left-[2%] top-[13%]", align: "text-right", delay: 0 },
  { value: "15+", label: "AI Solutions", pos: "left-0 top-[45%]", align: "text-right", delay: 2.1 },
  { value: "99.9%", label: "Uptime", pos: "left-[2%] bottom-[15%]", align: "text-right", delay: 4.2 },
  { value: "24/7", label: "Support", pos: "right-[2%] top-[13%]", align: "text-left", delay: 1.1 },
  { value: "200+", label: "Happy Clients", pos: "right-0 top-[45%]", align: "text-left", delay: 3.2 },
  { value: "100%", label: "Secure & Compliant", pos: "right-[2%] bottom-[15%]", align: "text-left", delay: 5.3 },
];

// Radius of the faint dashed orbit tracks — just outside the globe rim (38).
const ORBIT_R = 46;

export default function HeroGlobe() {
  return (
    <div className="relative h-full w-full">
      <GlobeScene />

      {/* faint dashed orbit tracks + a lone comet, behind the floating metrics */}
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
      </svg>

      {/* six key metrics as minimal floating text, spread around the globe */}
      {STATS.map((s) => (
        <div
          key={s.label}
          className={`chip-float absolute z-[2] w-[38%] max-w-[160px] ${s.pos} ${s.align}`}
          style={{ animationDelay: `-${s.delay}s` }}
        >
          <div className="text-2xl font-extrabold leading-none tracking-tight text-(--heading) [text-shadow:0_2px_18px_rgba(0,0,0,0.45)] md:text-[1.7rem]">
            <CountUp value={s.value} />
          </div>
          <p className="mt-1.5 text-[11px] font-medium uppercase leading-tight tracking-[0.14em] text-(--text-secondary) [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
