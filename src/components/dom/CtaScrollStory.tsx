"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FiArrowRight } from "react-icons/fi";
import {
  TbCalendarEvent,
  TbUserFilled,
  TbSend,
  TbClock,
  TbTrendingUp,
} from "react-icons/tb";

// ── CTA scroll story: the four-corner fist bump ───────────────────────
// Layout (the reference): a FULL-BLEED photo of teammates' fists meeting
// fills the whole pinned viewport; the heading sits on top of it, the two
// engagement cards float over its left/right edges, and a label pill rides
// its bottom edge.
//
// Story (scroll-scrubbed while the section is pinned ~1.5 screens):
//   1. orange AI flow-lines draw themselves; insight panels brighten
//   2. the photo assembles from its FOUR QUADRANTS — each quarter (carrying
//      one arm) travels in from its corner and GENTLY docks at centre
//   3. at contact: a soft flash, a small glow, an expanding ring, a tiny
//      particle burst
//   4. the payoff arrives TOGETHER after the bump: the heading crossfades
//      "Ready to Transform…" → "Let's Build Together.", the body copy fades
//      in, and the two cards slide into place — then the CTAs highlight
//   5. the scene recedes (fades/shrinks slightly) so the next section takes
//      focus as the pin releases
// Heading position and nav stay put — until the bump the stage holds only
// heading A and the assembling photo. For prefers-reduced-motion (and below lg) there is no pin: the
// markup's default state IS the completed scene, so nothing depends on JS.
// Photo: Pexels #6476774 by Mikael Blomkvist (free licence) at
// public/cta/hands.jpg — drop any other image on that path to swap it.

const ENGINEERS = [
  { initials: "SI", from: "#FF9440", to: "#F92B4E" },
  { initials: "AP", from: "#4EA8FF", to: "#8B5CF6" },
  { initials: "RK", from: "#2ED3B7", to: "#4EA8FF" },
];

const CARD =
  "card-frosted card-frosted--glass group relative flex flex-col rounded-2xl p-6 text-center";

const EYEBROW_CLS =
  "text-xs font-medium uppercase tracking-[0.35em] text-(--brand-orange)";

// Deterministic contact-burst particles (no Math.random — SSR-safe).
const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  const d = 30 + (i % 3) * 13;
  return {
    x: Math.cos(a) * d,
    y: Math.sin(a) * d * 0.72,
    s: i % 2 ? 3 : 2,
  };
});

// Quadrant start offsets — each quarter flies in from its own corner.
const QUAD = [
  { x: -130, y: -95 }, // top-left
  { x: 130, y: -95 }, // top-right
  { x: -130, y: 95 }, // bottom-left
  { x: 130, y: 95 }, // bottom-right
];

// Each quadrant is an overflow-hidden window onto a full-size object-cover
// copy of the photo (offset to its corner), so the four windows compose the
// exact full-bleed picture at ANY viewport aspect — no stretching.
const QUAD_ANCHOR = [
  "left-0 top-0",
  "right-0 top-0",
  "left-0 bottom-0",
  "right-0 bottom-0",
] as const;

