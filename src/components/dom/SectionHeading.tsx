"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { observeReveal } from "@/lib/scrollReveal";

// Shared section heading. Its reveal is tied CONTINUOUSLY to scroll position
// (via the shared `--rv` 0→1 controller) instead of snapping on at a threshold,
// so the eyebrow, title and body rise + de-blur in lock-step with the scroll —
// the section flows in as you travel toward it rather than popping in. The
// title also settles its letter-spacing from wide to tight as it sharpens.
// Respects prefers-reduced-motion (renders the final state instantly).

// Each child reads the inherited `--rv` and maps it to opacity / rise / blur.
// A small per-element offset (via CSS max()) staggers the body a beat behind
// the title without needing a second progress value.
const eyebrowStyle: CSSProperties = {
  opacity: "var(--rv)",
  transform: "translateY(calc((1 - var(--rv)) * 10px))",
  letterSpacing: "calc(0.3em + (1 - var(--rv)) * 0.25em)",
};

const titleStyle: CSSProperties = {
  opacity: "var(--rv)",
  filter: "blur(calc((1 - var(--rv)) * 10px))",
  letterSpacing: "calc(-0.025em + (1 - var(--rv)) * 0.145em)",
  transform: "translateY(calc((1 - var(--rv)) * 14px))",
};

// Body lags the title: its local progress is (rv - 0.15) rescaled, clamped ≥ 0.
const bodyStyle: CSSProperties = {
  ["--rvb" as string]: "max(0, calc((var(--rv) - 0.15) / 0.85))",
  opacity: "var(--rvb)",
  filter: "blur(calc((1 - var(--rvb)) * 8px))",
  transform: "translateY(calc((1 - var(--rvb)) * 12px))",
};

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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.style.setProperty("--rv", "1"); // final state, no motion
      return;
    }
    return observeReveal(el, { start: 0.92, end: 0.6 });
  }, [reduced]);

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

  return (
    <div
      ref={ref}
      className="mx-auto max-w-3xl text-center"
      style={{ ["--rv" as string]: "0" }}
    >
      {decorated ? (
        <div
          className="mb-4 flex items-center justify-center gap-4"
          style={eyebrowStyle}
        >
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-(--brand-orange)/60" />
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-(--brand-orange)">
            {eyebrow}
          </p>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-(--brand-orange)/60" />
        </div>
      ) : (
        <p
          className="text-xs font-medium uppercase text-(--brand-orange)"
          style={eyebrowStyle}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={`${decorated ? "" : "mt-4"} text-3xl font-extrabold text-(--heading) md:text-4xl`}
        style={titleStyle}
      >
        {titleNode}
      </h2>
      {body && (
        <p
          className="mt-5 text-base leading-relaxed text-(--foreground) md:text-lg"
          style={bodyStyle}
        >
          {body}
        </p>
      )}
    </div>
  );
}
