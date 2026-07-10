import { FiArrowRight } from "react-icons/fi";
import {
  TbCalendarEvent,
  TbUserFilled,
  TbSend,
  TbClock,
  TbMessageCircle,
  TbTrendingUp,
} from "react-icons/tb";

// "Consult the Expert" — the CTA composition: a holographic AI-consultant
// figure stands at the centre with floating insight panels, while elliptical
// orbit lines sweep outward through the two engagement cards (Plan Ahead /
// Instant Connect) docked either side. Below, the "Unlock Your Path" strip
// closes the section. The figure is a stylised scan-line hologram (pure SVG)
// rather than a photo render, matching the site's orange-holo language.

const ENGINEERS = [
  { initials: "SI", from: "#FF9440", to: "#F92B4E" },
  { initials: "AP", from: "#4EA8FF", to: "#8B5CF6" },
  { initials: "RK", from: "#2ED3B7", to: "#4EA8FF" },
];

// Frosted-glass feature cards with a lit orange edge ring (see .card-frosted
// in globals.css) — a distinct material from the site's other card families.
const CARD =
  "card-frosted group relative z-10 flex flex-col rounded-2xl p-7 text-center";

const EYEBROW =
  "text-[10px] font-semibold uppercase tracking-[0.25em] text-(--brand-orange)";

// ── The holographic expert ────────────────────────────────────────────
// A faceted, scan-lined silhouette with a rim-light stroke, drawn once in
// <defs> and reused for the body fill + the scan-line overlay.
function HoloExpert() {
  return (
    <svg
      viewBox="0 0 220 360"
      className="relative h-full w-full"
      fill="none"
      aria-hidden
    >
      <defs>
        {/* single compound silhouette: head, neck, torso, arms, legs, feet */}
        <path
          id="cp-fig"
          d="M110 19 a21 21 0 1 0 0.01 0 Z
             M102 62 L118 62 L118 74 L102 74 Z
             M110 74 L150 86 L156 96 L148 200 L72 200 L64 96 L70 86 Z
             M64 98 L52 106 L48 182 L60 186 L66 160 Z
             M156 98 L168 106 L172 182 L160 186 L154 160 Z
             M76 200 L104 200 L100 340 L82 340 Z
             M116 200 L144 200 L138 340 L120 340 Z
             M82 340 L100 340 L104 348 L80 348 Z
             M120 340 L138 340 L142 348 L118 348 Z"
        />
        <linearGradient id="cp-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#232838" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0d0f18" stopOpacity="0.98" />
        </linearGradient>
        <linearGradient id="cp-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFB057" />
          <stop offset="100%" stopColor="#FF6A3D" />
        </linearGradient>
        <pattern
          id="cp-scan"
          width="6"
          height="5"
          patternUnits="userSpaceOnUse"
        >
          <rect width="6" height="1.4" fill="#FF8A3D" />
        </pattern>
        <filter id="cp-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="7"
            floodColor="#FF8A3D"
            floodOpacity="0.4"
          />
        </filter>
        <radialGradient id="cp-base" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF8A3D" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FF8A3D" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* light pool + pedestal rings under the feet */}
      <ellipse cx="110" cy="344" rx="72" ry="13" fill="url(#cp-base)" />
      <ellipse
        cx="110"
        cy="344"
        rx="58"
        ry="10"
        stroke="url(#cp-rim)"
        strokeWidth="1"
        opacity="0.55"
      />
      <ellipse
        cx="110"
        cy="344"
        rx="40"
        ry="6.5"
        stroke="url(#cp-rim)"
        strokeWidth="0.8"
        opacity="0.3"
      />

      {/* the figure: dark faceted body + orange rim light + holo scan-lines */}
      <use
        href="#cp-fig"
        fill="url(#cp-body)"
        stroke="url(#cp-rim)"
        strokeWidth="1.5"
        filter="url(#cp-glow)"
      />
      <use href="#cp-fig" fill="url(#cp-scan)" opacity="0.16" />

      {/* suit details: lapels + tie */}
      <path
        d="M110 78 L96 106 L110 140 M110 78 L124 106 L110 140"
        stroke="url(#cp-rim)"
        strokeWidth="1"
        opacity="0.65"
      />
      <path
        d="M110 82 L116 92 L112 132 L110 140 L108 132 L104 92 Z"
        fill="url(#cp-rim)"
        opacity="0.75"
      />
    </svg>
  );
}

// Small frosted insight panels floating around the figure.
const PANEL =
  "chip-float absolute hidden rounded-xl border border-(--brand-orange)/25 bg-white/[0.04] p-3 shadow-[0_0_20px_-8px_var(--glow-orange)] backdrop-blur-md md:block";