export default function CtaScrollStory() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null); // pinned wrapper
  const sceneRef = useRef<HTMLDivElement>(null); // full-bleed photo + FX
  const cardLRef = useRef<HTMLDivElement>(null);
  const cardRRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const headARef = useRef<HTMLDivElement>(null);
  const headBRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const quadRefs = useRef<(HTMLDivElement | null)[]>([]);
  const particleRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    // Full pinned story on desktop with motion allowed. Everywhere else the
    // markup's default state (scene complete, heading A) simply renders.
    mm.add(
      "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
      () => {
        const lines = root.querySelectorAll<SVGPathElement>(".cta-flow");
        const panels = root.querySelectorAll<HTMLElement>(".cta-panel");
        const buttons = root.querySelectorAll<HTMLElement>(".cta-btn");
        const quads = quadRefs.current.filter(Boolean);
        const particles = particleRefs.current.filter(Boolean) as HTMLElement[];

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: stageRef.current,
            start: "top top",
            end: "+=150%",
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // 1 — the AI lines flow in
        tl.fromTo(
          lines,
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 0.3, stagger: 0.045 },
          0,
        );
        // …insight panels brighten as the network wakes
        tl.fromTo(
          panels,
          { opacity: 0.12, y: 14 },
          { opacity: 1, y: 0, duration: 0.24, stagger: 0.035, ease: "power1.out" },
          0.06,
        );

        // 2 — the four quarters (one arm each) MATERIALIZE while travelling:
        // fully invisible + blurred at rest, they fade in and come into
        // focus only once already in motion — the eye never sees a static
        // "broken pieces" frame, just darkness → ghostly motion → sharp
        // hands joining.
        // NOTE: translation-only (no scale) — scaled quadrant windows would
        // overlap a few px at the centre seams and visibly "snap" into
        // alignment when docking; pure x/y means the join lands seamless.
        tl.fromTo(
          quads,
          {
            x: (i: number) => QUAD[i].x,
            y: (i: number) => QUAD[i].y,
            opacity: 0,
            filter: "blur(12px)",
          },
          {
            x: (i: number) => QUAD[i].x * 0.55,
            y: (i: number) => QUAD[i].y * 0.55,
            opacity: 0.65,
            filter: "blur(5px)",
            duration: 0.26,
            ease: "power1.in",
          },
          0.08,
        );
        tl.to(
          quads,
          {
            x: (i: number) => QUAD[i].x * 0.14,
            y: (i: number) => QUAD[i].y * 0.14,
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.26,
            ease: "power1.out",
          },
          0.34,
        );
        // …and GENTLY dock — the last few px land soft, no collision
        tl.to(
          quads,
          { x: 0, y: 0, duration: 0.14, ease: "power3.out" },
          0.6,
        );

        // 3 — contact: the light SWELLS and settles rather than blinking —
        // every FX ramps over enough scroll distance to read as one smooth
        // glow, not a spliced-in frame.
        tl.fromTo(
          flashRef.current,
          { opacity: 0 },
          { opacity: 0.2, duration: 0.06, ease: "power1.inOut" },
          0.72,
        );
        tl.to(
          flashRef.current,
          { opacity: 0, duration: 0.14, ease: "power1.out" },
          0.78,
        );
        tl.fromTo(
          glowRef.current,
          { scale: 0.3, opacity: 0 },
          { scale: 1, opacity: 0.85, duration: 0.07, ease: "power1.inOut" },
          0.72,
        );
        tl.to(
          glowRef.current,
          { scale: 1.7, opacity: 0, duration: 0.16, ease: "power1.out" },
          0.79,
        );
        tl.fromTo(
          ringRef.current,
          { scale: 0.25, opacity: 0.8 },
          { scale: 2.1, opacity: 0, duration: 0.18, ease: "power1.out" },
          0.73,
        );
        // a soft light pulse behind the hands — slow breath, not a blink
        tl.fromTo(
          pulseRef.current,
          { opacity: 0.25 },
          { opacity: 0.55, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.inOut" },
          0.72,
        );
        particles.forEach((p, i) => {
          const conf = PARTICLES[i % PARTICLES.length];
          tl.fromTo(
            p,
            { x: 0, y: 0, opacity: 0 },
            { opacity: 1, duration: 0.015 },
            0.745 + (i % 4) * 0.006,
          );
          tl.to(
            p,
            {
              x: conf.x,
              y: conf.y,
              opacity: 0,
              duration: 0.15,
              ease: "power2.out",
            },
            0.76 + (i % 4) * 0.006,
          );
        });

        // 4 — AFTER the bump, the payoff arrives together: the heading
        // crossfades to "Let's Build Together.", the body copy fades in,
        // and the two cards slide into place — then the CTAs highlight
        tl.to(
          headARef.current,
          { opacity: 0, filter: "blur(6px)", duration: 0.06, ease: "power1.in" },
          0.78,
        );
        tl.fromTo(
          headBRef.current,
          { opacity: 0, filter: "blur(6px)" },
          { opacity: 1, filter: "blur(0px)", duration: 0.08, ease: "power1.out" },
          0.82,
        );
        tl.fromTo(
          bodyRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.08, ease: "power1.out" },
          0.83,
        );
        tl.fromTo(
          cardLRef.current,
          { x: -64, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.1, ease: "power2.out" },
          0.8,
        );
        tl.fromTo(
          cardRRef.current,
          { x: 64, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.1, ease: "power2.out" },
          0.82,
        );
        // …then, as the scroll continues, the tilted cards straighten to a
        // flat, face-on alignment (GSAP starts from the same ±9° the CSS
        // class gives, so the handoff is seamless)
        tl.fromTo(
          root.querySelectorAll<HTMLElement>(".cta-card-inner"),
          {
            rotationY: (i: number) => (i === 0 ? 9 : -9),
            rotation: (i: number) => (i === 0 ? -1.5 : 1.5),
            transformPerspective: 1100,
          },
          {
            rotationY: 0,
            rotation: 0,
            transformPerspective: 1100,
            duration: 0.12,
            ease: "power1.inOut",
          },
          0.88,
        );
        tl.to(
          buttons,
          {
            boxShadow:
              "0 0 34px -4px rgba(255,138,61,0.85), 0 0 12px -2px rgba(255,138,61,0.5)",
            duration: 0.06,
            ease: "power1.out",
          },
          0.92,
        );

        // 5 — the centrepiece recedes so the next section takes focus.
        // Opacity only — scaling the full-bleed layer pulled the photo off
        // the screen edges, which read as a jarring reframe/"image swap".
        tl.to(
          sceneRef.current,
          { opacity: 0.55, duration: 0.07, ease: "power1.in" },
          0.93,
        );
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef}>
      {/* ── pinned stage: full-bleed photo, heading + cards laid over it ── */}
      <div
        ref={stageRef}
        className="relative flex flex-col px-6 pb-16 pt-24 lg:h-screen lg:justify-start lg:px-0 lg:pb-0 lg:pt-32"
      >
        {/* full-bleed backdrop — painted first so all content stacks above.
            Breaks out of the page column to touch every edge. The mask melts
            the top/bottom edges into the page background so the section never
            meets its neighbours with a hard horizontal cut. */}
        <div
          ref={sceneRef}
          className="absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 overflow-hidden"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, black 7rem, black calc(100% - 7rem), transparent)",
            maskImage:
              "linear-gradient(to bottom, transparent, black 7rem, black calc(100% - 7rem), transparent)",
          }}
        >
          {/* the photo, as four corner windows that assemble on scroll —
              each window is a quarter-view onto a full-size object-cover
              copy, so the picture literally arrives from the four corners
              and meets at the centre at any viewport aspect. */}
          {QUAD_ANCHOR.map((anchor, i) => (
            <div
              key={i}
              ref={(el) => {
                quadRefs.current[i] = el;
              }}
              className={`absolute h-1/2 w-1/2 overflow-hidden ${anchor}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/cta/hands.jpg"
                alt=""
                className="absolute h-[200%] w-[200%] max-w-none object-cover"
                style={{
                  left: i % 2 ? "-100%" : "0",
                  top: i > 1 ? "-100%" : "0",
                  filter: "saturate(1.02) contrast(1.06) brightness(0.92)",
                }}
              />
            </div>
          ))}

          {/* light grade: soft top/bottom bands keep the heading and pill
              readable while the photo stays vivid like the mockup */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,14,0.6),rgba(10,10,14,0.08)_36%,rgba(10,10,14,0.1)_62%,rgba(10,10,14,0.6))]" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 42%, rgba(10,10,14,0.45) 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 mix-blend-color"
            style={{ background: "rgba(255,122,61,0.1)" }}
          />

          {/* warm light pool behind the bump (pulses at contact) */}
          <div
            ref={pulseRef}
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[62%] w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--glow-orange),transparent_70%)] opacity-25 blur-3xl"
          />

          {/* flowing AI lines sweeping the full stage */}
          <svg
            viewBox="0 0 480 288"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
            fill="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="cta-rim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFB057" />
                <stop offset="100%" stopColor="#FF6A3D" />
              </linearGradient>
              <linearGradient id="cta-flowgrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FF8A3D" stopOpacity="0" />
                <stop offset="35%" stopColor="#FF8A3D" stopOpacity="0.6" />
                <stop offset="70%" stopColor="#FFB057" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#FFB057" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* four S-curve streams passing beneath the bump; pathLength is
                normalised so dashoffset 1→0 draws each line */}
            {[
              "M0 214 C 120 236, 340 238, 480 196",
              "M0 228 C 130 252, 330 254, 480 214",
              "M0 242 C 140 268, 320 268, 480 232",
              "M0 196 C 110 214, 350 218, 480 178",
            ].map((d, i) => (
              <path
                key={i}
                className="cta-flow"
                d={d}
                pathLength={1}
                strokeDasharray="1"
                stroke="url(#cta-flowgrad)"
                strokeWidth={i === 3 ? 0.8 : 1.2 - i * 0.1}
                opacity={0.7 - i * 0.14}
              />
            ))}
            {/* dotted data arc, upper right — echoes the reference */}
            <path
              className="cta-flow"
              d="M300 66 C 360 40, 430 44, 478 76"
              pathLength={1}
              strokeDasharray="0.02 0.025"
              stroke="#FFB057"
              strokeWidth="1.2"
              opacity="0.5"
            />
          </svg>

          {/* contact flash — one soft blink the moment the fists meet */}
          <div
            ref={flashRef}
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_47%_50%,rgba(255,214,160,0.9),rgba(255,138,61,0.35)_45%,transparent_75%)] opacity-0"
          />

          {/* seam blends — the photo dissolves into the page background at
              its top and bottom edges, so the neighbouring sections flow
              into the scene instead of meeting it at a hard cut */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,var(--background)_10%,transparent)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(0deg,var(--background)_12%,transparent)]" />

          {/* contact FX at the meeting point (the fists sit just left of
              true centre in this photo) */}
          <div className="pointer-events-none absolute left-[47%] top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              ref={glowRef}
              className="absolute -left-14 -top-14 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(255,176,87,0.95),rgba(255,138,61,0.35)_55%,transparent_75%)] opacity-0 blur-md"
            />
            <div
              ref={ringRef}
              className="absolute -left-12 -top-12 h-24 w-24 rounded-full border-2 border-(--brand-orange)/80 opacity-0"
            />
            {PARTICLES.map((p, i) => (
              <span
                key={i}
                ref={(el) => {
                  particleRefs.current[i] = el;
                }}
                className="absolute rounded-full opacity-0"
                style={{
                  width: p.s,
                  height: p.s,
                  background: i % 3 ? "#FFB057" : "#FF8A3D",
                  boxShadow: "0 0 6px rgba(255,158,85,0.9)",
                }}
              />
            ))}
          </div>

          {/* floating insight panels — brighten as the network wakes */}
          <div className="cta-panel chip-float absolute left-[15%] top-[16%] hidden -rotate-3 rounded-xl border border-(--brand-orange)/25 bg-white/[0.04] p-3 shadow-[0_0_20px_-8px_var(--glow-orange)] backdrop-blur-md md:block">
            <div className="flex h-9 items-end gap-1">
              {[45, 70, 55, 90, 65, 100].map((h, i) => (
                <span
                  key={i}
                  className="w-1.5 rounded-sm bg-gradient-to-t from-(--grad-3) to-(--grad-1)"
                  style={{ height: `${h}%`, opacity: 0.55 + (h / 100) * 0.45 }}
                />
              ))}
            </div>
            <p className="mt-1 text-[9px] text-(--text-secondary)">
              Model performance
            </p>
          </div>
          <div
            className="cta-panel chip-float absolute right-[14%] top-[15%] hidden rotate-2 rounded-xl border border-(--brand-orange)/25 bg-white/[0.04] p-3 shadow-[0_0_20px_-8px_var(--glow-orange)] backdrop-blur-md md:block"
            style={{ animationDelay: "-1.6s" }}
          >
            <svg viewBox="0 0 64 28" className="h-6 w-14" fill="none" aria-hidden>
              <polyline
                points="2,24 14,18 26,20 38,10 50,12 62,3"
                stroke="url(#cta-rim)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="62" cy="3" r="2.5" fill="#FFB057" />
            </svg>
            <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-(--brand-orange)">
              <TbTrendingUp className="h-3 w-3" /> +38% ROI
            </p>
          </div>
          <div
            className="cta-panel chip-float absolute bottom-[11%] left-[calc(50%-170px)] hidden rotate-2 rounded-xl border border-(--brand-orange)/25 bg-white/[0.04] px-3 py-2 backdrop-blur-md md:block"
            style={{ animationDelay: "-3.1s" }}
          >
            <p className="flex items-center gap-1.5 text-[10px] font-semibold text-(--heading)">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
              AI Roadmap ready
            </p>
          </div>
          <div
            className="cta-panel chip-float absolute bottom-[11%] right-[calc(50%-170px)] hidden -rotate-2 rounded-xl border border-(--brand-orange)/25 bg-white/[0.04] px-3 py-2 backdrop-blur-md md:block"
            style={{ animationDelay: "-4.4s" }}
          >
            <p className="text-[10px] font-semibold text-(--heading)">
              <span className="text-(--brand-orange)">92%</span> AI readiness
            </p>
          </div>

          {/* label pill riding the photo's lower edge */}
          <p className="absolute bottom-5 left-1/2 w-fit -translate-x-1/2 whitespace-nowrap rounded-full border border-(--brand-orange)/30 bg-black/40 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-(--brand-orange) backdrop-blur">
            Partnership, powered by AI
          </p>
        </div>

        {/* heading block — sits ON the photo; position stable, A crossfades
            to B at the bump */}
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div ref={headARef}>
            <p className={`${EYEBROW_CLS} mb-6`}>Let&rsquo;s build together</p>
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-[1.12] tracking-tight text-(--heading) [text-shadow:0_2px_28px_rgba(0,0,0,0.9)] md:text-4xl lg:text-5xl">
              Ready to Transform Your Business with{" "}
              <span className="bg-gradient-to-r from-(--grad-1) via-(--grad-2) to-(--grad-3) bg-clip-text text-transparent drop-shadow-[0_0_20px_var(--glow-orange)]">
                AI
              </span>
              ?
            </h2>
          </div>
          {/* heading B: stacked in the same box, revealed at contact */}
          <div
            ref={headBRef}
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center opacity-0"
          >
            <p className={`${EYEBROW_CLS} mb-6`}>Collaboration in action</p>
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-[1.12] tracking-tight text-(--heading) [text-shadow:0_2px_28px_rgba(0,0,0,0.9)] md:text-4xl lg:text-5xl">
              Let&rsquo;s Build{" "}
              <span className="bg-gradient-to-r from-(--grad-1) via-(--grad-2) to-(--grad-3) bg-clip-text text-transparent drop-shadow-[0_0_20px_var(--glow-orange)]">
                Together
              </span>
              .
            </h2>
          </div>
          {/* body copy — arrives with heading B + the cards after the bump
              (kept in flow so the heading block's height never shifts) */}
          <p
            ref={bodyRef}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-(--foreground) [text-shadow:0_1px_18px_rgba(0,0,0,0.9)]"
          >
            Book a free AI strategy session with our experts and discover where
            AI can create the biggest impact in your organization.
          </p>
        </div>

        {/* cards row — the reference placement: one card hugging each side,
            vertically centred over the photo. Plain flex (no absolute
            positioning), so it can't collapse or drift. Mobile: stacked. */}
        <div className="relative z-10 mx-auto mt-12 flex w-full max-w-[82rem] flex-1 flex-col items-center justify-center gap-10 lg:mt-0 lg:flex-row lg:items-center lg:justify-between lg:px-10 xl:px-14">
          {/* ── PLAN AHEAD ────────────────────────────────────────────── */}
          {/* outer div = layout + GSAP slide-in; inner div = the visible
              card with the reference's 3D tilt (kept separate so GSAP's
              transform writes can't wipe the perspective) */}
          <div
            ref={cardLRef}
            className="relative w-full max-w-xs sm:max-w-sm lg:w-77 lg:max-w-none"
          >
            <div
              className={`${CARD} cta-card-inner lg:[transform:perspective(1100px)_rotateY(9deg)_rotateZ(-1.5deg)]`}
            >
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-(--brand-orange)">
              Plan Ahead
            </p>
            <div className="relative mx-auto mt-4 h-18 w-15">
              <span
                aria-hidden
                className="absolute -inset-3 animate-pulse rounded-full bg-[radial-gradient(circle,var(--glow-orange),transparent_70%)] blur-md"
              />
              <div className="chip-float relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-(--border) bg-(--background-alt) shadow-[0_14px_34px_-14px_rgba(0,0,0,0.55)]">
                <div className="bg-gradient-to-r from-(--grad-1) to-(--grad-3) py-1 text-center text-[9px] font-bold uppercase tracking-wider text-white">
                  Book
                </div>
                <div className="flex flex-1 items-center justify-center">
                  <TbCalendarEvent className="h-6 w-6 animate-pulse text-(--brand-orange)" />
                </div>
              </div>
            </div>
            <h3 className="mt-4 text-lg font-bold text-(--heading)">
              Schedule your AI Strategy Session
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-(--foreground)">
              Prefer a structured deep-dive? Book a time that works.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="flex -space-x-2.5">
                {ENGINEERS.map((e) => (
                  <span
                    key={e.initials}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-(--card) text-[10px] font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${e.from}, ${e.to})`,
                    }}
                  >
                    {e.initials}
                  </span>
                ))}
              </div>
              <span className="text-left text-[11px] leading-tight text-(--foreground)">
                <span className="font-semibold text-(--heading)">Santhosh</span>
                <br />
                DevOps &amp; AI experts
              </span>
            </div>
            <a
              href="mailto:softsuave.ai@gmail.com"
              className="cta-btn mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-(--brand-orange)/40 bg-(--brand-orange)/10 px-5 py-2.5 text-sm font-semibold text-(--brand-orange) transition-all hover:bg-(--brand-orange) hover:text-white"
            >
              Choose Your Engineer &amp; Time
              <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </a>
            </div>
          </div>

          {/* ── INSTANT CONNECT ───────────────────────────────────────── */}
          <div
            ref={cardRRef}
            className="relative w-full max-w-xs sm:max-w-sm lg:w-77 lg:max-w-none"
          >
            <div
              className={`${CARD} cta-card-inner lg:[transform:perspective(1100px)_rotateY(-9deg)_rotateZ(1.5deg)]`}
            >
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-(--brand-orange)">
              Instant Connect
            </p>
            <p className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-(--text-secondary)">
              <TbClock className="h-3 w-3" /> Connect Now — 2 Minutes Avg. Wait
            </p>
            <div className="chip-float relative mx-auto mt-4 h-14 w-14">
              <span className="absolute inset-0 animate-ping rounded-full ring-2 ring-emerald-400/50" />
              <span className="absolute inset-0 rounded-full ring-2 ring-emerald-400/70" />
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-(--grad-1) to-(--grad-3) shadow-[0_0_24px_-4px_var(--glow-orange)]">
                <TbUserFilled className="h-8 w-8 text-white/90" />
              </div>
              <span className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-(--background-alt) px-2 py-0.5 text-[8px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                LIVE
              </span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-(--heading)">
              Talk to an AI Expert Now
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-(--foreground)">
              Have a quick technical hurdle or immediate question?
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-full border border-(--border) bg-(--background)/40 px-4 py-2.5 text-left">
              <span className="flex-1 text-xs text-(--text-secondary)">
                Ask your quick question&hellip;
              </span>
              <TbSend className="h-4 w-4 shrink-0 text-(--brand-orange)" />
            </div>
            <a
              href="mailto:softsuave.ai@gmail.com"
              className="cta-btn btn-primary mt-3 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
            >
              Start Chat
              <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
