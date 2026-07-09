import type { CSSProperties } from "react";
import type { IconType } from "react-icons";
import {
  TbShoppingCart,
  TbTag,
  TbGift,
  TbCreditCard,
  TbSchool,
  TbBook,
  TbBulb,
  TbCertificate,
  TbBuildingBank,
  TbCoin,
  TbBrain,
  TbSparkles,
  TbReportMedical,
  TbHeartRateMonitor,
  TbShieldCheck,
} from "react-icons/tb";

// INDUSTRY SCENES — in-house animated "mini AI scenes" behind the showcase.
// Each takes an `accent` (the industry's identity colour) and threads it through
// the whole illustration — the pulsing AI core, its rotating hologram rings,
// the orbiting icon tiles, the data packets, the bars and the insight chip — so
// selecting an industry re-skins the entire scene, not just the title. Motion
// is layered (pulse + spin + orbit + travel) so the panel always feels alive.
// Pure CSS/SVG — no photos, no canvas.

const GOLD = "#FFC08A";

// ── Shared building blocks ─────────────────────────────────────────────

function SceneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {children}
    </div>
  );
}

// The living AI core: a breathing icon wrapped in a pulsing aura, an expanding
// pulse ring, and three rotating "hologram" rings (two flat, one tilted).
function AiCore({
  icon: Icon,
  accent,
  size = 116,
  scan = false,
}: {
  icon: IconType;
  accent: string;
  size?: number;
  scan?: boolean;
}) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* pulsing aura */}
      <span
        className="ind-core-pulse absolute inset-0 rounded-full blur-md"
        style={{ background: `radial-gradient(circle, ${accent}66, transparent 70%)` }}
      />
      {/* expanding pulse ring */}
      <span
        className="pulse-ring absolute inset-0 rounded-full border"
        style={{ borderColor: `${accent}66` }}
      />
      {/* hologram rings — dashed so the rotation reads */}
      <span
        className="ind-spin absolute rounded-full border border-dashed"
        style={{ inset: -14, borderColor: `${accent}55`, animationDuration: "14s" }}
      />
      <span
        className="ind-spin-rev absolute rounded-full border border-dashed"
        style={{ inset: -30, borderColor: `${accent}33`, animationDuration: "22s" }}
      />
      {/* tilted holographic ellipse: parent flattens, child spins inside it */}
      <span className="absolute" style={{ inset: -36, transform: "scaleY(0.4)" }}>
        <span
          className="ind-spin absolute inset-0 rounded-full border border-dashed"
          style={{ borderColor: `${accent}44`, animationDuration: "18s" }}
        />
      </span>
      {/* breathing core */}
      <div
        className="ind-breathe relative flex items-center justify-center overflow-hidden rounded-full border"
        style={{
          height: "74%",
          width: "74%",
          borderColor: `${accent}5a`,
          background: `radial-gradient(circle at 50% 35%, ${accent}33, ${accent}12)`,
          color: accent,
          boxShadow: `0 0 55px -8px ${accent}`,
        }}
      >
        <Icon style={{ height: "50%", width: "50%" }} strokeWidth={1.4} />
        {scan && (
          <span
            className="ind-scan absolute inset-x-0 h-6"
            style={{ background: `linear-gradient(to bottom, transparent, ${accent}b3, transparent)` }}
          />
        )}
      </div>
    </div>
  );
}

// Faint dashed ring marking an orbit path.
function OrbitRing({ size, accent }: { size: number; accent: string }) {
  return (
    <span
      className="pointer-events-none absolute rounded-full border border-dashed"
      style={{ width: size, height: size, borderColor: `${accent}33` }}
    />
  );
}

// Each transform lives on its own element so the static angle, the orbit spin,
// the radius offset, and the upright counter-spin never fight for `transform`:
//   angle (static) > spin (animated) > radius (static) > counter-spin (animated)
function OrbitSatellite({
  icon: Icon,
  radius,
  angle,
  duration,
  accent,
}: {
  icon: IconType;
  radius: number;
  angle: number;
  duration: number;
  accent: string;
}) {
  return (
    <div className="absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
      <div className="ind-orbit absolute inset-0" style={{ animationDuration: `${duration}s` }}>
        <div
          className="absolute left-1/2 top-1/2"
          style={{ transform: `translate(-50%, calc(-50% - ${radius}px))` }}
        >
          <div
            className="ind-orbit-counter flex h-9 w-9 items-center justify-center rounded-lg border bg-[#121A26]/90"
            style={{
              borderColor: `${accent}59`,
              color: accent,
              boxShadow: `0 0 16px -3px ${accent}99`,
              animationDuration: `${duration}s`,
            }}
          >
            <Icon className="h-4 w-4" strokeWidth={1.6} />
          </div>
        </div>
      </div>
    </div>
  );
}

