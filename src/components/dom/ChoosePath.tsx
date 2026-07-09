import { FiArrowRight } from "react-icons/fi";
import { TbCalendarEvent, TbUserFilled, TbSend, TbClock } from "react-icons/tb";

// "Choose Your Path" — a two-card CTA that splits intent: book a structured
// session (Plan Ahead) or start an instant chat with a live expert (Instant
// Connect). Theme-aware so it reads in both the light and dark systems.

const ENGINEERS = [
  { initials: "SI", from: "#FF9440", to: "#F92B4E" },
  { initials: "AP", from: "#4EA8FF", to: "#8B5CF6" },
  { initials: "RK", from: "#2ED3B7", to: "#4EA8FF" },
];

// Content-only by default; the card box (border, background, glow) fades in
// on hover so it reads as a plain block until you interact with it.
const CARD =
  "group relative flex flex-col rounded-2xl border border-transparent bg-transparent p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-(--brand-orange)/40 hover:bg-(--card) hover:shadow-[0_16px_50px_-24px_var(--glow-orange)] hover:backdrop-blur-sm";

const EYEBROW =
  "text-[10px] font-semibold uppercase tracking-[0.25em] text-(--brand-orange)";

export default function ChoosePath({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.3em] text-(--brand-orange)">
        Choose Your Path
      </p>

      <div className="grid gap-14 sm:grid-cols-2 lg:gap-24">
        {/* ── PLAN AHEAD ──────────────────────────────────────────────── */}
        <div className={CARD}>
          <p className={EYEBROW}>Plan Ahead</p>

          {/* calendar page — gently floats over a soft pulsing glow */}
          <div className="relative mx-auto mt-5 h-24 w-20">
            <span
              aria-hidden
              className="absolute -inset-3 animate-pulse rounded-full bg-[radial-gradient(circle,var(--glow-orange),transparent_70%)] blur-md"
            />
            <div className="chip-float relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-(--border) bg-(--background-alt) shadow-[0_14px_34px_-14px_rgba(0,0,0,0.55)]">
              <div className="bg-gradient-to-r from-(--grad-1) to-(--grad-3) py-1 text-center text-[9px] font-bold uppercase tracking-wider text-white">
                Book
              </div>
              <div className="flex flex-1 items-center justify-center">
                <TbCalendarEvent className="h-8 w-8 animate-pulse text-(--brand-orange)" />
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

        {/* ── INSTANT CONNECT ─────────────────────────────────────────── */}
        <div className={CARD}>
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
    </div>
  );
}
