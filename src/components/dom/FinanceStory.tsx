"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { CSSProperties } from "react";
import {
  TbCreditCard,
  TbBuildingBank,
  TbCpu,
  TbAlertTriangle,
  TbShieldCheck,
  TbTrendingDown,
  TbTrendingUp,
} from "react-icons/tb";

// FINANCE STORYBOARD — "AI Detects Fraud".
// Five beats (~1.5s each, crossfading): (0) a payment goes to the bank,
// (1) transactions stream into the AI, (2) fraud is detected with a red
// pulse, (3) the clean ones are verified green, (4) analytics glow in.
// Reuses the .eco-* motion classes.

const BEATS = 5;
const BEAT_MS = 1500;
const GREEN = "#34D399";
const RED = "#F92B4E";
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
  color = GREEN,
  size = 56,
  glow = true,
}: {
  icon: typeof TbCpu;
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

export default function FinanceStory() {
  const reduced = useReducedMotion();
  const [beatState, setBeat] = useState(0);

  useEffect(() => {
    if (reduced) return; // reduced-motion shows the final beat (derived below)
    const id = setInterval(() => setBeat((b) => (b + 1) % BEATS), BEAT_MS);
    return () => clearInterval(id);
  }, [reduced]);

  // reduced-motion: jump straight to the completed beat, no ticking
  const beat = reduced ? BEATS - 1 : beatState;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ── Beat 0: payment → bank ───────────────────────────────────── */}
      <Layer active={beat === 0}>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <Tile icon={TbCreditCard} />
            <span className="text-[11px] font-medium text-zinc-300">Payment</span>
          </div>
          <div className="relative h-8 w-24 overflow-hidden">
            <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-[#34D399]/25" />
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="eco-particle absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#8CF0C2]"
                style={{ left: 0, animationDelay: `${i * 0.4}s`, "--eco-dist": "96px" } as CSSProperties}
              />
            ))}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Tile icon={TbBuildingBank} />
            <span className="text-[11px] font-medium text-zinc-300">Bank</span>
          </div>
        </div>
      </Layer>

      {/* ── Beat 1: transactions stream into the AI ──────────────────── */}
      <Layer active={beat === 1}>
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="eco-chip flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#8CF0C2]"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <TbCreditCard className="h-4 w-4" />
              </span>
            ))}
          </div>
          <div className="relative h-16 w-24 overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="eco-particle absolute h-1.5 w-1.5 rounded-full bg-[#8CF0C2]"
                style={{
                  left: 0,
                  top: `${20 + (i % 3) * 22}%`,
                  animationDelay: `${i * 0.28}s`,
                  "--eco-dist": "92px",
                } as CSSProperties}
              />
            ))}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Tile icon={TbCpu} color={BLUE} />
            <span className="text-[11px] font-semibold" style={{ color: BLUE }}>AI</span>
          </div>
        </div>
      </Layer>

      {/* ── Beat 2: fraud detected (red pulse) ───────────────────────── */}
      <Layer active={beat === 2}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full border animate-[pulse_0.9s_ease-in-out_infinite]"
            style={{
              borderColor: `${RED}66`,
              background: `${RED}1A`,
              color: RED,
              boxShadow: `0 0 46px -6px ${RED}, inset 0 0 26px -8px ${RED}`,
            }}
          >
            <TbAlertTriangle className="h-9 w-9" />
          </div>
          <span
            className="rounded-full border px-3 py-1 text-sm font-semibold"
            style={{ borderColor: `${RED}55`, color: RED, background: `${RED}14` }}
          >
            Fraud Blocked
          </span>
        </div>
      </Layer>

      {/* ── Beat 3: verified (turns green) ───────────────────────────── */}
      <Layer active={beat === 3}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full border animate-[pulse_1.4s_ease-in-out_infinite]"
            style={{
              borderColor: `${GREEN}66`,
              background: `${GREEN}1A`,
              color: GREEN,
              boxShadow: `0 0 46px -6px ${GREEN}, inset 0 0 26px -8px ${GREEN}`,
            }}
          >
            <TbShieldCheck className="h-9 w-9" />
          </div>
          <span
            className="rounded-full border px-3 py-1 text-sm font-semibold"
            style={{ borderColor: `${GREEN}55`, color: GREEN, background: `${GREEN}14` }}
          >
            Verified · Safe
          </span>
        </div>
      </Layer>

      {/* ── Beat 4: analytics glow in ────────────────────────────────── */}
      <Layer active={beat === 4}>
        <div className="grid w-full max-w-[16rem] grid-cols-2 gap-3">
          <div
            className="eco-glow flex flex-col items-center gap-1 rounded-2xl border bg-white/[0.04] px-2 py-4 text-center backdrop-blur-sm"
            style={{ borderColor: `${GREEN}33` }}
          >
            <TbTrendingDown className="h-4 w-4" style={{ color: GREEN }} />
            <span className="bg-gradient-to-r from-[#7CF0BE] to-[#34D399] bg-clip-text text-lg font-bold text-transparent">
              -90%
            </span>
            <span className="text-[10px] uppercase tracking-wide text-zinc-400">Fraud</span>
          </div>
          <div
            className="eco-glow flex flex-col items-center gap-1 rounded-2xl border bg-white/[0.04] px-2 py-4 text-center backdrop-blur-sm"
            style={{ borderColor: `${GREEN}33`, animationDelay: "0.25s" }}
          >
            <TbTrendingUp className="h-4 w-4" style={{ color: GREEN }} />
            <span className="bg-gradient-to-r from-[#FFB057] to-[#F92B4E] bg-clip-text text-lg font-bold text-transparent">
              +500K
            </span>
            <span className="text-[10px] uppercase tracking-wide text-zinc-400">
              Transactions
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
              i === beat ? "w-4 bg-[#34D399]" : "w-1 bg-zinc-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