// A tiny glowing "data packet" that flows around an orbit path — the light
// travelling between the core and its nodes.
function OrbitPacket({
  radius,
  angle,
  duration,
  accent,
  delay = 0,
}: {
  radius: number;
  angle: number;
  duration: number;
  accent: string;
  delay?: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
      <div
        className="ind-orbit absolute inset-0"
        style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{ transform: `translate(-50%, calc(-50% - ${radius}px))` }}
        >
          <span
            className="block h-1.5 w-1.5 rounded-full"
            style={{ background: accent, boxShadow: `0 0 8px 1px ${accent}` }}
          />
        </div>
      </div>
    </div>
  );
}

// Floating glass "AI insight" chip.
function AiChip({
  icon: Icon,
  label,
  sub,
  accent,
  delay = 0,
  style,
}: {
  icon: IconType;
  label: string;
  sub?: string;
  accent: string;
  delay?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      className="ind-hover pointer-events-none absolute z-10 flex items-center gap-2 rounded-xl border bg-[#0E1622]/85 px-2.5 py-1.5 shadow-[0_10px_28px_-10px_rgba(0,0,0,0.7)] backdrop-blur-sm"
      style={{ animationDelay: `${delay}s`, borderColor: `${accent}40`, ...style }}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
        style={{ background: `${accent}22`, color: accent }}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
      </span>
      <div className="leading-tight">
        <div className="text-[10px] font-semibold text-white">{label}</div>
        {sub && (
          <div className="text-[9px]" style={{ color: `${accent}cc` }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// Vertical bar that pulses — used for the little inline charts.
function Bars({
  values,
  accent,
  width = "w-2",
  gap = "gap-1.5",
  step = 0.3,
}: {
  values: number[];
  accent: string;
  width?: string;
  gap?: string;
  step?: number;
}) {
  return (
    <div className={`flex items-end ${gap}`}>
      {values.map((h, i) => (
        <span
          key={i}
          className={`ind-bar ${width} rounded-t-sm`}
          style={{
            height: h,
            background: `linear-gradient(to top, ${accent}, ${accent}88)`,
            animationDelay: `${i * step}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── 01 Ecommerce — cart core, orbiting commerce icons, data packets ────
export function EcommerceScene({ accent }: { accent: string }) {
  return (
    <SceneFrame>
      <OrbitRing size={196} accent={accent} />
      <OrbitSatellite icon={TbTag} radius={98} angle={0} duration={16} accent={accent} />
      <OrbitSatellite icon={TbGift} radius={98} angle={120} duration={16} accent={accent} />
      <OrbitSatellite icon={TbCreditCard} radius={98} angle={240} duration={16} accent={accent} />
      <OrbitPacket radius={98} angle={60} duration={6} accent={accent} />
      <OrbitPacket radius={98} angle={200} duration={6} accent={accent} delay={2} />
      <OrbitPacket radius={98} angle={310} duration={6} accent={accent} delay={4} />
      <AiCore icon={TbShoppingCart} accent={accent} />
      <div className="pointer-events-none absolute bottom-8 left-10">
        <Bars values={[14, 22, 17, 28]} accent={accent} />
      </div>
      <AiChip
        icon={TbSparkles}
        label="AI recommends"
        sub="+32% basket size"
        accent={accent}
        delay={0.4}
        style={{ top: 14, right: 14 }}
      />
    </SceneFrame>
  );
}

// ── 02 HealthTech — DNA helix + AI diagnostics core + monitoring ───────
export function HealthTechScene({ accent }: { accent: string }) {
  return (
    <SceneFrame>
      {/* DNA helix on the left — the genome the AI reads */}
      <DnaHelix accent={accent} />

      {/* AI diagnostics core (brain) with a scan sweep in the accent colour */}
      <AiCore icon={TbBrain} accent={accent} size={124} scan />

      {/* Patient monitoring: ECG streaming across the bottom. Two identical
          400-unit periods at 200% width; translating -50% moves one period,
          so the loop repeats with no seam. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 h-12 overflow-hidden opacity-70">
        <svg
          viewBox="0 0 800 60"
          className="ind-ecg-scroll h-full w-[200%]"
          preserveAspectRatio="none"
        >
          <polyline
            points="0,30 150,30 165,8 180,52 195,30 400,30 550,30 565,8 580,52 595,30 800,30"
            fill="none"
            stroke={accent}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <AiChip
        icon={TbReportMedical}
        label="AI diagnosis"
        sub="98.6% confidence"
        accent={accent}
        delay={0.3}
        style={{ top: 14, right: 12 }}
      />

      {/* Medical dashboard: live vitals card */}
      <div
        className="ind-hover pointer-events-none absolute bottom-14 right-5 z-10 w-28 rounded-xl border border-white/10 bg-[#0E1622]/85 p-2.5 shadow-[0_10px_28px_-10px_rgba(0,0,0,0.7)] backdrop-blur-sm"
        style={{ animationDelay: "0.8s" }}
      >
        <div className="flex items-center gap-1.5" style={{ color: accent }}>
          <TbHeartRateMonitor className="h-3.5 w-3.5" strokeWidth={1.7} />
          <span className="text-[9px] font-medium text-white/70">Vitals</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="ind-blink text-lg font-bold text-white">72</span>
          <span className="text-[9px] text-white/50">bpm</span>
        </div>
        <div className="mt-1.5">
          <Bars values={[6, 10, 7, 12, 8, 11, 9]} accent={accent} width="w-1" gap="gap-0.5" step={0.18} />
        </div>
      </div>
    </SceneFrame>
  );
}

// Double-helix from computed base-pairs. Strand X positions come from
// cos(phase); where they cross (cos→0) the rung narrows, reading as a twist.
// The pattern scrolls up (indDnaScroll) so it appears to rotate; it holds two
// full turns, so translateY(-50%) loops seamlessly. One strand takes the
// accent, the other stays warm for a legible duplex.
function DnaHelix({ accent }: { accent: string }) {
  const TURN = 12;
  const RUNGS = TURN * 2;
  const STEP = 14;
  const AMP = 13;
  const CX = 20;
  const H = RUNGS * STEP;

  const rows = Array.from({ length: RUNGS + 1 }, (_, i) => {
    const phase = (i / TURN) * Math.PI * 2;
    const c = Math.cos(phase);
    return {
      y: i * STEP,
      x1: CX + AMP * c,
      x2: CX - AMP * c,
      frontA: c >= 0,
    };
  });

  return (
    <div className="pointer-events-none absolute left-5 top-1/2 h-52 w-12 -translate-y-1/2 overflow-hidden opacity-90">
      <svg viewBox={`0 0 40 ${H}`} className="ind-dna h-[200%] w-full" preserveAspectRatio="none">
        {rows.map((r, i) => (
          <g key={i}>
            <line x1={r.x1} y1={r.y} x2={r.x2} y2={r.y} stroke={GOLD} strokeOpacity={0.35} strokeWidth={1.4} />
            <circle cx={r.x1} cy={r.y} r={r.frontA ? 3 : 2} fill={accent} fillOpacity={r.frontA ? 1 : 0.5} />
            <circle cx={r.x2} cy={r.y} r={r.frontA ? 2 : 3} fill={GOLD} fillOpacity={r.frontA ? 0.5 : 1} />
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── 04 EdTech — graduation core, knowledge orbiting + data packets ─────
export function EdTechScene({ accent }: { accent: string }) {
  return (
    <SceneFrame>
      <OrbitRing size={196} accent={accent} />
      <OrbitSatellite icon={TbBook} radius={98} angle={30} duration={20} accent={accent} />
      <OrbitSatellite icon={TbBulb} radius={98} angle={150} duration={20} accent={accent} />
      <OrbitSatellite icon={TbCertificate} radius={98} angle={270} duration={20} accent={accent} />
      <OrbitPacket radius={98} angle={90} duration={7} accent={accent} />
      <OrbitPacket radius={98} angle={210} duration={7} accent={accent} delay={2.4} />
      <AiCore icon={TbSchool} accent={accent} />
      <AiChip
        icon={TbBrain}
        label="Adaptive path"
        sub="tuned to learner"
        accent={accent}
        delay={0.5}
        style={{ top: 14, right: 14 }}
      />
    </SceneFrame>
  );
}

// ── 05 FinTech — bank core, ticking bars + rising coins ────────────────
export function FinTechScene({ accent }: { accent: string }) {
  return (
    <SceneFrame>
      <div className="pointer-events-none absolute bottom-8">
        <Bars values={[20, 34, 24, 42, 30]} accent={accent} width="w-2.5" gap="gap-2" step={0.25} />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <TbCoin
          key={i}
          className="ind-rise pointer-events-none absolute h-4 w-4"
          style={{ left: `${30 + i * 15}%`, bottom: 24, color: accent, animationDelay: `${i * 1.1}s` }}
        />
      ))}
      <AiCore icon={TbBuildingBank} accent={accent} />
      <AiChip
        icon={TbShieldCheck}
        label="Fraud blocked"
        sub="AI risk score 0.02"
        accent={accent}
        delay={0.3}
        style={{ top: 14, right: 12 }}
      />
    </SceneFrame>
  );
}

