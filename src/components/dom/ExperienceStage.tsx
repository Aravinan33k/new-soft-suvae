"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FiPause, FiPlay } from "react-icons/fi";
import { scrollState } from "@/lib/scrollState";
import ExperienceScenes from "@/components/dom/ExperienceScenes";

type Slide = {
  label: string;
  eyebrow?: string;
  index?: string;
  title: string;
  body: string;
  tags?: string[];
  image?: string;
  button?: string;
};

const SLIDES: Slide[] = [
  {
    label: "Custom AI",
    image: "/services/custom-ai.jpg",
    eyebrow: "AI Systems",
    index: "01",
    title: "Custom AI Solutions",
    body: "Production-ready AI systems built on LLMs, RAG, agents, and predictive models — engineered to automate decisions at scale.",
    tags: ["LLM", "RAG", "Agents"],
  },
  {
    label: "Automation",
    image: "/services/automation.jpg",
    eyebrow: "Automation",
    index: "02",
    title: "AI Integrations & Workflow Automation",
    body: "Wire AI into the tools you already use and automate the busywork that slows your team down.",
    tags: ["Workflows", "Integrations", "Ops"],
  },
  {
    label: "Chatbots",
    image: "/services/chatbots.jpg",
    eyebrow: "AI Systems",
    index: "03",
    title: "AI Chatbots & AI Agents",
    body: "Conversational agents for support, sales, HR, and internal ops — always on, always learning.",
    tags: ["Chatbots", "Support", "NLP"],
  },
  {
    label: "Software",
    image: "/services/software.jpg",
    eyebrow: "Development",
    index: "04",
    title: "Custom Software Development",
    body: "Secure, scalable software engineered with AI-assisted development for faster delivery.",
    tags: ["Full-Stack", "APIs", "Scale"],
  },
  {
    label: "Mobile",
    image: "/services/mobile.jpg",
    eyebrow: "Mobile",
    index: "05",
    title: "Mobile App Development",
    body: "Native-quality iOS and Android apps with intuitive design and AI-enhanced features.",
    tags: ["iOS", "Android", "Cross-Platform"],
  },
  {
    label: "Web Apps",
    image: "/services/web.jpg",
    eyebrow: "Development",
    index: "06",
    title: "Web App Development",
    body: "Fast, AI-enabled web apps that simplify workflows and turn visitors into customers.",
    tags: ["Web Apps", "UX", "Performance"],
  },
  {
    label: "Modernization",
    image: "/services/modernization.jpg",
    eyebrow: "Cloud & Infra",
    index: "07",
    title: "Enterprise Modernization",
    body: "Modernize legacy systems with cloud, automation, and AI — without disrupting the business.",
    tags: ["Cloud", "Legacy", "Security"],
  },
  {
    label: "GCC",
    image: "/services/gcc.jpg",
    eyebrow: "Cloud & Infra",
    index: "08",
    title: "Global Capability Center (GCC)",
    body: "Stand up an AI-powered GCC with smarter workflows, analytics, and teams built to scale.",
    tags: ["Teams", "Analytics", "Scale"],
    button: "Start a conversation",
  },
];

