"use client";

import { useEffect, useState } from "react";
import { FiArrowRight } from "react-icons/fi";

const NAV_LINKS = [
  { label: "Solutions", href: "#services" },
  { label: "Services", href: "#services" },
  { label: "Industries", href: "#industries" },
  { label: "About Us", href: "#experience" },
  { label: "Resources", href: "#stack" },
];

// Glassmorphic navbar. At the top it spans the full container; once the
// page scrolls it condenses into a Vercel-style floating pill — 95% width,
// rounded, elevated shadow — while keeping the same 12px backdrop blur.
// The outer header keeps a constant height so content below never shifts.
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 flex h-20 items-center justify-center">
      <nav
        className={`flex items-center px-6 backdrop-blur-[12px] transition-all duration-500 ease-out md:px-10 ${
          scrolled
            ? "h-14 w-[95%] max-w-6xl rounded-2xl border border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.7),0_0_24px_-12px_rgba(255,106,61,0.25)]"
            : "h-20 w-full max-w-none border border-transparent"
        }`}
        style={{ backgroundColor: "rgba(10,10,20,0.5)" }}
      >
        <div className={`mx-auto flex w-full items-center ${scrolled ? "max-w-6xl" : "max-w-7xl"}`}>
          <a
            href="#top"
            className="group flex items-center gap-3 text-xl font-bold tracking-tight text-white md:text-2xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/softsuave-mark.svg"
              alt=""
              className="h-9 w-auto transition-all duration-300 group-hover:rotate-[5deg] group-hover:drop-shadow-[0_0_14px_rgba(255,106,61,0.8)] md:h-10"
            />
            Soft Suave
          </a>

          {/* Primary menu — hidden on small screens */}
          <nav className="ml-auto hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-zinc-300 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a
            href="#contact"
            className="btn-primary group ml-auto inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-[#1a0a04] lg:ml-8"
          >
            Contact Us
            <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </a>
        </div>
      </nav>
    </header>
  );
}
