"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { IconType } from "react-icons";
import {
  FaFacebookF,
  FaXTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa6";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Footer finale — the logo IS a particle system. No logo image is rendered
// anywhere: free-floating glowing particles drift, connect into a neural
// network, and organize themselves into the Soft Suave mark (positions
// sampled from the brand SVG's path data offscreen). Once formed, the mark
// keeps living — shimmering particles, pulsing links, the odd particle
// detaching and rejoining. The wordmark text fades in after the mark forms.
// Beneath the mark: the company footer (about, links, contact) mirroring
// softsuave.com. Replays on re-entering the viewport; prefers-reduced-motion
// shows the formed state immediately.
const LogoParticles = dynamic(
  () => import("@/components/canvas/LogoParticles"),
  { ssr: false, loading: () => null },
);

// ── Footer content (sourced from softsuave.com) ────────────────────────
const ABOUT =
  "Soft Suave is an AI-enabled engineering partner helping businesses build scalable AI solutions, automate complex workflows, and integrate modern technologies. With strategic partnerships and augmented teams, we drive modernization and measurable outcomes.";

const SOCIALS: { icon: IconType; label: string; href: string }[] = [
  { icon: FaFacebookF, label: "Facebook", href: "https://www.facebook.com/softsuave/" },
  { icon: FaXTwitter, label: "X", href: "https://x.com/softsuave" },
  { icon: FaLinkedinIn, label: "LinkedIn", href: "https://www.linkedin.com/company/softsuave" },
  { icon: FaInstagram, label: "Instagram", href: "https://www.instagram.com/softsuave" },
  { icon: FaYoutube, label: "YouTube", href: "https://www.youtube.com/@softsuave" },
];

export default function SiteFooter() {
  const wrapRef = useRef<HTMLElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);
  const [formed, setFormed] = useState(false);
  const [center, setCenter] = useState<{ x: number; y: number } | null>(null);

  // where the mark should form: the slot's centre, relative to the footer
  useEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      const slot = slotRef.current;
      if (!wrap || !slot) return;
      const wr = wrap.getBoundingClientRect();
      const sr = slot.getBoundingClientRect();
      setCenter({
        x: sr.left - wr.left + sr.width / 2,
        y: sr.top - wr.top + sr.height / 2,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.25 },
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, []);

  // wordmark appears when the swarm reports the mark has assembled — driven
  // by the animation clock (onFormed), not wall-clock, so it can't desync
  // when rendering is throttled
  const onFormed = useCallback(() => setFormed(true), []);
  // Reconciles the wordmark's "formed" flag with viewport + reduced-motion.
  // `formed` is multi-source (also driven imperatively by the canvas's
  // onFormed callback), so it can't be purely derived in render — this
  // sync-in-effect is the correct pattern here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (reduced) setFormed(true);
    else if (!active) setFormed(false);
  }, [active, reduced]);

  return (
    <footer
      ref={wrapRef}
      data-theme="dark"
      className="relative z-10 mt-24 overflow-hidden border-t border-(--border) bg-[#0a0a0c]"
    >
      {/* the particle system covers the footer; the mark forms in the slot */}
      <div className="pointer-events-none absolute inset-0">
        <LogoParticles
          active={active}
          reduced={reduced}
          center={center}
          onFormed={onFormed}
        />
      </div>

      <div className="relative mx-auto max-w-[85rem] px-6 py-14 md:px-10 lg:px-20">
        {/* ── Brand mark finale + about blurb + socials (centred) ──────── */}
        <div className="flex flex-col items-center text-center">
          {/* empty slot the particles assemble into — never an image */}
          <div ref={slotRef} aria-label="Soft Suave" role="img" className="h-40 w-40" />

          {/* Company wordmark — fades in once the mark has formed */}
          <p
            className="mt-4 text-2xl font-bold tracking-tight text-(--heading) transition-all duration-700"
            style={{
              opacity: formed ? 1 : 0,
              transform: formed ? "translateY(0)" : "translateY(8px)",
            }}
          >
            Soft Suave
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-(--foreground)">
            {ABOUT}
          </p>

          {/* social icons */}
          <div className="mt-7 flex gap-3">
            {SOCIALS.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-(--border) text-(--foreground) transition-all hover:border-(--brand-orange)/50 hover:text-(--brand-orange)"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
