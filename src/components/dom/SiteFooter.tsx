"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { IconType } from "react-icons";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
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

const PHONES = [
  { label: "USA", value: "+1 (410) 220-6301", href: "tel:+14102206301" },
  { label: "UK", value: "+44 7403 646450", href: "tel:+447403646450" },
  { label: "India (HR)", value: "+91 8015159981", href: "tel:+918015159981" },
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
      className="relative z-10 mt-24 overflow-hidden border-t border-(--border) bg-(--background-alt)"
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

      <div className="relative mx-auto max-w-[85rem] px-6 py-20 md:px-10 lg:px-20">
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

        {/* ── Get in Touch: offices + email + phones ───────────────────── */}
        <div className="mx-auto mt-16 grid max-w-4xl gap-x-10 gap-y-8 text-left sm:grid-cols-2 lg:grid-cols-3">
          {/* USA office */}
          <div className="flex gap-2.5">
            <FiMapPin className="mt-0.5 shrink-0 text-(--brand-orange)" />
            <p className="text-sm leading-relaxed text-(--foreground)">
              <span className="font-medium text-(--heading)">Soft Suave LLC</span>
              <br />
              3030 K Street NW, Suite 102, Washington, DC 20007, USA
            </p>
          </div>

          {/* India office */}
          <div className="flex gap-2.5">
            <FiMapPin className="mt-0.5 shrink-0 text-(--brand-orange)" />
            <p className="text-sm leading-relaxed text-(--foreground)">
              <span className="font-medium text-(--heading)">
                Soft Suave Technologies
              </span>
              <br />
              SSPDL Building, Alpha City, Gamma Block, 5th Floor, Navalur,
              Chennai&nbsp;-&nbsp;603103
            </p>
          </div>

          {/* email + phones */}
          <div>
            <a
              href="mailto:contact@softsuave.com"
              className="flex items-center gap-2.5 text-sm text-(--foreground) transition-colors hover:text-(--brand-orange)"
            >
              <FiMail className="shrink-0 text-(--brand-orange)" />
              contact@softsuave.com
            </a>
            <div className="mt-3 space-y-2">
              {PHONES.map((p) => (
                <a
                  key={p.label}
                  href={p.href}
                  className="flex items-center gap-2.5 text-sm text-(--foreground) transition-colors hover:text-(--brand-orange)"
                >
                  <FiPhone className="shrink-0 text-(--brand-orange)" />
                  <span>
                    {p.value}{" "}
                    <span className="text-(--text-secondary)">· {p.label}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────────────── */}
      <div className="relative border-t border-(--border)">
        <div className="mx-auto flex max-w-[85rem] flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-(--text-secondary) md:flex-row md:px-10 lg:px-20">
          <p>© 2026 Soft Suave. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="#" className="transition-colors hover:text-(--brand-orange)">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-(--brand-orange)">
              Case Studies
            </a>
            <a href="#" className="transition-colors hover:text-(--brand-orange)">
              Blog
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
