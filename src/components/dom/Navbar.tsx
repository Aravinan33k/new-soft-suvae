"use client";

import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  FiArrowRight,
  FiChevronDown,
  FiMail,
  FiMenu,
  FiMessageCircle,
  FiMoon,
  FiPhone,
  FiSun,
  FiX,
} from "react-icons/fi";
import { useTheme } from "@/components/dom/ThemeToggle";

type SubLink = { label: string; href: string };
type NavItem = { label: string; href?: string; items?: SubLink[] };

// Service pages don't exist yet, so service/team links point at the on-page
// sections that showcase them (#experience) or the contact CTA (#contact).
const NAV: NavItem[] = [
  {
    label: "AI Solutions",
    items: [
      { label: "Custom AI Development", href: "#experience" },
      { label: "Generative AI", href: "#experience" },
      { label: "AI Agents", href: "#experience" },
      { label: "AI Chatbots", href: "#experience" },
      { label: "RAG Solutions", href: "#experience" },
      { label: "AI Copilots", href: "#experience" },
    ],
  },
  {
    label: "AI Integrations",
    items: [
      { label: "CRM AI Integration", href: "#experience" },
      { label: "ERP AI Integration", href: "#experience" },
      { label: "Enterprise AI Integration", href: "#experience" },
      { label: "API Integration", href: "#experience" },
    ],
  },
  {
    label: "AI Automation",
    items: [
      { label: "Business Process Automation", href: "#experience" },
      { label: "Document Automation", href: "#experience" },
      { label: "Workflow Automation", href: "#experience" },
      { label: "Voice AI", href: "#experience" },
      { label: "Email Automation", href: "#experience" },
    ],
  },
  { label: "Industries", href: "#industries" },
  { label: "Case Studies", href: "#testimonials" },
  { label: "Resources", href: "#stack" },
  {
    label: "Company",
    items: [
      { label: "Hire AI Engineers", href: "#contact" },
      { label: "AI Consultants", href: "#contact" },
      { label: "AI Architects", href: "#contact" },
      { label: "AI Product Teams", href: "#contact" },
    ],
  },
];

// the split-button's dropdown options (the chevron half of the CTA)
const CTA_OPTIONS: { icon: IconType; label: string; href: string }[] = [
  { icon: FiMail, label: "Email Us", href: "mailto:softsuave.ai@gmail.com" },
  { icon: FiPhone, label: "Book a Call", href: "tel:+918015159981" },
  { icon: FiMessageCircle, label: "Chat on WhatsApp", href: "https://wa.me/918015159981" },
];

