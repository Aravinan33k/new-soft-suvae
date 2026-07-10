"use client";

import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  FiChevronLeft,
  FiChevronRight,
  FiPause,
  FiPlay,
  FiArrowRight,
} from "react-icons/fi";
import {
  TbStarFilled,
  TbTruck,
  TbHeartbeat,
  TbBuildingBank,
  TbBuildingFactory2,
  TbShoppingCart,
  TbSchool,
  TbUsers,
  TbPlayerPlayFilled,
  TbClock,
} from "react-icons/tb";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// ── "What Our Clients Say" — a cinematic, streaming-style showcase ─────────
// Modeled on a premium spatial media dashboard: floating glass panels, poster
// cards, a full-bleed hero, and circular play controls. A left rail of client
// "stories" drives an auto-rotating featured testimonial; a poster row lets
// you jump to any story. Search + tabs are cosmetic. Reads the theme tokens,
// but the image-backed surfaces intentionally carry light text over dark art.

type Client = {
  id: string;
  name: string;
  industry: string;
  icon: IconType;
  accent: string;
  img: string; // reuses the existing industry artwork in /public/industries
  headline: string; // the big featured quote
  quote: string; // supporting paragraph under the headline
  short: string; // one-liner shown on poster / list rows
  author: string;
  role: string;
  rating: number;
};

const CLIENTS: Client[] = [
  {
    id: "logistics",
    name: "Global Logistics Co.",
    industry: "Logistics & Supply Chain",
    icon: TbTruck,
    accent: "#FF8A3D",
    img: "/industries/logistics.jpg",
    headline: "Soft Suave transformed our operations with AI.",
    quote:
      "Their AI-powered logistics solution helped us optimize routes, reduce fuel costs, and improve delivery timelines. The results exceeded our expectations.",
    short:
      "AI route optimization cut our fuel costs and lifted on-time delivery across every region.",
    author: "Ravi Kumar",
    role: "CTO, Global Logistics Co.",
    rating: 5,
  },
  {
    id: "healthtech",
    name: "CityCare Hospitals",
    industry: "Healthcare",
    icon: TbHeartbeat,
    accent: "#2ED3B7",
    img: "/industries/healthtech.jpg",
    headline: "Patient engagement jumped 60% with their AI.",
    quote:
      "The AI chatbot and patient analytics system streamlined triage, reduced wait times, and gave our clinicians the insights they needed at the point of care.",
    short:
      "The AI chatbot and patient analytics system improved patient engagement by 60%.",
    author: "Dr. Anil Mehta",
    role: "Director of Operations",
    rating: 5,
  },
  {
    id: "fintech",
    name: "FinWise Bank",
    industry: "Banking & FinTech",
    icon: TbBuildingBank,
    accent: "#4EA8FF",
    img: "/industries/fintech.jpg",
    headline: "Fraud detection accuracy improved by 45%.",
    quote:
      "After implementing their AI solution, false positives dropped sharply while genuine fraud was caught earlier — protecting both our customers and our bottom line.",
    short:
      "Fraud detection accuracy improved by 45% after implementing their AI solution.",
    author: "Sneha Iyer",
    role: "Head of Risk",
    rating: 5,
  },
  {
    id: "manufacturing",
    name: "NextGen Manufacturing",
    industry: "Manufacturing",
    icon: TbBuildingFactory2,
    accent: "#FFB020",
    img: "/industries/manufacturing.jpg",
    headline: "Predictive maintenance saved us millions.",
    quote:
      "Predictive maintenance reduced unplanned downtime by 35% and helped us catch failures before they happened — saving us millions in operating costs.",
    short:
      "Predictive maintenance reduced downtime by 35% and saved us millions in costs.",
    author: "Arjun Patel",
    role: "Plant Manager",
    rating: 5,
  },
  {
    id: "ecommerce",
    name: "ShopEase",
    industry: "E-commerce",
    icon: TbShoppingCart,
    accent: "#B57BFF",
    img: "/industries/ecommerce.jpg",
    headline: "Their recommendation engine grew sales 28%.",
    quote:
      "The AI recommendation engine increased our sales by 28% within just three months, while smarter inventory forecasting kept our best sellers in stock.",
    short:
      "Their recommendation engine increased our sales by 28% within just 3 months.",
    author: "Meera Shah",
    role: "Head of Growth",
    rating: 5,
  },
  {
    id: "edtech",
    name: "EduFuture",
    industry: "EdTech",
    icon: TbSchool,
    accent: "#FF7EB6",
    img: "/industries/edtech.jpg",
    headline: "Adaptive learning lifted completion 41%.",
    quote:
      "Their adaptive learning platform personalized every course path, driving a 41% jump in completion rates and far deeper learner engagement across our catalogue.",
    short:
      "Adaptive learning powered by their AI lifted course completion rates by 41%.",
    author: "Priya Nair",
    role: "Head of Product",
    rating: 5,
  },
];

