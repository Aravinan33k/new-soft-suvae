import { FiArrowRight, FiCheck } from "react-icons/fi";
import { TbStarFilled } from "react-icons/tb";
import ExperienceStage from "@/components/dom/ExperienceStage";
// To revert to the neural brain, swap HeroGlobe back to HeroBrain below.
// import HeroBrain from "@/components/dom/HeroBrain";
import HeroGlobe from "@/components/dom/HeroGlobe";
import HeroAmbientBackground from "@/components/dom/HeroAmbientBackground";
import EcosystemSection from "@/components/dom/EcosystemSection";
import Navbar from "@/components/dom/Navbar";
import CountUp from "@/components/dom/CountUp";
import MouseParallax from "@/components/dom/MouseParallax";
import SiteAmbientBackground from "@/components/dom/SiteAmbientBackground";
import SiteFooter from "@/components/dom/SiteFooter";
import SectionHeading from "@/components/dom/SectionHeading";
import TechEcosystemFlow from "@/components/dom/TechEcosystemFlow";
import IndustriesShowcase from "@/components/dom/IndustriesShowcase";

const HERO_FEATURES = [
  "AI Agents",
  "Workflow Automation",
  "Custom Software",
  "Mobile Apps",
  "Enterprise AI",
];

const INDUSTRY_STATS = [
  { value: "20+", label: "Industries Served" },
  { value: "100+", label: "Projects Delivered" },
  { value: "98%", label: "Client Satisfaction" },
];

// Placeholder client voices — swap in real quotes when available
const TESTIMONIALS = [
  {
    quote:
      "Soft Suave built an AI workflow that cut our claims processing time by more than half. Their team felt like an extension of ours from day one.",
    name: "Sarah Mitchell",
    role: "VP of Operations, HealthTech",
  },
  {
    quote:
      "The recommendation engine they delivered lifted our conversion rate within the first quarter. Clear communication, on-time delivery, zero surprises.",
    name: "Daniel Rodriguez",
    role: "Head of Digital, Ecommerce",
  },
  {
    quote:
      "From fraud detection to reporting automation, every solution shipped production-ready. The most reliable engineering partner we've worked with.",
    name: "Priya Raghavan",
    role: "CTO, FinTech",
  },
];


