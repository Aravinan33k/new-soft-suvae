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
} from "react-icons/tb";
import ExperienceStage from "@/components/dom/ExperienceStage";
import FloatingCard from "@/components/dom/FloatingCard";
import FragmentCubes from "@/components/dom/FragmentCubes";
import DisconnectedDevices from "@/components/dom/DisconnectedDevices";
import ManualWorkflows from "@/components/dom/ManualWorkflows";
import SlowDecisions from "@/components/dom/SlowDecisions";
import HeroBrain from "@/components/dom/HeroBrain";
import ServicesNeuralBackground from "@/components/dom/ServicesNeuralBackground";

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

const STATS = [
  "400+ AI & Engineering Specialists",
  "13+ Years of Experience",
  "150+ Global Clients",
  "21+ Countries",
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
    body: "Transforming e-commerce with AI-driven solutions for smarter selling, faster operations, and better customer experiences. From personalized recommendations to inventory automation and real-time analytics, we help businesses grow efficiently.",
  },
  {
    name: "HealthTech",
    body: "Elevate healthcare with next-gen advanced AI solutions that refine patient outcomes, optimize clinical workflows, and streamline operations. We deliver intelligent automation and data-driven insights for transformative health tech innovation.",
  },
  {
    name: "Logistics",
    body: "Optimizing logistics with AI-powered solutions for smarter supply chains, real-time tracking, and operational efficiency. From demand forecasting to automated route optimization, we drive seamless and cost-effective logistics management.",
  },
  {
    name: "EdTech",
    body: "Reimagining education with next-gen AI solutions, creating personalized learning experiences, and smart content curation. From adaptive learning support to insightful analytics, we're pioneering the evolution of education.",
  },
  {
    name: "FinTech",
    body: "Redefining FinTech with AI-powered intelligence by enhancing security, automating decisions, and unlocking new financial possibilities. From real-time fraud detection to hyper-personalized banking, we drive the future of digital finance.",
  },
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

