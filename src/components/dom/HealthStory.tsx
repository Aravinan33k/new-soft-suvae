"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { CSSProperties } from "react";
import {
  TbMoodSmile,
  TbBuildingHospital,
  TbBrain,
  TbDna2,
  TbHeartbeat,
  TbScan,
  TbActivity,
  TbStethoscope,
  TbVaccine,
  TbPill,
  TbReportMedical,
  TbHeartFilled,
} from "react-icons/tb";

// HEALTHCARE STORYBOARD — "Diagnosis in Seconds".
// Five beats (~1.5s each, crossfading): (0) a patient arrives at the
// hospital, (1) AI scans DNA/heart/X-ray, (2) AI detects a risk as a
// neural net forms, (3) the doctor receives recommendations, (4) the
// patient recovers with a green glow. Reuses the .eco-* motion classes.

const BEATS = 5;
const BEAT_MS = 1500;
const TEAL = "#2ED3B7";
const BLUE = "#4EA8FF";
const GREEN = "#34D399";
const AMBER = "#FFB020";

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
  color = TEAL,
  size = 56,
  glow = true,
}: {
  icon: typeof TbBrain;
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

export default function HealthStory() {
  const reduced = useReducedMotion();
  const [beatState, setBeat] = useState(0);

  useEffect(() => {
    if (reduced) return; // reduced-motion shows the final beat (derived below)
    const id = setInterval(() => setBeat((b) => (b + 1) % BEATS), BEAT_MS);
    return () => clearInterval(id);
  }, [reduced]);

  // reduced-motion: jump straight to the completed beat, no ticking
  const beat = reduced ? BEATS - 1 : beatState;

  const scans = [
    { icon: TbDna2, label: "DNA" },
    { icon: TbHeartbeat, label: "Heart" },
    { icon: TbScan, label: "X-Ray" },
  ];
  const recs = [
    { icon: TbVaccine, label: "Treatment" },
    { icon: TbPill, label: "Medicine" },
    { icon: TbReportMedical, label: "Report" },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ── Beat 0: patient arrives ──────────────────────────────────── */}
      <Layer active={beat === 0}>
        <div className="flex items-center gap-3">
          <Tile icon={TbMoodSmile} />
          <div className="relative h-8 w-24 overflow-hidden">
            <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-[#2ED3B7]/25" />
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="eco-particle absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#8CF0DE]"
                style={{ left: 0, animationDelay: `${i * 0.4}s`, "--eco-dist": "96px" } as CSSProperties}
              />
            ))}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Tile icon={TbBuildingHospital} />
            <span className="text-[11px] font-medium text-zinc-300">Hospital</span>
          </div>
        </div>
      </Layer>

      {/* ── Beat 1: AI scans ─────────────────────────────────────────── */}
      <Layer active={beat === 1}>
        <div className="flex items-center gap-5">
          <div className="relative overflow-hidden rounded-2xl">
            <Tile icon={TbBrain} color={BLUE} glow={false} />
            <span
              className="eco-scan pointer-events-none absolute inset-x-0 top-0 h-4"
              style={{
                background:
                  "linear-gradient(180deg, transparent, rgba(78,168,255,0.55), transparent)",
              }}
            />
          </div>
          <div>
            <div
              className="mb-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
              style={{ borderColor: `${BLUE}55`, color: BLUE, background: `${BLUE}14` }}
            >
              <TbScan className="h-3.5 w-3.5" /> AI Scan
            </div>
            <div className="flex flex-wrap gap-1.5">
              {scans.map((c, i) => (
                <span
                  key={c.label}
                  className="eco-chip inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-zinc-300"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <c.icon className="h-3 w-3" style={{ color: TEAL }} />
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Layer>

      {/* ── Beat 2: AI detects issue (neural net forms) ──────────────── */}
      <Layer active={beat === 2}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Tile icon={TbBrain} />
            {/* tiny neural network forming around the brain */}
            <svg className="pointer-events-none absolute -inset-3 h-[calc(100%+24px)] w-[calc(100%+24px)]" viewBox="0 0 80 80" fill="none">
              {[
                [12, 14],
                [68, 20],
                [16, 64],
                [66, 60],
              ].map(([x, y], i) => (
                <g key={i}>
                  <line x1="40" y1="40" x2={x} y2={y} stroke={TEAL} strokeOpacity="0.5" strokeWidth="1">
                    <animate attributeName="stroke-opacity" values="0;0.6;0.2" dur="1.4s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
                  </line>
                  <circle cx={x} cy={y} r="2.4" fill={TEAL}>
                    <animate attributeName="r" values="0;2.6;2" dur="1.4s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
                  </circle>
                </g>
              ))}
            </svg>
          </div>
          <div
            className="rounded-2xl border px-4 py-3 text-center"
            style={{ borderColor: `${AMBER}55`, background: `${AMBER}12` }}
          >
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-zinc-300">
              <TbActivity className="h-3.5 w-3.5" style={{ color: AMBER }} />
              Disease Risk
            </div>
            <div
              className="mt-1 text-2xl font-bold"
              style={{ color: AMBER }}
            >
              92%
            </div>
          </div>
        </div>
      </Layer>

      {/* ── Beat 3: doctor receives recommendations ──────────────────── */}
      <Layer active={beat === 3}>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <Tile icon={TbStethoscope} />
            <span className="text-[11px] font-medium text-zinc-300">Doctor</span>
          </div>
          <div className="w-44 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm">
            {recs.map((r, i) => (
              <div
                key={r.label}
                className="eco-chip flex items-center gap-2 py-1 text-[13px] text-zinc-200"
                style={{ animationDelay: `${0.15 + i * 0.2}s` }}
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-lg"
                  style={{ background: `${TEAL}22`, color: TEAL }}
                >
                  <r.icon className="h-3.5 w-3.5" />
                </span>
                {r.label}
              </div>
            ))}
          </div>
        </div>
      </Layer>

      {/* ── Beat 4: patient improves (green glow) ────────────────────── */}
      <Layer active={beat === 4}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full border animate-[pulse_1.3s_ease-in-out_infinite]"
            style={{
              borderColor: `${GREEN}66`,
              background: `${GREEN}1A`,
              color: GREEN,
              boxShadow: `0 0 46px -6px ${GREEN}, inset 0 0 26px -8px ${GREEN}`,
            }}
          >
            <TbHeartFilled className="h-9 w-9" />
          </div>
          <span
            className="rounded-full border px-3 py-1 text-sm font-semibold"
            style={{ borderColor: `${GREEN}55`, color: GREEN, background: `${GREEN}14` }}
          >
            Recovered
          </span>
        </div>
      </Layer>

      {/* beat progress ticks */}
      <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1.5">
        {Array.from({ length: BEATS }).map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === beat ? "w-4 bg-[#2ED3B7]" : "w-1 bg-zinc-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