export default function Home() {
  return (
    <main className="relative min-h-svh">
      <SiteAmbientBackground />
      {/* Subtle cursor parallax for everything tagged data-parallax */}
      <MouseParallax />
      {/* ── Navbar: glass, condenses to a floating pill on scroll ──── */}
      <Navbar />

      <div id="top" className="relative z-10 mx-auto w-full max-w-[85rem] px-6 md:px-10 lg:px-20">
        {/* ── Hero: headline left, supporting copy right ────────────── */}
        {/* 45% text / 55% animation — keeps the page from feeling
            right-heavy while the globe stays the focal point */}
        <section className="relative grid grid-cols-1 gap-12 pt-24 lg:grid-cols-[45fr_55fr] lg:items-center lg:pt-30">
          <HeroAmbientBackground />
          {/* nudged 20px down so heading+paragraph+tags (not just the
              heading) sit at the visual centre beside the globe */}
          <div className="lg:translate-y-5" data-parallax="2">
            <p
              className="hero-reveal mb-6 text-xs font-medium uppercase tracking-[0.35em] text-[#FF8A3D] md:text-sm"
              style={{ animationDelay: "0.05s" }}
            >
              AI-Powered Digital Solutions
            </p>
            <h1
              className="hero-reveal max-w-4xl text-3xl font-semibold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl"
              style={{ animationDelay: "0.18s" }}
            >
              Transform Your Business with AI,{" "}
              <span className="bg-gradient-to-r from-[#FF9440] via-[#FB5A38] to-[#F92B4E] bg-clip-text text-transparent">
                Automation &amp; Custom Software
              </span>
            </h1>
            <p
              className="hero-reveal mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg"
              style={{ animationDelay: "0.28s" }}
            >
              We build AI-powered software, intelligent automation, and
              seamless integrations that simplify operations, boost
              productivity, and accelerate business growth.
            </p>
            <div
              className="hero-reveal mt-10 flex flex-col gap-4 sm:flex-row"
              style={{ animationDelay: "0.36s" }}
            >
              <a
                href="mailto:softsuave.ai@gmail.com"
                className="btn-primary group inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-[#1a0a04]"
              >
                Schedule a Free Consultation
                <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
              <a
                href="#experience"
                className="btn-secondary inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-6 py-2.5 text-sm font-semibold text-zinc-200 backdrop-blur hover:border-[#FF8A3D]/50 hover:text-[#FFB057]"
              >
                Explore Our Solutions
              </a>
            </div>
            <div
              className="hero-reveal mt-8 flex flex-wrap gap-x-6 gap-y-3"
              style={{ animationDelay: "0.52s" }}
            >
              {HERO_FEATURES.map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center gap-1.5 text-sm text-zinc-400"
                >
                  <FiCheck className="shrink-0 text-[#FF8A3D]" />
                  {feature}
                </span>
              ))}
            </div>
          </div>
          {/* Large 3D Earth with orbiting service chips — the hero focal
              point, pushed ~64-80px right so the copy gets breathing room. */}
          <div className="flex items-center justify-center lg:justify-end">
            <div
              className="hero-float pointer-events-none relative hidden aspect-square w-[90%] max-w-2xl md:block lg:-mr-16 lg:w-[95%] xl:-mr-20"
              data-parallax="4"
            >
              <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(255,138,61,0.05),transparent_66%)] blur-3xl" />
              <div className="relative h-full w-full">
                {/* <HeroBrain /> */}
                <HeroGlobe />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="relative z-10 mx-auto max-w-[85rem] px-6 md:px-10 lg:px-20">
        {/* ── How AI Connects Everything ────────────────────────────── */}
        <EcosystemSection />
      </div>

      {/* ── The experience: grows to full screen as you scroll in ───── */}
      <div id="experience" className="relative z-10 pt-24 lg:pt-30">
        <ExperienceStage />
      </div>

      <div className="relative z-10 mx-auto max-w-[85rem] px-6 md:px-10 lg:px-20">
        {/* ── Industries ────────────────────────────────────────────── */}
        {/* (The services grid that used to sit here was removed — the eight
            services now live as chapters inside the ExperienceStage above.) */}
        <section id="industries" className="relative pt-24 lg:pt-30">
          {/* Subtle ambient depth: soft orange glow behind the heading + a
              faint dot grid across the section */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
            data-parallax="-5"
          >
            <div className="absolute left-1/2 top-16 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,138,61,0.10),transparent_70%)] blur-2xl" />
            <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(circle,#FF8A3D_1px,transparent_1px)] [background-size:26px_26px]" />
          </div>

          <div className="relative">
            <SectionHeading
              eyebrow="Industries"
              decorated
              title="Transforming Industries with AI Innovation"
              body="From healthcare and finance to logistics and retail, we build AI-powered solutions that automate operations, improve decision-making, and help businesses scale with confidence."
            />

            {/* Credibility stats */}
            <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-14 gap-y-6">
              {INDUSTRY_STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-bold md:text-4xl">
                    <span className="bg-gradient-to-r from-[#FF9440] to-[#F92B4E] bg-clip-text text-transparent">
                      <CountUp value={stat.value} />
                    </span>
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Accordion showcase: industry list left, swapping visual right */}
            <IndustriesShowcase />
          </div>
        </section>

        {/* ── Tech stack: technology ecosystem flow ─────────────────── */}
        <section id="stack" className="pt-24 lg:pt-30">
          <TechEcosystemFlow />
        </section>

        {/* ── CTA ───────────────────────────────────────────────────── */}
        <section id="contact" className="pt-24 lg:pt-30">
          <div
            className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111113] bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgba(255,106,61,0.14),transparent_70%)] px-6 py-20 text-center shadow-sm"
            data-parallax="3"
          >
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Ready to Transform Your Business with AI?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-400">
              Book a free AI strategy session with our experts and discover
              where AI can create the biggest impact in your organization.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="mailto:softsuave.ai@gmail.com"
                className="btn-primary group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-[#1a0a04]"
              >
                Book a Free Consultation
                <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
              <a
                href="mailto:softsuave.ai@gmail.com"
                className="btn-secondary inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-8 py-3.5 text-sm font-semibold text-zinc-200 hover:border-[#FF8A3D]/50 hover:text-[#FFB057]"
              >
                Talk With AI Experts
              </a>
            </div>
          </div>
        </section>

        {/* ── Testimonials ──────────────────────────────────────────── */}
        <section id="testimonials" className="pb-24 pt-24 lg:pb-30 lg:pt-30">
          <SectionHeading
            eyebrow="Testimonials"
            title="What Our Clients Say About Us"
            body="We've empowered hundreds of clients globally to achieve their business goals. Hear firsthand how our expertise and AI-driven solutions have made a difference."
          />
          <div
            className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3"
            data-parallax="2"
          >
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#111113] p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#FF8A3D]/40 hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.6),0_0_36px_-10px_rgba(255,138,61,0.3)]"
              >
                <div className="flex gap-1 text-[#FF8A3D]">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <TbStarFilled key={s} className="h-4 w-4" />
                  ))}
                </div>
                <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-zinc-300">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-7 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#FF8A3D]/30 bg-[#FF8A3D]/10 text-sm font-bold text-[#FF9E55]">
                    {t.name.charAt(0)}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">
                      {t.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      {t.role}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>

      {/* ── Footer: the site network collapses into a glowing logo ──── */}
      <SiteFooter />
    </main>
  );
}
