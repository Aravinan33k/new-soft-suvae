import { FiArrowRight, FiCheck } from "react-icons/fi";
import {
  TbCpu,
  TbSettingsAutomation,
  TbMessageChatbot,
  TbCode,
  TbDeviceMobile,
  TbWorld,
  TbCloudComputing,
  TbUsersGroup,
  TbShoppingCart,
  TbStethoscope,
  TbTruck,
  TbSchool,
  TbBuildingBank,
  TbBuildingFactory2,
  TbRocket,
  TbBrain,
  TbClock,
  TbHeadset,
  TbUsers,
  TbShieldCheck,
} from "react-icons/tb";
import ExperienceStage from "@/components/dom/ExperienceStage";
import FloatingCard from "@/components/dom/FloatingCard";
import Reveal from "@/components/dom/Reveal";
import FragmentCubes from "@/components/dom/FragmentCubes";
import DisconnectedDevices from "@/components/dom/DisconnectedDevices";
import ManualWorkflows from "@/components/dom/ManualWorkflows";
import SlowDecisions from "@/components/dom/SlowDecisions";
// To revert to the neural brain, swap HeroGlobe back to HeroBrain below.
// import HeroBrain from "@/components/dom/HeroBrain";
import HeroGlobe from "@/components/dom/HeroGlobe";
import HeroAmbientBackground from "@/components/dom/HeroAmbientBackground";
import ServicesNeuralBackground from "@/components/dom/ServicesNeuralBackground";
import EcosystemSection from "@/components/dom/EcosystemSection";
import Navbar from "@/components/dom/Navbar";
import CountUp from "@/components/dom/CountUp";
import MouseParallax from "@/components/dom/MouseParallax";
import SiteAmbientBackground from "@/components/dom/SiteAmbientBackground";
import SiteFooter from "@/components/dom/SiteFooter";
import SectionHeading from "@/components/dom/SectionHeading";

const HERO_FEATURES = [
  "AI Agents",
  "Workflow Automation",
  "Custom Software",
  "Mobile Apps",
  "Enterprise AI",
];

const HERO_METRICS = [
  { value: "50+", label: "Projects Delivered", icon: TbRocket },
  { value: "15+", label: "AI Solutions", icon: TbBrain },
  { value: "99.9%", label: "Uptime", icon: TbClock },
  { value: "24/7", label: "Support", icon: TbHeadset },
  { value: "200+", label: "Happy Clients", icon: TbUsers },
  { value: "100%", label: "Secure & Compliant", icon: TbShieldCheck },
];

const PROBLEMS = [
  {
    name: "Fragmented Data",
    body: "Critical information trapped in spreadsheets, tools, and departments that never talk to each other.",
  },
  {
    name: "Disconnected Systems",
    body: "Dozens of apps and APIs running in isolation, forcing teams to bridge them by hand.",
  },
  {
    name: "Manual Workflows",
    body: "Repetitive work that drains hours, introduces errors, and can't scale with demand.",
  },
  {
    name: "Slow Decisions",
    body: "Insights buried in scattered dashboards, so the answers arrive long after they're needed.",
  },
];