// Headline metric per client — animates (counts up) on each hero change.
const METRIC: Record<string, { value: string; label: string }> = {
  logistics: { value: "32%", label: "On-Time Delivery" },
  healthtech: { value: "60%", label: "Patient Engagement" },
  fintech: { value: "45%", label: "Fraud Accuracy" },
  manufacturing: { value: "35%", label: "Less Downtime" },
  ecommerce: { value: "28%", label: "Sales Growth" },
  edtech: { value: "41%", label: "Course Completion" },
};

const HOLD_MS = 7000; // featured testimonial auto-advance interval (ms)

// Fixed-position ambient particles drifting up through the showcase (fixed
// values so SSR/CSR markup match — no Math.random hydration mismatch).
const SHOWCASE_PARTICLES = [
  { left: "8%", size: 3, delay: "0s", dur: "13s", tint: "bg-[#FF8A3D]/40" },
  { left: "22%", size: 2, delay: "3.2s", dur: "16s", tint: "bg-white/25" },
  { left: "41%", size: 4, delay: "1.4s", dur: "12s", tint: "bg-[#FFC08A]/35" },
  { left: "57%", size: 2, delay: "4.6s", dur: "17s", tint: "bg-[#4EA8FF]/35" },
  { left: "71%", size: 3, delay: "2.1s", dur: "14s", tint: "bg-[#FF8A3D]/30" },
  { left: "84%", size: 2, delay: "5.4s", dur: "15s", tint: "bg-white/20" },
  { left: "93%", size: 3, delay: "1s", dur: "18s", tint: "bg-[#FFC08A]/30" },
];

// Applied to whichever card is the active/featured story across all lists.
const ACTIVE_CARD =
  "scale-[1.03] border-(--brand-orange)/60 shadow-[0_0_0_1px_var(--brand-orange),0_22px_50px_-20px_var(--glow-orange)]";

// Featured client video testimonials shown in the left "Top Stories" rail.
// Each carries the related story shown on the big screen while it plays.
const TOP_VIDEOS: Video[] = [
  {
    src: "/reviews/tim-maliyil.mp4",
    title: "Tim Maliyil's Journey",
    subtitle: "From challenges to success",
    related: {
      industry: "Data Security",
      icon: TbBuildingBank,
      accent: "#4EA8FF",
      image: "/projects/data-security.svg",
      headline: "A reliable, invaluable technology partner.",
      quote:
        "Soft Suave's commitment to meeting deadlines, flexibility in working hours, and ability to seamlessly integrate with our U.S. team make them a reliable and invaluable technology partner.",
      author: "Tim Maliyil",
      role: "Founder & CEO, AlertBoot",
      company: "AlertBoot",
      rating: 5,
      metric: { value: "10+", label: "Years Partnered" },
    },
  },
  {
    src: "/reviews/dimitris-rokos.mp4",
    title: "Dimitris Rokos",
    subtitle: "CEO, AMD Telecom",
    related: {
      industry: "Telecom",
      icon: TbBuildingFactory2,
      accent: "#FF8A3D",
      image: "/projects/telecom-network.svg",
      headline: "They reduced our costs by 40%.",
      quote:
        "I've worked with Soft Suave for 3 years and the experience was unique. Partnering with them reduced our costs by 40% and increased our delivery speed by 20%.",
      author: "Dimitris Rokos",
      role: "Founder & CEO, AMD Telecom",
      company: "AMD Telecom",
      rating: 5,
      metric: { value: "40%", label: "Cost Reduction" },
    },
  },
  {
    src: "/reviews/dara-huang.mp4",
    title: "Dara Huang's Experience",
    subtitle: "From start to success with Soft Suave",
    related: {
      industry: "E-commerce",
      icon: TbShoppingCart,
      accent: "#B57BFF",
      image: "/projects/pet-ecommerce.svg",
      headline: "Beyond impressed with what they delivered.",
      quote:
        "Their 40-hour free trial isn't just a marketing promise — it's a genuine opportunity to experience top-notch developer skills. I was beyond impressed with what they delivered during the trial period!",
      author: "Dara Huang",
      role: "Co-Founder, Perkypet",
      company: "Perkypet",
      rating: 5,
      metric: { value: "40hr", label: "Free Trial" },
    },
  },
  {
    src: "/reviews/beautiful-mind.mp4",
    title: "Beautiful Mind",
    subtitle: "Social media & peer-support platform",
    related: {
      industry: "HealthTech",
      icon: TbHeartbeat,
      accent: "#FF7EB6",
      image: "/projects/mental-health.svg",
      headline: "They built our platform from concept to launch.",
      quote:
        "Soft Suave helped us bring Beautiful Mind to life — a social media and peer-support platform — guiding us from concept through to a polished, launched product.",
      author: "Aaron Gander",
      role: "Founder, Beautiful Mind",
      company: "Beautiful Mind",
      rating: 5,
      metric: { value: "1", label: "Platform Launched" },
    },
  },
];

