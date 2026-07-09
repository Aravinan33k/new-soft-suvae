"use client";

import { useEffect, useRef, useState } from "react";
import { FiSend, FiX } from "react-icons/fi";
import { TbMessageChatbot, TbSparkles } from "react-icons/tb";

type Message = {
  id: number;
  role: "user" | "bot";
  text: string;
};

const GREETING =
  "Hi! I'm Suave AI 👋 Ask me anything about our AI solutions, services, industries, or how to get started.";

const QUICK_QUESTIONS = [
  "What services do you offer?",
  "Do you build AI chatbots?",
  "Which industries do you serve?",
  "How do I get started?",
];

// Lightweight knowledge-base responder. Each entry pairs keyword triggers
// with an answer; the first entry whose keywords match the question wins.
// Swap answerFor() with a fetch to an LLM API route when one is available.
const KNOWLEDGE: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["service", "offer", "what do you do", "solutions", "help"],
    answer:
      "We offer Custom AI Solutions (LLMs, RAG, agents), AI Integrations & Workflow Automation, AI Chatbots & Agents, Custom Software Development, Mobile & Web App Development, Enterprise Modernization, and Global Capability Centers (GCC). Which one would you like to know more about?",
  },
  {
    keywords: ["chatbot", "chat bot", "agent", "conversational", "support bot"],
    answer:
      "Yes! We build conversational AI chatbots and agents for support, sales, HR, and internal ops — always on, always learning. They can plug into your existing tools and knowledge bases. Want to discuss your use case? Reach us at softsuave.ai@gmail.com.",
  },
  {
    keywords: ["automation", "workflow", "integrat", "automate"],
    answer:
      "We wire AI into the tools you already use and automate repetitive workflows — cutting manual effort, reducing errors, and speeding up operations. Typical wins: document processing, approvals, data sync between systems, and reporting.",
  },
  {
    keywords: ["mobile", "app development", "ios", "android"],
    answer:
      "We build native-quality iOS and Android apps with intuitive design and AI-enhanced features, plus cross-platform options when speed to market matters.",
  },
  {
    keywords: ["web", "website", "frontend", "web app"],
    answer:
      "We develop fast, AI-enabled web apps focused on UX and performance — designed to simplify workflows and convert visitors into customers.",
  },
  {
    keywords: ["industr", "sector", "domain", "vertical"],
    answer:
      "We serve 20+ industries including Ecommerce, HealthTech, Logistics, EdTech, FinTech, and Manufacturing — with 100+ projects delivered and 98% client satisfaction.",
  },
  {
    keywords: ["stack", "technolog", "tools", "llm", "model", "framework"],
    answer:
      "Our stack spans foundation models (GPT, Claude, Gemini, Llama, Mistral, DeepSeek), AI frameworks (LangChain, LangGraph, CrewAI, AutoGen, LlamaIndex), vector DBs (Pinecone, Weaviate, Qdrant, Milvus, FAISS), and cloud AI (Azure AI, AWS Bedrock, Vertex AI).",
  },
  {
    keywords: ["price", "cost", "pricing", "budget", "quote", "charge"],
    answer:
      "Pricing depends on scope and complexity, so we start with a free consultation to understand your needs and give you a clear estimate. Email softsuave.ai@gmail.com to book one.",
  },
  {
    keywords: ["contact", "email", "reach", "talk", "call", "consult", "start", "get started", "book", "hire"],
    answer:
      "The best way to get started is a free AI strategy session — email us at softsuave.ai@gmail.com and we'll find where AI can create the biggest impact for you.",
  },
  {
    keywords: ["hello", "hi", "hey", "good morning", "good evening"],
    answer:
      "Hello! 👋 How can I help you today? You can ask about our services, industries, tech stack, or how to start a project.",
  },
  {
    keywords: ["thank", "thanks", "great", "awesome"],
    answer: "You're welcome! Anything else you'd like to know? 😊",
  },
  {
    keywords: ["who are you", "about", "soft suave", "company", "team"],
    answer:
      "Soft Suave builds AI-powered software, intelligent automation, and seamless integrations. We've delivered 50+ projects and 15+ AI solutions for 200+ happy clients, with 24/7 support and 99.9% uptime.",
  },
];

