"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FiPause, FiPlay } from "react-icons/fi";
import { scrollState } from "@/lib/scrollState";

// Lazy-loaded client-only: three.js never blocks first paint.
const CanvasRoot = dynamic(() => import("@/components/canvas/CanvasRoot"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#010208]" aria-hidden />,
});

type Slide = {
  label: string;
  eyebrow?: string;
  index?: string;
  title: string;
  body: string;
  button?: string;
};

const SLIDES: Slide[] = [
  {
    label: "Complexity",
    eyebrow: "Soft Suave",
    title: "From Complexity to Intelligence",
    body: "Disconnected data, systems, and processes — analyzed, connected, and transformed into one intelligent digital ecosystem.",
  },
  {
    label: "Awaken",
    index: "01",
    title: "Intelligence awakens at the core",
    body: "A single AI ignites at the center — scanning the noise, pulsing light outward, giving scattered data its first sense of purpose.",
  },
  {
    label: "Connect",
    index: "02",
    title: "Connections form an intelligent web",
    body: "Thousands of glowing pathways link every particle. Data flows through neural networks, APIs, and pipelines. Nothing is random anymore — everything has purpose.",
  },
  {
    label: "Build",
    index: "03",
    title: "Solutions built from the network",
    body: "Websites, mobile apps, AI assistants, cloud platforms, dashboards, automation — each one constructed from the same living network.",
  },
  {
    label: "Start",
    title: "Transforming complexity into intelligence",
    body: "Tell us where your business is heading — we'll engineer the intelligence that takes it there.",
    button: "Start a conversation",
  },
];

const N = SLIDES.length;
const SLIDE_MS = 5200; // time each chapter is shown before auto-advancing

// Anthropic-style scroll expand: contained rounded card -> true full-bleed
const CARD_START = { maxWidth: "58rem", height: "80vh", borderRadius: "24px" };
const CARD_FULL = { maxWidth: "100%", height: "100vh", borderRadius: "0px" };