const N = SLIDES.length;
const SLIDE_MS = 12000; // each chapter's story plays ~12s before auto-advancing

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
      <div
        ref={cardRef}
        className="relative mx-auto flex min-h-[560px] w-full flex-col overflow-hidden bg-[#0a0a0c]"
        style={CARD_START}
      >
        {/* Content area: neural scene + left slider + chapter copy */}
        <div className="relative min-h-0 flex-1">
          {/* The navy backdrop is painted here on the full card so its colour
              never varies; the transparent canvas above it only draws the
              animation content, centered in the right half on large screens */}
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,#0B1426_0%,#08101e_55%,#0a0a0c_100%)]">
            {/* one cinematic story scene per service chapter */}
            <ExperienceScenes
              active={active}
              className="absolute inset-0 lg:left-[38%]"
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(10,10,12,0.8)_100%)]" />
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
                  className="group relative flex items-center gap-3 py-2.5 pl-4 pr-6 text-left"
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

                  {/* active state: frosted glass pill with a soft orange
                      glow behind the label */}
                  <span
                    aria-hidden
                    className={`absolute inset-y-1 left-2.5 right-0 rounded-lg border backdrop-blur-md transition-all duration-500 ease-out ${
                      isActive
                        ? "border-[#FF8A3D]/25 bg-[#FF8A3D]/[0.08] opacity-100 shadow-[0_0_26px_-6px_rgba(255,138,61,0.55),inset_0_1px_10px_rgba(255,138,61,0.08)]"
                        : "border-transparent bg-transparent opacity-0"
                    }`}
                  />
                  {/* vertical accent line on the pill's edge */}
                  <span
                    aria-hidden
                    className={`absolute left-2.5 top-1/2 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-[#FFB057] to-[#FF6A3D] shadow-[0_0_10px_rgba(255,138,61,0.9)] transition-all duration-500 ease-out ${
                      isActive ? "h-6 opacity-100" : "h-0 opacity-0"
                    }`}
                  />
                  {/* animated indicator: breathing dot at the pill's end */}
                  <span
                    aria-hidden
                    className={`absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#FF8A3D] shadow-[0_0_8px_2px_rgba(255,138,61,0.7)] transition-opacity duration-500 ${
                      isActive ? "animate-pulse opacity-100" : "opacity-0"
                    }`}
                  />

                  <span
                    className={`relative inline-block origin-left pl-2 font-mono text-xs tabular-nums transition-all duration-300 ease-out ${
                      isActive
                        ? "scale-[1.2] text-[#FF8A3D]"
                        : "scale-100 text-zinc-600 group-hover:text-zinc-400"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`relative inline-block text-sm font-medium transition-all duration-300 ease-out ${
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

          {/* Chapter copy: one left-aligned column beside the nav rail —
              the animated scene owns the right half of the card */}
          <div
            key={displayed}
            className={`pointer-events-none absolute inset-y-0 left-0 z-10 flex w-full flex-col justify-start pt-24 md:pt-32 px-6 pl-28 md:pl-104 lg:w-[60%] lg:pr-0 transition-all duration-300 ease-in ${
              leaving
                ? "-translate-y-3 opacity-0"
                : "animate-[fadeUp_0.55s_cubic-bezier(0.22,1,0.36,1)]"
            }`}
          >
            <div className="relative max-w-xl text-left">
              <div className="flex items-baseline gap-3">
                {slide.index && (
                  <p className="font-mono text-sm text-[#FF8A3D]/70">
                    {slide.index}
                  </p>
                )}
                {slide.eyebrow && (
                  <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#FF8A3D]/90 md:text-sm">
                    {slide.eyebrow}
                  </p>
                )}
              </div>
              <h2 className="mt-4 text-3xl font-semibold leading-[1.05] tracking-tight text-white [text-shadow:0_1px_14px_rgba(0,0,0,0.95)] md:text-5xl">
                {slide.title}
              </h2>
              <p className="mt-6 max-w-[520px] text-base leading-relaxed text-zinc-300 [text-shadow:0_1px_12px_rgba(0,0,0,0.95)] md:text-lg">
                {slide.body}
              </p>
              {slide.tags && (
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {/* glass chips: gradient glass fill, glowing dot marker,
                      soft outer glow — premium, not flat */}
                  {slide.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 rounded-full border border-[#FF8A3D]/35 bg-[linear-gradient(135deg,rgba(255,138,61,0.16),rgba(255,255,255,0.04)_55%,rgba(255,138,61,0.07))] px-4 py-1.5 text-xs font-medium text-zinc-100 shadow-[0_0_16px_-4px_rgba(255,138,61,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FF9E55] shadow-[0_0_6px_rgba(255,158,85,0.9)]" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {slide.button && (
                <a
                  href="mailto:softsuave.ai@gmail.com"
                  className="btn-primary pointer-events-auto mt-8 inline-block rounded-full px-8 py-3.5 text-sm font-semibold text-[#1a0a04]"
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
