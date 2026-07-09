"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Shared section heading with a premium typographic reveal: when scrolled
// into view the title de-blurs (blur 10px → sharp) while its letter
// spacing settles from wide tracking down to tight — the body follows a
// beat later. Respects prefers-reduced-motion (renders instantly).

export default function SectionHeading({
  eyebrow,
  title,
  body,
  decorated = false,
  highlight,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  decorated?: boolean;
  /** substring of `title` to render with the brand gradient */
  highlight?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (reduced) return; // shown instantly below — no observer/transition
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { rootMargin: "-60px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  // reduced-motion → render final state instantly (derived, not set in effect)
  const shown = revealed || reduced;
  const instant = reduced;

  let titleNode: React.ReactNode = title;
  if (highlight && title.includes(highlight)) {
    const [before, after] = title.split(highlight);
    titleNode = (
      <>
        {before}
        <span className="bg-gradient-to-r from-(--brand-orange) via-(--brand-orange-soft) to-(--heading) bg-clip-text text-transparent">
          {highlight}
        </span>
        {after}
      </>
    );
  }

  const dur = instant ? "0s" : undefined;

  return (
    <div ref={ref} className="mx-auto max-w-3xl text-center">
      {decorated ? (
        <div
          className="mb-4 flex items-center justify-center gap-4 transition-opacity duration-700 ease-out"
          style={{ opacity: shown ? 1 : 0, transitionDuration: dur }}
        >
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-(--brand-orange)/60" />
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-(--brand-orange)">
            {eyebrow}
          </p>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-(--brand-orange)/60" />
        </div>
      ) : (
        <p
          className="text-xs font-medium uppercase text-(--brand-orange) transition-[opacity,letter-spacing] duration-700 ease-out"
          style={{
            opacity: shown ? 1 : 0,
            letterSpacing: shown ? "0.3em" : "0.55em",
            transitionDuration: dur,
          }}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={`${decorated ? "" : "mt-4"} text-3xl font-extrabold text-(--heading) transition-[opacity,filter,letter-spacing,transform] duration-1000 ease-out md:text-4xl`}
        style={{
          opacity: shown ? 1 : 0,
          filter: shown ? "blur(0px)" : "blur(10px)",
          letterSpacing: shown ? "-0.025em" : "0.12em",
          transform: shown ? "none" : "translateY(14px)",
          transitionDuration: dur,
        }}
      >
        {titleNode}
      </h2>
      {body && (
        <p
          className="mt-5 text-base leading-relaxed text-(--foreground) transition-[opacity,filter,transform] duration-1000 ease-out md:text-lg"
          style={{
            opacity: shown ? 1 : 0,
            filter: shown ? "blur(0px)" : "blur(8px)",
            transform: shown ? "none" : "translateY(12px)",
            transitionDelay: instant ? "0s" : "0.15s",
            transitionDuration: dur,
          }}
        >
          {body}
        </p>
      )}
    </div>
  );
}
