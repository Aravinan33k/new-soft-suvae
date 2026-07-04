"use client";

import { useEffect, useRef, useState } from "react";

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
  const [shown, setShown] = useState(false);
  const [instant, setInstant] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInstant(true);
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "-60px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  let titleNode: React.ReactNode = title;
  if (highlight && title.includes(highlight)) {
    const [before, after] = title.split(highlight);
    titleNode = (
      <>
        {before}
        <span className="bg-gradient-to-r from-[#FF8A3D] via-[#FFB868] to-white bg-clip-text text-transparent">
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
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#FF8A3D]/60" />
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#FF8A3D]">
            {eyebrow}
          </p>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#FF8A3D]/60" />
        </div>
      ) : (
        <p
          className="text-xs font-medium uppercase text-[#FF8A3D] transition-[opacity,letter-spacing] duration-700 ease-out"
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
        className={`${decorated ? "" : "mt-4"} text-3xl font-semibold text-white transition-[opacity,filter,letter-spacing,transform] duration-1000 ease-out md:text-4xl`}
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
          className="mt-5 text-base leading-relaxed text-zinc-400 transition-[opacity,filter,transform] duration-1000 ease-out md:text-lg"
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
