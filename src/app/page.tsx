import BackgroundCanvas from "@/components/dom/layout/BackgroundCanvas";
import ScrollAnimation from "@/components/dom/ScrollAnimation";
import Hero from "@/components/dom/sections/Hero";
import StorySection from "@/components/dom/sections/StorySection";

export default function Home() {
  return (
    <main>
      <ScrollAnimation />
      <BackgroundCanvas />

      <div className="relative z-10" id="story">
        <Hero />
        <StorySection
          index="01"
          title="AI that bends everything toward it"
          body="Like light around a singularity, every workflow curves toward intelligence. We build the models, agents, and pipelines at the center of that pull."
        />
        <StorySection
          index="02"
          title="Autonomous agents in constant orbit"
          body="Self-directed systems that observe, decide, and act — handling the work that used to consume your teams, around the clock."
          align="right"
        />
        <StorySection
          index="03"
          title="Enterprise gravity, engineered"
          body="RAG over your entire knowledge mass. LLMs tuned to your domain. Cloud AI infrastructure that scales without collapsing."
        />
        <section className="relative flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(1,2,8,0.55),transparent_70%)]" />
          <h2 className="relative max-w-2xl text-3xl font-semibold tracking-tight text-slate-100 [text-shadow:0_1px_14px_rgba(1,2,8,0.95)] md:text-5xl">
            Cross the event horizon
          </h2>
          <p className="relative mt-5 max-w-md text-slate-300 [text-shadow:0_1px_12px_rgba(1,2,8,0.95)]">
            Tell us where your business is heading — we&apos;ll build the
            intelligence that takes it there.
          </p>
          <a
            href="#"
            className="relative mt-10 rounded-full bg-sky-400 px-8 py-3.5 text-sm font-semibold text-slate-950 transition-all duration-300 hover:bg-sky-300 hover:shadow-[0_0_40px_-8px_rgba(56,189,248,0.8)]"
          >
            Start a conversation
          </a>
        </section>
      </div>
    </main>
  );
}
