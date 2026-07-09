"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { CSSProperties } from "react";
import {
  TbBuildingWarehouse,
  TbPackage,
  TbRobot,
  TbTruck,
  TbTruckDelivery,
  TbCurrentLocation,
  TbClock,
  TbGasStation,
  TbRoute,
} from "react-icons/tb";

// LOGISTICS STORYBOARD — "AI Controls the Entire Supply Chain".
// Five beats (~1.5s each, crossfading): (0) boxes appear in the warehouse,
// (1) AI wires the warehouse to the truck as orange light travels,
// (2) the truck rolls out along an animating GPS route, (3) live tracking
// zooms in with location + ETA, (4) a results dashboard glows in. Reuses
// the shared .eco-* / .ind-* motion classes.

const BEATS = 5;
const BEAT_MS = 1500;
const ORANGE = "#FF8A3D";
const GOLD = "#FFC08A";
const BLUE = "#4EA8FF";

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
  color = ORANGE,
  size = 56,
  glow = true,
}: {
  icon: typeof TbTruck;
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

// A single travelling "orange light" track between two tiles.
function LightTrack({ delayBase = 0 }: { delayBase?: number }) {
  return (
    <div className="relative h-8 w-16 overflow-hidden">
      <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-[#FF8A3D]/25" />
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="eco-particle absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#FFC08A]"
          style={{
            left: 0,
            animationDelay: `${delayBase + i * 0.45}s`,
            "--eco-dist": "64px",
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

export default function LogisticsStory() {
  const reduced = useReducedMotion();
  const [beatState, setBeat] = useState(0);

  useEffect(() => {
    if (reduced) return; // reduced-motion shows the final beat (derived below)
    const id = setInterval(() => setBeat((b) => (b + 1) % BEATS), BEAT_MS);
    return () => clearInterval(id);
  }, [reduced]);

  // reduced-motion: jump straight to the completed beat, no ticking
  const beat = reduced ? BEATS - 1 : beatState;

  const track = "M 20 78 C 90 30, 170 96, 250 44";

  const trackStats = [
    { icon: TbCurrentLocation, label: "Location", value: "98%" },
    { icon: TbClock, label: "ETA", value: "12 min" },
  ];

  const stats = [
    { icon: TbTruckDelivery, label: "Delivery", value: "99%" },
    { icon: TbGasStation, label: "Fuel Saved", value: "28%" },
    { icon: TbRoute, label: "Routes", value: "Optimized" },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ── Beat 0: warehouse — boxes appear ─────────────────────────── */}
      <Layer active={beat === 0}>
        <div className="flex flex-col items-center gap-3">
          <Tile icon={TbBuildingWarehouse} size={60} />
          <div className="flex items-end gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="eco-chip flex h-9 w-9 items-center justify-center rounded-lg border text-[#FFC08A]"
                style={{
                  borderColor: `${ORANGE}45`,
                  background: `${ORANGE}14`,
                  animationDelay: `${i * 0.22}s`,
                }}
              >
                <TbPackage className="h-5 w-5" strokeWidth={1.6} />
              </span>
            ))}
          </div>
          <span className="text-[11px] font-medium text-zinc-300">Warehouse</span>
        </div>
      </Layer>

      {/* ── Beat 1: AI connects warehouse → truck ────────────────────── */}
      <Layer active={beat === 1}>
        <div className="flex items-center gap-1">
          <Tile icon={TbBuildingWarehouse} />
          <LightTrack />
          <div className="flex flex-col items-center gap-1">
            <Tile icon={TbRobot} color={BLUE} />
            <span className="text-[11px] font-semibold text-[#7DBCFF]">AI</span>
          </div>
          <LightTrack delayBase={0.22} />
          <Tile icon={TbTruck} />
        </div>
      </Layer>

      {/* ── Beat 2: truck moves — GPS route animates ─────────────────── */}
      <Layer active={beat === 2}>
        <div className="relative flex h-40 w-full items-center justify-center">
          <svg viewBox="0 0 270 120" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
            {/* faint base route */}
            <path d={track} fill="none" stroke={ORANGE} strokeOpacity={0.2} strokeWidth={2.5} />
            {/* animated GPS dashes travelling along the route */}
            <path
              className="ind-dash"
              d={track}
              fill="none"
              stroke={GOLD}
              strokeWidth={2.5}
              strokeDasharray="5 11"
              strokeLinecap="round"
            />
            {/* origin + destination pins */}
            <circle cx={20} cy={78} r={4} fill={ORANGE} />
            <g transform="translate(250 44)">
              <circle className="ind-ping" r={9} fill="none" stroke={GOLD} strokeWidth={1.5} />
              <circle r={5} fill="#0E1622" stroke={ORANGE} strokeWidth={1.5} />
              <circle r={2} fill={GOLD} />
            </g>
            {/* the truck rolling along the path */}
            <g
              className="ind-travel"
              style={{ offsetPath: `path('${track}')`, animationDuration: "4s" } as CSSProperties}
            >
              <g transform="translate(-9 -6)">
                <rect x={0} y={0} width={13} height={10} rx={1.6} fill={ORANGE} />
                <rect x={13} y={4} width={6} height={6} rx={1} fill={GOLD} />
                <circle cx={4} cy={11} r={2} fill="#0E1622" stroke={GOLD} strokeWidth={0.8} />
                <circle cx={14} cy={11} r={2} fill="#0E1622" stroke={GOLD} strokeWidth={0.8} />
              </g>
            </g>
          </svg>
          <span
            className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full border px-2.5 py-1 text-[10px] font-medium"
            style={{ borderColor: `${ORANGE}55`, color: GOLD, background: `${ORANGE}12` }}
          >
            GPS route active
          </span>
        </div>
      </Layer>

      {/* ── Beat 3: live tracking — location + ETA ───────────────────── */}
      <Layer active={beat === 3}>
        <div className="w-60 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-white">
              <TbTruck className="h-4 w-4" style={{ color: ORANGE }} />
              Live Tracking
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2 py-0.5">
              <span className="ind-blink h-1.5 w-1.5 rounded-full bg-[#F92B4E] shadow-[0_0_8px_#F92B4E]" />
              <span className="text-[9px] font-semibold tracking-wide text-white/80">LIVE</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {trackStats.map((s, i) => (
              <div
                key={s.label}
                className="eco-chip rounded-xl border border-white/10 bg-black/25 px-3 py-2"
                style={{ animationDelay: `${0.15 + i * 0.2}s` }}
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-400">
                  <s.icon className="h-3.5 w-3.5" style={{ color: ORANGE }} />
                  {s.label}
                </div>
                <div className="mt-1 text-lg font-bold text-white tabular-nums">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </Layer>

      {/* ── Beat 4: results dashboard glows in ───────────────────────── */}
      <Layer active={beat === 4}>
        <div className="grid w-full max-w-xs grid-cols-3 gap-3">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="eco-glow flex flex-col items-center gap-1 rounded-2xl border border-[#FF8A3D]/25 bg-white/[0.04] px-2 py-4 text-center backdrop-blur-sm"
              style={{ animationDelay: `${i * 0.25}s` }}
            >
              <s.icon className="h-4 w-4 text-[#FF9E55]" />
              <span className="bg-gradient-to-r from-[#FFB057] to-[#F92B4E] bg-clip-text text-base font-bold text-transparent">
                {s.value}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </Layer>

      {/* beat progress ticks */}
      <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1.5">
        {Array.from({ length: BEATS }).map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === beat ? "w-4 bg-[#FF8A3D]" : "w-1 bg-zinc-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
