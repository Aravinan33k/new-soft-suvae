"use client";

import { motion } from "framer-motion";

type Props = {
  index: string;
  title: string;
  body: string;
  align?: "left" | "right";
};

// Scroll chapters that float over the black hole. Each full-viewport section
// gives the scene rotation room to play while a caption fades through.
export default function StorySection({ index, title, body, align = "left" }: Props) {
  return (
    <section className="relative flex min-h-screen items-center px-6 md:px-20">
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.45 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className={`max-w-lg ${align === "right" ? "ml-auto text-right" : ""}`}
      >
        <p className="mb-4 font-mono text-sm text-sky-400/70">{index}</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-100 md:text-5xl">
          {title}
        </h2>
        <p className="mt-5 text-base leading-relaxed text-slate-400 [text-shadow:0_1px_10px_rgba(1,2,8,0.9)] md:text-lg">
          {body}
        </p>
      </motion.div>
    </section>
  );
}
