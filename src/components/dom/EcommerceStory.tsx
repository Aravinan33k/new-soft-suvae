"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { CSSProperties } from "react";
import {
  TbUser,
  TbShoppingCart,
  TbScan,
  TbSparkles,
  TbShirt,
  TbClock,
  TbHeadphones,
  TbBriefcase,
  TbCreditCard,
  TbCheck,
  TbTrendingUp,
} from "react-icons/tb";

// ECOMMERCE STORYBOARD — "From Visitor to Loyal Customer".
// A five-beat loop, one beat ~1.4s: (0) a visitor arrives at the store,
// (1) AI scans their behaviour, (2) AI recommends products that fan out,
// (3) checkout is auto-optimized, (4) a results dashboard glows in. Beats
// crossfade; the active beat's inner elements carry their own motion.

const BEATS = 5;
const BEAT_MS = 1500;
const ORANGE = "#FF8A3D";
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

// small rounded glyph tile
function Tile({
  icon: Icon,
  color = ORANGE,
  size = 56,
  glow = true,
}: {
  icon: typeof TbUser;
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

export default function EcommerceStory() {
  const reduced = useReducedMotion();
  const [beatState, setBeat] = useState(0);

  useEffect(() => {
    if (reduced) return; // reduced-motion shows the final beat (derived below)
    const id = setInterval(() => setBeat((b) => (b + 1) % BEATS), BEAT_MS);
    return () => clearInterval(id);
  }, [reduced]);

  // reduced-motion: jump straight to the completed beat, no ticking
  const beat = reduced ? BEATS - 1 : beatState;

  const products = [
    { icon: TbShirt, fly: "translate(-92px,-34px)" },
    { icon: TbClock, fly: "translate(92px,-34px)" },
    { icon: TbHeadphones, fly: "translate(-92px,34px)" },
    { icon: TbBriefcase, fly: "translate(92px,34px)" },
  ];

  const checks = ["Discount", "Fast Delivery", "Payment"];

  const stats = [
    { label: "Revenue", value: "+38%" },
    { label: "Orders", value: "+210%" },
    { label: "Customers", value: "+75%" },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ── Beat 0: visitor arrives at the store ─────────────────────── */}
      <Layer active={beat === 0}>
        <div className="flex items-center gap-3">
          <Tile icon={TbUser} />
          {/* particle track */}
          <div className="relative h-8 w-24 overflow-hidden">
            <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-[#FF8A3D]/25" />
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="eco-particle absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#FFC08A]"
                style={{ left: 0, animationDelay: `${i * 0.4}s`, "--eco-dist": "96px" } as CSSProperties}
              />
            ))}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Tile icon={TbShoppingCart} />
            <span className="text-[11px] font-medium text-zinc-300">Website</span>
          </div>
        </div>
      </Layer>

      {/* ── Beat 1: AI scans behaviour ───────────────────────────────── */}
      <Layer active={beat === 1}>
        <div className="flex items-center gap-5">
          {/* scanned visitor */}
          <div className="relative overflow-hidden rounded-2xl">
            <Tile icon={TbUser} color={BLUE} glow={false} />
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
              <TbScan className="h-3.5 w-3.5" /> AI Vision
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["Browsing", "Products", "History", "Clicks"].map((c, i) => (
                <span
                  key={c}
                  className="eco-chip rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-zinc-300"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Layer>

      {/* ── Beat 2: AI recommends products ───────────────────────────── */}
      <Layer active={beat === 2}>
        <div className="relative flex h-40 w-full items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <Tile icon={TbSparkles} />
            <span className="text-[11px] font-semibold text-[#FF9E55]">AI</span>
          </div>
          {products.map((p, i) => (
            <span
              key={i}
              className="eco-fly absolute flex h-10 w-10 items-center justify-center rounded-xl border border-[#FF8A3D]/35 bg-[#0d0d10]/80 text-[#FFC08A] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.7)] backdrop-blur-sm"
              style={{ ["--eco-fly" as string]: p.fly, animationDelay: `${i * 0.12}s` }}
            >
              <p.icon className="h-5 w-5" strokeWidth={1.6} />
            </span>
          ))}
        </div>
      </Layer>

      {/* ── Beat 3: checkout auto-optimized ──────────────────────────── */}
      <Layer active={beat === 3}>
        <div className="w-56 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2">
            <Tile icon={TbCreditCard} size={40} glow={false} />
            <span className="text-sm font-semibold text-white">Checkout</span>
          </div>
          <div className="flex flex-col gap-2">
            {checks.map((c, i) => (
              <div
                key={c}
                className="flex items-center gap-2 text-[13px] text-zinc-200"
              >
                <span
                  className="eco-tick flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: `${GREEN}22`, color: GREEN, animationDelay: `${0.2 + i * 0.25}s` }}
                >
                  <TbCheck className="h-3.5 w-3.5" strokeWidth={2.4} />
                </span>
                {c}
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
              <TbTrendingUp className="h-4 w-4 text-[#FF9E55]" />
              <span className="bg-gradient-to-r from-[#FFB057] to-[#F92B4E] bg-clip-text text-lg font-bold text-transparent">
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
