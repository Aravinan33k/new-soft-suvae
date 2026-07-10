"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import CountUp from "@/components/dom/CountUp";
import GlobeFallback from "@/components/dom/GlobeFallback";
import HeroServiceNetwork from "@/components/dom/HeroServiceNetwork";

// Client wrapper so the three.js globe never blocks first paint, plus the four
// headline company stats floating as minimal text labels spread radially around
// the Earth (HTML for crisp text), echoing the globe's faint orbital rings.
//
// LOAD CHOREOGRAPHY (the hero builds in deliberate stages instead of everything
// fighting for the main thread on first paint):
//   0ms      static placeholder planet rises in with the text — the globe's
//            column is never empty and never shows a half-initialized canvas
//   ~idle    the three.js chunk mounts, parses and warms up at opacity 0,
//            AFTER the browser has painted the text's entrance frames
//   reveal   GlobeScene reports in (textures uploaded, shaders compiled,
//            min-delay elapsed) → live globe dollies in while the placeholder
//            cross-fades out beneath it
//   +after   the service network layer draws in last, keyed off the reveal
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
  { value: "400+", label: "AI & Engineering Specialists", pos: "left-[1%] top-[13%]", align: "text-left", delay: 0 },
  { value: "150+", label: "Global Clients", pos: "left-[1%] bottom-[14%]", align: "text-left", delay: 2.1 },
  { value: "13+", label: "Years of Experience", pos: "right-[1%] top-[13%]", align: "text-right", delay: 1.1 },
  { value: "21+", label: "Countries", pos: "right-[1%] bottom-[14%]", align: "text-right", delay: 3.2 },
];

// Radius of the faint dashed orbit tracks — just outside the globe rim (38).
const ORBIT_R = 46;

export default function HeroGlobe() {
  // three.js only mounts once the browser goes idle after first paint, so the
  // chunk parse + WebGL context creation can't stutter the text's entrance
  const [mountScene, setMountScene] = useState(false);
  // flipped by GlobeScene the moment its staged entrance begins
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const start = () => setMountScene(true);
    let idle: number | null = null;
    let timer: number | null = null;
    // Safari has no requestIdleCallback; either way a timeout backstop makes
    // sure the globe is never held past the text's entrance
    if (typeof window.requestIdleCallback === "function") {
      idle = window.requestIdleCallback(start, { timeout: 600 });
    } else {
      timer = window.setTimeout(start, 350);
    }
    return () => {
      if (idle !== null) window.cancelIdleCallback(idle);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);

  const handleRevealed = useCallback(() => setRevealed(true), []);

  return (
    <div className="relative h-full w-full">
      {/* static planet placeholder: paints with the page (rising in alongside
          the text via hero-reveal on the INNER div), then the OUTER div
          cross-fades it out as the live globe dollies in over it. If WebGL
          never comes up, the reveal never fires and this simply stays — the
          graceful-degradation path for free. */}
      <div
        aria-hidden
        className="absolute inset-0 transition-opacity duration-1000 ease-out"
        style={{ opacity: revealed ? 0 : 1 }}
      >
        <div className="hero-reveal h-full w-full" style={{ animationDelay: "0.3s" }}>
          <GlobeFallback />
        </div>
      </div>

      {mountScene && <GlobeScene onRevealed={handleRevealed} />}

      {/* interactive AI service-node network — communicates WHAT we build,
          reacts to the cursor, threads particles into the globe, and sweeps a
          scanning beam. Sits above the globe but is pointer-transparent, so the
          globe's own drag/rotate still works underneath. Enters last, keyed
          off the globe's reveal, so its canvas loop never competes with the
          globe's warm-up. */}
      <HeroServiceNetwork active={revealed} />

      {/* four headline stats as minimal floating text, spread around the
          globe. STAGED LOAD: each fades in via hero-reveal on the OUTER
          (positioned) wrapper after the globe has entered, while the INNER
          div carries the infinite chip-float — two animations, two elements,
          no conflict. */}
      {STATS.map((s, i) => (
        <div
          key={s.label}
          className={`hero-reveal absolute z-2 w-max max-w-[40%] ${s.pos} ${s.align}`}
          style={{ animationDelay: `${1.15 + i * 0.12}s` }}
        >
          <div className="chip-float" style={{ animationDelay: `-${s.delay}s` }}>
            <div className="text-2xl font-extrabold leading-none tracking-tight text-(--heading) [text-shadow:0_2px_18px_rgba(0,0,0,0.45)] md:text-[1.7rem]">
              <CountUp value={s.value} />
            </div>
            <p className="mt-1.5 text-[11px] font-medium uppercase leading-tight tracking-[0.14em] text-(--text-secondary) [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
              {s.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
