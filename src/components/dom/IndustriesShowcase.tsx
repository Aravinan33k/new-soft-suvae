"use client";

import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import {
  TbShoppingCart,
  TbStethoscope,
  TbTruck,
  TbSchool,
  TbBuildingBank,
  TbBuildingFactory2,
} from "react-icons/tb";
import IndustryLottie from "@/components/dom/IndustryLottie";
import EcommerceStory from "@/components/dom/EcommerceStory";
import HealthStory from "@/components/dom/HealthStory";
import FinanceStory from "@/components/dom/FinanceStory";
import EducationStory from "@/components/dom/EducationStory";
import LogisticsStory from "@/components/dom/LogisticsStory";
import ManufacturingStory from "@/components/dom/ManufacturingStory";

// INDUSTRIES — Bluehost-style accordion showcase. Left: the industry names
// stacked on accent bars; the active one turns orange, its bar lights up and
// its description expands beneath. Right: a visual panel that swaps with the
// active industry. Auto-advances every few seconds; hovering the list or
// clicking an item takes over.

type Industry = {
  name: string;
  body: string;
  tags: string[];
  // strong panel copy: bold heading, one-line blurb, 4 feature ticks
  heading: string;
  blurb: string;
  features: string[];
  icon: IconType;
  scene: (props: { accent: string }) => React.JSX.Element;
  // per-industry accent (hex) — drives BOTH the panel's background glow AND
  // the illustration's colours (core, rings, icons), so each industry reads
  // with its own identity. Cross-fades as the active tab changes.
  glow: string;
  // only set when a real .lottie file exists in public/industries/lottie/;
  // otherwise the in-house CSS/SVG scene is rendered directly (no 404 fetch)
  lottieSrc?: string;
};

const INDUSTRIES: Industry[] = [
  {
    name: "Ecommerce",
    heading: "AI-Powered Ecommerce",
    blurb: "Increase conversions with intelligent recommendations, inventory prediction, and automated customer support.",
    features: ["Product Recommendations", "AI Pricing", "Smart Inventory", "Customer Analytics"],
    glow: "#B57BFF",
    body: "AI-powered personalization, inventory optimization, and demand forecasting to accelerate online business growth.",
    tags: ["Personalization", "Forecasting", "Growth"],
    icon: TbShoppingCart,
    scene: EcommerceStory,
  },
  {
    name: "HealthTech",
    heading: "AI-Powered HealthTech",
    blurb: "Improve patient outcomes with intelligent automation, clinical insights, and streamlined workflows.",
    features: ["Clinical Insights", "Patient Automation", "Diagnostic AI", "Records Intelligence"],
    glow: "#2ED3B7",
    body: "Intelligent automation and data-driven insights that improve patient outcomes and streamline clinical workflows.",
    tags: ["Automation", "Insights", "Care"],
    icon: TbStethoscope,
    scene: HealthStory,
  },
  {
    name: "Logistics",
    heading: "AI-Powered Logistics",
    blurb: "Optimize supply chains with demand forecasting, real-time tracking, and automated route planning.",
    features: ["Route Optimization", "Demand Forecasting", "Live Tracking", "Fleet Analytics"],
    glow: "#FF8A3D",
    body: "Smarter supply chains with demand forecasting, real-time tracking, and automated route optimization.",
    tags: ["Supply Chain", "Tracking", "Routing"],
    icon: TbTruck,
    scene: LogisticsStory,
  },
  {
    name: "EdTech",
    heading: "AI-Powered EdTech",
    blurb: "Personalize learning with adaptive content, smart curation, and analytics tuned to every learner.",
    features: ["Adaptive Learning", "Content Curation", "Smart Tutoring", "Learner Analytics"],
    glow: "#FF7EB6",
    body: "Personalized learning experiences, smart content curation, and analytics that adapt to every learner.",
    tags: ["Learning", "Curation", "Analytics"],
    icon: TbSchool,
    scene: EducationStory,
  },
  {
    name: "FinTech",
    heading: "AI-Powered FinTech",
    blurb: "Secure finance with real-time fraud detection, automated decisions, and personalized banking.",
    features: ["Fraud Detection", "Risk Scoring", "Automated Decisions", "Personalized Banking"],
    glow: "#4EA8FF",
    body: "Real-time fraud detection, automated decisions, and hyper-personalized banking built on secure AI.",
    tags: ["Fraud Detection", "Decisions", "Security"],
    icon: TbBuildingBank,
    scene: FinanceStory,
  },
  {
    name: "Manufacturing",
    heading: "AI-Powered Manufacturing",
    blurb: "Cut downtime with predictive maintenance, quality automation, and smart-factory analytics.",
    features: ["Predictive Maintenance", "Quality Automation", "Smart Factory", "Downtime Analytics"],
    glow: "#FFB020",
    body: "Predictive maintenance, quality automation, and smart-factory analytics that cut downtime and waste.",
    tags: ["Maintenance", "Quality", "Smart Factory"],
    icon: TbBuildingFactory2,
    scene: ManufacturingStory,
  },
];