export default function ExperienceStage() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);

  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const playingRef = useRef(true);
  const elapsedRef = useRef(0);
  const neuralRef = useRef(0);
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const select = (i: number) => {
    activeRef.current = i;
    elapsedRef.current = 0;
    setActive(i);
  };

  const togglePlaying = () => {
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
  };

  // Scroll-driven width expand: the card starts narrower and grows to its
  // full width as the section scrolls into view. Purely a size animation on
  // the outer card — everything inside (slider, canvas, chapters) is untouched.
  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    if (!section || !card) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(card, CARD_FULL);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(card, CARD_START, {
        ...CARD_FULL,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "center 70%",
          end: "center 40%",
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = now - last;
      last = now;

      // Autoplay: advance to the next chapter when the timer elapses
      if (playingRef.current) {
        elapsedRef.current += dt;
        if (elapsedRef.current >= SLIDE_MS) {
          elapsedRef.current = 0;
          const next = (activeRef.current + 1) % N;
          activeRef.current = next;
          setActive(next);
        }
      }

      // Per-chapter progress bar (updated via DOM to avoid 60fps re-renders)
      const frac = playingRef.current ? elapsedRef.current / SLIDE_MS : 0;
      for (let i = 0; i < N; i++) {
        const bar = barsRef.current[i];
        if (bar) bar.style.width = i === activeRef.current ? `${frac * 100}%` : "0%";
      }

      // Ease the neural assembly toward the active chapter's target
      const target = activeRef.current / (N - 1);
      neuralRef.current += (target - neuralRef.current) * (1 - Math.exp(-3 * dt / 1000));
      scrollState.progress = neuralRef.current;

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      scrollState.progress = 0;
    };
  }, []);

  const slide = SLIDES[active];

  return (
    <section ref={sectionRef} className="relative w-full px-4 py-10 md:px-8">
      <div
        ref={cardRef}
        className="relative mx-auto flex h-[86vh] min-h-[560px] w-full flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-[#02040a] shadow-[0_0_80px_-20px_rgba(56,189,248,0.45)]"
        style={{ maxWidth: CARD_START_WIDTH }}
      >
        {/* Window chrome bar */}
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-800/80 bg-slate-950/80 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-500/70" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <span className="h-3 w-3 rounded-full bg-green-500/70" />
          <span className="ml-3 flex-1 truncate rounded-md bg-slate-900/80 px-3 py-1 text-center text-[11px] text-slate-500">
            softsuave.com — the AI experience
          </span>
        </div>

        {/* Content area: neural scene + left slider + chapter copy */}
        <div className="relative min-h-0 flex-1">
          {/* Neural scene runs automatically behind everything */}
          <div className="absolute inset-0 z-0">
            <CanvasRoot />
          </div>

          {/* Left slider / chapter navigation */}
          <nav className="absolute left-0 top-0 z-20 flex h-full flex-col justify-center gap-2 pl-5 md:pl-10">
            {SLIDES.map((s, i) => {
              const isActive = i === active;
              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => select(i)}
                  aria-current={isActive}
                  className="group flex items-center gap-3 py-1.5 text-left"
                >
                  <span
                    className={`font-mono text-xs tabular-nums transition-colors ${
                      isActive ? "text-sky-400" : "text-slate-600 group-hover:text-slate-400"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex flex-col gap-1.5">
                    <span
                      className={`text-sm font-medium transition-colors ${
                        isActive
                          ? "text-slate-100"
                          : "text-slate-500 group-hover:text-slate-300"
                      }`}
                    >
                      {s.label}
                    </span>
                    {/* Track + autoplay progress fill */}
                    <span className="relative block h-px w-16 overflow-hidden bg-slate-700/70 md:w-24">
                      <span
                        ref={(el) => {
                          barsRef.current[i] = el;
                        }}
                        className="absolute inset-y-0 left-0 block bg-sky-400"
                        style={{ width: "0%" }}
                      />
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Chapter copy (offset right of the slider) */}
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 pl-32 text-center md:pl-56">
            <div key={active} className="max-w-2xl animate-[fadeUp_0.7s_ease]">
              <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_45%_at_55%_50%,rgba(1,2,8,0.55),transparent_70%)]" />
              {slide.eyebrow && (
                <p className="mb-5 text-xs font-medium uppercase tracking-[0.35em] text-sky-300/80 md:text-sm">
                  {slide.eyebrow}
                </p>
              )}
              {slide.index && (
                <p className="mb-4 font-mono text-sm text-sky-400/70">
                  {slide.index}
                </p>
              )}
              {active === 0 ? (
                <h2 className="bg-gradient-to-b from-white via-sky-100 to-indigo-300/60 bg-clip-text text-4xl font-semibold leading-[1.05] tracking-tight text-transparent md:text-6xl">
                  {slide.title}
                </h2>
              ) : (
                <h2 className="text-3xl font-semibold tracking-tight text-slate-100 [text-shadow:0_1px_14px_rgba(1,2,8,0.95)] md:text-5xl">
                  {slide.title}
                </h2>
              )}
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-300 [text-shadow:0_1px_12px_rgba(1,2,8,0.9)] md:text-lg">
                {slide.body}
              </p>
              {slide.button && (
                <a
                  href="#contact"
                  className="pointer-events-auto mt-10 inline-block rounded-full bg-sky-400 px-8 py-3.5 text-sm font-semibold text-slate-950 transition-all duration-300 hover:bg-sky-300 hover:shadow-[0_0_40px_-8px_rgba(56,189,248,0.8)]"
                >
                  {slide.button}
                </a>
              )}
            </div>
          </div>

          {/* Play / pause */}
          <button
            type="button"
            onClick={togglePlaying}
            aria-label={playing ? "Pause slideshow" : "Play slideshow"}
            className="absolute bottom-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-700/70 bg-slate-950/70 text-slate-200 backdrop-blur transition-colors hover:border-sky-400/60 hover:text-sky-300"
          >
            {playing ? <FiPause /> : <FiPlay className="translate-x-px" />}
          </button>
        </div>
      </div>
    </section>
  );
}
