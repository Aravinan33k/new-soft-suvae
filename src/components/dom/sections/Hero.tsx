"use client";

import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.7 + i * 0.15, duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// Pure overlay — the black hole renders behind this via the fixed canvas.
export default function Hero() {
  return (
    <section className="relative flex h-svh min-h-[640px] w-full flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Local scrim for copy legibility */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_52%,rgba(1,2,8,0.5),transparent_70%)]" />

      <motion.p
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="relative mb-6 text-xs font-medium uppercase tracking-[0.35em] text-sky-300/80 md:text-sm"
      >
        Applied AI Studio
      </motion.p>

      <motion.h1
        custom={1}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="relative max-w-4xl bg-gradient-to-b from-white via-sky-100 to-indigo-300/60 bg-clip-text text-4xl font-semibold leading-[1.05] tracking-tight text-transparent md:text-7xl"
      >
        Intelligence with its own gravity
      </motion.h1>

      <motion.p
        custom={2}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="relative mt-6 max-w-xl text-base leading-relaxed text-slate-300 [text-shadow:0_1px_12px_rgba(1,2,8,0.9)] md:text-lg"
      >
        From autonomous agents to enterprise-scale RAG systems — we design,
        build, and deploy AI that pulls your whole business into its orbit.
      </motion.p>

      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="relative mt-10 flex flex-col items-center gap-4 sm:flex-row"
      >
        <a
          href="#story"
          className="group inline-flex items-center gap-2 rounded-full bg-sky-400 px-7 py-3 text-sm font-semibold text-slate-950 transition-all duration-300 hover:bg-sky-300 hover:shadow-[0_0_40px_-8px_rgba(56,189,248,0.8)]"
        >
          Start a project
          <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
        </a>
        <a
          href="#story"
          className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-white/[0.03] px-7 py-3 text-sm font-semibold text-slate-200 backdrop-blur transition-colors duration-300 hover:border-sky-400/50 hover:text-sky-200"
        >
          Explore the work
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
          Scroll
        </span>
        <div className="h-10 w-px overflow-hidden bg-slate-800">
          <motion.div
            animate={{ y: [-40, 40] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="h-4 w-px bg-sky-400"
          />
        </div>
      </motion.div>
    </section>
  );
}