function FloatingPanels() {
  return (
    <>
      {/* bar chart — top left */}
      <div className={`${PANEL} -left-16 top-8 lg:-left-24`}>
        <div className="flex h-10 items-end gap-1">
          {[45, 70, 55, 90, 65, 100].map((h, i) => (
            <span
              key={i}
              className="w-1.5 rounded-sm bg-gradient-to-t from-(--grad-3) to-(--grad-1)"
              style={{ height: `${h}%`, opacity: 0.55 + (h / 100) * 0.45 }}
            />
          ))}
        </div>
      </div>

      {/* sparkline + growth — top right */}
      <div
        className={`${PANEL} -right-16 top-16 lg:-right-24`}
        style={{ animationDelay: "-1.6s" }}
      >
        <svg viewBox="0 0 64 28" className="h-7 w-16" fill="none" aria-hidden>
          <polyline
            points="2,24 14,18 26,20 38,10 50,12 62,3"
            stroke="url(#cp-spark)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="cp-spark" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF6A3D" />
              <stop offset="100%" stopColor="#FFB057" />
            </linearGradient>
          </defs>
          <circle cx="62" cy="3" r="2.5" fill="#FFB057" />
        </svg>
        <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-(--brand-orange)">
          <TbTrendingUp className="h-3 w-3" /> +38% ROI
        </p>
      </div>

      {/* readiness dial — mid left */}
      <div
        className={`${PANEL} -left-12 top-44 lg:-left-20`}
        style={{ animationDelay: "-3.1s" }}
      >
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 36 36" className="h-9 w-9" fill="none" aria-hidden>
            <circle cx="18" cy="18" r="14" stroke="var(--border)" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="14"
              stroke="#FF8A3D"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="66 88"
              transform="rotate(-90 18 18)"
            />
          </svg>
          <div className="text-left">
            <p className="text-xs font-bold text-(--heading)">92%</p>
            <p className="text-[9px] text-(--text-secondary)">AI readiness</p>
          </div>
        </div>
      </div>

      {/* roadmap chip — mid right */}
      <div
        className={`${PANEL} -right-10 top-52 px-3 py-2 lg:-right-16`}
        style={{ animationDelay: "-4.4s" }}
      >
        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-(--heading)">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
          AI Roadmap ready
        </p>
      </div>
    </>
  );
}

// Elliptical orbit lines sweeping through the whole composition, with two
// comet dots travelling the rings (hidden for reduced-motion users).
function OrbitLines() {
  return (
    <svg
      viewBox="0 0 1000 520"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-[130%] w-full -translate-y-1/2 lg:block"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="cp-orbit" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF8A3D" stopOpacity="0" />
          <stop offset="30%" stopColor="#FF8A3D" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#FFB057" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFB057" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        id="cp-o1"
        d="M 70 260 A 430 118 0 1 0 930 260 A 430 118 0 1 0 70 260"
        stroke="url(#cp-orbit)"
        strokeWidth="1.2"
        opacity="0.5"
        transform="rotate(-5 500 260)"
      />
      <path
        id="cp-o2"
        d="M 110 260 A 390 150 0 1 0 890 260 A 390 150 0 1 0 110 260"
        stroke="url(#cp-orbit)"
        strokeWidth="1"
        opacity="0.35"
        transform="rotate(4 500 260)"
      />
      <path
        d="M 160 260 A 340 92 0 1 0 840 260 A 340 92 0 1 0 160 260"
        stroke="url(#cp-orbit)"
        strokeWidth="0.8"
        opacity="0.22"
        transform="rotate(-11 500 260)"
      />

      {/* comet dots travelling two of the orbits */}
      <g className="motion-reduce:hidden">
        <circle r="7" fill="#FF8A3D" opacity="0.18">
          <animateMotion dur="16s" repeatCount="indefinite" rotate="none">
            <mpath href="#cp-o1" />
          </animateMotion>
        </circle>
        <circle r="3" fill="#FFB057">
          <animateMotion dur="16s" repeatCount="indefinite" rotate="none">
            <mpath href="#cp-o1" />
          </animateMotion>
        </circle>
        <circle r="2.4" fill="#FF8A3D" opacity="0.9">
          <animateMotion
            dur="22s"
            begin="-9s"
            repeatCount="indefinite"
            rotate="none"
          >
            <mpath href="#cp-o2" />
          </animateMotion>
        </circle>
      </g>
    </svg>
  );
}