// Flat, minimal navbar in the Anthropic template style: a solid warm-cream
// bar, plain dark text links with dropdown carets, and a black split-button
// CTA (a "Contact Us" pill + a chevron that opens contact options). A hairline
// bottom border deepens to a soft shadow once the page scrolls.
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null); // desktop dropdown
  const [ctaOpen, setCtaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const { dark, toggle, setDark } = useTheme();

  useEffect(() => {
    // Hysteresis: condense into the floating pill past 48px, expand back under 12px
    const onScroll = () =>
      setScrolled((prev) => (prev ? window.scrollY > 12 : window.scrollY > 48));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close the split-button menu on an outside click
  useEffect(() => {
    if (!ctaOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (ctaRef.current && !ctaRef.current.contains(e.target as Node)) setCtaOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [ctaOpen]);

  // hover intent: a short close delay lets the cursor cross into the panel
  const openMenu = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(label);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(null), 120);
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-center">
      <nav
        className={`flex items-center backdrop-blur-xl transition-all duration-300 ease-out ${
          scrolled
            ? "h-11 w-[min(92%,72rem)] rounded-full border shadow-[0_8px_32px_-10px_var(--shadow-strong)]"
            : "h-16 w-full rounded-none border-x-0 border-t-0 border-b"
        }`}
        style={{ backgroundColor: "var(--nav-surface)", borderColor: "var(--border)" }}
      >
        <div className="mx-auto flex w-full max-w-[90rem] items-center px-5 md:px-8 lg:px-10">
          {/* ── Wordmark ─────────────────────────────────────────────── */}
          <a href="#top" className="group flex shrink-0 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/softsuave-mark.svg"
              alt=""
              className={`w-auto transition-all duration-300 group-hover:-translate-y-0.5 ${
                scrolled ? "h-6" : "h-7"
              }`}
            />
            <span
              className={`font-bold tracking-tight text-(--heading) transition-all duration-300 ${
                scrolled ? "text-base" : "text-lg"
              }`}
            >
              Soft Suave
            </span>
          </a>

          {/* ── Right cluster: links + split CTA + toggle ─────────────── */}
          <div className="ml-auto flex items-center gap-5 lg:gap-7">
            <ul className="hidden items-center gap-7 xl:flex">
              {NAV.map((item) =>
                item.items ? (
                  <li
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => openMenu(item.label)}
                    onMouseLeave={scheduleClose}
                  >
                    <button
                      type="button"
                      aria-expanded={open === item.label}
                      className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                        open === item.label
                          ? "text-(--heading)"
                          : "text-(--foreground) hover:text-(--heading)"
                      }`}
                    >
                      {item.label}
                      <FiChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-300 ${
                          open === item.label ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <div
                      className={`absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3 transition-all duration-200 ease-out ${
                        open === item.label
                          ? "pointer-events-auto translate-y-0 opacity-100"
                          : "pointer-events-none -translate-y-1 opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden rounded-xl border border-(--border) bg-(--panel) p-1.5 shadow-[0_20px_56px_-20px_var(--shadow-strong)] backdrop-blur-xl">
                        {item.items.map((sub) => (
                          <a
                            key={sub.label}
                            href={sub.href}
                            onClick={() => setOpen(null)}
                            className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-(--foreground) transition-colors hover:bg-(--background-alt) hover:text-(--heading)"
                          >
                            {sub.label}
                            <FiArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </li>
                ) : (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm font-medium text-(--foreground) transition-colors hover:text-(--heading)"
                    >
                      {item.label}
                    </a>
                  </li>
                ),
              )}
            </ul>

            {/* ── CTA with a built-in dropdown of contact options ──────── */}
            <div ref={ctaRef} className="relative hidden sm:block">
              <button
                type="button"
                aria-label="Contact us"
                aria-expanded={ctaOpen}
                onClick={() => setCtaOpen((v) => !v)}
                className="nav-cta flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
              >
                Contact Us
                <FiChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${ctaOpen ? "rotate-180" : ""}`}
                />
              </button>

              <div
                className={`absolute right-0 top-full z-50 w-56 pt-2 transition-all duration-200 ease-out ${
                  ctaOpen
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none -translate-y-1 opacity-0"
                }`}
              >
                <div className="overflow-hidden rounded-xl border border-(--border) bg-(--panel) p-1.5 shadow-[0_20px_56px_-20px_var(--shadow-strong)] backdrop-blur-xl">
                  {CTA_OPTIONS.map((o) => (
                    <a
                      key={o.label}
                      href={o.href}
                      target={o.href.startsWith("http") ? "_blank" : undefined}
                      rel={o.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      onClick={() => setCtaOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-(--foreground) transition-colors hover:bg-(--background-alt) hover:text-(--heading)"
                    >
                      <o.icon className="h-4 w-4 shrink-0 text-(--brand-orange)" />
                      {o.label}
                    </a>
                  ))}

                  {/* colour-theme switch lives inside the Contact menu — an
                      explicit Light/Dark segmented control so it's unmistakably
                      a theme picker, not just another menu link */}
                  <div className="my-1 h-px bg-(--border)" />
                  <div className="px-3 pb-1 pt-1.5">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-(--text-secondary)">
                      Appearance
                    </p>
                    <div className="flex gap-1 rounded-lg bg-(--background-alt) p-1">
                      <button
                        type="button"
                        onClick={() => setDark(false)}
                        aria-pressed={!dark}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                          !dark
                            ? "bg-(--brand-orange) text-white shadow-sm"
                            : "text-(--foreground) hover:text-(--heading)"
                        }`}
                      >
                        <FiSun className="h-3.5 w-3.5 shrink-0" />
                        Light
                      </button>
                      <button
                        type="button"
                        onClick={() => setDark(true)}
                        aria-pressed={dark}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                          dark
                            ? "bg-(--brand-orange) text-white shadow-sm"
                            : "text-(--foreground) hover:text-(--heading)"
                        }`}
                      >
                        <FiMoon className="h-3.5 w-3.5 shrink-0" />
                        Dark
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* hamburger — below xl */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-(--border) text-(--heading) transition-colors hover:border-(--foreground) xl:hidden"
            >
              {mobileOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer (below xl) ─────────────────────────────────── */}
      <div
        className={`fixed inset-x-0 top-16 z-40 origin-top px-4 transition-all duration-300 ease-out xl:hidden ${
          mobileOpen
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div className="mx-auto max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-(--border) bg-(--panel) p-3 shadow-[0_24px_64px_-16px_var(--shadow-strong)] backdrop-blur-xl">
          {NAV.map((item) =>
            item.items ? (
              <div key={item.label} className="border-b border-(--border) last:border-0">
                <button
                  type="button"
                  onClick={() =>
                    setMobileExpanded((v) => (v === item.label ? null : item.label))
                  }
                  className="flex w-full items-center justify-between px-3 py-3.5 text-sm font-semibold text-(--heading)"
                >
                  {item.label}
                  <FiChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${
                      mobileExpanded === item.label ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    mobileExpanded === item.label
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col gap-0.5 pb-2 pl-3">
                      {item.items.map((sub) => (
                        <a
                          key={sub.label}
                          href={sub.href}
                          onClick={() => setMobileOpen(false)}
                          className="rounded-lg px-3 py-2 text-sm text-(--foreground) transition-colors hover:bg-(--background-alt) hover:text-(--heading)"
                        >
                          {sub.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block border-b border-(--border) px-3 py-3.5 text-sm font-semibold text-(--heading) last:border-0 hover:text-(--foreground)"
              >
                {item.label}
              </a>
            ),
          )}
          <a
            href="mailto:softsuave.ai@gmail.com"
            onClick={() => setMobileOpen(false)}
            className="nav-cta mt-3 flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold"
          >
            Contact Us
            <FiArrowRight />
          </a>

          {/* colour-theme switch */}
          <button
            type="button"
            onClick={toggle}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-(--border) px-5 py-3 text-sm font-medium text-(--foreground) transition-colors hover:text-(--heading)"
          >
            {dark ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
            {dark ? "Light theme" : "Dark theme"}
          </button>
        </div>
      </div>
    </header>
  );
}