const N = INDUSTRIES.length;
const HOLD_MS = 4500; // how long each industry stays active before advancing
const EXIT_MS = 260; // fade-out of the outgoing panel before the swap

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Static particle field (fixed values so SSR and client markup match — no
// Math.random, which would cause a hydration mismatch). Each drifts upward.
const PARTICLES = [
  { left: "12%", size: 3, delay: "0s", dur: "9s", tint: "bg-[#FF8A3D]/50" },
  { left: "24%", size: 2, delay: "2.4s", dur: "11s", tint: "bg-white/40" },
  { left: "37%", size: 4, delay: "1.1s", dur: "8s", tint: "bg-[#FFC08A]/50" },
  { left: "48%", size: 2, delay: "3.6s", dur: "12s", tint: "bg-[#4EA8FF]/50" },
  { left: "58%", size: 3, delay: "0.7s", dur: "10s", tint: "bg-white/40" },
  { left: "69%", size: 2, delay: "4.2s", dur: "9s", tint: "bg-[#FF8A3D]/50" },
  { left: "78%", size: 4, delay: "1.8s", dur: "13s", tint: "bg-[#FFC08A]/40" },
  { left: "88%", size: 2, delay: "3s", dur: "10s", tint: "bg-[#4EA8FF]/45" },
  { left: "31%", size: 2, delay: "5.1s", dur: "12s", tint: "bg-white/35" },
  { left: "64%", size: 3, delay: "2s", dur: "11s", tint: "bg-[#FF8A3D]/40" },
];

// Ambient depth layers rendered behind the illustration — kept static across
// industries so the per-industry glow (added on top) still reads as the accent.
function PanelDepth() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* slowly panning grid */}
      <div className="ind-grid-pan absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,138,61,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,138,61,0.35)_1px,transparent_1px)] [background-size:38px_38px]" />

      {/* orange glow (top-left) + blue glow (bottom-right) */}
      <div
        className="absolute -left-24 -top-24 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,120,50,0.15), transparent 70%)" }}
      />
      <div
        className="absolute -bottom-28 -right-24 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(60,130,255,0.14), transparent 70%)" }}
      />

      {/* drifting blurred bokeh circles */}
      <div className="ind-blob absolute left-[15%] top-[55%] h-40 w-40 rounded-full bg-[#FF8A3D]/10 blur-2xl" />
      <div
        className="ind-blob absolute right-[18%] top-[18%] h-28 w-28 rounded-full bg-[#4EA8FF]/10 blur-2xl"
        style={{ animationDelay: "-5s" }}
      />
      <div
        className="ind-blob absolute left-[60%] top-[70%] h-24 w-24 rounded-full bg-[#FFC08A]/10 blur-2xl"
        style={{ animationDelay: "-9s" }}
      />

      {/* floating particles rising through the field */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className={`ind-particle absolute bottom-[-10px] rounded-full ${p.tint}`}
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.dur,
          }}
        />
      ))}
    </div>
  );
}