const SERVICES = [
  {
    name: "Custom AI Solutions",
    category: "AI Systems",
    color: "#FF8A3D",
    body: "Production-ready AI systems built on LLMs, RAG, agents, and predictive models — engineered to automate decisions at scale.",
    tags: ["LLM", "RAG", "Agents"],
    icon: TbCpu,
    wide: true,
  },
  {
    name: "AI Integrations & Workflow Automation",
    category: "Automation",
    color: "#34D399",
    body: "Wire AI into the tools you already use and automate the busywork that slows your team down.",
    tags: ["Workflows", "Integrations", "Ops"],
    icon: TbSettingsAutomation,
    wide: false,
  },
  {
    name: "AI Chatbots & AI Agents",
    category: "AI Systems",
    color: "#FF8A3D",
    body: "Conversational agents for support, sales, HR, and internal ops — always on, always learning.",
    tags: ["Chatbots", "Support", "NLP"],
    icon: TbMessageChatbot,
    wide: false,
  },
  {
    name: "Custom Software Development",
    category: "Development",
    color: "#4EA8FF",
    body: "Secure, scalable software engineered with AI-assisted development for faster delivery.",
    tags: ["Full-Stack", "APIs", "Scale"],
    icon: TbCode,
    wide: false,
  },
  {
    name: "Mobile App Development",
    category: "Mobile",
    color: "#FFD166",
    body: "Native-quality iOS and Android apps with intuitive design and AI-enhanced features.",
    tags: ["iOS", "Android", "Cross-Platform"],
    icon: TbDeviceMobile,
    wide: false,
  },
  {
    name: "Web App Development",
    category: "Development",
    color: "#4EA8FF",
    body: "Fast, AI-enabled web apps that simplify workflows and turn visitors into customers.",
    tags: ["Web Apps", "UX", "Performance"],
    icon: TbWorld,
    wide: true,
  },
  {
    name: "Enterprise Modernization",
    category: "Cloud & Infra",
    color: "#B388FF",
    body: "Modernize legacy systems with cloud, automation, and AI — without disrupting the business.",
    tags: ["Cloud", "Legacy", "Security"],
    icon: TbCloudComputing,
    wide: true,
  },
  {
    name: "Global Capability Center (GCC)",
    category: "Cloud & Infra",
    color: "#B388FF",
    body: "Stand up an AI-powered GCC with smarter workflows, analytics, and teams built to scale.",
    tags: ["Teams", "Analytics", "Scale"],
    icon: TbUsersGroup,
    wide: true,
  },
];

const INDUSTRIES = [
  {
    name: "Ecommerce",
    body: "AI-powered personalization, inventory optimization, and demand forecasting to accelerate online business growth.",
    icon: TbShoppingCart,
  },
  {
    name: "HealthTech",
    body: "Intelligent automation and data-driven insights that improve patient outcomes and streamline clinical workflows.",
    icon: TbStethoscope,
  },
  {
    name: "Logistics",
    body: "Smarter supply chains with demand forecasting, real-time tracking, and automated route optimization.",
    icon: TbTruck,
  },
  {
    name: "EdTech",
    body: "Personalized learning experiences, smart content curation, and analytics that adapt to every learner.",
    icon: TbSchool,
  },
  {
    name: "FinTech",
    body: "Real-time fraud detection, automated decisions, and hyper-personalized banking built on secure AI.",
    icon: TbBuildingBank,
  },
  {
    name: "Manufacturing",
    body: "Predictive maintenance, quality automation, and smart-factory analytics that cut downtime and waste.",
    icon: TbBuildingFactory2,
  },
];

const INDUSTRY_STATS = [
  { value: "20+", label: "Industries Served" },
  { value: "100+", label: "Projects Delivered" },
  { value: "98%", label: "Client Satisfaction" },
];