const FALLBACK =
  "Great question! I don't have a detailed answer for that here, but our experts do — drop us a line at softsuave.ai@gmail.com or use the \"Schedule a Free Consultation\" button above, and we'll get back to you quickly.";

function answerFor(question: string): string {
  const q = question.toLowerCase();
  for (const entry of KNOWLEDGE) {
    if (entry.keywords.some((k) => q.includes(k))) return entry.answer;
  }
  return FALLBACK;
}

// Floating AI assistant, pinned to the bottom-right corner. A pulsing
// launcher button opens a glassmorphic chat panel that answers common
// visitor questions from the knowledge base above.
export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: "bot", text: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the newest message in view
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = (text: string) => {
    const question = text.trim();
    if (!question || typing) return;
    setMessages((prev) => [
      ...prev,
      { id: nextId.current++, role: "user", text: question },
    ]);
    setInput("");
    setTyping(true);
    // Small delay so the reply feels conversational rather than instant
    const delay = 600 + Math.min(question.length * 15, 900);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, role: "bot", text: answerFor(question) },
      ]);
      setTyping(false);
    }, delay);
  };

  const showQuickQuestions = messages.length <= 1;

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-4 md:bottom-6 md:right-6">
      {/* ── Chat panel ─────────────────────────────────────────────── */}
      <div
        className={`flex w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-(--border) bg-(--panel) shadow-[0_24px_64px_-12px_var(--shadow-strong),0_0_48px_-12px_var(--glow-orange)] backdrop-blur-xl transition-all duration-300 ease-out ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-(--border) bg-[radial-gradient(ellipse_80%_120%_at_50%_0%,var(--glow-orange),transparent_70%)] px-4 py-3.5">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#FF8A3D]/30 bg-[#FF8A3D]/15 text-[#FF9E55]">
            <TbSparkles className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#111113] bg-emerald-400" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-(--heading)">Suave AI</p>
            <p className="text-xs text-(--text-secondary)">
              Online — ask me anything
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="flex h-8 w-8 items-center justify-center rounded-full text-(--text-secondary) transition-colors hover:bg-(--brand-orange)/10 hover:text-(--heading)"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex h-80 flex-col gap-3 overflow-y-auto px-4 py-4 md:h-96"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "self-end rounded-br-md bg-gradient-to-r from-(--btn-a) to-(--btn-b) text-white"
                  : "self-start rounded-bl-md border border-(--border) bg-(--background-alt) text-(--foreground)"
              }`}
            >
              {m.text}
            </div>
          ))}

          {typing && (
            <div className="flex items-center gap-1.5 self-start rounded-2xl rounded-bl-md border border-(--border) bg-(--background-alt) px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#FF8A3D]"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}

          {showQuickQuestions && !typing && (
            <div className="mt-1 flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="rounded-full border border-[#FF8A3D]/25 bg-[#FF8A3D]/[0.08] px-3 py-1.5 text-xs text-[#FFB057] transition-colors hover:border-[#FF8A3D]/50 hover:bg-[#FF8A3D]/[0.15]"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-(--border) p-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            className="min-w-0 flex-1 rounded-full border border-(--border) bg-(--background-alt) px-4 py-2.5 text-sm text-(--foreground) placeholder:text-(--text-secondary) outline-none transition-colors focus:border-(--brand-orange)/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || typing}
            aria-label="Send message"
            className="btn-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#1a0a04] transition-opacity disabled:opacity-40"
          >
            <FiSend className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* ── Launcher button ────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#FF9440] to-[#F92B4E] text-[#1a0a04] shadow-[0_12px_32px_-8px_rgba(249,43,78,0.6),0_0_28px_-6px_rgba(255,138,61,0.5)] transition-transform duration-300 hover:scale-105 active:scale-95"
      >
        {/* Idle pulse ring to draw the eye */}
        {!open && (
          <span className="absolute inset-0 animate-ping rounded-full bg-[#FF8A3D]/30" />
        )}
        <span className="relative">
          {open ? (
            <FiX className="h-6 w-6" />
          ) : (
            <TbMessageChatbot className="h-7 w-7" />
          )}
        </span>
      </button>
    </div>
  );
}