function SectionHeading({
  eyebrow,
  title,
  body,
  decorated = false,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  decorated?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {decorated ? (
        <div className="mb-4 flex items-center justify-center gap-4">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#FF8A3D]/60" />
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#FF8A3D]">
            {eyebrow}
          </p>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#FF8A3D]/60" />
        </div>
      ) : (
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#FF8A3D]">
          {eyebrow}
        </p>
      )}
      <h2
        className={`${decorated ? "" : "mt-4"} text-3xl font-semibold tracking-tight text-white md:text-4xl`}
      >
        {title}
      </h2>
      {body && (
        <p className="mt-5 text-base leading-relaxed text-zinc-400 md:text-lg">
          {body}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-svh bg-[#0a0a0c]">
      {/* ── Navbar ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#0a0a0c]">
        <nav className="mx-auto flex h-20 w-full max-w-7xl items-center px-6 md:px-10">
          <a
            href="#top"
            className="flex items-center gap-3 text-xl font-bold tracking-tight text-white md:text-2xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/softsuave-mark.svg" alt="" className="h-9 w-auto md:h-10" />
            Soft Suave
          </a>
        </nav>
      </header>

      <div id="top" className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-10">
        {/* ── Hero: headline left, supporting copy right ────────────── */}
        <section className="relative grid grid-cols-1 gap-12 pt-20 md:grid-cols-12 md:items-center md:pt-28">
          {/* 3D neural brain layered into the hero background; page scroll
              spins it a full 360° */}
          <div className="pointer-events-none absolute -right-16 top-1/2 -z-10 hidden aspect-square w-[46%] -translate-y-1/2 opacity-90 md:block lg:-right-8">
            <HeroBrain />
          </div>
          <div className="md:col-span-7">
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.35em] text-[#FF8A3D] md:text-sm">
              Soft Suave
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
              Empowering Businesses with Scalable AI,{" "}
              <span className="bg-gradient-to-r from-[#FF9440] via-[#FB5A38] to-[#F92B4E] bg-clip-text text-transparent">
                Automation &amp; Integrations
              </span>
            </h1>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="#contact"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6A3D] px-6 py-2.5 text-sm font-semibold text-[#1a0a04] transition-all duration-300 hover:bg-[#FF8A5C] hover:shadow-[0_0_40px_-8px_rgba(255,106,61,0.6)]"
              >
                Book AI Strategy Call
                <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-6 py-2.5 text-sm font-semibold text-zinc-200 backdrop-blur transition-colors duration-300 hover:border-[#FF8A3D]/50 hover:text-[#FFB057]"
              >
                Explore AI Solutions
              </a>
            </div>
          </div>
          <div className="md:col-span-5 md:pl-6 lg:pl-14">
            <p className="max-w-md font-serif text-lg leading-relaxed text-zinc-400 md:text-xl">
              Build scalable AI solutions, intelligent automation systems, and
              seamless integrations with AI&#8209;enabled engineering teams
              focused on real business outcomes.
            </p>
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
          <div className="mt-12 grid grid-cols-1 gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-4">
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
        <section id="connect" className="pt-24 md:pt-32">
          <SectionHeading
            eyebrow="How It Works"
            title="We connect it all into one intelligent ecosystem"
            body="Soft Suave links your data, systems, and workflows through AI — turning fragmented operations into a single, living network that learns, automates, and scales."
          />
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat}
                className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#111113] px-5 py-4 shadow-sm"
              >
                <FiCheck className="shrink-0 text-[#FF8A3D]" />
                <span className="text-sm text-zinc-300">{stat}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Services: glass cards over a living neural mesh ─────────── */}
        <section id="services" className="pt-24 md:pt-32">
          <SectionHeading
            eyebrow="AI-First Engineering"
            decorated
            title="AI & Software Services Built for Businesses of All Sizes"
            body="Whether you are a startup, SMB, or enterprise, Soft Suave helps you build AI solutions, develop software, automate workflows, and scale digital products with confidence."
          />
          <div className="relative mt-12 overflow-hidden rounded-3xl border border-white/[0.06]">
            <ServicesNeuralBackground />
            <div className="relative grid grid-cols-1 gap-6 p-6 md:grid-cols-2 md:p-8 lg:grid-cols-4">
              {SERVICES.map((service, i) => (
                <FloatingCard
                  key={service.name}
                  float={false}
                  offsetClass={service.wide ? "md:col-span-2" : ""}
                  className="relative flex flex-col overflow-hidden rounded-2xl border border-[#FF8A3D]/[0.12] bg-white/[0.03] p-7 shadow-[inset_0_1px_24px_rgba(255,138,61,0.05)] backdrop-blur-md transition-all duration-500 hover:border-[#FF8A3D]/30 hover:bg-white/[0.06] md:p-8"
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
                      className="relative flex h-[60px] w-[60px] items-center justify-center rounded-full border backdrop-blur-sm transition-transform duration-500 group-hover:rotate-[10deg]"
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
                    <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </FloatingCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── Industries ────────────────────────────────────────────── */}
        <section id="industries" className="pt-24 md:pt-32">
          <SectionHeading
            eyebrow="Industries"
            title="AI-Driven Efficiency and Growth Across Industries"
            body="Our AI-driven solutions help industries improve efficiency, scale operations, and accelerate transformation — modernizing faster and staying competitive in a digital-first world."
          />
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((industry) => (
              <div
                key={industry.name}
                className="rounded-2xl border border-white/[0.08] bg-[#111113] p-6 shadow-sm transition-all hover:border-[#FF8A3D]/50 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-white">
                  {industry.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {industry.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tech stack ────────────────────────────────────────────── */}
        <section id="stack" className="pt-24 md:pt-32">
          <SectionHeading
            eyebrow="Technology Stack"
            title="Modern Tech Stack for AI and Software Solutions"
            body="We use modern AI, software, cloud, mobile, and web technologies to create smarter, scalable, future-ready solutions for business growth."
          />
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111113] bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgba(255,106,61,0.14),transparent_70%)] px-6 py-20 text-center shadow-sm">
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
                className="group inline-flex items-center gap-2 rounded-full bg-[#FF6A3D] px-8 py-3.5 text-sm font-semibold text-[#1a0a04] transition-all duration-300 hover:bg-[#FF8A5C] hover:shadow-[0_0_40px_-8px_rgba(255,106,61,0.6)]"
              >
                Let&apos;s Build Together
                <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <a
                href="mailto:softsuave.ai@gmail.com"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-8 py-3.5 text-sm font-semibold text-zinc-200 transition-colors duration-300 hover:border-[#FF8A3D]/50 hover:text-[#FFB057]"
              >
                Talk With AI Experts
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="relative z-10 mt-24 border-t border-white/[0.08] py-10 text-center text-sm text-zinc-500">
        <p>
          <a
            href="mailto:softsuave.ai@gmail.com"
            className="text-[#FF8A3D] hover:text-[#FFB057]"
          >
            softsuave.ai@gmail.com
          </a>
        </p>
        <p className="mt-3 text-xs text-zinc-600">
          © 2026 Soft Suave. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
