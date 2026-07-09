"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { CSSProperties } from "react";
import {
  TbSchool,
  TbRobot,
  TbBooks,
  TbClipboardText,
  TbVideo,
  TbNotes,
  TbTrophy,
} from "react-icons/tb";

// EDUCATION STORYBOARD — "Personalized Learning".
// Five beats (~1.5s each, crossfading): (0) a student, (1) meets an AI
// tutor, (2) a lesson is generated (quiz/video/notes), (3) the student
// learns as a progress bar fills, (4) earns a certificate. Reuses the
// .eco-* motion classes.

const BEATS = 5;
const BEAT_MS = 1500;
const VIOLET = "#B388FF";
const GOLD = "#FFC77A";

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
  color = VIOLET,
  size = 56,
  glow = true,
}: {
  icon: typeof TbSchool;
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

export default function EducationStory() {
  const reduced = useReducedMotion();
  const [beatState, setBeat] = useState(0);

  useEffect(() => {
    if (reduced) return; // reduced-motion shows the final beat (derived below)
    const id = setInterval(() => setBeat((b) => (b + 1) % BEATS), BEAT_MS);
    return () => clearInterval(id);
  }, [reduced]);

  // reduced-motion: jump straight to the completed beat, no ticking
  const beat = reduced ? BEATS - 1 : beatState;

  const lessons = [
    { icon: TbClipboardText, label: "Quiz", fly: "translate(-88px,-6px)" },
    { icon: TbVideo, label: "Video", fly: "translate(0,-52px)" },
    { icon: TbNotes, label: "Notes", fly: "translate(88px,-6px)" },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ── Beat 0: student ──────────────────────────────────────────── */}
      <Layer active={beat === 0}>
        <div className="flex flex-col items-center gap-2">
          <Tile icon={TbSchool} size={64} />
          <span className="text-[11px] font-medium text-zinc-300">Student</span>
        </div>
      </Layer>

      {/* ── Beat 1: meets the AI tutor ───────────────────────────────── */}
      <Layer active={beat === 1}>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <Tile icon={TbSchool} />
            <span className="text-[11px] font-medium text-zinc-300">Student</span>
          </div>
          <div className="relative h-8 w-24 overflow-hidden">
            <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-[#B388FF]/25" />
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="eco-particle absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#D8C4FF]"
                style={{ left: 0, animationDelay: `${i * 0.4}s`, "--eco-dist": "96px" } as CSSProperties}
              />
            ))}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Tile icon={TbRobot} />
            <span className="text-[11px] font-medium text-zinc-300">AI Tutor</span>
          </div>
        </div>
      </Layer>

      {/* ── Beat 2: lesson generated ─────────────────────────────────── */}
      <Layer active={beat === 2}>
        <div className="relative flex h-40 w-full items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <Tile icon={TbBooks} />
            <span className="text-[11px] font-semibold" style={{ color: VIOLET }}>Lesson</span>
          </div>
          {lessons.map((l, i) => (
            <span
              key={l.label}
              className="eco-fly absolute flex flex-col items-center gap-1"
              style={{ ["--eco-fly" as string]: l.fly, animationDelay: `${i * 0.14}s` }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#B388FF]/35 bg-[#0d0d10]/80 text-[#D8C4FF] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.7)] backdrop-blur-sm">
                <l.icon className="h-5 w-5" strokeWidth={1.6} />
              </span>
              <span className="text-[10px] text-zinc-400">{l.label}</span>
            </span>
          ))}
        </div>
      </Layer>

      {/* ── Beat 3: student learns (progress fills) ──────────────────── */}
      <Layer active={beat === 3}>
        <div className="w-60">
          <div className="mb-2 flex items-center justify-between text-[12px] text-zinc-300">
            <span className="flex items-center gap-1.5">
              <TbSchool className="h-4 w-4" style={{ color: VIOLET }} />
              Learning…
            </span>
            <span className="font-semibold" style={{ color: VIOLET }}>
              Progress
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="eco-fill h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${VIOLET}, #7C5CFF)` }}
            />
          </div>
        </div>
      </Layer>

      {/* ── Beat 4: certificate ──────────────────────────────────────── */}
      <Layer active={beat === 4}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full border animate-[pulse_1.4s_ease-in-out_infinite]"
            style={{
              borderColor: `${GOLD}66`,
              background: `${GOLD}1A`,
              color: GOLD,
              boxShadow: `0 0 46px -6px ${GOLD}, inset 0 0 26px -8px ${GOLD}`,
            }}
          >
            <TbTrophy className="h-9 w-9" />
          </div>
          <span
            className="rounded-full border px-3 py-1 text-sm font-semibold"
            style={{ borderColor: `${GOLD}55`, color: GOLD, background: `${GOLD}14` }}
          >
            Certified
          </span>
        </div>
      </Layer>

      {/* beat progress ticks */}
      <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1.5">
        {Array.from({ length: BEATS }).map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === beat ? "w-4 bg-[#B388FF]" : "w-1 bg-zinc-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
