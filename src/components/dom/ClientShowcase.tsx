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
  active = false,
}: {
  video: Video;
  onPlay: (v: Video) => void;
  onEnded: (v: Video) => void;
  active?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [poster, setPoster] = useState<string>();
  const [duration, setDuration] = useState<number>();

  // Single-video playback: only one video plays at a time. When another card
  // becomes the active one, this card's `active` turns false — so pause its
  // video. Pausing an already-paused element is a no-op, so this is safe.
  useEffect(() => {
    if (!active) ref.current?.pause();
  }, [active]);

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
      className={`group relative aspect-video w-full overflow-hidden rounded-2xl border bg-black shadow-[0_20px_50px_-30px_var(--shadow-strong)] transition-all ${
        active ? ACTIVE_CARD : "border-(--border) hover:border-(--brand-orange)/50"
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
          setPlaying(true);
          onPlay(video);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          onEnded(video);
        }}
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out ${
          playing ? "" : "group-hover:scale-[1.06]"
        }`}
      />
      {!playing && (
        <button
          type="button"
          aria-label={`Play: ${video.title}`}
          onClick={() => ref.current?.play()}
          className="absolute inset-0 flex flex-col items-center justify-center text-left"
        >
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/15 transition-colors group-hover:from-black/95" />
          {/* duration badge (top-right) once metadata is known */}
          {duration != null && (
            <span className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              <TbClock className="h-3 w-3" /> {fmtDuration(duration)}
            </span>
          )}
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md transition-all group-hover:scale-110 group-hover:border-(--brand-orange) group-hover:bg-(--brand-orange) group-hover:shadow-[0_0_28px_-4px_var(--glow-orange)]">
            {/* soft pulse ring on hover */}
            <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-ping group-hover:bg-white/10" />
            <TbPlayerPlayFilled className="relative ml-0.5 h-6 w-6" />
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
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const rest = onImage
    ? "border-white/25 bg-white/10 text-white hover:border-(--brand-orange)/60 hover:bg-(--brand-orange)"
    : "border-(--border) bg-(--card)/70 text-(--foreground) hover:border-(--brand-orange)/50 hover:text-(--brand-orange)";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full border backdrop-blur-md transition-all hover:scale-105 hover:shadow-[0_0_20px_-4px_var(--glow-orange)] ${
        active ? "border-(--brand-orange)/50 bg-(--brand-orange)/15 text-(--brand-orange)" : rest
      }`}
    >
      {children}
    </button>
  );
}

export default function ClientShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false); // manual pause button
  const [hovered, setHovered] = useState(false); // hover-to-pause
  const [activeVideo, setActiveVideo] = useState<Video | null>(null); // video whose story is on the big screen
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
        rating: client.rating,
        metric: METRIC[client.id],
      };
  const heroId = activeVideo ? activeVideo.src : client.id;
  const playing = !paused && !hovered && !activeVideo;

  const next = () => setActive((a) => (a + 1) % n);
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
      className="relative overflow-hidden rounded-[28px] border border-(--brand-orange)/25 bg-(--card) p-5 shadow-[0_50px_140px_-40px_var(--shadow-strong),0_0_100px_-18px_var(--glow-orange)] ring-1 ring-inset ring-white/8 backdrop-blur-2xl md:p-8 lg:p-10"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* elevated surface: a top-lit sheen, a warm brand spotlight, and a
          glass edge so the whole box clearly lifts off the page background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_34%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_70%_at_50%_-12%,var(--glow-orange),transparent_60%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent"
      />
      {/* warm cinematic glow anchored bottom-right, as in the reference */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,var(--glow-orange),transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,var(--glow-blue),transparent_70%)] blur-3xl"
      />
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
      <div className="relative mt-5 grid gap-4 lg:grid-cols-[300px_1fr] lg:items-stretch">
        {/* ── LEFT rail: featured video testimonials (no panel box, but the
            old p-4 inset kept so the videos stay their original size) ── */}
        <div className="flex flex-col gap-3 px-4">
          {TOP_VIDEOS.map((v) => (
            <VideoCard
              key={v.src}
              video={v}
              onPlay={setActiveVideo}
              onEnded={(vid) => setActiveVideo((cur) => (cur?.src === vid.src ? null : cur))}
              active={activeVideo?.src === v.src}
            />
          ))}
        </div>

        {/* ── RIGHT stage: Hero + Video Stories (natural height) ── */}
        <div className="flex flex-col gap-4">
          {/* Hero featured testimonial */}
          <div className="relative min-h-[400px] overflow-hidden rounded-3xl border border-(--border) bg-black shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:min-h-[440px] lg:min-h-0 lg:flex-1">
            {/* project-UI backdrop, with scrims so the copy stays legible */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={`bg-${heroId}`}
              src={hero.image}
              alt=""
              className="holo-img absolute inset-0 h-full w-full scale-105 object-cover"
            />
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
              <div className="absolute inset-x-6 top-5 z-10 flex gap-1.5 md:inset-x-9">
                {CLIENTS.map((cl, i) => (
                  <button
                    key={cl.id}
                    type="button"
                    aria-label={`Show ${cl.name}`}
                    onClick={() => selectClient(i)}
                    className="group relative h-1 flex-1 overflow-hidden rounded-full bg-white/25"
                  >
                    {/* the active one fills over the hold duration; its
                        animationend advances to the next story */}
                    <span
                      key={i === active ? `fill-${client.id}` : undefined}
                      className={i === active ? "story-progress block h-full w-full bg-(--brand-orange)" : "block h-full bg-(--brand-orange)"}
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
            )}

            {/* what the client said + rating + author, over the project image —
                replays (fade-up) whenever the story or playing video changes */}
            <div
              key={`copy-${heroId}`}
              className="absolute inset-x-6 bottom-20 z-10 max-w-xl animate-[fadeUp_0.6s_cubic-bezier(0.22,1,0.36,1)] md:inset-x-9 md:bottom-24"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md"
                  style={{ borderColor: `${hero.accent}66`, background: `${hero.accent}22` }}
                >
                  <hero.icon className="h-3.5 w-3.5" /> {hero.industry}
                </span>
                <span className="flex gap-0.5 text-(--brand-orange)">
                  {Array.from({ length: hero.rating }).map((_, i) => (
                    <TbStarFilled
                      key={i}
                      className="h-3.5 w-3.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                    />
                  ))}
                </span>
              </div>
              <p className="mt-2.5 line-clamp-3 text-sm font-semibold leading-snug text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.95)] md:text-base">
                &ldquo;{hero.quote}&rdquo;
              </p>
              <p className="mt-2 text-[13px] text-white/85">
                <span className="font-semibold text-white">{hero.author}</span>
                <span className="text-white/60"> · {hero.role}</span>
              </p>
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
                  onPlay={setActiveVideo}
                  onEnded={(vid) => setActiveVideo((cur) => (cur?.src === vid.src ? null : cur))}
                  active={activeVideo?.src === v.src}
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
