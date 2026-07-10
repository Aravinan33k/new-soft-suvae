"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  type TargetAndTransition,
  type Transition,
} from "framer-motion";
import type { IconType } from "react-icons";
import {
  TbTargetArrow,
  TbScan,
  TbFlask,
  TbPlugConnected,
  TbRocket,
  TbChartArrowsVertical,
  TbCheck,
} from "react-icons/tb";
import SectionHeading from "@/components/dom/SectionHeading";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// "AI Transformation Journey" — the six-stage path from a raw business problem
// to a compounding, optimized AI system.
//
// Desktop is a PINNED HORIZONTAL RAIL: the section is tall, and a sticky stage
// stays centred in the viewport while you scroll through it. A single rail runs
// full-width with the six nodes on it; the rail fills left→right to your scroll
// position and each node walks upcoming → active → done as the fill reaches it.
// Beneath the rail, one large "active stage" card cross-fades in as you advance,
// so the whole thing reads as travelling through the journey rather than a
// static diagram. Mobile keeps a compact vertical rail; reduced-motion gets a
// static, all-visible row. Reads the theme tokens, so it adapts light/dark.

const N = 6;

const STEPS: { title: string; body: string; icon: IconType }[] = [
  {
    title: "Business Challenge",
    body: "We start with the problem — the friction, the bottleneck, the opportunity worth solving.",
    icon: TbTargetArrow,
  },
  {
    title: "AI Assessment",
    body: "We map your data, systems, and workflows to find where AI creates the highest-value impact.",
    icon: TbScan,
  },
  {
    title: "Prototype",
    body: "A working proof-of-concept validates the approach fast — before heavy investment.",
    icon: TbFlask,
  },
  {
    title: "Integration",
    body: "We embed the solution into your existing tools and processes with minimal disruption.",
    icon: TbPlugConnected,
  },
  {
    title: "Deployment",
    body: "We ship to production with the security, scale, and reliability enterprises expect.",
    icon: TbRocket,
  },
  {
    title: "Optimization",
    body: "We monitor, learn, and refine — so the system keeps compounding value over time.",
    icon: TbChartArrowsVertical,
  },
];

// Stage artwork shown in the active card (product-mockup SVGs in /public/journey,
// same visual language as the /projects screens). Parallel to STEPS.
const STAGE_IMAGES = [
  "/journey/business-challenge.svg",
  "/journey/ai-assessment.svg",
  "/journey/prototype.svg",
  "/journey/integration.svg",
  "/journey/deployment.svg",
  "/journey/optimization.svg",
];

