import { FiArrowRight, FiCheck } from "react-icons/fi";
import ExperienceStage from "@/components/dom/ExperienceStage";
import FragmentCubes from "@/components/dom/FragmentCubes";

const NAV_LINKS = [
  { label: "How It Works", href: "#connect" },
  { label: "Services", href: "#services" },
  { label: "Industries", href: "#industries" },
  { label: "Work", href: "#work" },
  { label: "Contact", href: "#contact" },
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

const STATS = [
  "400+ AI & Engineering Specialists",
  "13+ Years of Experience",
  "150+ Global Clients",
  "21+ Countries",
];

const SERVICES = [
  {
    name: "Custom AI Solutions",
    body: "Build industry-ready AI solutions with LLMs, RAG, agents, and predictive models to automate workflows and improve decisions faster at scale.",
  },
  {
    name: "AI Integrations & Workflow Automation",
    body: "Integrate AI into business tools and automate workflows to reduce manual work, improve accuracy, and speed up daily operations.",
  },
  {
    name: "AI Chatbots & AI Agents",
    body: "Deploy AI chatbots and agents for customer support, HR, finance, sales, healthcare, internal operations, and employee assistance.",
  },
  {
    name: "Custom Software Development",
    body: "Build secure, scalable, high-performance solutions with our AI-enabled custom software development service to improve operations and support smarter business growth.",
  },
  {
    name: "Mobile App Development",
    body: "Create AI-enabled mobile apps across Android, iOS, and cross-platform environments with intuitive design, smarter features, and experiences tailored to your business goals.",
  },
  {
    name: "Web App Development",
    body: "Power your digital ideas with AI-enabled web apps that simplify workflows, engage users, and support faster business growth online.",
  },
  {
    name: "Enterprise Modernization",
    body: "Modernize legacy systems with cloud, automation, and AI to improve agility, performance, resilience, security, and long-term business growth across operations.",
  },
  {
    name: "Global Capability Center (GCC)",
    body: "Scale your GCC with AI-powered teams, smarter workflows, automation, and analytics that improve productivity, decision-making, and operational efficiency.",
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
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-medium uppercase tracking-[0.3em] text-sky-600/90">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
        {title}
      </h2>
      {body && (
        <p className="mt-5 text-base leading-relaxed text-slate-600 md:text-lg">
          {body}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-svh bg-[#f4f7fb]">
      {/* ── Navbar ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#f4f7fb]">
        <nav className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 md:px-10">
          <a
            href="#top"
            className="flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900 md:text-2xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/softsuave-mark.svg" alt="" className="h-9 w-auto md:h-10" />
            Soft Suave
          </a>
          <div className="flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hidden text-sm text-slate-600 transition-colors hover:text-sky-600 lg:block"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              className="rounded-full bg-[#1FB6FF] px-4 py-1.5 text-sm font-semibold text-slate-950 transition-all duration-300 hover:bg-[#53C8FF] hover:shadow-[0_0_24px_-6px_rgba(31,182,255,0.45)]"
            >
              Book AI Strategy Call
            </a>
          </div>
        </nav>
      </header>

      <div id="top" className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-10">
        {/* ── Hero: headline left, supporting copy right ────────────── */}
        <section className="relative grid grid-cols-1 gap-12 pt-20 md:grid-cols-12 md:items-center md:pt-28">
          {/* Layer 2: center spotlight behind the headline */}
          <div className="pointer-events-none absolute -inset-x-24 -inset-y-16 -z-10 bg-[radial-gradient(circle_at_center,rgba(0,170,255,0.08)_0%,rgba(0,120,255,0.05)_25%,transparent_70%)]" />
          <div className="pointer-events-none absolute -inset-x-24 -inset-y-16 -z-10 bg-[radial-gradient(circle_at_75%_20%,rgba(118,94,255,0.07),transparent_60%)]" />
          {/* Layer 5: left & right fade keeps focus centered */}
          <div className="pointer-events-none absolute -inset-x-24 -inset-y-16 -z-10 bg-[linear-gradient(90deg,rgba(244,247,251,0.95)_0%,transparent_20%,transparent_80%,rgba(244,247,251,0.95)_100%)]" />
          <div className="md:col-span-7">
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.35em] text-sky-600/90 md:text-sm">
              Soft Suave
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
              Empowering Businesses with Scalable AI,{" "}
              <span className="bg-gradient-to-b from-indigo-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
                Automation &amp; Integrations
              </span>
            </h1>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="#contact"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#1FB6FF] px-6 py-2.5 text-sm font-semibold text-slate-950 transition-all duration-300 hover:bg-[#53C8FF] hover:shadow-[0_0_40px_-8px_rgba(31,182,255,0.5)]"
              >
                Book AI Strategy Call
                <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-300 hover:border-sky-400/60 hover:text-sky-700"
              >
                Explore AI Solutions
              </a>
            </div>
          </div>
          <div className="md:col-span-5 md:pl-6 lg:pl-14">
            <p className="max-w-md font-serif text-lg leading-relaxed text-slate-600 md:text-xl">
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
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PROBLEMS.map((p, i) =>
              i === 0 ? (
                // Fragmented Data: dark panel with the animated circuit-cube
                // fragments as its background
                <div
                  key={p.name}
                  className="relative overflow-hidden rounded-2xl border border-sky-950/50 bg-[#070D1A] p-6 shadow-sm transition-all hover:border-sky-400/50 hover:shadow-md"
                >
                  <FragmentCubes className="pointer-events-none absolute inset-0 h-full w-full" />
                  {/* Scrim so the copy stays readable over the cubes */}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,13,26,0.42)_0%,rgba(7,13,26,0.05)_45%,rgba(7,13,26,0.5)_100%)]" />
                  <div className="relative">
                    <h3 className="text-base font-semibold text-white">
                      {p.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300 [text-shadow:0_1px_8px_rgba(7,13,26,0.9)]">
                      {p.body}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  key={p.name}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-sky-400/50 hover:shadow-md"
                >
                  <h3 className="text-base font-semibold text-slate-900">
                    {p.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {p.body}
                  </p>
                </div>
              ),
            )}
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
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
              >
                <FiCheck className="shrink-0 text-sky-500" />
                <span className="text-sm text-slate-700">{stat}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Services ──────────────────────────────────────────────── */}
        <section id="services" className="pt-24 md:pt-32">
          <SectionHeading
            eyebrow="Our Services"
            title="AI & Software Services Built for Businesses of All Sizes"
            body="Whether you are a startup, SMB, or enterprise, Soft Suave helps you build AI solutions, develop software, automate workflows, and scale digital products with confidence."
          />
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service) => (
              <div
                key={service.name}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-sky-400/50 hover:bg-[#1FB6FF]/[0.04] hover:shadow-md"
              >
                <h3 className="text-base font-semibold text-slate-900">
                  {service.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {service.body}
                </p>
              </div>
            ))}
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
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-sky-400/50 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {industry.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
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
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-sm font-semibold uppercase tracking-wider text-sky-600/90">
                  {group.category}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
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
          <div className="mx-auto mt-10 flex max-w-3xl items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-sm text-slate-500">
            Case studies coming soon.
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────── */}
        <section id="contact" className="pt-24 md:pt-32">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgba(31,182,255,0.12),transparent_70%)] px-6 py-20 text-center shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/softsuave-mark.svg"
              alt="Soft Suave"
              className="mx-auto h-14 w-auto drop-shadow-[0_0_24px_rgba(31,182,255,0.35)]"
            />
            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Transforming Complexity into Intelligent Digital Solutions
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600">
              Book a free AI strategy session with our experts and discover
              where AI can create the biggest impact in your organization.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="mailto:softsuave.ai@gmail.com"
                className="group inline-flex items-center gap-2 rounded-full bg-[#1FB6FF] px-8 py-3.5 text-sm font-semibold text-slate-950 transition-all duration-300 hover:bg-[#53C8FF] hover:shadow-[0_0_40px_-8px_rgba(31,182,255,0.5)]"
              >
                Let&apos;s Build Together
                <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <a
                href="mailto:softsuave.ai@gmail.com"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-8 py-3.5 text-sm font-semibold text-slate-700 transition-colors duration-300 hover:border-sky-400/60 hover:text-sky-700"
              >
                Talk With AI Experts
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="relative z-10 mt-24 border-t border-slate-200 py-10 text-center text-sm text-slate-500">
        <p>
          <a
            href="mailto:softsuave.ai@gmail.com"
            className="text-sky-600 hover:text-sky-500"
          >
            softsuave.ai@gmail.com
          </a>
        </p>
        <p className="mt-3 text-xs text-slate-400">
          © 2026 Soft Suave. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
