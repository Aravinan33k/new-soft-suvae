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
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-100 md:text-5xl">
            Cross the event horizon
          </h2>
          <p className="mt-5 max-w-md text-slate-400">
            Tell us where your business is heading — we&apos;ll build the
            intelligence that takes it there.
          </p>
          <a
            href="#"
            className="mt-10 rounded-full bg-sky-400 px-8 py-3.5 text-sm font-semibold text-slate-950 transition-all duration-300 hover:bg-sky-300 hover:shadow-[0_0_40px_-8px_rgba(56,189,248,0.8)]"
          >
            Start a conversation
          </a>
        </section>
      </div>
    </main>
  );
}
