"use client";

import {
  useRef,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";

// Floating glass card: idle bob at a per-card phase, and on hover a 12px
// lift, cursor-following 3D tilt, soft blue glow, and a spinning border
// beam (see .card-* styles in globals.css).

const MAX_TILT_DEG = 6;

export default function FloatingCard({
  children,
  className = "",
  offsetClass = "",
  floatDelay = 0,
  float = true,
  lift = 12,
  style,
}: {
  children: ReactNode;
  className?: string;
  offsetClass?: string;
  floatDelay?: number;
  float?: boolean;
  lift?: number;
  style?: CSSProperties;
}) {
  // Rect is measured on the outer wrapper (its transform never changes),
  // so the tilt doesn't feed back into its own cursor math
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const tiltToCursor = (e: MouseEvent<HTMLDivElement>) => {
    const wrapper = wrapperRef.current;
    const card = cardRef.current;
    if (!wrapper || !card) return;
    const r = wrapper.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    const rx = (-py * MAX_TILT_DEG).toFixed(2);
    const ry = (px * MAX_TILT_DEG).toFixed(2);
    card.style.transform = `perspective(900px) translateY(-${lift}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };

  const settle = () => {
    const card = cardRef.current;
    if (card) card.style.transform = "perspective(900px)";
  };

  return (
    <div
      ref={wrapperRef}
      className={`group relative h-full hover:z-10 ${offsetClass}`}
      onMouseEnter={tiltToCursor}
      onMouseMove={tiltToCursor}
      onMouseLeave={settle}
    >
      <div
        className={float ? "card-float h-full group-hover:[animation-play-state:paused]" : "h-full"}
        style={float ? { animationDelay: `${floatDelay}s` } : undefined}
      >
        <div ref={cardRef} className={`card-tilt h-full ${className}`} style={style}>
          {children}
          <div className="card-border-spin pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>
      </div>
    </div>
  );
}
