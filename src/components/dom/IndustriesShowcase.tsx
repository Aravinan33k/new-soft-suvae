"use client";

import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import { FiArrowRight } from "react-icons/fi";
import {
  TbShoppingCart,
  TbStethoscope,
  TbTruck,
  TbSchool,
  TbBuildingBank,
  TbBuildingFactory2,
} from "react-icons/tb";

// INDUSTRIES — Bluehost-style accordion showcase. Left: the industry names
// stacked on accent bars; the active one turns orange, its bar lights up and
// its description expands beneath. Right: a visual panel that swaps with the
// active industry. Auto-advances every few seconds; hovering the list or
// clicking an item takes over.

type Industry = {
  name: string;
  body: string;
  icon: IconType;
  tags: string[];
  image: string;
};

const INDUSTRIES: Industry[] = [
  {
    name: "Ecommerce",
    body: "AI-powered personalization, inventory optimization, and demand forecasting to accelerate online business growth.",
    icon: TbShoppingCart,
    tags: ["Personalization", "Forecasting", "Growth"],
    image: "/industries/ecommerce.jpg",
  },
  {
    name: "HealthTech",
    body: "Intelligent automation and data-driven insights that improve patient outcomes and streamline clinical workflows.",
    icon: TbStethoscope,
    tags: ["Automation", "Insights", "Care"],
    image: "/industries/healthtech.jpg",
  },
  {
    name: "Logistics",
    body: "Smarter supply chains with demand forecasting, real-time tracking, and automated route optimization.",
    icon: TbTruck,
    tags: ["Supply Chain", "Tracking", "Routing"],
    image: "/industries/logistics.jpg",
  },
  {
    name: "EdTech",
    body: "Personalized learning experiences, smart content curation, and analytics that adapt to every learner.",
    icon: TbSchool,
    tags: ["Learning", "Curation", "Analytics"],
    image: "/industries/edtech.jpg",
  },
  {
    name: "FinTech",
    body: "Real-time fraud detection, automated decisions, and hyper-personalized banking built on secure AI.",
    icon: TbBuildingBank,
    tags: ["Fraud Detection", "Decisions", "Security"],
    image: "/industries/fintech.jpg",
  },
  {
    name: "Manufacturing",
    body: "Predictive maintenance, quality automation, and smart-factory analytics that cut downtime and waste.",
    icon: TbBuildingFactory2,
    tags: ["Maintenance", "Quality", "Smart Factory"],
    image: "/industries/manufacturing.jpg",
  },
];

const N = INDUSTRIES.length;
const HOLD_MS = 4500; // how long each industry stays active before advancing

export default function IndustriesShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // auto-advance; any change (manual or automatic) restarts the timer
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const t = setTimeout(() => setActive((a) => (a + 1) % N), HOLD_MS);
    return () => clearTimeout(t);
  }, [active, paused]);

  const industry = INDUSTRIES[active];

  return (
    <div
      className="mt-14 grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16"
      data-parallax="3"
    >
      {/* ── Left: accordion list ─────────────────────────────────────── */}
      <div
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
              className="group block w-full text-left"
            >
              <div className="relative py-4 pl-7">
                {/* accent bar: dark track, gradient fill when active */}
                <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-zinc-800" />
                <span
                  className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b from-[#FF9440] to-[#F92B4E] shadow-[0_0_12px_rgba(255,138,61,0.7)] transition-opacity duration-400 ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />

                <h3
                  className={`text-lg font-semibold transition-colors duration-300 md:text-xl ${
                    isActive
                      ? "text-[#FF8A3D]"
                      : "text-white group-hover:text-[#FFB057]"
                  }`}
                >
                  {ind.name}
                </h3>

                {/* description expands only for the active item */}
                <div
                  className={`grid transition-all duration-500 ease-out ${
                    isActive ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-md text-sm leading-relaxed text-zinc-400">
                      {ind.body}
                    </p>
                    <a
                      href="mailto:softsuave.ai@gmail.com"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#FF8A3D] hover:text-[#FFB057]"
                    >
                      <span className="border-b border-[#FF8A3D]/40 pb-0.5">
                        Learn More
                      </span>
                      <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </a>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Right: visual panel for the active industry ──────────────── */}
      <div className="relative hidden lg:block">
        <div className="relative flex min-h-[460px] items-center justify-center overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d0d10]">
          {/* the industry illustration fills the panel, swapping per item */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={active}
            src={industry.image}
            alt={industry.name}
            className="absolute inset-0 h-full w-full object-cover animate-[fadeUp_0.55s_cubic-bezier(0.22,1,0.36,1)]"
          />
          {/* legibility scrim for the caption + dots */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(180deg,transparent,rgba(6,6,9,0.85))]" />

          {/* caption: icon chip + name + tags over the image */}
          <div
            key={`cap-${active}`}
            className="absolute inset-x-0 bottom-14 px-8 text-center animate-[fadeUp_0.55s_cubic-bezier(0.22,1,0.36,1)]"
          >
            <h3 className="inline-flex items-center gap-2.5 text-2xl font-semibold text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.8)]">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#FF8A3D]/40 bg-[#0d0d10]/80 text-[#FF9E55] backdrop-blur-sm">
                <industry.icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              {industry.name}
            </h3>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {industry.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#FF8A3D]/35 bg-[#0d0d10]/70 px-3 py-1 text-xs text-zinc-200 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
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