// Live enterprise metrics floated over each industry's panel — three small
// widgets per industry, reinforcing the "real system, real numbers" feel.
const METRICS: Record<string, { value: string; label: string }[]> = {
  Ecommerce: [
    { value: "+38%", label: "Sales Growth" },
    { value: "99.8%", label: "Prediction Accuracy" },
    { value: "4.2M", label: "Orders Processed" },
  ],
  HealthTech: [
    { value: "−45%", label: "Wait Times" },
    { value: "99.2%", label: "Diagnostic Accuracy" },
    { value: "1.8M", label: "Patients Served" },
  ],
  Logistics: [
    { value: "+32%", label: "On-Time Delivery" },
    { value: "−27%", label: "Fuel Cost" },
    { value: "5.6M", label: "Shipments Tracked" },
  ],
  EdTech: [
    { value: "+41%", label: "Course Completion" },
    { value: "92%", label: "Engagement Rate" },
    { value: "3.5M", label: "Active Learners" },
  ],
  FinTech: [
    { value: "99.9%", label: "Fraud Caught" },
    { value: "−60%", label: "False Positives" },
    { value: "$2.4B", label: "Value Secured" },
  ],
  Manufacturing: [
    { value: "−37%", label: "Downtime" },
    { value: "99.5%", label: "Quality Pass Rate" },
    { value: "12M", label: "Units Inspected" },
  ],
};

// Corner anchors so the three widgets frame the illustration without
// crowding the centred caption/feature grid below it.
const METRIC_POS = ["left-4 top-5", "right-4 top-5", "left-5 top-[45%]"];

