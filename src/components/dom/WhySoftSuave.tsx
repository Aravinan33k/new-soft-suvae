"use client";

import { motion } from "framer-motion";
import type { IconType } from "react-icons";
import { TbUsersGroup, TbCalendarStats, TbWorld } from "react-icons/tb";
import { FiCheck } from "react-icons/fi";
import CountUp from "@/components/dom/CountUp";

// "Why Soft Suave" — the trust/credibility band (mirrors softsuave.com's
// "Your AI Growth Partner" block). Left: the positioning statement + proof
// points. Right: the four headline stats as glowing cards with count-up
// numbers. Reads the theme tokens, so it adapts light/dark.

const STATS: { value: string; label: string; icon: IconType }[] = [
  { value: "400+", label: "AI & Engineering Specialists", icon: TbUsersGroup },
  { value: "13+", label: "Years of Experience", icon: TbCalendarStats },
  { value: "150+", label: "Global Clients", icon: TbUsersGroup },
  { value: "21+", label: "Countries Served", icon: TbWorld },
];

const PROOF = [
  "AI-enabled engineering teams focused on real business outcomes",
  "Proven delivery strength across startups, SMBs, and enterprises",
  "Strategic partnerships that scale with your roadmap",
];

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
};

export default function WhySoftSuave() {
  return (
    <section id="why" className="relative pt-24 lg:pt-30">
      {/* soft glow anchoring the section */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 h-72 w-[42rem] max-w-[90vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,var(--glow-orange),transparent_70%)] blur-2xl"
      />

      <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
        {/* ── Left: positioning + proof points ─────────────────────────── */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ staggerChildren: 0.12 }}
        >
          <motion.p
            variants={fadeUp}
            className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-(--brand-orange)"
          >
            Why Soft Suave
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-3xl font-extrabold leading-tight tracking-tight text-(--heading) md:text-4xl"
          >
            We connect it all into one{" "}
            <span className="bg-gradient-to-r from-(--brand-orange) via-(--brand-orange-soft) to-(--heading) bg-clip-text text-transparent">
              intelligent ecosystem
            </span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-base leading-relaxed text-(--foreground) md:text-lg"
          >
            With years of AI and software engineering experience, Soft Suave
            helps startups, SMBs, and enterprises build practical AI solutions
            backed by proven delivery strength.
          </motion.p>

          <motion.ul variants={fadeUp} className="mt-8 flex flex-col gap-3.5">
            {PROOF.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--brand-orange)/12 text-(--brand-orange)">
                  <FiCheck className="h-3 w-3" />
                </span>
                <span className="text-sm leading-relaxed text-(--foreground) md:text-base">
                  {p}
                </span>
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* ── Right: stat cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
              className="card-neon group relative overflow-hidden rounded-2xl p-5 sm:p-6"
            >
              {/* corner glow that lifts on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-(--brand-orange)/15 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              />
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-(--brand-orange)/25 bg-(--brand-orange)/10 text-(--brand-orange)">
                <stat.icon className="h-4 w-4" />
              </span>
              <p className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">
                <span className="bg-gradient-to-r from-(--grad-1) to-(--grad-3) bg-clip-text text-transparent">
                  <CountUp value={stat.value} />
                </span>
              </p>
              <p className="mt-1 text-xs leading-snug text-(--text-secondary) md:text-sm">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
