import { FiArrowRight, FiCheck } from "react-icons/fi";
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
import ClientShowcase from "@/components/dom/ClientShowcase";
import CtaScrollStory from "@/components/dom/CtaScrollStory";
import TransformationJourney from "@/components/dom/TransformationJourney";

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
              className="hero-reveal mb-6 text-xs font-medium uppercase tracking-[0.35em] text-(--brand-orange) md:text-sm"
              style={{ animationDelay: "0.05s" }}
            >
              AI-Powered Digital Solutions
            </p>
            <h1
              className="hero-reveal max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-(--heading) md:text-5xl lg:text-6xl"
              style={{ animationDelay: "0.18s" }}
            >
              <span className="block text-[1.12em]">Transform Your</span>
              Business with{" "}
              <span className="bg-gradient-to-r from-amber-200 to-(--grad-1) bg-clip-text text-transparent drop-shadow-[0_0_22px_var(--glow-orange)]">
                AI
              </span>
              ,{" "}
              <span className="bg-gradient-to-r from-(--grad-1) via-(--grad-2) to-(--grad-3) bg-clip-text text-transparent">
                Automation
              </span>{" "}
              &amp; Custom Software
            </h1>
            <p
              className="hero-reveal mt-6 max-w-2xl text-base leading-relaxed text-(--foreground) md:text-lg"
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
                className="btn-primary group inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white"
              >
                Schedule a Free Consultation
                <FiArrowRight className="transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
              </a>
              <a
                href="#experience"
                className="btn-secondary inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-(--foreground)"
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
                  className="inline-flex items-center gap-1.5 text-sm text-(--foreground)"
                >
                  <FiCheck className="shrink-0 text-(--brand-orange)" />
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
              {/* softened + widened so this fades gradually into the same
                  ambient wash behind the text, instead of reading as a
                  distinct bright zone confined to the globe's column.
                  "circle_closest-side" forces the gradient to be inscribed
                  (radius = half the shorter side) instead of the CSS default
                  "farthest-corner", which reaches the box's corners — at this
                  blur size that residual corner glow was showing through as
                  a faint soft-edged square/rectangle around the globe. */}
              <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle_closest-side,var(--glow-orange),transparent_70%)] opacity-60 blur-[90px]" />
              {/* small cool counterpoint: blue glow tucked behind the
                  lower-left of the globe so the warm palette has contrast */}
              <div className="absolute bottom-[6%] left-[4%] h-[45%] w-[45%] rounded-full bg-[radial-gradient(circle_closest-side,var(--glow-blue),transparent_70%)] opacity-50 blur-[90px]" />
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
        <div className="mx-auto max-w-[85rem] px-6 md:px-10 lg:px-20">
          <SectionHeading
            eyebrow="Our Services"
            title="AI & Software Services Built for Businesses of All Sizes"
            body="Whether you are a startup, SMB, or enterprise, Soft Suave helps you build AI solutions, develop software, automate workflows, and scale digital products with confidence."
          />
        </div>
        <div className="mt-14 lg:mt-16">
          <ExperienceStage />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-[85rem] px-6 md:px-10 lg:px-20">
        {/* ── AI Transformation Journey: idea → business impact ─────── */}
        <TransformationJourney />
      </div>

      <div className="relative z-10 mx-auto max-w-[85rem] px-6 md:px-10 lg:px-20">
        {/* ── Industries ────────────────────────────────────────────── */}
        {/* (The services grid that used to sit here was removed — the eight
            services now live as chapters inside the ExperienceStage above.) */}
        <section id="industries" className="relative pt-24 lg:pt-30">
          {/* full-bleed alternating band for section rhythm — masked so it
              melts in and out of the page background instead of starting and
              ending on a hard horizontal edge */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-1/2 -z-20 w-screen -translate-x-1/2 bg-(--section-alt)"
            style={{
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent, black 10rem, black calc(100% - 10rem), transparent)",
              maskImage:
                "linear-gradient(to bottom, transparent, black 10rem, black calc(100% - 10rem), transparent)",
            }}
          />
          {/* Subtle ambient depth: soft orange glow behind the heading + a
              faint dot grid across the section */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
            data-parallax="-5"
          >
            <div className="absolute left-1/2 top-16 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,var(--glow-orange),transparent_70%)] blur-2xl" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle,var(--brand-orange)_1px,transparent_1px)] [background-size:26px_26px]" />
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
                  <p className="text-3xl font-extrabold md:text-4xl">
                    <span className="bg-gradient-to-r from-(--grad-1) to-(--grad-3) bg-clip-text text-transparent">
                      <CountUp value={stat.value} />
                    </span>
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-(--text-secondary)">
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

        {/* ── CTA — pinned scroll story: AI lines flow in, the cards dock,
            two holographic fists travel together and gently bump (glow +
            particle burst), the heading turns "Let's Build Together." and
            the CTAs light up. Owns its own heading — it crossfades mid-story.
            (ChoosePath.tsx is superseded by this but kept for reference.) */}
        <section id="contact" className="pt-24 lg:pt-10">
          <CtaScrollStory />
        </section>

        {/* ── Testimonials / Reviews ────────────────────────────────── */}
        {/* mt gap leaves clean page background between the CTA card and the
            testimonials dashboard so they don't butt together */}
        <section id="testimonials" className="relative mt-16 lg:mt-20">
          <SectionHeading
            eyebrow="Testimonials"
            title="What Our Clients Say About Us"
            body="We've empowered hundreds of clients globally to achieve their business goals. Hear firsthand how our expertise and AI-driven solutions have made a difference."
          />
          {/* interactive testimonials dashboard: client list drives a featured,
              auto-rotating quote; satisfaction donut + mini cards + metric
              strip beneath. Reads the theme tokens, so it adapts light/dark. */}
          <div className="mt-12">
            <ClientShowcase />
          </div>
        </section>
      </div>

      {/* ── Footer: the site network collapses into a glowing logo ──── */}
      <SiteFooter />
    </main>
  );
}