export default function IndustriesShowcase() {
  // `active` = the selected tab (drives the left list + glow immediately).
  // `shown`  = the industry currently painted in the right panel; it lags
  //            `active` by one exit animation so the old panel can fade out
  //            before the new one slides in.
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0);
  const [paused, setPaused] = useState(false);

  // `phase` is derived, not stored: while the selected tab is ahead of the
  // painted one the old panel is animating OUT; once they match it's settled IN.
  const phase = active === shown ? "in" : "out";

  // auto-advance; any change (manual or automatic) restarts the timer
  useEffect(() => {
    if (paused || prefersReduced()) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % N), HOLD_MS);
    return () => clearTimeout(t);
  }, [active, paused]);

  // Tab-switch choreography: hold the current panel through its fade-OUT, then
  // swap `shown` so the entrance animation plays the new industry IN. Reduced
  // motion swaps immediately (the animations are disabled in CSS anyway).
  useEffect(() => {
    if (active === shown) return;
    const t = setTimeout(
      () => setShown(active),
      prefersReduced() ? 0 : EXIT_MS,
    );
    return () => clearTimeout(t);
  }, [active, shown]);

  const industry = INDUSTRIES[shown];

  return (
    <div
      className="mt-14 grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16"
      data-parallax="3"
    >
      {/* ── Left: industry cards ─────────────────────────────────────── */}
      <div
        className="space-y-2.5"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {INDUSTRIES.map((ind, i) => {
          const isActive = i === active;
          return (
            <button
              key={ind.name}
              type="button"
              onClick={() => setActive(i)}
              aria-expanded={isActive}
              className="group block w-full rounded-2xl p-3.5 text-left transition-all duration-300"
            >
              <div className="flex items-center gap-3.5">
                {/* icon tile — neutral, warming to the brand accent when active */}
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${
                    isActive
                      ? "border-(--brand-orange)/35 bg-(--brand-orange)/10 text-(--brand-orange)"
                      : "border-(--border) bg-(--card) text-(--text-secondary) group-hover:text-(--brand-orange)"
                  }`}
                >
                  <ind.icon className="h-5 w-5" strokeWidth={1.7} />
                </span>

                {/* name + always-visible tagline */}
                <span className="min-w-0 flex-1">
                  <h3
                    className={`truncate text-lg font-semibold transition-colors duration-300 ${
                      isActive ? "text-(--brand-orange)" : "text-(--heading) group-hover:text-(--brand-orange)"
                    }`}
                  >
                    {ind.name}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-(--text-secondary)">
                    {ind.tags.join(" · ")}
                  </p>
                </span>

              </div>

              {/* description expands only for the active item, aligned under
                  the name (icon 40px + gap 14px = 54px) */}
              <div
                className={`grid transition-all duration-500 ease-out ${
                  isActive ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden pl-13.5">
                  <p className="max-w-md text-sm leading-relaxed text-(--foreground)">
                    {ind.body}
                  </p>
                  <a
                    href="mailto:softsuave.ai@gmail.com"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-(--brand-orange) hover:text-(--brand-orange-hover)"
                  >
                    <span className="border-b border-(--brand-orange)/40 pb-0.5">
                      Learn More
                    </span>
                    <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  </a>
                </div>
              </div>

              {/* auto-advance progress bar on the active row */}
              {isActive && (
                <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-(--border)">
                  <span
                    className="story-progress block h-full w-full rounded-full bg-(--brand-orange)"
                    style={{
                      animationDuration: `${HOLD_MS}ms`,
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Right: visual panel for the active industry ──────────────── */}
      <div className="relative hidden lg:block">
        <div className="relative flex min-h-[520px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/[0.08] bg-[rgba(18,18,22,0.65)] shadow-[0_20px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[22px]">
          {/* ambient depth behind everything: animated grid, orange + blue
              glows, drifting blurred circles, and floating particles */}
          <PanelDepth />
          {/* per-industry glow layers — the active one cross-fades in over
              700ms as the tab changes, so the panel's ambient colour shifts
              with the industry */}
          {INDUSTRIES.map((ind, i) => (
            <div
              key={ind.name}
              aria-hidden
              className="pointer-events-none absolute inset-0 transition-opacity duration-700 ease-out"
              style={{ opacity: i === active ? 1 : 0 }}
            >
              <div
                className="absolute -left-16 -top-20 h-80 w-80 rounded-full blur-2xl"
                style={{ background: `radial-gradient(circle, ${ind.glow}47, transparent 70%)` }}
              />
              <div
                className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full blur-2xl"
                style={{ background: `radial-gradient(circle, ${ind.glow}22, transparent 70%)` }}
              />
              <div
                className="absolute inset-0"
                style={{ background: `radial-gradient(ellipse at center, ${ind.glow}14, transparent 65%)` }}
              />
            </div>
          ))}
          <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle,#FF8A3D_1px,transparent_1px)] bg-size-[24px_24px]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.4)_100%)]" />
          {/* top highlight line for a subtle glass edge */}
          <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          {/* Lottie animation per industry when present at lottieSrc;
              falls back to the in-house CSS/SVG scene until a real file
              is dropped in public/industries/lottie/ — no code change
              needed once that happens. */}
          <div
            key={shown}
            className={`relative h-56 w-full ${
              phase === "out" ? "ind-swap-out" : "ind-illustration-in"
            }`}
          >
            {industry.lottieSrc ? (
              <IndustryLottie
                src={industry.lottieSrc}
                fallback={<industry.scene accent={industry.glow} />}
              />
            ) : (
              <industry.scene accent={industry.glow} />
            )}
          </div>

          {/* caption: name + tags beneath the scene */}
          <div
            key={`cap-${shown}`}
            className={`relative px-8 pb-16 text-center ${
              phase === "out" ? "ind-swap-out" : "ind-caption-in"
            }`}
          >
            <h3 className="text-2xl font-bold text-white md:text-[26px]">
              {industry.heading}
            </h3>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-300">
              {industry.blurb}
            </p>
            <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-x-5 gap-y-2.5 text-left">
              {industry.features.map((f) => (
                <span
                  key={f}
                  className="flex items-center gap-2 text-[13px] font-medium text-zinc-200"
                >
                  <FiCheck className="h-4 w-4 shrink-0" style={{ color: industry.glow }} />
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* live metric widgets floated over the illustration — fade out
              with the panel, then stagger back in for the new industry */}
          <div
            key={`metrics-${shown}`}
            aria-hidden
            className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-200 ${
              phase === "out" ? "opacity-0" : "opacity-100"
            }`}
          >
            {(METRICS[industry.name] ?? []).map((m, i) => (
              <div
                key={m.label}
                className={`ind-metric-in absolute ${METRIC_POS[i]}`}
                style={{ animationDelay: `${0.2 + i * 0.12}s` }}
              >
                <div className="ind-metric-float rounded-xl border border-white/12 bg-black/45 px-3 py-2 shadow-[0_10px_28px_-10px_rgba(0,0,0,0.85)] backdrop-blur-md">
                  <p
                    className="text-base font-bold leading-none tabular-nums"
                    style={{ color: industry.glow }}
                  >
                    {m.value}
                  </p>
                  <p className="mt-1 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-400">
                    {m.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* progress dots */}
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
            {INDUSTRIES.map((ind, i) => (
              <button
                key={ind.name}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show ${ind.name}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active
                    ? "w-6 bg-[#FF8A3D]"
                    : "w-1.5 bg-zinc-700 hover:bg-zinc-500"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