// Real client video testimonials in /public/reviews.
const VIDEO_STORIES: Video[] = [
  {
    src: "/reviews/happy-clients.mp4",
    title: "Real Clients, Real Results",
    subtitle: "Hear what our happy clients say",
    related: {
      industry: "Across Industries",
      icon: TbUsers,
      accent: "#2ED3B7",
      image: "/projects/analytics.svg",
      headline: "Real clients. Real results.",
      quote:
        "Hear directly from the clients who trusted Soft Suave to design, build, and scale their products — across logistics, healthcare, finance, and beyond.",
      author: "Soft Suave Clients",
      role: "Global client community",
      company: "Soft Suave",
      rating: 5,
      metric: { value: "100+", label: "Happy Clients" },
    },
  },
  {
    src: "/reviews/dara-huang.mp4",
    title: "Dara Huang's Experience",
    subtitle: "From start to success with Soft Suave",
    related: {
      industry: "E-commerce",
      icon: TbShoppingCart,
      accent: "#B57BFF",
      image: "/projects/pet-ecommerce.svg",
      headline: "Beyond impressed with what they delivered.",
      quote:
        "Their 40-hour free trial isn't just a marketing promise — it's a genuine opportunity to experience top-notch developer skills. I was beyond impressed with what they delivered during the trial period!",
      author: "Dara Huang",
      role: "Co-Founder, Perkypet",
      company: "Perkypet",
      rating: 5,
      metric: { value: "40hr", label: "Free Trial" },
    },
  },
  {
    src: "/reviews/beautiful-mind.mp4",
    title: "Beautiful Mind",
    subtitle: "Social media & peer-support platform",
    related: {
      industry: "HealthTech",
      icon: TbHeartbeat,
      accent: "#FF7EB6",
      image: "/projects/mental-health.svg",
      headline: "They built our platform from concept to launch.",
      quote:
        "Soft Suave helped us bring Beautiful Mind to life — a social media and peer-support platform — guiding us from concept through to a polished, launched product.",
      author: "Aaron Gander",
      role: "Founder, Beautiful Mind",
      company: "Beautiful Mind",
      rating: 5,
      metric: { value: "1", label: "Platform Launched" },
    },
  },
];

// A video review: shows a poster frame grabbed from the video itself (a moment
// where the speaker is on screen, not the black intro) with a play overlay;
// clicking plays it inline with native controls. The frame is captured
// client-side once the card scrolls into view, so the large files aren't
// fetched until needed. Playing a card fires onPlay so the big hero can show
// this video's related story; onEnded lets the hero return to the rotation.
type HeroContent = {
  industry: string;
  icon: IconType;
  accent: string;
  image: string; // project-UI backdrop shown behind the big screen
  headline: string;
  quote: string;
  author: string;
  role: string;
  company: string; // reviewer's company — rendered as a monogram trust mark
  rating: number;
  metric?: { value: string; label: string };
};

// Project-UI backdrop per client story (reuses the AI/app-UI mockups).
const CLIENT_IMAGE: Record<string, string> = {
  logistics: "/carousel/05-global-network.jpg",
  healthtech: "/carousel/01-ai-chatbot-assistant.jpg",
  fintech: "/carousel/03-ai-data-interface.jpg",
  manufacturing: "/carousel/06-cloud-computing.jpg",
  ecommerce: "/carousel/02-mobile-app-ui.jpg",
  edtech: "/carousel/04-cross-platform-software.jpg",
};
type Video = { src: string; title: string; subtitle: string; related: HeroContent };

