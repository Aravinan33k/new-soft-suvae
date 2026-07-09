"use client";

import { useEffect, useState } from "react";
import { TbStarFilled } from "react-icons/tb";

type Review = {
  quote: string;
  name: string;
  role: string;
  x: number;
  y: number;
};

const HOLD_MS = 5000; // how long each review stays visible before the next fades in

// Floating reviews over the cityscape photo (desktop only) — one review
// visible at a time, in its own anchored spot, auto-advancing on a fade
// every 5s and looping back to the first.
export default function ReviewsFloating({ reviews }: { reviews: Review[] }) {
  const [active, setActive] = useState(0);
  const n = reviews.length;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % n), HOLD_MS);
    return () => clearTimeout(t);
  }, [active, n]);

  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block">
      {reviews.map((r, i) => {
        const isActive = i === active;
        return (
          <figure
            key={r.name}
            className={`absolute w-[270px] -translate-x-1/2 -translate-y-1/2 p-4 transition-opacity duration-700 ease-out lg:w-[300px] ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
            style={{ left: `${r.x}%`, top: `${r.y}%` }}
          >
            <div className="flex gap-0.5 text-(--brand-orange) drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {Array.from({ length: 5 }).map((_, s) => (
                <TbStarFilled key={s} className="h-3.5 w-3.5" />
              ))}
            </div>
            <blockquote className="mt-2 text-sm font-medium leading-relaxed text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.9),0_1px_16px_rgba(0,0,0,0.7)]">
              &ldquo;{r.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-3">
              <span className="block text-sm font-bold text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">
                {r.name}
              </span>
              <span className="mt-0.5 block text-xs font-medium text-white/85 [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">
                {r.role}
              </span>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
