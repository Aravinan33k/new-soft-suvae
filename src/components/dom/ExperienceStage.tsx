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
  loading: () => <div className="absolute inset-0 bg-[#0a0a0c]" aria-hidden />,
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
  // Two-phase copy transition: the shown chapter lags `active` while the
  // old text fades out, then the new text slides in
  const [displayed, setDisplayed] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const playingRef = useRef(true);
  const elapsedRef = useRef(0);
  const neuralRef = useRef(0);
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  // displayed fill fraction per chapter, eased so a deselected item's
  // line retracts smoothly instead of snapping to zero
  const barShownRef = useRef<number[]>(Array(N).fill(0));

  const select = (i: number) => {
    if (i === activeRef.current) return;
    activeRef.current = i;
    elapsedRef.current = 0;
    scrollState.transition = 1; // kick the camera: rotate + zoom dip
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
          start: "center 72%",
          end: "center 36%",
          scrub: 1,
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
          scrollState.transition = 1; // kick the camera: rotate + zoom dip
          setActive(next);
        }
      }

      // Per-chapter timeline line (updated via DOM to avoid 60fps re-renders):
      // the active item's orange line grows DOWNWARD with autoplay progress;
      // a deselected item's line eases back up smoothly.
      const frac = playingRef.current ? elapsedRef.current / SLIDE_MS : 0;
      const ease = 1 - Math.exp((-8 * dt) / 1000);
      const shown = barShownRef.current;
      for (let i = 0; i < N; i++) {
        shown[i] =
          i === activeRef.current ? frac : shown[i] + (0 - shown[i]) * ease;
        const bar = barsRef.current[i];
        if (bar) bar.style.height = `${shown[i] * 100}%`;
      }

      // Ease the neural assembly toward the active chapter's target
      const target = activeRef.current / (N - 1);
      neuralRef.current += (target - neuralRef.current) * (1 - Math.exp(-3 * dt / 1000));
      scrollState.progress = neuralRef.current;

      // Transition pulse decays 1 → 0 over ~800ms; the camera reads it
      scrollState.transition = Math.max(0, scrollState.transition - dt / 800);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      scrollState.progress = 0;
      scrollState.transition = 0;
    };
  }, []);

  // Copy transition sequencing: fade the old text out (300ms), then mount
  // the new text which slides in (500ms) — ~800ms total, in sync with the
  // camera's transition pulse.
  useEffect(() => {
    if (active === displayed) return;
    setLeaving(true);
    const t = setTimeout(() => {
      setDisplayed(active);
      setLeaving(false);
    }, 300);
    return () => clearTimeout(t);
  }, [active, displayed]);

  const slide = SLIDES[displayed];

  return (
    <section ref={sectionRef} className="relative w-full py-10">
      {/* Layer 4: soft warm glow under the browser mockup */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-48 w-full max-w-5xl bg-[radial-gradient(ellipse,rgba(255,138,61,0.14),transparent_70%)] blur-[50px]" />

      <div
        ref={cardRef}
        className="relative mx-auto flex min-h-[560px] w-full flex-col overflow-hidden border border-white/[0.08] bg-[#0a0a0c] shadow-[0_0_80px_-20px_rgba(255,138,61,0.35)]"
        style={CARD_START}
      >
        {/* Window chrome bar */}
        <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.08] bg-[#111827] px-4 py-3">
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

          {/* Left timeline / chapter navigation: a vertical rail where the
              active item's orange line grows downward, its number scales up
              and its label slides + glows */}
          <nav className="absolute left-0 top-0 z-20 flex h-full flex-col justify-center pl-5 md:pl-10">
            {SLIDES.map((s, i) => {
              const isActive = i === active;
              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => select(i)}
                  aria-current={isActive}
                  className="group relative flex items-center gap-3 py-2.5 pl-4 text-left"
                >
                  {/* rail track */}
                  <span className="absolute left-0 top-0 h-full w-px bg-zinc-700/60" />
                  {/* orange line growing downward on the active chapter */}
                  <span
                    ref={(el) => {
                      barsRef.current[i] = el;
                    }}
                    className="absolute left-[-0.5px] top-0 w-[2px] rounded-full bg-gradient-to-b from-[#FFB057] to-[#FF6A3D] shadow-[0_0_10px_rgba(255,138,61,0.9)]"
                    style={{ height: "0%" }}
                  />
                  <span
                    className={`inline-block origin-left font-mono text-xs tabular-nums transition-all duration-300 ease-out ${
                      isActive
                        ? "scale-[1.2] text-[#FF8A3D]"
                        : "scale-100 text-zinc-600 group-hover:text-zinc-400"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`inline-block text-sm font-medium transition-all duration-300 ease-out ${
                      isActive
                        ? "translate-x-[5px] text-white [text-shadow:0_0_14px_rgba(255,138,61,0.55)]"
                        : "translate-x-0 text-zinc-500 group-hover:text-zinc-300"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Chapter copy (offset right of the slider) */}
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 pl-32 text-center md:pl-56">
            <div
              key={displayed}
              className={`max-w-2xl transition-all duration-300 ease-in ${
                leaving
                  ? "-translate-y-3 opacity-0"
                  : "animate-[fadeUp_0.55s_cubic-bezier(0.22,1,0.36,1)]"
              }`}
            >
              <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_45%_at_55%_50%,rgba(1,2,8,0.55),transparent_70%)]" />
              {slide.eyebrow && (
                <p className="mb-5 text-xs font-medium uppercase tracking-[0.35em] text-[#FF8A3D]/90 md:text-sm">
                  {slide.eyebrow}
                </p>
              )}
              {slide.index && (
                <p className="mb-4 font-mono text-sm text-[#FF8A3D]/70">
                  {slide.index}
                </p>
              )}
              {active === 0 ? (
                <h2 className="bg-gradient-to-r from-[#FF9440] via-[#FB5A38] to-[#F92B4E] bg-clip-text text-4xl font-semibold leading-[1.05] tracking-tight text-transparent md:text-6xl">
                  {slide.title}
                </h2>
              ) : (
                <h2 className="text-3xl font-semibold tracking-tight text-white [text-shadow:0_1px_14px_rgba(0,0,0,0.95)] md:text-5xl">
                  {slide.title}
                </h2>
              )}
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-300 [text-shadow:0_1px_12px_rgba(0,0,0,0.9)] md:text-lg">
                {slide.body}
              </p>
              {slide.button && (
                <a
                  href="#contact"
                  className="btn-primary pointer-events-auto mt-10 inline-block rounded-full px-8 py-3.5 text-sm font-semibold text-[#1a0a04]"
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
            className="absolute bottom-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700/70 bg-black/50 text-zinc-200 backdrop-blur transition-colors hover:border-[#FF8A3D]/60 hover:text-[#FFB057]"
          >
            {playing ? <FiPause /> : <FiPlay className="translate-x-px" />}
          </button>
        </div>
      </div>
    </section>
  );
}