// A small monochrome company "logo" — a monogram tile in the client's brand
// accent, shown beside the reviewer. These are our own clients (not Google/
// AWS), so we render an honest lettermark rather than borrowed brand logos —
// same trust cue, no false endorsement.
function CompanyMark({ name, accent }: { name: string; accent: string }) {
  const initials = name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-[12px] font-black leading-none tracking-tight text-white backdrop-blur-md"
      style={{
        borderColor: `${accent}66`,
        background: `linear-gradient(135deg, ${accent}55, ${accent}1f)`,
        boxShadow: `0 6px 16px -8px ${accent}, inset 0 1px 0 rgba(255,255,255,0.18)`,
      }}
    >
      {initials}
    </span>
  );
}

// Featured-review backdrop with a "generating" load feel: a skeleton shimmer
// holds the frame, then the image fades up from a heavy blur to sharp once it
// decodes. Mounted with key={story} so the cycle replays on every change.
function HeroBackdrop({ src }: { src: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Cached images can be `complete` before React attaches onLoad — sync once.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <>
      {/* skeleton shimmer — fades out as the image resolves */}
      <div
        aria-hidden
        className={`cs-shimmer absolute inset-0 transition-opacity duration-700 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt=""
        onLoad={() => setLoaded(true)}
        className={`holo-img absolute inset-0 h-full w-full scale-105 object-cover transition-[opacity,filter] duration-[900ms] ease-out ${
          loaded ? "opacity-100 blur-0" : "opacity-0 blur-2xl"
        }`}
      />
    </>
  );
}

// mm:ss for the video duration badge
function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function VideoCard({
  video,
  onPlay,
  onEnded,
  onPreviewStart,
  onPreviewEnd,
  active = false,
  dimmed = false,
}: {
  video: Video;
  onPlay: (v: Video) => void;
  onEnded: (v: Video) => void;
  // hover preview started/stopped — lets the big screen swap just its backdrop
  onPreviewStart?: (v: Video) => void;
  onPreviewEnd?: (v: Video) => void;
  active?: boolean;
  dimmed?: boolean; // another card is active — recede into the background
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [previewing, setPreviewing] = useState(false); // muted hover preview
  const [poster, setPoster] = useState<string>();
  const [duration, setDuration] = useState<number>();

  // Netflix/Apple-TV style hover preview: the video plays muted while the
  // cursor is over the card. `previewRef` marks the playback as a silent
  // preview so onPlay doesn't hijack the big hero screen. Disabled under
  // reduced-motion. A real click (below) clears the flag and unmutes.
  const previewRef = useRef(false);
  const startPreview = () => {
    const v = ref.current;
    if (!v || playing || reduced) return;
    previewRef.current = true;
    v.muted = true;
    setPreviewing(true);
    v.play().catch(() => {});
    // the big screen backdrop follows the previewing video's project
    onPreviewStart?.(video);
  };
  const stopPreview = () => {
    const v = ref.current;
    if (!v || !previewRef.current) return;
    previewRef.current = false;
    setPreviewing(false);
    v.pause();
    onPreviewEnd?.(video);
  };

  // Single-video playback: only one video plays at a time. When another card
  // becomes the active one, this card's `active` turns false — so pause its
  // video. Pausing an already-paused element is a no-op, so this is safe.
  useEffect(() => {
    if (!active) ref.current?.pause();
  }, [active]);

  // Videos only play while the user is actually on this area: scrolling the
  // card (mostly) out of the viewport auto-pauses it. The overlay reappears
  // via onPause, and the user can resume when they scroll back.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) ref.current?.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(box);
    return () => io.disconnect();
  }, []);

  // Capture a representative frame as the poster once the card is in view.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let cancelled = false;
    let started = false;

    const capture = () => {
      if (started) return;
      started = true;
      const v = document.createElement("video");
      v.src = video.src;
      v.muted = true;
      v.preload = "metadata";
      v.crossOrigin = "anonymous";

      const onMeta = () => {
        if (Number.isFinite(v.duration)) setDuration(v.duration);
        // seek ~20% in (clamped 4–25s) to land on the speaker, past any intro
        const t = Math.min(Math.max((v.duration || 20) * 0.2, 4), 25);
        v.currentTime = Number.isFinite(t) ? t : 4;
      };
      const onSeeked = () => {
        if (cancelled) return cleanup();
        try {
          const c = document.createElement("canvas");
          c.width = v.videoWidth;
          c.height = v.videoHeight;
          c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
          setPoster(c.toDataURL("image/jpeg", 0.7));
        } catch {
          /* tainted/decode failure — leave the plain black backdrop */
        }
        cleanup();
      };
      const cleanup = () => {
        v.removeEventListener("loadedmetadata", onMeta);
        v.removeEventListener("seeked", onSeeked);
        v.removeAttribute("src");
        v.load();
      };
      v.addEventListener("loadedmetadata", onMeta);
      v.addEventListener("seeked", onSeeked);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          capture();
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(box);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [video.src]);

  return (
    <div
      ref={boxRef}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
      className={`group relative aspect-video w-full overflow-hidden rounded-2xl border bg-black shadow-[0_20px_50px_-30px_var(--shadow-strong)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_30px_65px_-22px_var(--glow-orange)] hover:ring-1 hover:ring-(--brand-orange)/45 ${
        active
          ? ACTIVE_CARD
          : dimmed
            ? "border-(--border) opacity-60 blur-[1.5px] saturate-[0.85] hover:opacity-100 hover:blur-0 hover:border-(--brand-orange)/50"
            : "border-(--border) hover:scale-[1.02] hover:border-(--brand-orange)/50"
      }`}
    >
      <video
        ref={ref}
        src={video.src}
        poster={poster}
        preload="none"
        playsInline
        controls={playing}
        onPlay={() => {
          // silent hover preview — don't promote it to the big hero screen
          if (previewRef.current) return;
          setPlaying(true);
          onPlay(video);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          // a hover preview that ran to the end releases the backdrop too
          if (previewRef.current) {
            previewRef.current = false;
            setPreviewing(false);
            onPreviewEnd?.(video);
          }
          setPlaying(false);
          onEnded(video);
        }}
        className={`absolute inset-0 h-full w-full object-cover transition-[transform,filter] duration-[900ms] ease-out group-hover:brightness-110 ${
          playing ? "" : "group-hover:scale-[1.06]"
        }`}
      />
      {!playing && (
        <button
          type="button"
          aria-label={`Play: ${video.title}`}
          onClick={() => {
            const v = ref.current;
            if (!v) return;
            // real play: clear the preview flag and unmute
            previewRef.current = false;
            setPreviewing(false);
            v.muted = false;
            v.play();
          }}
          className="absolute inset-0 flex flex-col items-center justify-center text-left"
        >
          {/* scrim lightens on hover / while previewing so the footage reads through */}
          <span
            className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/15 transition-opacity duration-500 group-hover:opacity-70 ${
              previewing ? "opacity-40" : "opacity-100"
            }`}
          />
          {/* duration badge — slides in from the right on hover */}
          {duration != null && (
            <span className="pointer-events-none absolute right-3 top-3 flex translate-x-2 items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 backdrop-blur-sm transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100">
              <TbClock className="h-3 w-3" /> {fmtDuration(duration)}
            </span>
          )}
          {/* play affordance — hidden by default, grows in on hover; once the
              muted preview actually starts playing, the icon itself gets out
              of the way (footage reads through) even though the card is
              still hovered — only the title/subtitle stay visible */}
          <span
            className={`relative flex h-11 w-11 scale-90 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white opacity-0 backdrop-blur-md transition-all duration-300 ease-out group-hover:scale-100 group-hover:border-(--brand-orange) group-hover:bg-(--brand-orange) group-hover:opacity-100 group-hover:shadow-[0_0_26px_-4px_var(--glow-orange)] ${
              previewing ? "opacity-0! scale-75!" : ""
            }`}
          >
            {/* soft pulse ring on hover */}
            <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-ping group-hover:bg-white/10" />
            <TbPlayerPlayFilled className="relative ml-0.5 h-5 w-5" />
          </span>
          <span className="absolute inset-x-0 bottom-0 p-4">
            <span className="block text-sm font-bold text-white">{video.title}</span>
            <span className="mt-0.5 block text-[11px] text-white/75">{video.subtitle}</span>
          </span>
        </button>
      )}
    </div>
  );
}