export default function ChoosePath({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <OrbitLines />

      {/* ── the composition: card · expert · card ──────────────────────── */}
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-8 xl:gap-12">
        {/* ── PLAN AHEAD ──────────────────────────────────────────────── */}
        <div className={`${CARD} order-2 lg:order-1`}>
          <p className={EYEBROW}>Plan Ahead</p>

          {/* calendar page — gently floats over a soft pulsing glow */}
          <div className="relative mx-auto mt-5 h-20 w-17">
            <span
              aria-hidden
              className="absolute -inset-3 animate-pulse rounded-full bg-[radial-gradient(circle,var(--glow-orange),transparent_70%)] blur-md"
            />
            <div className="chip-float relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-(--border) bg-(--background-alt) shadow-[0_14px_34px_-14px_rgba(0,0,0,0.55)]">
              <div className="bg-gradient-to-r from-(--grad-1) to-(--grad-3) py-1 text-center text-[9px] font-bold uppercase tracking-wider text-white">
                Book
              </div>
              <div className="flex flex-1 items-center justify-center">
                <TbCalendarEvent className="h-7 w-7 animate-pulse text-(--brand-orange)" />
              </div>
            </div>
          </div>

          <h3 className="mt-5 text-lg font-bold text-(--heading)">
            Schedule your AI Strategy Session
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-(--foreground)">
            Prefer a structured deep-dive? Book a time that works.
          </p>

          {/* engineers */}
          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="flex -space-x-2.5">
              {ENGINEERS.map((e) => (
                <span
                  key={e.initials}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-(--card) text-[10px] font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${e.from}, ${e.to})` }}
                >
                  {e.initials}
                </span>
              ))}
            </div>
            <span className="text-left text-[11px] leading-tight text-(--foreground)">
              <span className="font-semibold text-(--heading)">Santhosh</span>
              <br />
              DevOps &amp; AI experts
            </span>
          </div>

          <a
            href="mailto:softsuave.ai@gmail.com"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-(--brand-orange)/40 bg-(--brand-orange)/10 px-5 py-2.5 text-sm font-semibold text-(--brand-orange) transition-all hover:bg-(--brand-orange) hover:text-white"
          >
            Choose Your Engineer &amp; Time
            <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* ── CONSULT THE EXPERT: holographic centrepiece ─────────────── */}
        <div className="order-1 mx-auto lg:order-2">
          <div className="relative h-80 w-56 md:h-96 md:w-64">
            {/* soft light behind the hologram */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-1/4 h-1/2 rounded-full bg-[radial-gradient(circle,var(--glow-orange),transparent_70%)] opacity-80 blur-2xl"
            />
            <HoloExpert />
            <FloatingPanels />
          </div>
          <p className="mx-auto mt-4 w-fit rounded-full border border-(--brand-orange)/30 bg-(--brand-orange)/[0.07] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-(--brand-orange) backdrop-blur">
            Consult the Expert
          </p>
        </div>

        {/* ── INSTANT CONNECT ─────────────────────────────────────────── */}
        <div className={`${CARD} order-3`}>
          <p className={EYEBROW}>Instant Connect</p>
          <p className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-(--text-secondary)">
            <TbClock className="h-3 w-3" /> Connect Now — 2 Minutes Avg. Wait
          </p>

          {/* live expert avatar — expanding "live" pulse + a gentle float */}
          <div className="chip-float relative mx-auto mt-4 h-16 w-16">
            <span className="absolute inset-0 animate-ping rounded-full ring-2 ring-emerald-400/50" />
            <span className="absolute inset-0 rounded-full ring-2 ring-emerald-400/70" />
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-(--grad-1) to-(--grad-3) shadow-[0_0_24px_-4px_var(--glow-orange)]">
              <TbUserFilled className="h-9 w-9 text-white/90" />
            </div>
            <span className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-(--background-alt) px-2 py-0.5 text-[8px] font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              LIVE
            </span>
          </div>

          <h3 className="mt-4 text-lg font-bold text-(--heading)">
            Talk to an AI Expert Now
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-(--foreground)">
            Have a quick technical hurdle or immediate question?
          </p>

          {/* quick-question input (cosmetic) */}
          <div className="mt-4 flex items-center gap-2 rounded-full border border-(--border) bg-(--background)/40 px-4 py-2.5 text-left">
            <span className="flex-1 text-xs text-(--text-secondary)">
              Ask your quick question&hellip;
            </span>
            <TbSend className="h-4 w-4 shrink-0 text-(--brand-orange)" />
          </div>

          <a
            href="mailto:softsuave.ai@gmail.com"
            className="btn-primary mt-3 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          >
            Start Chat
            <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>

      {/* ── Unlock Your Path: closing strip ─────────────────────────────── */}
      <div className="relative z-10 mt-16 text-center">
        <h3 className="text-2xl font-extrabold tracking-tight text-(--heading) md:text-3xl">
          Unlock{" "}
          <span className="bg-gradient-to-r from-(--grad-1) via-(--grad-2) to-(--grad-3) bg-clip-text text-transparent">
            Your Path
          </span>
        </h3>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          <p className="flex items-center gap-2 text-sm text-(--foreground)">
            <TbCalendarEvent className="h-4 w-4 shrink-0 text-(--brand-orange)" />
            Personalized strategic deep-dives.
          </p>
          <p className="flex items-center gap-2 text-sm text-(--foreground)">
            <TbMessageCircle className="h-4 w-4 shrink-0 text-(--brand-orange)" />
            On-demand expert problem solving.
          </p>
        </div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.35em] text-(--text-secondary)">
          Find your ideal engagement model
        </p>
      </div>
    </div>
  );
}