const STACK = [
  {
    category: "Foundation Models",
    items: ["GPT", "Claude", "Gemini", "Llama", "Mistral", "DeepSeek"],
  },
  {
    category: "AI Frameworks",
    items: ["LangChain", "LangGraph", "CrewAI", "AutoGen", "LlamaIndex", "Semantic Kernel"],
  },
  {
    category: "Vector DB",
    items: ["Pinecone", "Weaviate", "Qdrant", "Milvus", "FAISS"],
  },
  {
    category: "Cloud AI",
    items: ["Azure AI", "AWS Bedrock", "Google Vertex AI", "OpenAI", "Anthropic"],
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

      <div id="top" className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-10">
        {/* ── Hero: headline left, supporting copy right ────────────── */}
        <section className="relative grid grid-cols-1 gap-12 pt-20 md:pt-28 lg:grid-cols-12 lg:items-center">
          <HeroAmbientBackground />
          <div className="lg:col-span-6" data-parallax="2">
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
              className="hero-reveal mt-6 max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg"
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
                href="#contact"
                className="btn-primary group inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-[#1a0a04]"
              >
                Schedule a Free Consultation
                <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
              <a
                href="#services"
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
              point. Bleeds slightly right on wide screens for presence. */}
          <div className="flex items-center justify-center lg:col-span-6">
            <div
              className="hero-float pointer-events-none relative hidden aspect-square w-full max-w-2xl md:block lg:-mr-4 lg:w-[110%] xl:-mr-8"
              data-parallax="4"
            >
              <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(255,138,61,0.1),transparent_66%)] blur-3xl" />
              <div className="relative h-full w-full">
                {/* <HeroBrain /> */}
                <HeroGlobe />
              </div>
            </div>
          </div>
          <div
            className="hero-reveal mt-4 grid grid-cols-2 gap-x-6 gap-y-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-6 backdrop-blur-sm sm:grid-cols-3 lg:col-span-12 lg:grid-cols-6 lg:px-8"
            style={{ animationDelay: "0.66s" }}
          >
            {HERO_METRICS.map((metric) => (
              <div key={metric.label} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#FF8A3D]/25 bg-[#FF8A3D]/10 text-[#FF9E55]">
                  <metric.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xl font-bold text-white md:text-2xl">
                    <CountUp value={metric.value} />
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">{metric.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── The experience: grows to full screen as you scroll in ───── */}
      <div id="experience" className="relative z-10">
        <ExperienceStage />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10">
        {/* ── Business Problems ─────────────────────────────────────── */}
        <section id="problems" className="pt-24 md:pt-32">
          <SectionHeading
            eyebrow="The Challenge"
            title="Every business runs on disconnected systems"
            body="Data, tools, and teams that were never designed to work together. Complexity piles up — and it quietly slows everything down."
          />
          <div
            className="mt-12 grid grid-cols-1 gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-4"
            data-parallax="3"
          >
            {PROBLEMS.map((p, i) => {
              // Animated dark art panels: cube fragments for Fragmented Data,
              // isolated devices for Disconnected Systems
              const Art =
                [FragmentCubes, DisconnectedDevices, ManualWorkflows, SlowDecisions][i] ?? null;
              const artBg = ["#070D1A", "#0E1B30", "#0D0B1E", "#040810"][i] ?? "#070D1A";
              // Each card floats at its own height and bob phase
              const offset =
                ["lg:translate-y-6", "lg:translate-y-0", "lg:translate-y-14", "lg:translate-y-4"][i] ?? "";
              return Art ? (
                <FloatingCard
                  key={p.name}
                  offsetClass={offset}
                  floatDelay={i * -1.7}
                  className="relative min-h-80 overflow-hidden rounded-2xl border border-white/[0.08] p-7 shadow-sm hover:border-[#FF8A3D]/50 hover:shadow-[0_28px_56px_-16px_rgba(0,0,0,0.6),0_0_48px_-8px_rgba(255,138,61,0.35)]"
                  style={{ backgroundColor: artBg }}
                >
                  <Art className="pointer-events-none absolute inset-0 h-full w-full" />
                  {/* Scrim so the copy stays readable over the art */}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,12,0.42)_0%,rgba(10,10,12,0.05)_45%,rgba(10,10,12,0.5)_100%)]" />
                  <div className="relative">
                    <h3 className="text-base font-semibold text-white">
                      {p.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300 [text-shadow:0_1px_8px_rgba(10,10,12,0.9)]">
                      {p.body}
                    </p>
                  </div>
                </FloatingCard>
              ) : (
                <FloatingCard
                  key={p.name}
                  offsetClass={offset}
                  floatDelay={i * -1.7}
                  className="relative min-h-80 rounded-2xl border border-white/[0.08] bg-[#111113] p-7 shadow-sm hover:border-[#FF8A3D]/50 hover:shadow-[0_28px_56px_-16px_rgba(0,0,0,0.5),0_0_48px_-8px_rgba(255,138,61,0.3)]"
                >
                  <h3 className="text-base font-semibold text-white">
                    {p.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                    {p.body}
                  </p>
                </FloatingCard>
              );
            })}
          </div>
        </section>

        {/* ── How AI Connects Everything ────────────────────────────── */}
        <EcosystemSection />

        {/* ── Services: glass cards over a living neural mesh ─────────── */}
        <section id="services" className="relative pt-24 md:pt-32">
          {/* Ambient depth to match the Industries section: soft orange glow
              behind the heading + a faint dot grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
            data-parallax="-5"
          >
            <div className="absolute left-1/2 top-16 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,138,61,0.10),transparent_70%)] blur-2xl" />
            <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(circle,#FF8A3D_1px,transparent_1px)] [background-size:26px_26px]" />
          </div>
          <SectionHeading
            eyebrow="AI-First Engineering"
            decorated
            title="AI & Software Services Built for Businesses of All Sizes"
            highlight="AI & Software Services"
            body="Whether you are a startup, SMB, or enterprise, Soft Suave helps you build AI solutions, develop software, automate workflows, and scale digital products with confidence."
          />
          <div
            className="relative mt-12 overflow-hidden rounded-3xl border border-white/[0.06]"
            data-parallax="2"
          >
            <ServicesNeuralBackground />
            <div className="relative grid grid-cols-1 gap-6 p-6 md:grid-cols-2 md:p-8 lg:grid-cols-4">
              {SERVICES.map((service, i) => (
                <Reveal
                  key={service.name}
                  delay={i * 80}
                  className={`h-full ${service.wide ? "md:col-span-2" : ""}`}
                >
                <FloatingCard
                  float={false}
                  lift={8}
                  className="relative flex flex-col overflow-hidden rounded-2xl border border-[#FF8A3D]/[0.12] bg-white/[0.03] p-7 shadow-[inset_0_1px_24px_rgba(255,138,61,0.05)] backdrop-blur-md transition-all duration-500 hover:border-[#FF8A3D]/50 hover:bg-white/[0.06] hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.6),0_0_44px_-10px_rgba(255,138,61,0.4)] md:p-8"
                >
                  {/* hover light spread from the icon corner */}
                  <div
                    className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(circle, ${service.color}30, transparent 70%)`,
                    }}
                  />
                  {/* periodic scanning light sweep */}
                  <span
                    aria-hidden
                    className="sweep-bar pointer-events-none absolute inset-0"
                    style={{ animationDelay: `${i * 1.1}s` }}
                  />

                  <span className="absolute right-7 top-7 text-3xl font-bold text-white/[0.06] transition-transform duration-500 group-hover:rotate-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="relative mb-5 h-[60px] w-[60px]">
                    <span
                      className="pulse-ring absolute inset-0 rounded-full border"
                      style={{
                        borderColor: `${service.color}40`,
                        animationDelay: `${i * 0.4}s`,
                      }}
                    />
                    <div
                      className="relative flex h-[60px] w-[60px] items-center justify-center rounded-full border backdrop-blur-sm transition-transform duration-500 group-hover:rotate-[5deg]"
                      style={{
                        borderColor: `${service.color}40`,
                        backgroundColor: `${service.color}1A`,
                      }}
                    >
                      <service.icon
                        className="h-6 w-6"
                        style={{ color: service.color }}
                      />
                    </div>
                  </div>

                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: service.color }}
                  >
                    {service.category}
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-white">
                    {service.name}
                  </h3>
                  <p className="mt-3 text-sm leading-[1.7] text-zinc-400">
                    {service.body}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {service.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border px-2.5 py-1 text-[11px] text-zinc-300"
                        style={{
                          borderColor: `${service.color}33`,
                          backgroundColor: `${service.color}12`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex-1" />

                  <div className="mt-6 flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors duration-300 group-hover:text-white">
                    <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[70px] group-hover:opacity-100">
                      Explore
                    </span>
                    <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>
                </FloatingCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Industries ────────────────────────────────────────────── */}
        <section id="industries" className="relative pt-24 md:pt-32">
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

            {/* 3 × 2 equal grid */}
            <div
              className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              data-parallax="3"
            >
              {INDUSTRIES.map((industry) => (
                <div
                  key={industry.name}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111113] p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-[#FF8A3D]/50 hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.6),0_0_40px_-8px_rgba(255,138,61,0.35)]"
                >
                  {/* Oversized watermark icon fades in on hover (premium touch) */}
                  <industry.icon className="pointer-events-none absolute -bottom-8 -right-6 h-44 w-44 text-[#FF8A3D] opacity-0 transition-opacity duration-500 group-hover:opacity-[0.06]" />
                  {/* Warm radial tint on hover */}
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,138,61,0.08),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="relative flex flex-1 flex-col">
                    {/* Icon tile — rotates slightly on hover */}
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[#FF8A3D]/25 bg-[#FF8A3D]/[0.08] text-[#FF8A3D] transition-transform duration-300 group-hover:rotate-6">
                      <industry.icon className="h-6 w-6" />
                    </div>

                    {/* Accent line above the title → grows on hover */}
                    <span className="mb-3 block h-0.5 w-8 rounded-full bg-gradient-to-r from-[#FF9440] to-[#F92B4E] transition-all duration-300 group-hover:w-12" />

                    <h3 className="text-lg font-semibold text-white">
                      {industry.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                      {industry.body}
                    </p>

                    <div className="flex-1" />

                    {/* CTA */}
                    <a
                      href="#contact"
                      className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors duration-300 group-hover:text-[#FF8A3D]"
                    >
                      <span className="border-b border-transparent pb-0.5 transition-colors duration-300 group-hover:border-[#FF8A3D]/50">
                        Learn More
                      </span>
                      <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Tech stack ────────────────────────────────────────────── */}
        <section id="stack" className="pt-24 md:pt-32">
          <SectionHeading
            eyebrow="Technology Stack"
            title="Modern Tech Stack for AI and Software Solutions"
            body="We use modern AI, software, cloud, mobile, and web technologies to create smarter, scalable, future-ready solutions for business growth."
          />
          <div
            className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
            data-parallax="2"
          >
            {STACK.map((group) => (
              <div
                key={group.category}
                className="rounded-2xl border border-white/[0.08] bg-[#111113] p-6 shadow-sm"
              >
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#FF8A3D]">
                  {group.category}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-zinc-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Case studies ──────────────────────────────────────────── */}
        <section id="work" className="pt-24 md:pt-32">
          <SectionHeading
            eyebrow="Case Studies"
            title="AI Success Stories Across Key Industries"
            body="Explore how our AI solutions helped businesses automate workflows, reduce effort, improve decisions, and achieve measurable impact across industry projects."
          />
          <div className="mx-auto mt-10 flex max-w-3xl items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-sm text-zinc-500">
            Case studies coming soon.
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────── */}
        <section id="contact" className="pt-24 md:pt-32">
          <div
            className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111113] bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgba(255,106,61,0.14),transparent_70%)] px-6 py-20 text-center shadow-sm"
            data-parallax="3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/softsuave-mark.svg"
              alt="Soft Suave"
              className="mx-auto h-14 w-auto drop-shadow-[0_0_24px_rgba(255,106,61,0.4)]"
            />
            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Transforming Complexity into Intelligent Digital Solutions
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
                Let&apos;s Build Together
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
      </div>

      {/* ── Footer: the site network collapses into a glowing logo ──── */}
      <SiteFooter />
    </main>
  );
}
