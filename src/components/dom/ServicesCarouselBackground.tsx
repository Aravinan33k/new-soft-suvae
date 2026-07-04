"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SLIDES = [
  "/carousel/02-rising-defiance.png",
  "/carousel/03-towering-purple.png",
  "/carousel/04-towering-victory.png",
  "/carousel/05-fist-clash-sky.png",
  "/carousel/06-heads-clash-city.png",
  "/carousel/07-slam.png",
  "/carousel/08-rain-fight.png",
  "/carousel/09-clash-of-titans-poster.png",
];

const INTERVAL_MS = 1000;

// Shared background for the Services grid: cycles through the mecha/brain
// artwork every second with a soft cross-dissolve (all frames are mounted
// at once — only opacity toggles — so nothing pops in unloaded mid-fade).
export default function ServicesCarouselBackground() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {SLIDES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes="100vw"
          quality={60}
          priority={i === 0}
          className="object-cover transition-opacity ease-in-out"
          style={{
            opacity: i === active ? 1 : 0,
            transitionDuration: "700ms",
          }}
        />
      ))}
      {/* Light edge darkening only — the artwork itself should read clearly */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_65%_at_50%_45%,rgba(10,10,12,0.1)_0%,rgba(10,10,12,0.28)_65%,rgba(10,10,12,0.5)_100%)]" />
    </div>
  );
}