// Each stage's image arrives with its OWN transition, so travelling the journey
// never repeats a move: cinematic zoom-out → glide from the right → spring up →
// 3D flip → curtain wipe → iris reveal.
const IMG_FX: {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition: Transition;
}[] = [
  {
    initial: { opacity: 0, scale: 1.18, filter: "blur(14px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
  {
    initial: { opacity: 0, x: 90, rotate: 1.5 },
    animate: { opacity: 1, x: 0, rotate: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
  {
    initial: { opacity: 0, y: 70, scale: 0.92 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { type: "spring", stiffness: 210, damping: 20 },
  },
  {
    initial: { opacity: 0, rotateY: 70, transformPerspective: 900 },
    animate: { opacity: 1, rotateY: 0, transformPerspective: 900 },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
  {
    initial: { clipPath: "inset(0 100% 0 0 round 16px)" },
    animate: { clipPath: "inset(0 0% 0 0 round 16px)" },
    transition: { duration: 0.6, ease: [0.65, 0, 0.35, 1] },
  },
  {
    initial: { clipPath: "circle(6% at 50% 50%)" },
    animate: { clipPath: "circle(120% at 50% 50%)" },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
];

// Three micro-highlights per stage — floated as glass chips in the left flank
// beside the stage card. Parallel to STEPS.
const STAGE_POINTS: string[][] = [
  ["Friction mapping", "Bottleneck audit", "ROI target"],
  ["Data readiness", "Impact scoring", "Use-case ranking"],
  ["Rapid POC build", "Real-data testing", "Fast validation"],
  ["API connectors", "Two-way sync", "Zero disruption"],
  ["Enterprise security", "99.9% uptime", "Scale-ready infra"],
  ["Live monitoring", "Learn & refine", "Compounding value"],
];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

type Status = "todo" | "active" | "done";

// A single journey node with its three live states.
function StepNode({
  icon: Icon,
  index,
  status,
  big,
}: {
  icon: IconType;
  index: number;
  status: Status;
  big: boolean;
}) {
  const box = big ? "h-14 w-14" : "h-12 w-12";
  const glyph = big ? "h-6 w-6" : "h-5 w-5";
  return (
    <div
      className={`relative flex ${box} shrink-0 items-center justify-center rounded-full border backdrop-blur-sm transition-colors duration-500 ${
        status === "done"
          ? "border-transparent bg-gradient-to-br from-(--grad-1) to-(--grad-3) text-white"
          : status === "active"
            ? "border-(--brand-orange) bg-(--card) text-(--brand-orange)"
            : "border-(--border) bg-(--card) text-(--text-secondary)"
      }`}
    >
      {/* active: a loader ring spins around the node + a soft glow */}
      {status === "active" && (
        <>
          <span
            aria-hidden
            className="absolute -inset-1 animate-spin rounded-full border-2"
            style={{
              borderColor:
                "color-mix(in srgb, var(--brand-orange) 22%, transparent)",
              borderTopColor: "var(--brand-orange)",
              animationDuration: "1.1s",
            }}
          />
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-(--brand-orange)/15 blur-md"
          />
        </>
      )}

      {/* done: one continuous soft orange pulse ring — "completed & alive" */}
      {status === "done" && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-(--brand-orange)/30"
          animate={{ scale: [1, 1.55], opacity: [0.5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {/* glyph: a check once completed, otherwise the stage icon */}
      {status === "done" ? (
        <motion.span
          key="check"
          className="relative"
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
        >
          <TbCheck className={glyph} strokeWidth={3} />
        </motion.span>
      ) : (
        <Icon className={`relative ${glyph}`} />
      )}

      {/* number badge — muted until the step is reached */}
      <span
        className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors duration-500 ${
          status === "todo"
            ? "bg-(--border) text-(--text-secondary)"
            : "bg-gradient-to-br from-(--grad-1) to-(--grad-3) text-white"
        }`}
      >
        {index + 1}
      </span>
    </div>
  );
}

// Staggered entrance for the active card's pieces: each child rises in with a
// slight blur, one after the other, every time the stage changes.
const cardStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const cardItem = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// The large card that swaps in as the active stage changes.
function ActiveCard({ index }: { index: number }) {
  const step = STEPS[index];
  const Icon = step.icon;
  return (
    // Concurrent (no mode="wait"): the incoming stage starts animating the
    // instant the rail icon flips, crossfading over the outgoing one — the
    // photo change stays in sync with the icons instead of trailing them.
    <AnimatePresence>
      <motion.div
        key={index}
        variants={cardStagger}
        initial="hidden"
        animate="show"
        exit={{
          opacity: 0,
          y: -16,
          scale: 0.96,
          filter: "blur(6px)",
          transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
        }}
        className="absolute inset-0 flex flex-col items-center text-center"
      >
        {/* ── stage artwork: a product-mockup image, arriving with a transition
            unique to this stage (see IMG_FX) — the text below stays put ── */}
        <div className="relative w-full max-w-md">
          {/* soft glow pooled behind the frame */}
          <span
            aria-hidden
            className="absolute -inset-4 rounded-[28px] bg-[radial-gradient(ellipse_at_center,var(--glow-orange),transparent_70%)] opacity-70 blur-2xl"
          />
          <motion.div
            initial={IMG_FX[index].initial}
            animate={IMG_FX[index].animate}
            transition={IMG_FX[index].transition}
            className="relative overflow-hidden rounded-2xl border border-(--brand-orange)/25 bg-black shadow-[0_24px_70px_-28px_var(--glow-orange)]"
          >
            {/* slow Ken Burns drift so the mockup feels alive while it holds */}
            <motion.img
              src={STAGE_IMAGES[index]}
              alt={step.title}
              className="aspect-video w-full object-cover"
              animate={{ scale: [1, 1.05] }}
              transition={{
                duration: 7,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            {/* glass sheen sweeping once as the image settles */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-white/25 to-transparent"
              initial={{ x: "-120%" }}
              animate={{ x: "380%" }}
              transition={{ duration: 1.1, delay: 0.35, ease: "easeOut" }}
            />
            {/* stage icon chip — continuity with the rail nodes */}
            <span className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-black/45 text-(--brand-orange) backdrop-blur-md">
              <Icon className="h-5 w-5" />
            </span>
          </motion.div>
        </div>

        <motion.p
          variants={cardItem}
          className="mt-4 text-xs font-medium uppercase tracking-[0.35em] text-(--brand-orange)"
        >
          Stage {String(index + 1).padStart(2, "0")} of {String(N).padStart(2, "0")}
        </motion.p>

        <motion.h3
          variants={cardItem}
          className="mt-2 text-2xl font-bold tracking-tight text-(--heading) md:text-3xl"
        >
          {step.title}
        </motion.h3>

        <motion.p
          variants={cardItem}
          className="mt-3 max-w-xl text-base leading-relaxed text-(--foreground)"
        >
          {step.body}
        </motion.p>

        {/* ── stage progress: six segments; the active one stretches into a
            gradient pill with a light-band sweeping across it ── */}
        <motion.div variants={cardItem} className="mt-5 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className={`relative h-1.5 overflow-hidden rounded-full transition-all duration-500 ease-out ${
                i === index
                  ? "w-10 bg-gradient-to-r from-(--grad-1) via-(--grad-2) to-(--grad-3) shadow-[0_0_10px_var(--glow-orange)]"
                  : i < index
                    ? "w-4 bg-(--brand-orange)/50"
                    : "w-4 bg-(--border)"
              }`}
            >
              {i === index && (
                <span
                  aria-hidden
                  className="absolute inset-y-0 w-4 bg-linear-to-r from-transparent via-white/80 to-transparent"
                  style={{ animation: "indConveyor 1.6s linear infinite" }}
                />
              )}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function TransformationJourney() {
  const reduced = useReducedMotion();

  // Desktop pinned track: progress 0→1 across the tall scroll region while the
  // inner stage stays pinned (sticky) in the viewport.
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: dProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });
  const fillWidth = useTransform(dProgress, (v) => `${clamp01(v) * 92}%`);
  const [activeD, setActiveD] = useState(0);
  useMotionValueEvent(dProgress, "change", (v) => {
    const idx = Math.min(N - 1, Math.max(0, Math.round(v * (N - 1))));
    setActiveD((prev) => (prev === idx ? prev : idx));
  });

  // Mobile rail: fills to scroll position as the section passes.
  const mobileRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: mProgress } = useScroll({
    target: mobileRef,
    offset: ["start 0.85", "end 0.6"],
  });
  const [activeM, setActiveM] = useState(0);
  useMotionValueEvent(mProgress, "change", (v) => {
    const idx = Math.min(N - 1, Math.max(0, Math.round(v * (N - 1))));
    setActiveM((prev) => (prev === idx ? prev : idx));
  });

  const statusOf = (i: number, active: number): Status =>
    i < active ? "done" : i === active ? "active" : "todo";

  return (
    <section id="journey" className="relative pt-24 lg:pt-30">
      {/* faint heading glow for section rhythm */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-20 h-72 w-[46rem] max-w-[90vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,var(--glow-orange),transparent_70%)] blur-2xl"
      />

      <SectionHeading
        eyebrow="AI Transformation Journey"
        title="From AI Idea to Business Impact"
        highlight="Business Impact"
        body="Move from AI idea to real business impact with a clear transformation journey that improves productivity, simplifies automation, and supports scalable growth."
      />

      {/* ── Desktop: pinned horizontal rail ───────────────────────────── */}
      {reduced ? (
        // reduced-motion / static: all six stages visible in a row, no scroll
        <div className="mx-auto mt-16 hidden max-w-6xl lg:block">
          <div className="grid grid-cols-6 gap-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <StepNode icon={step.icon} index={i} status="done" big={false} />
                <h3 className="mt-4 text-sm font-bold text-(--heading)">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-(--foreground)">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          ref={trackRef}
          className="relative hidden lg:block"
          // 56vh per stage ≈ 30% slower stage-advance than the previous 44vh —
          // one wheel notch no longer skips past a stage
          style={{ height: `${N * 56}vh` }}
        >
          {/* pinned BELOW the sticky navbar (h-16) with a little extra
              breathing room, so the icon rail never tucks under the nav pill */}
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col items-center justify-center pt-6">
            {/* ── flank designs: the empty margins beside the stage card get a
                giant ghost stage numeral (left) and the stage icon inside slow
                orbit rings (right). Stage-synced — both swap with the icons —
                purely decorative, and only on wide screens where the space
                actually exists. ── */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 top-[55%] hidden w-64 -translate-y-1/2 xl:block"
            >
              {/* static orbit behind the numeral — stays put across stages */}
              <span
                className="ind-spin absolute -left-10 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border border-dashed border-(--brand-orange)/15"
                style={{ animationDuration: "40s" }}
              />
              <span className="absolute left-24 top-[12%] h-1.5 w-1.5 animate-pulse rounded-full bg-(--brand-orange)/50" />
              <span
                className="absolute bottom-[10%] left-6 h-1 w-1 animate-pulse rounded-full bg-(--brand-orange)/35"
                style={{ animationDelay: "0.9s" }}
              />
              {/* dotted connector reaching toward the stage card */}
              <span className="absolute right-[-8%] top-1/2 h-px w-28 bg-[linear-gradient(90deg,var(--brand-orange),transparent)] opacity-25" />
              <AnimatePresence>
                <motion.div
                  key={activeD}
                  exit={{ opacity: 0, x: 16, filter: "blur(6px)" }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-0 top-1/2 flex -translate-y-1/2 flex-col items-start gap-3"
                >
                  {STAGE_POINTS[activeD].map((point, i) => (
                    <motion.span
                      key={point}
                      initial={{ opacity: 0, x: -32, filter: "blur(5px)" }}
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      transition={{
                        duration: 0.5,
                        delay: i * 0.09,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      // staggered indents so the stack floats organically
                      style={{ marginLeft: i === 1 ? 30 : i === 2 ? 10 : 0 }}
                      className="inline-flex w-max items-center gap-2 rounded-full border border-(--border) bg-(--card)/60 px-3.5 py-1.5 text-xs font-medium text-(--foreground) shadow-[0_10px_28px_-14px_var(--shadow-strong)] backdrop-blur-md"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-(--brand-orange) shadow-[0_0_8px_var(--glow-orange)]" />
                      {point}
                    </motion.span>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute right-0 top-[55%] hidden w-64 -translate-y-1/2 xl:block"
            >
              <div className="relative mx-auto flex h-72 w-72 items-center justify-center">
                {/* concentric orbits + a travelling spark — persistent */}
                <span
                  className="ind-spin absolute inset-0 rounded-full border border-dashed border-(--brand-orange)/15"
                  style={{ animationDuration: "34s" }}
                />
                <span className="absolute inset-10 rounded-full border border-(--border)" />
                <span className="ind-spin absolute inset-0" style={{ animationDuration: "11s" }}>
                  <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-(--brand-orange)/80 shadow-[0_0_10px_var(--brand-orange)]" />
                </span>
                <span
                  className="ind-spin-rev absolute inset-16"
                  style={{ animationDuration: "18s" }}
                >
                  <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-(--brand-orange)/50" />
                </span>
                {/* soft pooled glow */}
                <span className="absolute inset-12 rounded-full bg-[radial-gradient(circle,var(--glow-orange),transparent_70%)] opacity-40 blur-xl" />
                {/* dotted connector reaching toward the stage card */}
                <span className="absolute left-[-18%] top-1/2 h-px w-28 bg-[linear-gradient(270deg,var(--brand-orange),transparent)] opacity-25" />
                {/* the stage's icon as a ghost watermark, swapping with the rail */}
                <AnimatePresence>
                  {(() => {
                    const FlankIcon = STEPS[activeD].icon;
                    return (
                      <motion.span
                        key={activeD}
                        initial={{ opacity: 0, scale: 0.7, rotate: -12 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 1.15, rotate: 8 }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute text-(--brand-orange)"
                      >
                        <FlankIcon className="h-24 w-24 opacity-30 drop-shadow-[0_0_18px_var(--glow-orange)]" />
                      </motion.span>
                    );
                  })()}
                </AnimatePresence>
              </div>
            </div>

            {/* the rail with its six nodes */}
            <div className="relative mx-auto min-h-32 w-full max-w-5xl">
              {/* spotlight that glides to follow the active step */}
              <div
                aria-hidden
                className="pointer-events-none absolute top-6 h-44 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--glow-orange),transparent_68%)] blur-2xl transition-[left] duration-700 ease-out"
                style={{ left: `${4 + (activeD / (N - 1)) * 92}%` }}
              />
              {/* base track */}
              <div
                aria-hidden
                className="absolute left-[4%] right-[4%] top-6 h-0.5 -translate-y-1/2 rounded-full bg-(--border)"
              />
              {/* gradient fill that grows to the scroll position — carrying a
                  sweeping energy shimmer + small particles riding the line */}
              <motion.div
                aria-hidden
                className="absolute left-[4%] top-6 h-0.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-(--grad-1) via-(--grad-2) to-(--grad-3)"
                style={{ width: fillWidth, boxShadow: "0 0 12px var(--glow-orange)" }}
              >
                {/* energy: a bright band sweeping along the filled segment —
                    clipped so nothing escapes the rail */}
                <span className="absolute inset-0 overflow-hidden rounded-full">
                  <span
                    className="absolute inset-y-0 w-20 bg-linear-to-r from-transparent via-white/80 to-transparent"
                    style={{ animation: "indConveyor 2.4s linear infinite" }}
                  />
                </span>
              </motion.div>
              {/* nodes + short labels, evenly spaced along the rail */}
              {STEPS.map((step, i) => {
                const status = statusOf(i, activeD);
                return (
                  <div
                    key={step.title}
                    className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                    style={{ left: `${4 + (i / (N - 1)) * 92}%` }}
                  >
                    {/* focus treatment: the active step enlarges ~18% under the
                        spotlight while every other step softly blurs + dims.
                        Dimming uses brightness/saturation (not opacity) so the
                        nodes stay opaque and the rail line passes UNDER them. */}
                    <div
                      className={`flex flex-col items-center transition-all duration-500 ease-out ${
                        status === "active"
                          ? "scale-[1.18]"
                          : status === "done"
                            ? "blur-[1px] brightness-[0.85] saturate-[0.8]"
                            : "blur-[1.5px] brightness-[0.6] saturate-[0.55]"
                      }`}
                    >
                      <StepNode icon={step.icon} index={i} status={status} big={false} />
                      <span
                        className={`mt-3 w-28 text-center text-xs font-semibold leading-tight transition-colors duration-500 ${
                          status === "todo"
                            ? "text-(--text-secondary)"
                            : "text-(--heading)"
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* the enlarged active stage, cross-fading as the rail advances */}
            <div className="relative mt-10 h-120 w-full max-w-2xl">
              <ActiveCard index={activeD} />
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile: vertical rail ─────────────────────────────────────── */}
      <div ref={mobileRef} className="relative mx-auto mt-14 max-w-6xl lg:hidden">
        <div className="absolute bottom-4 left-6 top-4 w-px bg-(--border)" aria-hidden />
        <motion.div
          aria-hidden
          className="absolute left-6 top-4 w-px origin-top bg-gradient-to-b from-(--grad-1) to-(--grad-3)"
          style={{
            bottom: "1rem",
            scaleY: reduced ? 1 : mProgress,
            boxShadow: "0 0 12px var(--glow-orange)",
          }}
        />
        <div className="flex flex-col gap-8">
          {STEPS.map((step, i) => {
            const status = reduced ? "done" : statusOf(i, activeM);
            return (
              <div key={step.title} className="relative flex items-start gap-5 pl-0">
                <StepNode icon={step.icon} index={i} status={status} big={false} />
                <div
                  className={`pt-1 transition-opacity duration-500 ${
                    status === "todo" ? "opacity-45" : "opacity-100"
                  }`}
                >
                  <h3 className="text-base font-bold text-(--heading)">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-(--foreground)">
                    {step.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