// Frosted circular button — the signature "play" affordance of the reference.
// Glassmorphism (blur + inset highlight), orange hover, and a subtle magnetic
// pull: the button eases toward the cursor while hovered, springing back on
// exit. Disabled under reduced-motion.
function GlassCircle({
  label,
  onClick,
  size = "md",
  active = false,
  onImage = false,
  children,
}: {
  label: string;
  onClick?: () => void;
  size?: "sm" | "md";
  active?: boolean;
  onImage?: boolean; // white glass, for use over a dark image
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const [pull, setPull] = useState({ x: 0, y: 0 });

  // Magnetic: translate a fraction of the cursor's offset from the button
  // centre (capped) so it "reaches" toward the pointer without chasing it.
  const onMove = (e: React.MouseEvent) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const cap = 8;
    setPull({
      x: Math.max(-cap, Math.min(cap, dx * 0.4)),
      y: Math.max(-cap, Math.min(cap, dy * 0.4)),
    });
  };
  const reset = () => setPull({ x: 0, y: 0 });

  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const rest = onImage
    ? "border-white/20 bg-white/10 text-white ring-1 ring-inset ring-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] hover:border-(--brand-orange)/60 hover:bg-(--brand-orange) hover:ring-(--brand-orange)/40"
    : "border-(--border) bg-(--card)/70 text-(--foreground) ring-1 ring-inset ring-white/8 hover:border-(--brand-orange)/50 hover:text-(--brand-orange)";
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ transform: `translate(${pull.x}px, ${pull.y}px)` }}
      className={`group/glass flex ${dim} shrink-0 items-center justify-center rounded-full border backdrop-blur-xl transition-transform duration-300 ease-out hover:shadow-[0_0_22px_-4px_var(--glow-orange)] ${
        active ? "border-(--brand-orange)/50 bg-(--brand-orange)/15 text-(--brand-orange)" : rest
      }`}
    >
      {/* icon scales on hover independently of the button's magnetic transform */}
      <span className="transition-transform duration-300 ease-out group-hover/glass:scale-110">
        {children}
      </span>
    </button>
  );
}

