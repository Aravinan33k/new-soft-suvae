"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { CSSProperties } from "react";
import {
  TbBuildingFactory2,
  TbSettings,
  TbSettingsFilled,
  TbRobot,
  TbChevronDown,
  TbCheck,
  TbTrendingUp,
} from "react-icons/tb";

// MANUFACTURING STORYBOARD — "Smart Factory".
// Five beats (~1.5s each, crossfading): (0) the factory runs, smoke rising,
// (1) machines spin up, (2) AI monitors the line with a laser scan, (3) the
// robot fixes a flagged machine (green check), (4) output/efficiency climbs.
// Reuses the shared .eco-* / .ind-* motion classes.

const BEATS = 5;
const BEAT_MS = 1500;
const AMBER = "#FFB020";
const GOLD = "#FFC08A";
const BLUE = "#4EA8FF";
const GREEN = "#34D399";

function Layer({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center px-6 transition-opacity duration-500 ease-out ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

function Tile({
  icon: Icon,
  color = AMBER,
  size = 56,
  glow = true,
}: {
  icon: typeof TbSettings;
  color?: string;
  size?: number;
  glow?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl border ${glow ? "eco-glow" : ""}`}
      style={{
        width: size,
        height: size,
        borderColor: `${color}55`,
        background: `${color}18`,
        color,
      }}
    >
      <Icon style={{ width: size * 0.46, height: size * 0.46 }} strokeWidth={1.6} />
    </div>
  );
}

export default function ManufacturingStory() {
  const reduced = useReducedMotion();
  const [beatState, setBeat] = useState(0);

  useEffect(() => {
    if (reduced) return; // reduced-motion shows the final beat (derived below)
    const id = setInterval(() => setBeat((b) => (b + 1) % BEATS), BEAT_MS);
    return () => clearInterval(id);
  }, [reduced]);

  // reduced-motion: jump straight to the completed beat, no ticking
  const beat = reduced ? BEATS - 1 : beatState;

  // three shop-floor machines (gears)
  const gears = [
    { spin: "ind-spin", dur: "5s", size: 44 },
    { spin: "ind-spin-rev", dur: "7s", size: 60 },
    { spin: "ind-spin", dur: "6s", size: 44 },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ── Beat 0: factory runs, smoke rising ───────────────────────── */}
      <Layer active={beat === 0}>
        <div className="relative flex flex-col items-center gap-3">
          {/* smoke puffs rising from the chimney */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-16 w-16 -translate-x-1/2 -translate-y-14">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="ind-rise absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-white/25 blur-[3px]"
                style={{ bottom: 0, animationDelay: `${i * 1.1}s` } as CSSProperties}
              />
            ))}
          </div>
          <Tile icon={TbBuildingFactory2} size={64} />
          <span className="text-[11px] font-medium text-zinc-300">Smart Factory</span>
        </div>
      </Layer>

      {/* ── Beat 1: machines spin up ─────────────────────────────────── */}
      <Layer active={beat === 1}>
        <div className="flex items-center gap-6">
          {gears.map((g, i) => (
            <TbSettingsFilled
              key={i}
              className={g.spin}
              style={{
                width: g.size,
                height: g.size,
                color: i === 1 ? AMBER : `${GOLD}cc`,
                animationDuration: g.dur,
                filter: `drop-shadow(0 0 10px ${AMBER}66)`,
              }}
            />
          ))}
        </div>
      </Layer>

      {/* ── Beat 2: AI monitors the line (laser scan) ────────────────── */}
      <Layer active={beat === 2}>
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-col items-center gap-0.5">
            <Tile icon={TbRobot} color={BLUE} />
            <span className="text-[11px] font-semibold text-[#7DBCFF]">AI Monitor</span>
          </div>
          <TbChevronDown className="ind-blink h-4 w-4" style={{ color: BLUE }} />
          {/* machine row with a laser scan sweeping over it */}
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3">
            <div className="flex items-center gap-5">
              {[0, 1, 2].map((i) => (
                <TbSettingsFilled
                  key={i}
                  className="ind-spin h-8 w-8"
                  style={{ color: `${GOLD}cc`, animationDuration: `${5 + i}s` }}
                />
              ))}
            </div>
            <span
              className="eco-scan pointer-events-none absolute inset-x-0 top-0 h-5"
              style={{
                background:
                  "linear-gradient(180deg, transparent, rgba(78,168,255,0.6), transparent)",
              }}
            />
          </div>
        </div>
      </Layer>

      {/* ── Beat 3: robot fixes the flagged machine ──────────────────── */}
      <Layer active={beat === 3}>
        <div className="flex items-center gap-4">
          <Tile icon={TbRobot} color={BLUE} />
          <div className="relative">
            <Tile icon={TbSettingsFilled} />
            {/* green "fixed" check badge popping in */}
            <span
              className="eco-tick absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0E1622]"
              style={{ background: GREEN, color: "#0E1622" }}
            >
              <TbCheck className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          </div>
          <span
            className="rounded-full border px-3 py-1 text-sm font-semibold"
            style={{ borderColor: `${GREEN}55`, color: GREEN, background: `${GREEN}14` }}
          >
            Issue Fixed
          </span>
        </div>
      </Layer>

      {/* ── Beat 4: output / efficiency climbs ───────────────────────── */}
      <Layer active={beat === 4}>
        <div className="eco-glow flex items-center gap-4 rounded-2xl border border-[#FFB020]/30 bg-white/[0.04] px-6 py-5 backdrop-blur-sm">
          {/* rising bars */}
          <div className="flex items-end gap-1.5">
            {[16, 26, 22, 34, 42].map((h, i) => (
              <span
                key={i}
                className="ind-bar w-2 rounded-t-sm"
                style={{
                  height: h,
                  background: `linear-gradient(to top, ${AMBER}, ${GOLD})`,
                  animationDelay: `${i * 0.18}s`,
                }}
              />
            ))}
          </div>
          <div className="flex flex-col">
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-zinc-400">
              <TbTrendingUp className="h-3.5 w-3.5" style={{ color: AMBER }} />
              Efficiency
            </span>
            <span className="bg-gradient-to-r from-[#FFD07A] to-[#FF8A3D] bg-clip-text text-3xl font-bold text-transparent tabular-nums">
              +42%
            </span>
          </div>
        </div>
      </Layer>

      {/* beat progress ticks */}
      <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1.5">
        {Array.from({ length: BEATS }).map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === beat ? "w-4 bg-[#FFB020]" : "w-1 bg-zinc-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
