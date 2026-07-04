"use client";

import { useEffect, useState } from "react";

// Premium 2s intro: the Soft Suave mark scales in, network lines connect
// out to six nodes, a wireframe globe draws itself and lights up with city
// dots, then the whole overlay lifts and fades to reveal the site. Pure
// SVG/CSS so it never blocks or delays first paint, and the real 3D scene
// keeps warming up behind it.

// Hexagon of network nodes around the center (110,110), radius 92
const NODES: [number, number][] = [
  [110, 18],
  [189.7, 64],
  [189.7, 156],
  [110, 202],
  [30.3, 156],
  [30.3, 64],
];

// A few "city" lights that sprinkle onto the globe as it finishes building
const CITIES: [number, number][] = [
  [95, 92],
  [131, 104],
  [112, 133],
  [86, 118],
  [138, 126],
  [104, 82],
];

export default function Preloader() {
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const hold = reduce ? 500 : 2000;

    // Lock scroll while the intro plays
    document.documentElement.style.overflow = "hidden";

    const t1 = setTimeout(() => setDone(true), hold);
    const t2 = setTimeout(() => {
      setGone(true);
      document.documentElement.style.overflow = "";
    }, hold + 650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (gone) return null;

  const hexPath =
    NODES.map((n, i) => `${i ? "L" : "M"}${n[0]} ${n[1]}`).join(" ") + " Z";

  return (
    <div
      className={`preloader ${done ? "preloader--done" : ""}`}
      role="status"
      aria-label="Loading Soft Suave"
    >
      <div className="pl-stage">
        <svg
          viewBox="0 0 220 220"
          className="absolute inset-0 h-full w-full"
          fill="none"
        >
          <defs>
            <linearGradient id="plGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF9440" />
              <stop offset="100%" stopColor="#F92B4E" />
            </linearGradient>
          </defs>

          {/* Earth: wireframe globe drawing itself in */}
          <g stroke="url(#plGrad)" strokeWidth="1">
            <circle
              className="pl-draw"
              cx="110"
              cy="110"
              r="62"
              pathLength={1}
              style={{ animationDelay: "1.0s", opacity: 0.85 }}
            />
            {/* latitudes */}
            <ellipse
              className="pl-draw"
              cx="110"
              cy="110"
              rx="62"
              ry="17"
              pathLength={1}
              style={{ animationDelay: "1.1s", opacity: 0.6 }}
            />
            <ellipse
              className="pl-draw"
              cx="110"
              cy="80"
              rx="53"
              ry="13"
              pathLength={1}
              style={{ animationDelay: "1.2s", opacity: 0.5 }}
            />
            <ellipse
              className="pl-draw"
              cx="110"
              cy="140"
              rx="53"
              ry="13"
              pathLength={1}
              style={{ animationDelay: "1.2s", opacity: 0.5 }}
            />
            {/* meridians */}
            <ellipse
              className="pl-draw"
              cx="110"
              cy="110"
              rx="42"
              ry="62"
              pathLength={1}
              style={{ animationDelay: "1.15s", opacity: 0.5 }}
            />
            <ellipse
              className="pl-draw"
              cx="110"
              cy="110"
              rx="20"
              ry="62"
              pathLength={1}
              style={{ animationDelay: "1.25s", opacity: 0.5 }}
            />
          </g>

          {/* City lights */}
          {CITIES.map((c, i) => (
            <circle
              key={`c${i}`}
              className="pl-pop"
              cx={c[0]}
              cy={c[1]}
              r="2"
              fill="#ffd6a0"
              style={{ animationDelay: `${1.4 + i * 0.05}s` }}
            />
          ))}

          {/* Network layer: lines connect out, ring + nodes, slow spin */}
          <g className="pl-spin">
            <g stroke="url(#plGrad)" strokeWidth="1">
              {NODES.map((n, i) => (
                <line
                  key={`l${i}`}
                  className="pl-draw"
                  x1="110"
                  y1="110"
                  x2={n[0]}
                  y2={n[1]}
                  pathLength={1}
                  style={{ animationDelay: `${0.55 + i * 0.05}s`, opacity: 0.55 }}
                />
              ))}
              <path
                className="pl-draw"
                d={hexPath}
                pathLength={1}
                style={{ animationDelay: "0.9s", opacity: 0.45 }}
              />
            </g>
            {NODES.map((n, i) => (
              <circle
                key={`n${i}`}
                className="pl-pop"
                cx={n[0]}
                cy={n[1]}
                r="3.4"
                fill="url(#plGrad)"
                style={{ animationDelay: `${0.8 + i * 0.05}s` }}
              />
            ))}
          </g>
        </svg>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/softsuave-mark.svg" alt="" className="pl-mark" />
      </div>

      <div className="pl-word">Soft Suave</div>

      <div className="pl-bar">
        <span />
      </div>
    </div>
  );
}