export default function ClientShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false); // manual pause button
  const [hovered, setHovered] = useState(false); // hover-to-pause
  const [activeVideo, setActiveVideo] = useState<Video | null>(null); // video whose story is on the big screen
  // hover-previewing video — swaps ONLY the big screen's backdrop to its
  // project image; the stars, quote, author and progress bars stay put
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const reduced = useReducedMotion();
  const n = CLIENTS.length;
  const client = CLIENTS[active];

  // The big screen shows the playing video's related story, else the rotating
  // client story. Rotation pauses whenever a video story owns the screen.
  const hero: HeroContent = activeVideo
    ? activeVideo.related
    : {
        industry: client.industry,
        icon: client.icon,
        accent: client.accent,
        image: CLIENT_IMAGE[client.id],
        headline: client.headline,
        quote: client.quote,
        author: client.author,
        role: client.role,
        company: client.name,
        rating: client.rating,
        metric: METRIC[client.id],
      };
  const heroId = activeVideo ? activeVideo.src : client.id;
  // The backdrop alone also follows a hover preview: while a card previews,
  // its project image slides in behind the unchanged copy, and eases back out
  // when the cursor leaves. A real (clicked) play still swaps the whole story.
  const backdrop = activeVideo ?? previewVideo;
  const backdropSrc = backdrop ? backdrop.related.image : hero.image;
  const backdropId = backdrop ? backdrop.src : client.id;
  const playing = !paused && !hovered && !activeVideo;

  const next = () => setActive((a) => (a + 1) % n);
  // A real play owns the screen — any lingering preview backdrop yields to it.
  const playVideo = (v: Video) => {
    setPreviewVideo(null);
    setActiveVideo(v);
  };
  const endPreview = (vid: Video) =>
    setPreviewVideo((cur) => (cur === vid ? null : cur));
  // Selecting a client clears any active video story and resumes the rotation.
  const selectClient = (i: number) => {
    setActiveVideo(null);
    setActive(i);
  };
  const go = (dir: number) => selectClient((active + dir + n) % n);

  // With motion enabled, the story progress bar's animationend drives the
  // advance (kept perfectly in sync). Reduced motion has no animation, so we
  // fall back to a plain timer here.
  useEffect(() => {
    if (!playing || !reduced) return;
    const t = setTimeout(next, HOLD_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, playing, reduced]);


  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* faint particles drifting upward — a subtle "AI" ambience */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {SHOWCASE_PARTICLES.map((p, i) => (
          <span
            key={i}
            className={`ind-particle absolute bottom-[-10px] rounded-full ${p.tint}`}
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.dur,
            }}
          />
        ))}
      </div>

      {/* ── Body: aligned row-grid ── */}
      <div className="relative mt-5 grid gap-6 lg:grid-cols-[300px_1fr] lg:items-stretch lg:gap-10">
        {/* ── LEFT rail: featured video testimonials (no panel box, but the
            old p-4 inset kept so the videos stay their original size) ── */}
        <div className="flex flex-col gap-3 px-4">
          {TOP_VIDEOS.map((v) => (
            <VideoCard
              key={v.src}
              video={v}
              onPlay={playVideo}
              onEnded={(vid) => setActiveVideo((cur) => (cur === vid ? null : cur))}
              onPreviewStart={setPreviewVideo}
              onPreviewEnd={endPreview}
              active={activeVideo === v}
              dimmed={activeVideo != null && activeVideo.src !== v.src}
            />
          ))}
        </div>

        {/* ── RIGHT stage: Hero + Video Stories. The vertical gap matches the
            grid's column gutter, so the space under the big screen equals the
            space between the left rail and the big screen; the flex-1 hero
            shrinks to absorb it. ── */}
        <div className="flex flex-col gap-6 lg:gap-10">
          {/* Hero featured testimonial */}
          <div className="relative min-h-[400px] overflow-hidden rounded-3xl border border-(--border) bg-black shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:min-h-[440px] lg:min-h-0 lg:flex-1">
            {/* project-UI backdrop — shimmer skeleton → blurred → sharpens in.
                Keyed by story (or previewing video) so the load cycle replays
                on every change. Hover previews swap only this layer. */}
            <HeroBackdrop key={`bg-${backdropId}`} src={backdropSrc} />
            {/* lighter scrims — the backdrop image stays clearly visible; only
                the bottom is darkened enough to keep the small caption legible */}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/30 to-transparent" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-transparent" />

            {/* orange gradient wipe — replays on every story change */}
            <div
              key={`wipe-${heroId}`}
              aria-hidden
              className="story-wipe pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,transparent_35%,var(--glow-orange)_50%,transparent_65%)]"
            />

            {/* top row: story progress bars, or a back control while a video story shows */}
            {activeVideo ? (
              <div className="absolute inset-x-6 top-5 z-10 md:inset-x-9">
                <button
                  type="button"
                  onClick={() => setActiveVideo(null)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md transition-colors hover:border-(--brand-orange)/60"
                >
                  <FiChevronLeft className="h-3.5 w-3.5" /> Back to client stories
                </button>
              </div>
            ) : (
              <div className="absolute inset-x-6 top-5 z-10 md:inset-x-9">
                {/* status line: live state + position counter, so it's obvious
                    the reviews are auto-advancing */}
                <div className="mb-2 flex items-center justify-between text-[11px] font-medium">
                  <span className="inline-flex items-center gap-1.5 text-white/85 [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        playing
                          ? "animate-pulse bg-(--brand-orange) shadow-[0_0_8px_var(--glow-orange)]"
                          : "bg-white/50"
                      }`}
                    />
                    {playing ? "Auto-playing stories" : "Paused"}
                  </span>
                  <span className="tabular-nums tracking-[0.2em] [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
                    <span className="text-white">{String(active + 1).padStart(2, "0")}</span>
                    <span className="text-white/45"> / {String(n).padStart(2, "0")}</span>
                  </span>
                </div>
                {/* segmented progress — one bar per story */}
                <div className="flex gap-1.5">
                  {CLIENTS.map((cl, i) => (
                    <button
                      key={cl.id}
                      type="button"
                      aria-label={`Show ${cl.name}`}
                      onClick={() => selectClient(i)}
                      className="group relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/20 transition-transform hover:scale-y-150"
                    >
                      {/* the active one fills over the hold duration; its
                          animationend advances to the next story */}
                      <span
                        key={i === active ? `fill-${client.id}` : undefined}
                        className={
                          i === active
                            ? "story-progress block h-full w-full rounded-full bg-(--brand-orange) shadow-[0_0_10px_var(--glow-orange)]"
                            : "block h-full rounded-full bg-(--brand-orange)"
                        }
                        style={
                          i === active
                            ? {
                                animationDuration: `${HOLD_MS}ms`,
                                animationPlayState: playing ? "running" : "paused",
                              }
                            : { width: i < active ? "100%" : "0%" }
                        }
                        onAnimationEnd={i === active ? next : undefined}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* what the client said + rating + author, over the project image —
                replays (fade-up) whenever the story or playing video changes */}
            <div
              key={`copy-${heroId}`}
              className="absolute inset-x-6 bottom-20 z-10 max-w-2xl md:inset-x-9 md:bottom-24"
            >
              {/* Cinematic staggered reveal — the image (holo-img Ken Burns)
                  zooms first, then stars pop, quote fades up, and the
                  attribution + company mark slide in, one beat after another. */}
              {/* rating leads — pops in */}
              <span
                className="flex gap-1 text-(--brand-orange) [animation-fill-mode:both] animate-[csPop_0.5s_cubic-bezier(0.22,1,0.36,1)]"
                style={{ animationDelay: "0.12s" }}
              >
                {Array.from({ length: hero.rating }).map((_, i) => (
                  <TbStarFilled
                    key={i}
                    className="h-4 w-4 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] [animation-fill-mode:both] animate-[csPop_0.45s_cubic-bezier(0.22,1,0.36,1)]"
                    style={{ animationDelay: `${0.14 + i * 0.06}s` }}
                  />
                ))}
              </span>
              {/* the quote IS the hero — largest, heaviest element in the block */}
              <p
                className="mt-3 line-clamp-4 text-lg font-semibold leading-snug tracking-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.95)] [animation-fill-mode:both] animate-[fadeUp_0.6s_cubic-bezier(0.22,1,0.36,1)] md:text-2xl md:leading-[1.3]"
                style={{ animationDelay: "0.24s" }}
              >
                &ldquo;{hero.quote}&rdquo;
              </p>
              {/* attribution + industry badge — slide in last */}
              <div
                className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 [animation-fill-mode:both] animate-[csSlideIn_0.55s_cubic-bezier(0.22,1,0.36,1)]"
                style={{ animationDelay: "0.44s" }}
              >
                {/* company monogram beside the reviewer — an instant trust cue */}
                <div className="flex items-center gap-2.5">
                  <CompanyMark name={hero.company} accent={hero.accent} />
                  <span className="text-sm leading-tight">
                    <span className="block font-semibold text-white">{hero.author}</span>
                    <span className="block text-[12px] text-white/55">{hero.role}</span>
                  </span>
                </div>
                {/* category pill — gradient border, tinted glass, accent icon */}
                <span
                  className="inline-flex rounded-full p-px backdrop-blur-md"
                  style={{
                    background: `linear-gradient(135deg, ${hero.accent}, ${hero.accent}33 55%, rgba(255,255,255,0.14))`,
                    boxShadow: `0 4px 16px -8px ${hero.accent}`,
                  }}
                >
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${hero.accent}26, rgba(10,10,12,0.72))`,
                    }}
                  >
                    <hero.icon className="h-3.5 w-3.5" style={{ color: hero.accent }} />
                    {hero.industry}
                  </span>
                </span>
              </div>
            </div>

            {/* prev / next / pause — circular glass controls, bottom-right */}
            <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2.5">
              <GlassCircle label="Previous" onImage onClick={() => go(-1)}>
                <FiChevronLeft className="h-4 w-4" />
              </GlassCircle>
              <GlassCircle
                label={paused ? "Play" : "Pause"}
                active={paused}
                onImage
                onClick={() => setPaused((p) => !p)}
              >
                {paused ? <FiPlay className="h-4 w-4" /> : <FiPause className="h-4 w-4" />}
              </GlassCircle>
              <GlassCircle label="Next" onImage onClick={() => go(1)}>
                <FiChevronRight className="h-4 w-4" />
              </GlassCircle>
            </div>
          </div>

          {/* Client video stories — real testimonial videos (no heading) */}
          <div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {VIDEO_STORIES.map((v) => (
                <VideoCard
                  key={v.src}
                  video={v}
                  onPlay={playVideo}
                  onEnded={(vid) => setActiveVideo((cur) => (cur === vid ? null : cur))}
                  onPreviewStart={setPreviewVideo}
                  onPreviewEnd={endPreview}
                  active={activeVideo === v}
                  dimmed={activeVideo != null && activeVideo.src !== v.src}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* View-all affordance */}
      <div className="relative mt-5 flex justify-center">
        <a
          href="#testimonials"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-(--brand-orange) hover:text-(--brand-orange-hover)"
        >
          View All Reviews
          <FiArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
